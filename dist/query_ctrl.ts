///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import _ from 'lodash';
import appEvents from 'app/core/app_events';
import {KDBMetaQuery} from './meta_query';
import {QueryCtrl} from 'app/plugins/sdk';
import {SqlPart} from './sql_part/sql_part';
import KDBQuery from './kdb_query';
import sqlPart from './sql_part';
import { defaultRowCountLimit } from './model/kdb-request-config';
//Declaring default constants
const conflationUnitDefault: string = 'm';
const conflationDurationDefault: string = "5";

export interface QueryMeta {
    sql: string;
}

export class KDBQueryCtrl extends QueryCtrl {
    static templateUrl = 'partials/query.editor.html';

    //Boolean Variables
    showLastQuerySQL: boolean; //needed?
    showHelp: boolean;
    useByClause: boolean;

    //High level objects
    queryModel: KDBQuery;
    metaBuilder: KDBMetaQuery;
    lastQueryMeta: QueryMeta;

    //Query Segments
    tableSegment: any;
    whereAdd: any;
    timeColumnSegment: any;
    metricColumnSegment: any;
    groupingSegment: any;
    functionSegment: any;
    conflationUnitSegment: any;
    conflationDurationSegment: any;
    conflationAggregateSegment: any;
    rowCountLimitSegment: any;
    kdbSideFunctionSegment: any;

    //Option Arrays
    formats: any[];
    queryTypes : any[];
    selectMenu: any[];
    groupMenu: any[];
    aggMenu: any[];
    durationUnits: any[]

    //Grouping Parts
    selectParts: SqlPart[][];
    groupParts: SqlPart[];
    whereParts: SqlPart[]

    kdbFunction: string;

    
    /** @ngInject */
    constructor(public $scope,
                public $injector,
                private templateSrv, //: TemplateSrv,
                private $q,
                private uiSegmentSrv
    ) {
        super($scope, $injector);

        if(!this.datasource.ws) {
            this.datasource.connectWS();
        };

        //this.target = this.target;98
        this.queryModel = new KDBQuery(this.target, templateSrv, this.panel.scopedVars);
        this.metaBuilder = new KDBMetaQuery(this.target, this.queryModel);
        this.updateProjection();

        //if the panel is of a tabular type then only a tabular query is possible
        this.target.panelType = this.panelCtrl.panel.type;

        if(this.panelCtrl.panel.type == 'graph' || this.panelCtrl.panel.type == 'heatmap') {
            this.formats = [{text: 'Time series', value: 'time series'}, {text: 'Table', value: 'table'}];
            this.target.useTemporalField = true;
        }
        else if (this.panelCtrl.panel.type == 'table') {
            this.target.format = 'table';
            this.formats = [{text: 'Table', value: 'table'}];
            this.target.useGrouping = false
        }
        else {
            this.target.format = 'table';
            this.formats = [{text: 'Table', value: 'table'}];
        }

        this.queryTypes = [
            {text: 'Built Query', value: 'selectQuery'},
            {text: 'Free-form Query', value: 'functionQuery'},
            //{text: 'Function', value: 'kdbSideQuery'}
        ];

        this.aggMenu = [
            {text: 'Average', value: 'avg'},
            {text: 'Count', value: 'count'},
            {text: 'First', value: 'first'},
            {text: 'Last', value: 'last'},
            {text: 'Maximum', value: 'max'},
            {text: 'Median', value: 'med'},
            {text: 'Minimum', value: 'min'},
            {text: 'Sample Std Dev', value: 'sdev'},
            {text: 'Sample Variance', value: 'svar'},
            {text: 'Sum', value: 'sum'},
            {text: 'Standard Deviation', value: 'dev'},
            {text: 'Variance', value: 'var'}];

        this.durationUnits = [
            //NOTE: The text -> value conversion here doesnt work; segment.value is still the 'text' value.
            {text: 'Seconds', value: 's'},
            {text: 'Minutes', value: 'm'},
            {text: 'Hours', value: 'h'}];
            
        this.target.version = this.datasource.meta.info.version;

        //If queryError isn't present, build it
        if(!this.target.queryError) {
            this.target.queryError = {
                //Errors present: From(table), conflation, Row Count, funcGroupCol
                error: [false,false,false,false],
                message: ['','','','']
            };
        }

        //Initialise the conflation if it doesn't already exist;
        if(!this.target.useConflation){
            this.target.conflationUnit = conflationUnitDefault;
            this.target.conflationDuration = conflationDurationDefault;
            this.target.conflationDurationMS = Number(conflationDurationDefault) * (conflationUnitDefault == 'Seconds' ? Math.pow(10,9) : (conflationUnitDefault == 'Minutes' ? 60 * Math.pow(10,9) : 3600 * Math.pow(10,9)));
        }
        if(!this.target.kdbSideFunction){
            this.target.kdbSideFunction = 'Select Function'
        }

        this.conflationDurationSegment = this.uiSegmentSrv.newSegment({value: this.target.conflationDuration.toString(), fake: false});
        this.conflationAggregateSegment = this.uiSegmentSrv.newSegment({value: this.target.conflationDefaultAggType, fake: false});
        this.rowCountLimitSegment = this.uiSegmentSrv.newSegment({value: this.target.rowCountLimit.toString(), fake: false});
        this.kdbSideFunctionSegment = this.uiSegmentSrv.newSegment({value: this.target.kdbSideFunction.toString(), fake: false});

        this.panelCtrl.events.on('data-received', this.onDataReceived.bind(this), $scope);
        this.panelCtrl.events.on('data-error', this.onDataError.bind(this), $scope);
    

        if(this.target.queryType == 'selectQuery') {
            this.buildQueryBuilderPanel();
        } else if(this.target.queryType == 'functionQuery'){
            this.buildFunctionQueryPanel();
        } else this.buildQueryBuilderPanel();
    }


    buildFunctionQueryPanel() {
        if(!this.target.kdbFunction || this.target.kdbFunction == 'Enter function') {
            this.kdbFunction = ''
        }
        else {
            this.kdbFunction = this.target.kdbFunction;
        }
    }

    //This function builds the datasource if the panel type is a graph
    buildQueryBuilderPanel() {
        //default to query builder
        this.metricColumnSegment = this.uiSegmentSrv.newSegment('dummy');

        if(!this.target.timeColumn || this.target.timeColumn == 'Select Field'){
            this.timeColumnSegment = this.uiSegmentSrv.newSegment('Select Field');
        }
        //else populate the pre-existing value
        else {
            this.timeColumnSegment = this.uiSegmentSrv.newSegment(this.target.timeColumn);
        }

        //If queryError isn't present, build it
        if(!this.target.queryError) {
            this.target.queryError = {
                //Errors present: From(table), conflation, Row Count, funcGroupCol
                error: [false,false,false,false],
                message: ['','','','']
            };
        }
          
        //Table field
        if(!this.target.table || this.target.table == 'select Table'){
            this.tableSegment = this.uiSegmentSrv.newSegment({value: 'Select Table', fake: true});
        }
        //else populate the pre-existing value
        else {
            this.tableSegment = this.uiSegmentSrv.newSegment({value:this.target.table, fake: false});
        }
        if(!this.target.groupingField) {
            this.groupingSegment = this.uiSegmentSrv.newSegment({value: 'Select Field', fake: true});
        }
        else {
            this.groupingSegment = this.uiSegmentSrv.newSegment({value:this.target.groupingField, fake: false});
        }
        //if the select field is empty then initialise it
        if(!this.target.select){
            this.target.select = [[{type: 'column', params: ['Select Column']}]];
        }

        this.whereAdd = this.uiSegmentSrv.newPlusButton();
        this.setupAdditionalMenu();
    }

    newKdbArgSegment() {
        return this.uiSegmentSrv.newSegment({value: this.target.kdbSideFunction.toString(), fake: false})
    }

    setupAdditionalMenu() {
        this.buildSelectMenu();
        this.updateProjection();
        this.panelCtrl.refresh();
    }

    updateProjection() {
        this.selectParts = _.map(this.target.select, (parts: any) => {
            return _.map(parts, sqlPart.create).filter(n => n);
        });
        this.whereParts = _.map(this.target.where, sqlPart.create).filter(n => n);
    }

    updatePersistedParts() {
        this.target.select = _.map(this.selectParts, selectParts => {
            return _.map(selectParts, (part: any) => {
                return {type: part.def.type, datatype: part.datatype, params: part.params};
            });
        });
        this.target.where = _.map(this.whereParts, (part: any) => {
            return {type: part.def.type, datatype: part.datatype, name: part.name, params: part.params};
        });
    }

    buildSelectMenu() {
        this.selectMenu = [];

        const aggregates = {
            text: 'Aggregate Functions',
            value: 'aggregate',
            submenu: this.aggMenu
        };

        this.selectMenu.push({text: 'Add Column', value: 'column'});
        this.selectMenu.push({text: 'Define Alias', value: 'alias'});
        
        if(this.target.useConflation) {
            this.selectMenu.push(aggregates);
        }
    }


    resetPlusButton(button) {
        const plusButton = this.uiSegmentSrv.newPlusButton();
        button.html = plusButton.html;
        button.value = plusButton.value;
    }

    onQueryChange() {
        if(this.target.queryType == 'selectQuery') {
            this.buildQueryBuilderPanel();
            this.target.queryError.error[3] = false;
        } else if(this.target.queryType == 'functionQuery'){
            this.buildFunctionQueryPanel();
            this.functionChanged();
        } else this.buildQueryBuilderPanel();
        this.panelCtrl.refresh()
    }
    
    getTableSegments() {
        return this.datasource
            .metricFindQuery(this.metaBuilder.buildTableQuery())
            .then(this.transformToSegments({}))
            .catch(this.handleQueryError.bind(this));
    }

    //This function resets other values in the query if the table is reselected
    onTableChanged() {
        this.target.table = this.tableSegment.value;
        this.target.select = [[{type: 'column', params: ['select column']}]];
        this.target.where = [];
        const segment = this.uiSegmentSrv.newSegment('Select Field');
        this.timeColumnSegment.html = segment.html;
        this.timeColumnSegment.value = segment.value;
        this.target.timeColumn = segment.value;
        this.groupingSegment.html = segment.html;
        this.groupingSegment.value = segment.value;
        this.target.groupingField = segment.value;
        this.target.useGrouping = false;

        this.updateProjection();
        this.panelCtrl.refresh();
    
    }

    getTimeColumnSegments() {
        return this.datasource
            .metricFindQuery(this.metaBuilder.buildColumnQuery('time'))
            .then(this.transformToSegments({}))
            .catch(this.handleQueryError.bind(this));
    }

    timeColumnChanged() {
        this.target.timeColumn = this.timeColumnSegment.value;
        this.datasource.metricFindQuery(this.metaBuilder.buildDatatypeQuery(this.target.timeColumn)).then(result => {
            if (Array.isArray(result)) {
                if (typeof result[0].t == 'string') {
                    this.target.timeColumnType = result[0].t;
                 }
             }
        }); 
        this.panelCtrl.refresh(); 
    }

    conflationSettingsChanged() {
        //Conflation errors are reported in queryError at index 1
        this.target.queryError.error[1] = false;

        if (isNaN(this.conflationDurationSegment.value)) {
            this.target.queryError.error[1] = true
            this.target.queryError.message[1] = 'Conflation duration must be a number.'
        } else this.target.conflationDuration = this.conflationDurationSegment.value;
        if(this.target.conflationUnit == 's') {
            this.target.conflationDurationMS = this.target.conflationDuration * Math.pow(10,9);
        }
        else if(this.target.conflationUnit == 'm') {
            this.target.conflationDurationMS = this.target.conflationDuration * 60 * Math.pow(10,9);
        }
        else if(this.target.conflationUnit == 'h') {
            this.target.conflationDurationMS = this.target.conflationDuration * 3600 * Math.pow(10,9);
        }
        else {
            this.target.queryError.error[1] = true;
            this.target.queryError.message[1] = 'Unhandled exception in conflation. Please post conflation settings on our GitHub page.'
        };
        if (this.target.useConflation === false) {
            console.log(this.selectParts[0][1]);
            this.selectParts.map(partGroup => {
                for (let i=0;i<partGroup.length;i++) {
                    if(partGroup[i].part.type == "aggregate") partGroup.splice(i,1)
                }
            })
            console.log(this.selectParts[0][1]);
        };
        this.updatePersistedParts();
        this.panelCtrl.refresh();
    }

    rowCountLimitChanged() {
        //Row count limit errors are reported in queryError at index 2

        if (isNaN(this.rowCountLimitSegment.value)) {
            this.target.rowCountLimit = defaultRowCountLimit;
            this.target.queryError.error[2] = true;
            this.target.queryError.message[2] = 'Row count must be a positive integer.';
        } else {
            let numberRowCountLimit = Number(this.rowCountLimitSegment.value);
            if (Number.isInteger(numberRowCountLimit) && numberRowCountLimit > 0) {
                this.target.rowCountLimit = numberRowCountLimit;
                this.target.queryError.error[2] = false;
            } else {
                this.target.rowCountLimit = defaultRowCountLimit;
                this.target.queryError.error[2] = true;
            this.target.queryError.message[2] = 'Row count must be a positive integer.';
            }
        };
        this.panelCtrl.refresh();
    }


    getGroupingSegments() {
        return this.datasource
        .metricFindQuery(this.metaBuilder.buildColumnQuery('grouping'))
        .then(this.transformToSegments({}))
        .catch(this.handleQueryError.bind(this));
    }

    groupingChanged() {
        console.log(this.selectParts);
        this.target.groupingField = this.groupingSegment.value;
        this.panelCtrl.refresh();
    }

    kdbSideFunctionChanged() {
        this.target.kdbSideFunction = this.kdbSideFunctionSegment.value
        this.panelCtrl.refresh();
    };

    getKdbServerFunctions() {
        //kdbFuncs will be an array of strings
        return this.datasource
        .metricFindQuery(this.metaBuilder.buildServerFunctionsQuery())
        .then(this.transformToSegments({}))
        .catch(this.handleQueryError.bind(this));
    }

    onDataReceived(dataList) {
        this.lastQueryMeta = null;   
        const anySeriesFromQuery = _.find(dataList, {refId: this.target.refId});
       if(anySeriesFromQuery.meta.errorReceived){
           this.target.errorFound = true;
           this.target.lastQueryError = anySeriesFromQuery.meta.errorMessage;
       } else {
           this.target.errorFound = false;
           this.target.lastQueryError = '';
       }
        
    }

    onDataError(err) {
        if (err.data && err.data.results) {
            const queryRes = err.data.results[this.target.refId];
            if (queryRes) {
                this.lastQueryMeta = queryRes.meta;
                this.target.lastQueryError = queryRes.error;
            }
        }
    }

    transformToSegments(config) {
        return results => {
            const segments = _.map(results, segment => {
                return this.uiSegmentSrv.newSegment({
                    value: segment.table ? segment.table : segment.c,
                    expandable: segment.expandable,
                });
            });

            if (config.addTemplateVars) {
                for (const variable of this.templateSrv.variables) {
                    let value;
                    value = '$' + variable.name;
                    if (config.templateQuoter && variable.multi === false) {
                        value = config.templateQuoter(value);
                    }

                    segments.unshift(
                        this.uiSegmentSrv.newSegment({
                            type: 'template',
                            value: value,
                            expandable: true,
                        })
                    );
                }
            }

            if (config.addNone) {
                segments.unshift(this.uiSegmentSrv.newSegment({type: 'template', value: 'none', expandable: true}));
            }

            return segments;
        };
    }

    findAggregateIndex(selectParts) {
        return _.findIndex(selectParts, (p: any) => p.def.type === 'aggregate');
    }

    findBinaryAggIndex(selectParts) {
        return _.findIndex(selectParts, (p: any) => p.def.type === 'binaryAgg');
    }

    findMovingIndex(selectParts) {
        return _.findIndex(selectParts, (p: any) => p.def.type === 'moving');
    }

    findBucketIndex(groupParts) {
        return _.findIndex(groupParts, (p: any) => p.def.type === 'bucket');
    }

    findWindowIndex(selectParts) {
        return _.findIndex(selectParts, (p: any) => p.def.type === 'window' || p.def.type === 'moving_window');
    }

    addSelectPart(selectParts, item, subItem) {
        let partType = item.value;
        if (subItem && subItem.type) {
            partType = subItem.type;
        }
        let partModel = sqlPart.create({type: partType});
        if (subItem) {
            partModel.params[0] = subItem.value;
        }
        let addAlias = false;

        switch (partType) {
            case 'column':
                const parts = _.map(selectParts, (part: any) => {
                    return sqlPart.create({type: part.def.type, params: _.clone(part.params)});
                });
                this.selectParts.push(parts);
                break;
            case 'percentile':
            case 'aggregate':
                const aggIndex = this.findAggregateIndex(selectParts);
                if (aggIndex !== -1) {
                    // replace current aggregation
                    selectParts[aggIndex] = partModel;
                } else {
                    selectParts.splice(1, 0, partModel);
                }
                if (!_.find(selectParts, (p: any) => p.def.type === 'alias')) {
                    addAlias = true;
                }
                break;
            case 'binaryAgg':
                const binAggIndex = this.findBinaryAggIndex(selectParts);
                if (binAggIndex !== -1) {
                    // replace current aggregation
                    selectParts[binAggIndex] = partModel;
                } else {
                    selectParts.splice(1, 0, partModel);
                }
                if (!_.find(selectParts, (p: any) => p.def.type === 'alias')) {
                    addAlias = true;
                }
                break;
            case 'moving_window':
            case 'window':
                const windowIndex = this.findWindowIndex(selectParts);
                if (windowIndex !== -1) {
                    // replace current window function
                    selectParts[windowIndex] = partModel;
                } else {
                    const aggIndex = this.findAggregateIndex(selectParts);
                    if (aggIndex !== -1) {
                        selectParts.splice(aggIndex + 1, 0, partModel);
                    } else {
                        selectParts.splice(1, 0, partModel);
                    }
                }
                if (!_.find(selectParts, (p: any) => p.def.type === 'alias')) {
                    addAlias = true;
                }
                break;
            case 'alias':
                addAlias = true;
                break;
        }

        if (addAlias) {
            // set initial alias name to column name
            partModel = sqlPart.create({type: 'alias', params: [selectParts[0].params[0].replace(/"/g, '')]});
            if (selectParts[selectParts.length - 1].def.type === 'alias') {
                selectParts[selectParts.length - 1] = partModel;
            } else {
                selectParts.push(partModel);
            }
        }

        this.updatePersistedParts();
        this.panelCtrl.refresh();
    }

    removeSelectPart(selectParts, part, index) {
        if (part.def.type === 'column') {
            if (this.selectParts.length > 1) {
                const modelsIndex = _.indexOf(this.selectParts, selectParts);
                this.selectParts.splice(modelsIndex, 1);
            }
        } else {
                selectParts.splice(index, 1);
        }
        
        this.updatePersistedParts();
    }

    handleSelectPartEvent(part, index, evt, selectParts) {
        switch (evt.name) {
            case 'get-param-options': {
                return this.datasource
                    .metricFindQuery(this.metaBuilder.buildColumnQuery((this.target.format == 'time series')?'value':'tableValue'))
                    .then(this.transformToSegments({}))
                    .catch(this.handleQueryError.bind(this));
            }
            case 'part-param-changed': {
                this.updatePersistedParts();
                this.updateColumnMeta(part).then(result => {
                    part.datatype = result[1][0].t;
                    this.panelCtrl.refresh();
                });
                break;
            }
            case 'action': {
                this.removeSelectPart(selectParts, part, index);
                this.panelCtrl.refresh();
                break;
            }
            case 'get-part-actions': {
                return this.$q.when([{text: 'Remove', value: 'remove-part'}]);
            }
        }
    }


    handleWherePartEvent(whereParts, part, evt, index) {
        switch (evt.name) {
            case 'get-param-options': {
                switch (evt.param.name) {
                    case 'left':
                        return this.datasource
                            .metricFindQuery(this.metaBuilder.buildColumnQuery('where'))
                            .then(this.transformToSegments({}))
                            .catch(this.handleQueryError.bind(this));
                    case 'right':
                        if (['b', 'g', 'x', 'h', 'i', 'j', 'e', 'f', 'p','z','n','u', 'v','t'].indexOf(part.datatype) > -1) {
                            // don't do value lookups for numerical fields
                            return this.$q.when([]);
                        } else {
                            return this.datasource
                                .metricFindQuery(this.metaBuilder.buildValueQuery(part.params[0], this.panelCtrl.range, this.target.timeColumn, this.target.timeColumnType))
                                .then(this.transformToSegments({}))
                                .catch(this.handleQueryError.bind(this));
                        }
                    case 'op':
                        return this.$q.when(this.uiSegmentSrv.newOperators(this.metaBuilder.getOperators(part.datatype)));
                    default:
                        return this.$q.when([]);
                }
            }
            case 'part-param-changed': {
                //If the left field is updated set the#
                this.updatePersistedParts();
                //Handling for subgroups of columns (e.g time.minute)
                if (part.params[0].includes('.')) {
                    let subgroup = part.params[0].substr(part.params[0].indexOf('.') + 1);
                    part.datatype = this.metaBuilder.subgroupDatatypeLookup[subgroup];
                    this.panelCtrl.refresh();
                    break;
                } else {
                this.datasource.metricFindQuery(this.metaBuilder.buildDatatypeQuery(part.params[0])).then((d: any) => {
                    if (d.length === 1) {
                        part.datatype = d[0].t;
                        this.panelCtrl.refresh();
                    }
                });

                break;
                }
            }
            case 'action': {
                // remove element
                whereParts.splice(index, 1);
                this.updatePersistedParts();
                this.panelCtrl.refresh();
                break;
            }
            case 'get-part-actions': {
                return this.$q.when([{text: 'Remove', value: 'remove-part'}]);
            }
        }
    }

    getWhereOptions() {
        const options = [];
        options.push(this.uiSegmentSrv.newSegment({type: 'expression', value: 'Expression'}));
        return this.$q.when(options);
    }

    addWhereAction(part, index) {
        this.whereParts.push(sqlPart.create({type: 'expression', params: ['select field', '=', 'enter value']}));  
        this.updatePersistedParts();
        this.resetPlusButton(this.whereAdd);
        this.panelCtrl.refresh();
    }

    handleQueryError(err) {
        this.error = err.message || 'Failed to issue metric query';
        return [];
    }

    updateColumnMeta(part) {
        return new Promise(resolve => {
            this.datasource.metricFindQuery(this.metaBuilder.getColumnDataType(part.params[0]))
                .then(result => {
                    resolve(result);
                })
        })
    }

    aggQueryToggled() {
        if(!this.target.aggQuery) {
            this.target.group = [];
        } else {
            this.target.group = [[{type: 'column', params: ['select group']}]];
        }
        this.setupAdditionalMenu();
        this.panelCtrl.refresh();
    }


    //This function runs when the 'useGrouping' checkbox is toggled
    groupingToggled() {
        if(this.target.queryType == 'functionQuery') this.functionChanged();
        this.panelCtrl.refresh();
        //this.refresh();
    }

    //Setting the Conflation Fields to the default if Conflation is enabled
    resetConflationFields() {
        if(this.target.useConflation === true) {
            this.target.conflationUnit = conflationUnitDefault;
            this.target.conflationDuration = conflationDurationDefault;
        };
        this.conflationSettingsChanged();
        this.setupAdditionalMenu();
    }

    //Function Builder
    functionChanged() {
        if(this.target.useGrouping === true && (this.target.funcGroupCol == '' || !this.target.funcGroupCol)) {
            this.target.queryError.error[3] = true;
            this.target.queryError.message[3] = 'Grouping enabled but no grouping column defined'
        } else {
            this.target.queryError.error[3] = false;
            this.target.queryError.message[3] = ''
        }
        this.panelCtrl.refresh();
    }

    //This function resets various paramaeters and performs a number of checks in the query format has been reset
    queryFormatRefresh() {
        if (this.target.format == 'table') {
            this.target.useGrouping = false;
            this.groupingToggled();
        } 
        else {
            this.selectParts.forEach(prt => {
                if(prt[0].datatype == 's') {
                    const modelsIndex = _.indexOf(this.selectParts, prt);
                    this.selectParts.splice(modelsIndex, 1);
                }
            })
        }
        this.panelCtrl.refresh();
    }

    //toggling whether or not time should be included in the query for tabular results
    temporalFieldToggled() {
        //if time has been turned off, do stuff
        if(!this.target.useTemporalField){
            this.target.useConflation = false;
        }
        this.panelCtrl.refresh();
    }

}
