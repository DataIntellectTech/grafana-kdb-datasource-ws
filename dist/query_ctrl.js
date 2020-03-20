System.register(['lodash', './meta_query', 'app/plugins/sdk', './kdb_query', './sql_part', './model/kdb-request-config'], function(exports_1) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var lodash_1, meta_query_1, sdk_1, kdb_query_1, sql_part_1, kdb_request_config_1;
    var conflationUnitDefault, conflationDurationDefault, KDBQueryCtrl;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (meta_query_1_1) {
                meta_query_1 = meta_query_1_1;
            },
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            },
            function (kdb_query_1_1) {
                kdb_query_1 = kdb_query_1_1;
            },
            function (sql_part_1_1) {
                sql_part_1 = sql_part_1_1;
            },
            function (kdb_request_config_1_1) {
                kdb_request_config_1 = kdb_request_config_1_1;
            }],
        execute: function() {
            //Declaring default constants
            conflationUnitDefault = 'm';
            conflationDurationDefault = "5";
            KDBQueryCtrl = (function (_super) {
                __extends(KDBQueryCtrl, _super);
                /** @ngInject */
                function KDBQueryCtrl($scope, $injector, templateSrv, //: TemplateSrv,
                    $q, uiSegmentSrv) {
                    _super.call(this, $scope, $injector);
                    this.$scope = $scope;
                    this.$injector = $injector;
                    this.templateSrv = templateSrv;
                    this.$q = $q;
                    this.uiSegmentSrv = uiSegmentSrv;
                    if (!this.datasource.ws) {
                        this.datasource.connectWS();
                    }
                    ;
                    //this.target = this.target;98
                    this.queryModel = new kdb_query_1.default(this.target, templateSrv, this.panel.scopedVars);
                    this.metaBuilder = new meta_query_1.KDBMetaQuery(this.target, this.queryModel);
                    this.updateProjection();
                    //if the panel is of a tabular type then only a tabular query is possible
                    this.target.panelType = this.panelCtrl.panel.type;
                    if (this.panelCtrl.panel.type == 'graph' || this.panelCtrl.panel.type == 'heatmap') {
                        this.formats = [{ text: 'Time series', value: 'time series' }, { text: 'Table', value: 'table' }];
                        this.target.useTemporalField = true;
                    }
                    else if (this.panelCtrl.panel.type == 'table') {
                        this.target.format = 'table';
                        this.formats = [{ text: 'Table', value: 'table' }];
                        this.target.useGrouping = false;
                    }
                    else {
                        this.target.format = 'table';
                        this.formats = [{ text: 'Table', value: 'table' }];
                    }
                    this.queryTypes = [
                        { text: 'Built Query', value: 'selectQuery' },
                        { text: 'Free-form Query', value: 'functionQuery' },
                    ];
                    this.aggMenu = [
                        { text: 'Average', value: 'avg' },
                        { text: 'Count', value: 'count' },
                        { text: 'First', value: 'first' },
                        { text: 'Last', value: 'last' },
                        { text: 'Maximum', value: 'max' },
                        { text: 'Median', value: 'med' },
                        { text: 'Minimum', value: 'min' },
                        { text: 'Sample Std Dev', value: 'sdev' },
                        { text: 'Sample Variance', value: 'svar' },
                        { text: 'Sum', value: 'sum' },
                        { text: 'Standard Deviation', value: 'dev' },
                        { text: 'Variance', value: 'var' }];
                    this.durationUnits = [
                        //NOTE: The text -> value conversion here doesnt work; segment.value is still the 'text' value.
                        { text: 'Seconds', value: 's' },
                        { text: 'Minutes', value: 'm' },
                        { text: 'Hours', value: 'h' }];
                    this.target.version = this.datasource.meta.info.version;
                    //If queryError isn't present, build it
                    if (!this.target.queryError) {
                        this.target.queryError = {
                            //Errors present: From(table), conflation, Row Count, funcGroupCol
                            error: [false, false, false, false],
                            message: ['', '', '', '']
                        };
                    }
                    //Initialise the conflation if it doesn't already exist;
                    if (!this.target.useConflation) {
                        this.target.conflationUnit = conflationUnitDefault;
                        this.target.conflationDuration = conflationDurationDefault;
                        this.target.conflationDurationMS = Number(conflationDurationDefault) * (conflationUnitDefault == 'Seconds' ? Math.pow(10, 9) : (conflationUnitDefault == 'Minutes' ? 60 * Math.pow(10, 9) : 3600 * Math.pow(10, 9)));
                    }
                    if (!this.target.kdbSideFunction) {
                        this.target.kdbSideFunction = 'Select Function';
                    }
                    this.conflationDurationSegment = this.uiSegmentSrv.newSegment({ value: this.target.conflationDuration.toString(), fake: false });
                    this.conflationAggregateSegment = this.uiSegmentSrv.newSegment({ value: this.target.conflationDefaultAggType, fake: false });
                    this.rowCountLimitSegment = this.uiSegmentSrv.newSegment({ value: this.target.rowCountLimit.toString(), fake: false });
                    this.kdbSideFunctionSegment = this.uiSegmentSrv.newSegment({ value: this.target.kdbSideFunction.toString(), fake: false });
                    this.panelCtrl.events.on('data-received', this.onDataReceived.bind(this), $scope);
                    this.panelCtrl.events.on('data-error', this.onDataError.bind(this), $scope);
                    if (this.target.queryType == 'selectQuery') {
                        this.buildQueryBuilderPanel();
                    }
                    else if (this.target.queryType == 'functionQuery') {
                        this.buildFunctionQueryPanel();
                    }
                    else
                        this.buildQueryBuilderPanel();
                }
                KDBQueryCtrl.prototype.buildFunctionQueryPanel = function () {
                    if (!this.target.kdbFunction || this.target.kdbFunction == 'Enter function') {
                        this.kdbFunction = '';
                    }
                    else {
                        this.kdbFunction = this.target.kdbFunction;
                    }
                };
                //This function builds the datasource if the panel type is a graph
                KDBQueryCtrl.prototype.buildQueryBuilderPanel = function () {
                    //default to query builder
                    this.metricColumnSegment = this.uiSegmentSrv.newSegment('dummy');
                    if (!this.target.timeColumn || this.target.timeColumn == 'Select Field') {
                        this.timeColumnSegment = this.uiSegmentSrv.newSegment('Select Field');
                    }
                    else {
                        this.timeColumnSegment = this.uiSegmentSrv.newSegment(this.target.timeColumn);
                    }
                    //If queryError isn't present, build it
                    if (!this.target.queryError) {
                        this.target.queryError = {
                            //Errors present: From(table), conflation, Row Count, funcGroupCol
                            error: [false, false, false, false],
                            message: ['', '', '', '']
                        };
                    }
                    //Table field
                    if (!this.target.table || this.target.table == 'select Table') {
                        this.tableSegment = this.uiSegmentSrv.newSegment({ value: 'Select Table', fake: true });
                    }
                    else {
                        this.tableSegment = this.uiSegmentSrv.newSegment({ value: this.target.table, fake: false });
                    }
                    if (!this.target.groupingField) {
                        this.groupingSegment = this.uiSegmentSrv.newSegment({ value: 'Select Field', fake: true });
                    }
                    else {
                        this.groupingSegment = this.uiSegmentSrv.newSegment({ value: this.target.groupingField, fake: false });
                    }
                    //if the select field is empty then initialise it
                    if (!this.target.select) {
                        this.target.select = [[{ type: 'column', params: ['Select Column'] }]];
                    }
                    this.whereAdd = this.uiSegmentSrv.newPlusButton();
                    this.setupAdditionalMenu();
                };
                KDBQueryCtrl.prototype.newKdbArgSegment = function () {
                    return this.uiSegmentSrv.newSegment({ value: this.target.kdbSideFunction.toString(), fake: false });
                };
                KDBQueryCtrl.prototype.setupAdditionalMenu = function () {
                    this.buildSelectMenu();
                    this.updateProjection();
                    this.panelCtrl.refresh();
                };
                KDBQueryCtrl.prototype.updateProjection = function () {
                    this.selectParts = lodash_1.default.map(this.target.select, function (parts) {
                        return lodash_1.default.map(parts, sql_part_1.default.create).filter(function (n) { return n; });
                    });
                    this.whereParts = lodash_1.default.map(this.target.where, sql_part_1.default.create).filter(function (n) { return n; });
                };
                KDBQueryCtrl.prototype.updatePersistedParts = function () {
                    this.target.select = lodash_1.default.map(this.selectParts, function (selectParts) {
                        return lodash_1.default.map(selectParts, function (part) {
                            return { type: part.def.type, datatype: part.datatype, params: part.params };
                        });
                    });
                    this.target.where = lodash_1.default.map(this.whereParts, function (part) {
                        return { type: part.def.type, datatype: part.datatype, name: part.name, params: part.params };
                    });
                };
                KDBQueryCtrl.prototype.buildSelectMenu = function () {
                    this.selectMenu = [];
                    var aggregates = {
                        text: 'Aggregate Functions',
                        value: 'aggregate',
                        submenu: this.aggMenu
                    };
                    this.selectMenu.push({ text: 'Add Column', value: 'column' });
                    this.selectMenu.push({ text: 'Define Alias', value: 'alias' });
                    if (this.target.useConflation) {
                        this.selectMenu.push(aggregates);
                    }
                };
                KDBQueryCtrl.prototype.resetPlusButton = function (button) {
                    var plusButton = this.uiSegmentSrv.newPlusButton();
                    button.html = plusButton.html;
                    button.value = plusButton.value;
                };
                KDBQueryCtrl.prototype.onQueryChange = function () {
                    if (this.target.queryType == 'selectQuery') {
                        this.buildQueryBuilderPanel();
                        this.target.queryError.error[3] = false;
                    }
                    else if (this.target.queryType == 'functionQuery') {
                        this.buildFunctionQueryPanel();
                        this.functionChanged();
                    }
                    else
                        this.buildQueryBuilderPanel();
                    this.panelCtrl.refresh();
                };
                KDBQueryCtrl.prototype.getTableSegments = function () {
                    return this.datasource
                        .metricFindQuery(this.metaBuilder.buildTableQuery())
                        .then(this.transformToSegments({}))
                        .catch(this.handleQueryError.bind(this));
                };
                //This function resets other values in the query if the table is reselected
                KDBQueryCtrl.prototype.onTableChanged = function () {
                    this.target.table = this.tableSegment.value;
                    this.target.select = [[{ type: 'column', params: ['select column'] }]];
                    this.target.where = [];
                    var segment = this.uiSegmentSrv.newSegment('Select Field');
                    this.timeColumnSegment.html = segment.html;
                    this.timeColumnSegment.value = segment.value;
                    this.target.timeColumn = segment.value;
                    this.groupingSegment.html = segment.html;
                    this.groupingSegment.value = segment.value;
                    this.target.groupingField = segment.value;
                    this.target.useGrouping = false;
                    this.updateProjection();
                    this.panelCtrl.refresh();
                };
                KDBQueryCtrl.prototype.getTimeColumnSegments = function () {
                    return this.datasource
                        .metricFindQuery(this.metaBuilder.buildColumnQuery('time'))
                        .then(this.transformToSegments({}))
                        .catch(this.handleQueryError.bind(this));
                };
                KDBQueryCtrl.prototype.timeColumnChanged = function () {
                    var _this = this;
                    this.target.timeColumn = this.timeColumnSegment.value;
                    this.datasource.metricFindQuery(this.metaBuilder.buildDatatypeQuery(this.target.timeColumn)).then(function (result) {
                        if (Array.isArray(result)) {
                            if (typeof result[0].t == 'string') {
                                _this.target.timeColumnType = result[0].t;
                            }
                        }
                    });
                    this.panelCtrl.refresh();
                };
                KDBQueryCtrl.prototype.conflationSettingsChanged = function () {
                    //Conflation errors are reported in queryError at index 1
                    this.target.queryError.error[1] = false;
                    if (isNaN(this.conflationDurationSegment.value)) {
                        this.target.queryError.error[1] = true;
                        this.target.queryError.message[1] = 'Conflation duration must be a number.';
                    }
                    else
                        this.target.conflationDuration = this.conflationDurationSegment.value;
                    if (this.target.conflationUnit == 's') {
                        this.target.conflationDurationMS = this.target.conflationDuration * Math.pow(10, 9);
                    }
                    else if (this.target.conflationUnit == 'm') {
                        this.target.conflationDurationMS = this.target.conflationDuration * 60 * Math.pow(10, 9);
                    }
                    else if (this.target.conflationUnit == 'h') {
                        this.target.conflationDurationMS = this.target.conflationDuration * 3600 * Math.pow(10, 9);
                    }
                    else {
                        this.target.queryError.error[1] = true;
                        this.target.queryError.message[1] = 'Unhandled exception in conflation. Please post conflation settings on our GitHub page.';
                    }
                    ;
                    if (this.target.useConflation === false) {
                        console.log(this.selectParts[0][1]);
                        this.selectParts.map(function (partGroup) {
                            for (var i = 0; i < partGroup.length; i++) {
                                if (partGroup[i].part.type == "aggregate")
                                    partGroup.splice(i, 1);
                            }
                        });
                        console.log(this.selectParts[0][1]);
                    }
                    ;
                    this.updatePersistedParts();
                    this.panelCtrl.refresh();
                };
                KDBQueryCtrl.prototype.rowCountLimitChanged = function () {
                    //Row count limit errors are reported in queryError at index 2
                    if (isNaN(this.rowCountLimitSegment.value)) {
                        this.target.rowCountLimit = kdb_request_config_1.defaultRowCountLimit;
                        this.target.queryError.error[2] = true;
                        this.target.queryError.message[2] = 'Row count must be a positive integer.';
                    }
                    else {
                        var numberRowCountLimit = Number(this.rowCountLimitSegment.value);
                        if (Number.isInteger(numberRowCountLimit) && numberRowCountLimit > 0) {
                            this.target.rowCountLimit = numberRowCountLimit;
                            this.target.queryError.error[2] = false;
                        }
                        else {
                            this.target.rowCountLimit = kdb_request_config_1.defaultRowCountLimit;
                            this.target.queryError.error[2] = true;
                            this.target.queryError.message[2] = 'Row count must be a positive integer.';
                        }
                    }
                    ;
                    this.panelCtrl.refresh();
                };
                KDBQueryCtrl.prototype.getGroupingSegments = function () {
                    return this.datasource
                        .metricFindQuery(this.metaBuilder.buildColumnQuery('grouping'))
                        .then(this.transformToSegments({}))
                        .catch(this.handleQueryError.bind(this));
                };
                KDBQueryCtrl.prototype.groupingChanged = function () {
                    console.log(this.selectParts);
                    this.target.groupingField = this.groupingSegment.value;
                    this.panelCtrl.refresh();
                };
                KDBQueryCtrl.prototype.kdbSideFunctionChanged = function () {
                    this.target.kdbSideFunction = this.kdbSideFunctionSegment.value;
                    this.panelCtrl.refresh();
                };
                ;
                KDBQueryCtrl.prototype.getKdbServerFunctions = function () {
                    //kdbFuncs will be an array of strings
                    return this.datasource
                        .metricFindQuery(this.metaBuilder.buildServerFunctionsQuery())
                        .then(this.transformToSegments({}))
                        .catch(this.handleQueryError.bind(this));
                };
                KDBQueryCtrl.prototype.onDataReceived = function (dataList) {
                    this.lastQueryMeta = null;
                    var anySeriesFromQuery = lodash_1.default.find(dataList, { refId: this.target.refId });
                    if (anySeriesFromQuery.meta.errorReceived) {
                        this.target.errorFound = true;
                        this.target.lastQueryError = anySeriesFromQuery.meta.errorMessage;
                    }
                    else {
                        this.target.errorFound = false;
                        this.target.lastQueryError = '';
                    }
                };
                KDBQueryCtrl.prototype.onDataError = function (err) {
                    if (err.data && err.data.results) {
                        var queryRes = err.data.results[this.target.refId];
                        if (queryRes) {
                            this.lastQueryMeta = queryRes.meta;
                            this.target.lastQueryError = queryRes.error;
                        }
                    }
                };
                KDBQueryCtrl.prototype.transformToSegments = function (config) {
                    var _this = this;
                    return function (results) {
                        var segments = lodash_1.default.map(results, function (segment) {
                            return _this.uiSegmentSrv.newSegment({
                                value: segment.table ? segment.table : segment.c,
                                expandable: segment.expandable,
                            });
                        });
                        if (config.addTemplateVars) {
                            for (var _i = 0, _a = _this.templateSrv.variables; _i < _a.length; _i++) {
                                var variable = _a[_i];
                                var value = void 0;
                                value = '$' + variable.name;
                                if (config.templateQuoter && variable.multi === false) {
                                    value = config.templateQuoter(value);
                                }
                                segments.unshift(_this.uiSegmentSrv.newSegment({
                                    type: 'template',
                                    value: value,
                                    expandable: true,
                                }));
                            }
                        }
                        if (config.addNone) {
                            segments.unshift(_this.uiSegmentSrv.newSegment({ type: 'template', value: 'none', expandable: true }));
                        }
                        return segments;
                    };
                };
                KDBQueryCtrl.prototype.findAggregateIndex = function (selectParts) {
                    return lodash_1.default.findIndex(selectParts, function (p) { return p.def.type === 'aggregate'; });
                };
                KDBQueryCtrl.prototype.findBinaryAggIndex = function (selectParts) {
                    return lodash_1.default.findIndex(selectParts, function (p) { return p.def.type === 'binaryAgg'; });
                };
                KDBQueryCtrl.prototype.findMovingIndex = function (selectParts) {
                    return lodash_1.default.findIndex(selectParts, function (p) { return p.def.type === 'moving'; });
                };
                KDBQueryCtrl.prototype.findBucketIndex = function (groupParts) {
                    return lodash_1.default.findIndex(groupParts, function (p) { return p.def.type === 'bucket'; });
                };
                KDBQueryCtrl.prototype.findWindowIndex = function (selectParts) {
                    return lodash_1.default.findIndex(selectParts, function (p) { return p.def.type === 'window' || p.def.type === 'moving_window'; });
                };
                KDBQueryCtrl.prototype.addSelectPart = function (selectParts, item, subItem) {
                    var partType = item.value;
                    if (subItem && subItem.type) {
                        partType = subItem.type;
                    }
                    var partModel = sql_part_1.default.create({ type: partType });
                    if (subItem) {
                        partModel.params[0] = subItem.value;
                    }
                    var addAlias = false;
                    switch (partType) {
                        case 'column':
                            var parts = lodash_1.default.map(selectParts, function (part) {
                                return sql_part_1.default.create({ type: part.def.type, params: lodash_1.default.clone(part.params) });
                            });
                            this.selectParts.push(parts);
                            break;
                        case 'percentile':
                        case 'aggregate':
                            var aggIndex = this.findAggregateIndex(selectParts);
                            if (aggIndex !== -1) {
                                // replace current aggregation
                                selectParts[aggIndex] = partModel;
                            }
                            else {
                                selectParts.splice(1, 0, partModel);
                            }
                            if (!lodash_1.default.find(selectParts, function (p) { return p.def.type === 'alias'; })) {
                                addAlias = true;
                            }
                            break;
                        case 'binaryAgg':
                            var binAggIndex = this.findBinaryAggIndex(selectParts);
                            if (binAggIndex !== -1) {
                                // replace current aggregation
                                selectParts[binAggIndex] = partModel;
                            }
                            else {
                                selectParts.splice(1, 0, partModel);
                            }
                            if (!lodash_1.default.find(selectParts, function (p) { return p.def.type === 'alias'; })) {
                                addAlias = true;
                            }
                            break;
                        case 'moving_window':
                        case 'window':
                            var windowIndex = this.findWindowIndex(selectParts);
                            if (windowIndex !== -1) {
                                // replace current window function
                                selectParts[windowIndex] = partModel;
                            }
                            else {
                                var aggIndex_1 = this.findAggregateIndex(selectParts);
                                if (aggIndex_1 !== -1) {
                                    selectParts.splice(aggIndex_1 + 1, 0, partModel);
                                }
                                else {
                                    selectParts.splice(1, 0, partModel);
                                }
                            }
                            if (!lodash_1.default.find(selectParts, function (p) { return p.def.type === 'alias'; })) {
                                addAlias = true;
                            }
                            break;
                        case 'alias':
                            addAlias = true;
                            break;
                    }
                    if (addAlias) {
                        // set initial alias name to column name
                        partModel = sql_part_1.default.create({ type: 'alias', params: [selectParts[0].params[0].replace(/"/g, '')] });
                        if (selectParts[selectParts.length - 1].def.type === 'alias') {
                            selectParts[selectParts.length - 1] = partModel;
                        }
                        else {
                            selectParts.push(partModel);
                        }
                    }
                    this.updatePersistedParts();
                    this.panelCtrl.refresh();
                };
                KDBQueryCtrl.prototype.removeSelectPart = function (selectParts, part, index) {
                    if (part.def.type === 'column') {
                        if (this.selectParts.length > 1) {
                            var modelsIndex = lodash_1.default.indexOf(this.selectParts, selectParts);
                            this.selectParts.splice(modelsIndex, 1);
                        }
                    }
                    else {
                        selectParts.splice(index, 1);
                    }
                    this.updatePersistedParts();
                };
                KDBQueryCtrl.prototype.handleSelectPartEvent = function (part, index, evt, selectParts) {
                    var _this = this;
                    switch (evt.name) {
                        case 'get-param-options': {
                            return this.datasource
                                .metricFindQuery(this.metaBuilder.buildColumnQuery((this.target.format == 'time series') ? 'value' : 'tableValue'))
                                .then(this.transformToSegments({}))
                                .catch(this.handleQueryError.bind(this));
                        }
                        case 'part-param-changed': {
                            this.updatePersistedParts();
                            this.updateColumnMeta(part).then(function (result) {
                                part.datatype = result[1][0].t;
                                _this.panelCtrl.refresh();
                            });
                            break;
                        }
                        case 'action': {
                            this.removeSelectPart(selectParts, part, index);
                            this.panelCtrl.refresh();
                            break;
                        }
                        case 'get-part-actions': {
                            return this.$q.when([{ text: 'Remove', value: 'remove-part' }]);
                        }
                    }
                };
                KDBQueryCtrl.prototype.handleWherePartEvent = function (whereParts, part, evt, index) {
                    var _this = this;
                    switch (evt.name) {
                        case 'get-param-options': {
                            switch (evt.param.name) {
                                case 'left':
                                    return this.datasource
                                        .metricFindQuery(this.metaBuilder.buildColumnQuery('where'))
                                        .then(this.transformToSegments({}))
                                        .catch(this.handleQueryError.bind(this));
                                case 'right':
                                    if (['b', 'g', 'x', 'h', 'i', 'j', 'e', 'f', 'p', 'z', 'n', 'u', 'v', 't'].indexOf(part.datatype) > -1) {
                                        // don't do value lookups for numerical fields
                                        return this.$q.when([]);
                                    }
                                    else {
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
                                var subgroup = part.params[0].substr(part.params[0].indexOf('.') + 1);
                                part.datatype = this.metaBuilder.subgroupDatatypeLookup[subgroup];
                                this.panelCtrl.refresh();
                                break;
                            }
                            else {
                                this.datasource.metricFindQuery(this.metaBuilder.buildDatatypeQuery(part.params[0])).then(function (d) {
                                    if (d.length === 1) {
                                        part.datatype = d[0].t;
                                        _this.panelCtrl.refresh();
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
                            return this.$q.when([{ text: 'Remove', value: 'remove-part' }]);
                        }
                    }
                };
                KDBQueryCtrl.prototype.getWhereOptions = function () {
                    var options = [];
                    options.push(this.uiSegmentSrv.newSegment({ type: 'expression', value: 'Expression' }));
                    return this.$q.when(options);
                };
                KDBQueryCtrl.prototype.addWhereAction = function (part, index) {
                    this.whereParts.push(sql_part_1.default.create({ type: 'expression', params: ['select field', '=', 'enter value'] }));
                    this.updatePersistedParts();
                    this.resetPlusButton(this.whereAdd);
                    this.panelCtrl.refresh();
                };
                KDBQueryCtrl.prototype.handleQueryError = function (err) {
                    this.error = err.message || 'Failed to issue metric query';
                    return [];
                };
                KDBQueryCtrl.prototype.updateColumnMeta = function (part) {
                    var _this = this;
                    return new Promise(function (resolve) {
                        _this.datasource.metricFindQuery(_this.metaBuilder.getColumnDataType(part.params[0]))
                            .then(function (result) {
                            resolve(result);
                        });
                    });
                };
                KDBQueryCtrl.prototype.aggQueryToggled = function () {
                    if (!this.target.aggQuery) {
                        this.target.group = [];
                    }
                    else {
                        this.target.group = [[{ type: 'column', params: ['select group'] }]];
                    }
                    this.setupAdditionalMenu();
                    this.panelCtrl.refresh();
                };
                //This function runs when the 'useGrouping' checkbox is toggled
                KDBQueryCtrl.prototype.groupingToggled = function () {
                    if (this.target.queryType == 'functionQuery')
                        this.functionChanged();
                    this.panelCtrl.refresh();
                    //this.refresh();
                };
                //Setting the Conflation Fields to the default if Conflation is enabled
                KDBQueryCtrl.prototype.resetConflationFields = function () {
                    if (this.target.useConflation === true) {
                        this.target.conflationUnit = conflationUnitDefault;
                        this.target.conflationDuration = conflationDurationDefault;
                    }
                    ;
                    this.conflationSettingsChanged();
                    this.setupAdditionalMenu();
                };
                //Function Builder
                KDBQueryCtrl.prototype.functionChanged = function () {
                    if (this.target.useGrouping === true && (this.target.funcGroupCol == '' || !this.target.funcGroupCol)) {
                        this.target.queryError.error[3] = true;
                        this.target.queryError.message[3] = 'Grouping enabled but no grouping column defined';
                    }
                    else {
                        this.target.queryError.error[3] = false;
                        this.target.queryError.message[3] = '';
                    }
                    this.panelCtrl.refresh();
                };
                //This function resets various paramaeters and performs a number of checks in the query format has been reset
                KDBQueryCtrl.prototype.queryFormatRefresh = function () {
                    var _this = this;
                    if (this.target.format == 'table') {
                        this.target.useGrouping = false;
                        this.groupingToggled();
                    }
                    else {
                        this.selectParts.forEach(function (prt) {
                            if (prt[0].datatype == 's') {
                                var modelsIndex = lodash_1.default.indexOf(_this.selectParts, prt);
                                _this.selectParts.splice(modelsIndex, 1);
                            }
                        });
                    }
                    this.panelCtrl.refresh();
                };
                //toggling whether or not time should be included in the query for tabular results
                KDBQueryCtrl.prototype.temporalFieldToggled = function () {
                    //if time has been turned off, do stuff
                    if (!this.target.useTemporalField) {
                        this.target.useConflation = false;
                    }
                    this.panelCtrl.refresh();
                };
                KDBQueryCtrl.templateUrl = 'partials/query.editor.html';
                return KDBQueryCtrl;
            })(sdk_1.QueryCtrl);
            exports_1("KDBQueryCtrl", KDBQueryCtrl);
        }
    }
});
//# sourceMappingURL=query_ctrl.js.map