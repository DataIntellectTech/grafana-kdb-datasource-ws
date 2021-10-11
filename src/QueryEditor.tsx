import defaults from 'lodash/defaults';
import _ from 'lodash';
import React, { ChangeEvent, PureComponent } from 'react';
import {
  Alert,
  Button,
  ButtonSelect,
  Checkbox,
  ContextMenu,
  InlineField,
  InlineFormLabel,
  InlineLabel,
  InlineSegmentGroup,
  LegacyForms,
  Popover,
  Segment,
  SegmentAsync,
  SegmentInput,
  Select,
  TextArea,
  Tooltip,
  WithContextMenu,
} from '@grafana/ui';
import { DataQueryError, PanelProps, QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import { KDBMetaQuery } from './meta_query';
import KDBQuery from './kdb_query';
import { values } from 'lodash';
import sqlPart from './sql_part';
import { SqlPart } from './sql_part/sql_part';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;
type State = {
  queryTypeStr: string;
  tableFrom: string;
  useTemporalField: boolean;
  useConflation: boolean;
  conflationDuration: number;
  formatAs: string;
  rowCountLimit: number;
  showHelp: boolean;
  timeColumn: string;
  conflation: Conflation;
  functionBody: string;
  queryErrorMessage: string;
  isQueryError: boolean;
  useGrouping: boolean;
  funcGroupCol: string;
  target: MyQuery;
  selectOptions: SelectableValue<string>[];
  whereSegments: WhereSegment[];
  selectSegments: SelectSegment[];
  firstWhere: boolean;
  whereOperators: SelectableValue<string>[];
  groupBy: string;
  useAsyncFunction: boolean;
  asyncField: string;
  useCustomPostback: boolean;
  postbackFunction: string;
};

type WhereSegment = {
  expressionField: string;
  operator: string;
  value: string;
};

type SelectSegment = {
  value: string;
  type: string;
  aggregate?: string
  alias?: string
};

export type Conflation = {
  unitType: string;
  duration: number;
  aggregate: string
};

export const conflationUnitDefault: string = 'm';
export const conflationDurationDefault: string = '5';
export class QueryEditor extends PureComponent<Props, State> {
  uiSegmentSrv: any;
  templateSrv: any;
  selectMenu: any[];

  selectParts: SqlPart[][];
  whereParts: SqlPart[];
  

   version = this.props.datasource.meta.info.version
    
  queryOptions: SelectableValue[] = [
    { value: 'selectQuery', label: 'Built Query' },
    { value: 'functionQuery', label: 'free-form Query' },
  ];

  formatOptions: SelectableValue[] = [{ value: 'table', label: 'Table' }, { value: 'time series', label: 'Time series' }];


  unitOptions: SelectableValue[] = [
    { value: 'ms', label: 'Miliseconds' },
    { value: 's', label: 'Seconds' },
    { value: 'm', label: 'Minutes' },
    { value: 'h', label: 'Hours' },
  ];

  aggregateOptions: SelectableValue[] = [
    { label: 'Average', value: 'avg' },
    { label: 'Count', value: 'count' },
    { label: 'First', value: 'first' },
    { label: 'Last', value: 'last' },
    { label: 'Maximum', value: 'max' },
    { label: 'Median', value: 'med' },
    { label: 'Minimum', value: 'min' },
    { label: 'Sample Std Dev', value: 'sdev' },
    { label: 'Sample Variance', value: 'svar' },
    { texlabelt: 'Sum', value: 'sum' },
    { label: 'Standard Deviation', value: 'dev' },
    { label: 'Variance', value: 'var' },
  ];

  selectAddButtonOptions: SelectableValue[] = [
    { label: 'Add Column', value: 'add'},
    { label: 'Define Alias', value: 'alias'},
    { label: 'Aggregate Functions', value: 'aggregate'}
  ];    
  removeOption: SelectableValue[] = [{ label: 'remove', value: 'remove' }];




   constructor(props: Props) {
    super(props);

    const query = defaults(this.props.query, defaultQuery);

    let selectSegments: SelectSegment[] = []
    const { onRunQuery } = this.props;
    if(query.select) {
      query.select.map(segments => {
      segments.map(segment => {
          selectSegments.push({ value: segment.params[0], type: 'column', aggregate: segment.params[1], alias: segment.params[2] })
      })
     })
    }

    let whereSegments: WhereSegment[] = []
    if(query.where){
      query.where.map(segment => {
        whereSegments.push({ expressionField: segment.params[0], operator: segment.params[1], value: segment.params[2]})
      })
    }

    this.state = {
      queryTypeStr: 'selectQuery',
      tableFrom: query.table,
      useTemporalField: query.useTemporalField,
      useConflation: query.useConflation,
      conflationDuration: 5,
      formatAs: query.format,
      rowCountLimit: query.rowCountLimit,
      showHelp: false,
      timeColumn: query.timeColumn,
      conflation: query.conflation,
      functionBody: query.kdbFunction,
      isQueryError: false,
      queryErrorMessage: null,
      useGrouping: query.useGrouping,
      funcGroupCol: query.funcGroupCol,
      target: null,
      selectOptions: [],
      whereSegments: whereSegments,
      whereOperators: [],
      firstWhere: true,
      selectSegments: selectSegments,
      groupBy: query.groupingField,
      asyncField: query.asyncProcTypes,
      useAsyncFunction: query.useAsyncFunction,
      useCustomPostback: query.useCustomPostback,
      postbackFunction: query.postbackFunction,
    };
    // run the default query immediately to get default look
    onRunQuery();
  }

  onQueryChange(queryType: string) {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, queryType: queryType });
    if (queryType == 'selectQuery') {
      this.setState({ isQueryError: false, queryErrorMessage: '' });
    } else if (queryType == 'functionQuery') {
      this.functionChanged();
    }
    this.setState({ queryTypeStr: queryType });

    onRunQuery();
  }
  //Function Builder
  functionChanged() {
    if (this.state.useGrouping === true && (this.state.funcGroupCol == '' || !this.state.funcGroupCol)) {
      this.setState({ isQueryError: true, queryErrorMessage: 'Grouping enabled but no grouping column defined' });
    } else {
      this.setState({ isQueryError: false, queryErrorMessage: '' });
    }
  }
  async onTableFromChange(table: string) {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, table: table });
    this.setState({ tableFrom: table }, () => {
      let options = this.getSelectOptions.bind(this)
      // this.getSelectOptions(table).then((options) => {
        this.setState({ selectOptions: options });
      // });
    });
    onRunQuery();
  }
  onTimeColumnChange(column: string) {
    let target = {
      timeColumn: column,
      timeColumnType: '',
    };
    const { onChange, query, onRunQuery } = this.props;

    const queryModel = new KDBQuery(target);
    const metaBuilder = new KDBMetaQuery(target, queryModel);

    this.props.datasource.metricFindQueryDefault(metaBuilder.buildDatatypeQuery(target.timeColumn)).then((result) => {
      if (Array.isArray(result)) {
        if (typeof result[0].t == 'string') {
          target.timeColumnType = result[0].t;
        }
      }
    });

    onChange({ ...query, funcTimeCol: column, timeColumn: target.timeColumn, timeColumnType: target.timeColumnType });
    this.setState({ timeColumn: column });
    onRunQuery();
  }

  onFormatChange(format: string) {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, format: format  });
    onRunQuery();
    this.setState({ formatAs: format });
  }

  onDurationChange(duration: number) {
    let conflation = this.state.conflation
    conflation.duration = duration
    this.allConflationSettingsSet(conflation, this.state.useConflation)
    this.setState({ conflation: conflation });
  }

   allConflationSettingsSet(conflation, useConflation){
    if((conflation.unitType && conflation.duration && conflation.aggregate) || !useConflation){
      const { onChange, query, onRunQuery } = this.props;
      onChange({ ...query, useConflation: useConflation, conflation: conflation });
      onRunQuery();
    }
   }

  onRowLimitChange = (duration: number) => {
    const { onChange, query, onRunQuery } = this.props;
    let rowLimit = Number(duration)

    if( !isNaN(rowLimit)){
      // this.state.rowCountLimit = rowLimit
      // this.state.queryError.error[2] = false;
      onChange({ ...query, rowCountLimit: rowLimit });
      onRunQuery();
      this.setState({ rowCountLimit: rowLimit });
    }
    //TODO else do error
  };

  onUnitChange(unit: string) {
    let conflation = this.state.conflation
    conflation.unitType = unit
    this.allConflationSettingsSet(conflation, this.state.useConflation)
    this.setState({ conflation: conflation });
  }

  onAggregateChange(value: string) {
    let conflation = this.state.conflation
    conflation.aggregate = value
    this.allConflationSettingsSet(conflation, this.state.useConflation)
    this.setState({ conflation: conflation });
  }

  showHelp() {
    if (this.state.showHelp) {
      this.setState({ showHelp: false });
    } else {
      this.setState({ showHelp: true });
    }
  }

  useTemporalField = (checked: boolean) => {
    const { onChange, query, onRunQuery } = this.props;
    if(!checked){
      // reset conflation and grouping flags
      onChange({ ...query, useTemporalField: checked, useConflation: false, useGrouping: false });
    }else{
      onChange({ ...query, useTemporalField: checked });
    }
    this.setState({ useTemporalField: checked });
    onRunQuery();
  };

  useGrouping = (checked: boolean) => {
    // reset grouping if checked
    const { onChange, query, onRunQuery } = this.props;
    if(!checked){
      onChange({ ...query, useGrouping: checked });
      onRunQuery();
      this.setState({ useGrouping: checked });
    }else{      
      onChange({ ...query, useGrouping: checked, groupingField: '' });
      onRunQuery();
      this.setState({ useGrouping: checked, groupBy: '' });
    }
  };

  useConflation = (checked: boolean) => {
    let conflation: Conflation = {
      unitType: '',
      duration: 0,
      aggregate: '' 
    };
    this.allConflationSettingsSet(conflation, checked)
    this.setState({ useConflation: checked, conflation: conflation });
    this.forceUpdate()
  };

  onFunctionChange = (event) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, kdbFunction: event.target.value });
    onRunQuery();
    this.setState({ functionBody: event.target.value });
  };

  setWhereSegment = (segment: WhereSegment) => {
    let segments = this.state.whereSegments;
    const { onChange, query, onRunQuery } = this.props;
    let index = segments.indexOf(segment);
    segments[index] = segment;

    let whereParams = [];
    for (const segment of segments) {
      // Only add where if all segment fields are populated
      // Otherwise the component will render with no data until all are populated
      if (segment.expressionField && segment.operator && segment.value) {
        let values = [];
        Object.values(segment).map(function (value) {
          values.push(value);
        });
        whereParams.push({ params: values });
      }
    }

    onChange({ ...query, where: whereParams });
    onRunQuery();
    this.setState({ whereSegments: segments });
  };
  
  async setWhereOperators(field: string) {
    this.getOperators(field).then((operators) => this.setState({ whereOperators: operators }));
  }

  async getOperators(field: string) {
    let target = {
      table: this.state.tableFrom,
    };
    const queryModel = new KDBQuery(target);
    const metaBuilder = new KDBMetaQuery(target, queryModel);

    let query = metaBuilder.buildDatatypeQuery(field);
    let temp: SelectableValue[] = [];
    return this.props.datasource
      .metricFindQueryDefault(query)
      .then((result) => {
        if (Array.isArray(result)) {
          if (typeof result[0].t == 'string') {
            return result[0].t;
          }
        }
      })
      .then((result: string) => metaBuilder.getOperators(result))
      .then(function (operators) {
        operators.forEach((operator) => temp.push({ value: operator, label: operator }));
        return temp;
      });
  }

  async getWhereValues(field: string) {
    let target = {
      table: this.state.tableFrom,
    };
    const queryModel = new KDBQuery(target);
    const metaBuilder = new KDBMetaQuery(target, queryModel);
    let query = metaBuilder.buildValueQuery(
      field,
      this.props.data.timeRange.to,
      this.state.target.timeColumn,
      this.state.target.timeColumnType
    );
    return this.props.datasource.metricFindQuerySym(query).then(this.transformToSegments({}));
  }

  getTableSegments() {
    let target = {};

    const queryModel = new KDBQuery(target);
    const metaBuilder = new KDBMetaQuery(target, queryModel);

      const { datasource } = this.props;

      return new Promise<Array<SelectableValue<any>>>((resolve) => {
        setTimeout(async() => {
          const response = await datasource.metricFindQueryDefault(metaBuilder.buildTableQuery()).then(this.transformToSegments({}))
          const result = response.map((option: any) => {
              return {value: option.value, label: option.label}
          })
          resolve(result)
        }, 0);
      });
  }

  
  getSelectOptions() {
    const { datasource, query } = this.props;

    const queryModel = new KDBQuery(query);
    const metaBuilder = new KDBMetaQuery(query, queryModel);
    
      return new Promise<Array<SelectableValue<any>>>((resolve) => {
        setTimeout(async() => {
          const response = await datasource.metricFindQueryDefault(metaBuilder.buildColumnQuery(query.format == 'time series' ? 'value' : 'tableValue')).then(this.transformToSegments({}))
          const result = response.map((option: any) => {
            return {value: option.value,label: option.label}
          })
          resolve(result)
        }, 0);
      });


  }

  transformToSegments(config) {
    return (results: SelectableValue<string>[]) => {
      const segments = _.map(results, (segment) => {
        return {
          label: segment.table ? segment.table : segment.c,
          value: segment.table ? segment.table : segment.c,
        };
      });

      if (config.addTemplateVars) {
        for (const variable of this.templateSrv.variables) {
          let value;
          value = '$' + variable.name;
          if (config.templateQuoter && variable.multi === false) {
            value = config.templateQuoter(value);
          }

          segments.unshift({
            label: value,
            value: value,
          });
        }
      }

      if (config.addNone) {
        segments.unshift({ label: 'none', value: 'none' });
      }

      return segments;
    };
  }

  addSelectPart(selectParts, item, subItem) {
    let partType = item.value;
    if (subItem && subItem.type) {
      partType = subItem.type;
    }
    let partModel = sqlPart.create({ type: partType });
    if (subItem) {
      partModel.params[0] = subItem.value;
    }
    let addAlias = false;

    switch (partType) {
      case 'column':
        const parts = _.map(selectParts, (part: any) => {
          return sqlPart.create({ type: part.def.type, params: _.clone(part.params) });
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
      partModel = sqlPart.create({ type: 'alias', params: [selectParts[0].params[0].replace(/"/g, '')] });
      if (selectParts[selectParts.length - 1].def.type === 'alias') {
        selectParts[selectParts.length - 1] = partModel;
      } else {
        selectParts.push(partModel);
      }
    }

    // this.updatePersistedParts();
    // this.panelCtrl.refresh();
  }

  // updatePersistedParts() {
  //     this.state.target.select = _.map(this.selectParts, selectParts => {
  //         return _.map(selectParts, (part: any) => {
  //             return {type: part.def.type, datatype: part.datatype, params: part.params};
  //         });
  //     });
  //     this.state.target.where = _.map(this.whereParts, (part: any) => {
  //         return {type: part.def.type, datatype: part.datatype, name: part.name, params: part.params};
  //     });
  // }
  findAggregateIndex(selectParts) {
    return _.findIndex(selectParts, (p: any) => p.def.type === 'aggregate');
  }

  findBinaryAggIndex(selectParts) {
    return _.findIndex(selectParts, (p: any) => p.def.type === 'binaryAgg');
  }

  findWindowIndex(selectParts) {
    return _.findIndex(selectParts, (p: any) => p.def.type === 'window' || p.def.type === 'moving_window');
  }

  addNewWhereSegment() {
    let newSegment: WhereSegment = {
      expressionField: '',
      operator: '',
      value: '',
    };
    let tempSegments = this.state.whereSegments;
    tempSegments.push(newSegment);
    this.setState({ whereSegments: tempSegments, firstWhere: false }, () => {
      console.log('testing');
    });
    this.forceUpdate();
  }

  removeSegment(segment) {
    const { onChange, query, onRunQuery } = this.props;
    let segments = this.state.whereSegments.filter((obj) => obj !== segment);

    let whereParams = [];
    for (const segment of segments) {
      // Only add where if all segment fields are populated
      // Otherwise the component will render with no data until all are populated
      if (segment.expressionField && segment.operator && segment.value) {
        let values = [];
        Object.values(segment).map(function (value) {
          values.push(value);
        });
        whereParams.push({ params: values });
      }
    }

    onChange({ ...query, where: whereParams });
    onRunQuery();
    if (segments.length == 0) {
      this.setState({ whereSegments: segments, firstWhere: true });
    } else {
      this.setState({ whereSegments: segments });
    }
    this.forceUpdate();
  }

  onSelectAddButtonPress(option, segment){
    switch(option.value){
      case 'add':
        this.addNewSelectSegment()
        break;
      case 'alias':
          this.addSegmentAlias(segment)
          break;
      case 'aggregate': 
          this.addSegmentAggregate(segment)
         break;
    }
  }

  addNewSelectSegment() {
    let newSegment: SelectSegment = {
      value: '',
      type: ''
    };
    let tempSegments = this.state.selectSegments;
    tempSegments.push(newSegment);
    this.setState({ selectSegments: tempSegments }, () => {
      console.log('testing');
    });
    this.forceUpdate();
  }

  addSegmentAlias(segment){
    
    let segments = this.state.selectSegments
    segment.alias = 'value'
    let index = segments.indexOf(segment);
    segments[index] = segment;
    this.setState({ selectSegments: segments }, () => {
      console.log('testing');
    });
    this.forceUpdate();
  }

  addSegmentAggregate(segment){
    
    let segments = this.state.selectSegments
    segment.aggregate = 'avg'
    let index = segments.indexOf(segment);
    segments[index] = segment;
    this.setState({ selectSegments: segments }, () => {
      console.log('testing');
    });
    this.forceUpdate();
  }

  setSelectSegment = (segment: SelectSegment) => {
    let segments = this.state.selectSegments;
    const { onChange, query, onRunQuery } = this.props;
    let index = segments.indexOf(segment);
    segments[index] = segment;

    // let selectParams = []
    let list_string_values = [];
    for (const segment of segments) {
      let params = []

      if(segment.value){
        params.push({ type: 'column', params: [segment.value] })
      }

      if(segment.aggregate){
        params.push({ type: 'aggregate', params: [segment.aggregate] })
      }

      if(segment.alias){
        params.push({ type: 'alias', params: [segment.alias] })
      }

      list_string_values.push(params);
      // selectParams.push(segment.value)
    }

    onChange({ ...query, select: list_string_values });
    onRunQuery();
    this.setState({ selectSegments: segments });
  };

  removeSelectSegment(segment) {
    const { onChange, query, onRunQuery } = this.props;
    let segments = this.state.selectSegments.filter((obj) => obj !== segment);

    let list_string_values = [];
    for (const segment of segments) {
      let params = []

      if(segment.value){
        params.push({ type: segment.type, params: [segment.value] })
      }

      if(segment.aggregate){
        params.push({ type: 'aggregate', params: [segment.aggregate] })
      }

      if(segment.alias){
        params.push({ type: 'alias', params: [segment.alias] })
      }

      list_string_values.push(params);
      // selectParams.push(segment.value)
    }

    onChange({ ...query, select: list_string_values });
    onRunQuery();

    this.setState({ selectSegments: segments });
    this.forceUpdate();
  }

  removeSelectSegmentAlias(segment) {
    let segments = this.state.selectSegments
    let index = segments.indexOf(segment)
    segments[index].alias = ''

    this.setState({ selectSegments: segments });
    this.forceUpdate();        
  }

  onGroupByChange(groupBy){   
    const { onChange, query, onRunQuery } = this.props;

    onChange({ ...query, groupingField: groupBy, funcGroupCol: groupBy });
    onRunQuery();

    this.setState({groupBy: groupBy, funcGroupCol: groupBy})
  }

  removeSelectSegmentAggregate(segment) {
    let segments = this.state.selectSegments
    let index = segments.indexOf(segment)
    segments[index].aggregate = ''

    this.setState({ selectSegments: segments });
    this.forceUpdate();        
  }



  // conflationSettingsChanged() {
  //   //Conflation errors are reported in queryError at index 1
  //   this.state.target.queryError.error[1] = false;
  //   if (isNaN(this.conflationDurationSegment.value)) {
  //     //Test if its a variable
  //     let instVariables = this.templateSrv.getVariables();
  //     let namedVars: string[] = [];
  //     for (var i = 0; i < instVariables.length; i++) {
  //       namedVars = namedVars.concat('${' + instVariables[i].name + '}');
  //     }
  //     namedVars = namedVars.concat(['$__interval', '$__interval_ms']);
  //     //If it is a variable, set target.conflationDuration to it
  //     if (namedVars.indexOf(this.conflationDurationSegment.value) !== -1) {
  //       this.state.target.conflationDuration = this.conflationDurationSegment.value;
  //     } else {
  //       // Otherwise error
  //       this.state.target.queryError.error[1] = true;
  //       this.state.target.queryError.message[1] = 'Conflation duration must be a number.';
  //     }
  //   } else this.state.target.conflationDuration = this.conflationDurationSegment.value;

  //   if (this.state.target.useConflation === false) {
  //     this.selectParts.map((partGroup) => {
  //       for (let i = 0; i < partGroup.length; i++) {
  //         if (partGroup[i].part.type == 'aggregate') partGroup.splice(i, 1);
  //       }
  //     });
  //   }
  //   // this.updatePersistedParts();
  //   // this.panelCtrl.refresh();
  // }
  getTimeColumnSegments() {
    const { datasource, query } = this.props;

    const queryModel = new KDBQuery(query);
    const metaBuilder = new KDBMetaQuery(query, queryModel);
  
    return new Promise<Array<SelectableValue<any>>>((resolve) => {
      setTimeout(async() => {
        const response = await datasource.metricFindQueryDefault(metaBuilder.buildColumnQuery('time')).then(this.transformToSegments({}));
        const result = response.map((option: any) => {
          return {value: option.value, label: option.label}
        })
        resolve(result)
      }, 0);
    });
}
  useAsyncFunction(checked){
    const { onChange, query, onRunQuery } = this.props;
    if(!checked){
      onChange({ ...query, useAsyncFunction: checked });
      onRunQuery();
      this.setState({ useAsyncFunction: checked });
    }else{      
      onChange({ ...query, useAsyncFunction: checked, asyncProcTypes: '' });
      onRunQuery();
      this.setState({ useAsyncFunction: checked, asyncField: '' });
    }
  }
  
  asyncFieldChanged(asyncField){
    const { onChange, query, onRunQuery } = this.props;

    onChange({ ...query, asyncProcTypes: asyncField});
    onRunQuery();

    this.setState({asyncField: asyncField})
  }

  useCustomPostback(checked){
    const { onChange, query, onRunQuery } = this.props;
    if(!checked){
      onChange({ ...query, useCustomPostback: checked });
      onRunQuery();
      this.setState({ useCustomPostback: checked });
    }else{      
      onChange({ ...query, useCustomPostback: checked, postbackFunction: '' });
      onRunQuery();
      this.setState({ useCustomPostback: checked, postbackFunction: '' });
    }
  }

  render() {
    
    const query = defaults(this.props.query, defaultQuery);

    const data = this.props.data;
    var error: DataQueryError
    if(data)
    {
      error = data.error
    }

    var selectAddButtonOptions = this.selectAddButtonOptions

    if(!this.state.useConflation )
    {
      selectAddButtonOptions = selectAddButtonOptions.filter((o) => o.value !== 'aggregate')
    }
   
    return (
      <div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <span className="gf-form-label query-keyword width-10">
                Query Type
              </span>
              <Select
                width={20}
                placeholder="Select Query Type"
                options={this.queryOptions}
                onChange={(e: SelectableValue<string>) => this.onQueryChange(e.value)}
                value={this.state.queryTypeStr || ''}
              />
          </div>
          <div className="gf-form gf-form--grow">
            <div className="gf-form-label gf-form-label--grow"></div>
          </div>
        </div>
        {this.state.queryTypeStr && this.state.queryTypeStr === 'selectQuery' && (
          <div>
            <div className="gf-form-inline">
              <div className="gf-form">
                {/* <InlineField label="From" labelWidth={20} style={{color: '#33A2E5'}} grow={true}> */}
                  <span className="gf-form-label query-keyword width-10">
                     From
                  </span>
                  <SegmentAsync
                    width={20}
                    placeholder="Select Table"
                    loadOptions={this.getTableSegments.bind(this)}
                    onChange={(e: SelectableValue<string>) => this.onTableFromChange(e.value)}
                    value={this.state.tableFrom || ''}
                  />
                {/* </InlineField> */}
              </div>
              <div className="gf-form gf-form--grow">
                <div className="gf-form-label gf-form-label--grow"></div>
              </div>
            </div>
            {this.state.useTemporalField && (
              <div className="gf-form-inline">
                <div className="gf-form">
                    <InlineFormLabel className="query-keyword" tooltip="Time series data is plotted against this column.  Results are also automatically filtered on this field using the date extents of the graph.">
                      Time Column
                    </InlineFormLabel>
                    <SegmentAsync
                      width={20}
                      placeholder="time"
                      loadOptions={this.getTimeColumnSegments.bind(this)}
                      onChange={(e: SelectableValue<string>) => this.onTimeColumnChange(e.value)}
                      value={this.state.timeColumn || ''}
                    />
                </div>
                <div className="gf-form gf-form--grow">
                  <div className="gf-form-label gf-form-label--grow"></div>
                </div>
              </div>
            )}
            {/* <div className="gf-form-inline"> */}
              {this.state.selectSegments.length == 0 && (
                <div className="gf-form-inline">
                  <span className="gf-form-label query-keyword width-10">
                     Select
                  </span>
                  <div className="gf-form-label width-4">
                      <Button
                          type="button"
                          className="btn btn-primary"
                          onClick={this.addNewSelectSegment.bind(this)}
                          style={{ background: '#202226', padding: '10', outline: 'none' }}
                        >+</Button>
                  </div>
                  <div className="gf-form gf-form--grow">
                    <div className="gf-form-label gf-form-label--grow" style={{padding: '10'}}></div>
                  </div>
                </div>
              )}
            {this.state.selectSegments.map((segment) => {
              return (
                <div className="gf-form-inline">
                  {this.state.selectSegments.indexOf(segment) == 0 && (
                    <div className="gf-form-inline">
                    <span className="gf-form-label query-keyword width-10">
                       Select
                    </span>
                    </div>
                  )}
                  {this.state.selectSegments.indexOf(segment) > 0 && (
                    <label className="gf-form-label query-keyword width-10" />
                  )}
                  <div className="gf-form">
                    {/* <InlineSegmentGroup> */}
                        <Segment className="query-keyword"
                          value="Column:"
                          options={this.removeOption}
                          onChange={() => this.removeSelectSegment(segment)}
                        />
                        <SegmentAsync
                          onChange={(e: SelectableValue<string>) => {
                            segment.value = e.value;
                            this.setSelectSegment(segment);
                          }}
                          loadOptions={this.getSelectOptions.bind(this)}
                          value={segment.value || ''}
                          placeholder="Select field"
                        />
                    {/* </InlineSegmentGroup> */}
                  </div>
                    {segment.alias && (
                      <div className="gf-form-inline">
                        <InlineSegmentGroup>
                            <Segment
                              value="Alias:"
                              options={this.removeOption}
                              onChange={() => this.removeSelectSegmentAlias(segment)}
                            />
                            <SegmentInput
                              onChange={(e: string) => {
                                segment.alias = e;
                                this.setSelectSegment(segment);
                              }}
                              value={segment.alias || ''}
                            />
                        </InlineSegmentGroup>
                      </div>
                    )}
                    {segment.aggregate && (
                      <div className="gf-form-inline">
                      <InlineSegmentGroup>
                          <Segment
                            value="Aggregate:"
                            options={this.removeOption}
                            onChange={() => this.removeSelectSegmentAggregate(segment)}
                          />
                          <Segment
                            onChange={(e: SelectableValue<string>) => {
                              segment.aggregate = e.value;
                              this.setSelectSegment(segment);
                            }}
                            options={this.aggregateOptions}
                            value={segment.aggregate || ''}
                          />
                      </InlineSegmentGroup>
                    </div>                      
                    )}
                    <div>
                      <ButtonSelect
                          options={selectAddButtonOptions}
                          onChange={(e: SelectableValue<string>) => this.onSelectAddButtonPress(e, segment)}
                          style={{ background: '#202226' }}

                      >+</ButtonSelect>
                    </div>                  
                  <div className="gf-form gf-form--grow">
                    <div className="gf-form-label gf-form-label--grow"></div>
                  </div>
                </div>
              );
            })}
              {this.state.whereSegments.length == 0 && (
                <div className="gf-form-inline">
                  <InlineFormLabel className="query-keyword"
                    width={10}
                    tooltip="'in' and 'within' operator arguments need to be provided as a comma seperated list (e.g. sym in AAPL,MSFT,IBM). 'within' requires lower bound first (e.g within 75,100; NOT within 100,75)."
                  >
                    Where
                  </InlineFormLabel>
                  <div className="gf-form-label width-4">
                    <Button
                      type="button"
                      className="btn btn-primary"
                      onClick={this.addNewWhereSegment.bind(this)}
                      style={{ width: '5', background: '#202226', padding: '10', outline: 'hidden'}}
                    >+</Button>
                  </div>
                  <div className="gf-form gf-form--grow">
                    <div className="gf-form-label gf-form-label--grow"></div>
                  </div>
                </div>
              )}
            {this.state.whereSegments.map((segment) => {
              return (
                <div className="gf-form-inline">
                  {this.state.whereSegments.indexOf(segment) == 0 && (
                    <div className="gf-form-inline">
                      <InlineFormLabel className="query-keyword"
                        width={10}
                        tooltip="'in' and 'within' operator arguments need to be provided as a comma seperated list (e.g. sym in AAPL,MSFT,IBM). 'within' requires lower bound first (e.g within 75,100; NOT within 100,75)."
                      >
                        Where
                      </InlineFormLabel>
                    </div>
                  )}

                  {/* <div className="gf-form">   */}
                  {this.state.whereSegments.indexOf(segment) > 0 && (
                    <label className="gf-form-label query-keyword width-10" />
                  )}
                  <div className="gf-form">
                        <Segment value="Expr" options={this.removeOption} onChange={() => this.removeSegment(segment)} />
                        <Segment
                          onChange={(e: SelectableValue<string>) => {
                            segment.expressionField = e.value;
                            this.setWhereSegment(segment);
                            this.setWhereOperators(e.value);
                          }}
                          options={this.getSelectOptions.bind(this)}
                          value={segment.expressionField || ''}
                          placeholder="Select field"
                        />
                        <Segment
                          onChange={(e: SelectableValue<string>) => {
                            segment.operator = e.value;
                            this.setWhereSegment(segment);
                          }}
                          options={this.state.whereOperators}
                          value={segment.operator || '='}
                          defaultValue={'='}
                        />
                        <SegmentInput
                          onChange={(e: string) => {
                            segment.value = e;
                            this.setWhereSegment(segment);
                          }}
                          placeholder="enter value"
                          value={segment.value || ''}
                        />
                  </div>
                  {this.state.whereSegments.indexOf(segment) == this.state.whereSegments.length - 1 && (
                    <div className="gf-form-inline">
                      {' '}
                      <Button
                        type="button"
                        className="btn btn-primary"
                        onClick={this.addNewWhereSegment.bind(this)}
                        style={{ background: '#202226' }}
                      >
                        +
                      </Button>{' '}
                    </div>
                  )}
                  {/* </div> */}
                  <div className="gf-form gf-form--grow">
                    <div className="gf-form-label gf-form-label--grow"></div>
                  </div>
                </div>
              );
            })}

            {/* </div> */}
          </div>
        )}
        {this.state.queryTypeStr && this.state.queryTypeStr == 'functionQuery' && (
          
          <div className="gf-form-inline">
            <div className="gf-form" style={{ height: '111px' }}>
              <span className="gf-form-label query-keyword width-10" style={{ height: '111px' }}>
                Function
              </span>
              <textarea
                className="gf-form-textarea width-30"
                rows={5}
                style={{ background: '#0b0c0e' }}
                value={this.state.functionBody}
                placeholder="Enter function"
                onChange={this.onFunctionChange}
              ></textarea>
            </div>
            <div className="gf-form gf-form--grow" style={{ height: '111px' }}>
              <div className="gf-form-label gf-form-label--grow" style={{ height: '111px' }}></div>
            </div>
          </div>
        )}
        {this.state.queryTypeStr && this.state.queryTypeStr !== 'kdbSideQuery' && (
          <div>
            {this.state.queryTypeStr && this.state.queryTypeStr == 'functionQuery' && (
                <div>
                  <div className="gf-form-inline">
                    <div className="gf-form">
                      <InlineFormLabel className="gf-form-label query-keyword width-15" tooltip="This allows use of asynchronous functions provided they utilise a postback function. Enable 'Custom Postback' if using non-TorQ Gateway.">
                          <span>
                          <input type="checkbox" className="width-2" checked={this.state.useAsyncFunction} onChange={(e) => this.useAsyncFunction(e.currentTarget.checked)}/>
                        </span>Use Async with Postback</InlineFormLabel>
                  </div>
                    {this.state.useAsyncFunction && (  
                      <div className="gf-form">            
                          <InlineFormLabel className="query-keyword">Proc Types:</InlineFormLabel>
                            <SegmentInput
                                placeholder="Proc"
                                value={this.state.asyncField || ''}
                                onChange={(e: string) => {
                                  this.asyncFieldChanged(e);
                                }}
                              />
                          </div>       
                        )}
                        {this.state.useAsyncFunction && (  
                          <div className="gf-form">
                            <InlineFormLabel className="gf-form-label query-keyword width-15" tooltip="This allows use of asynchronous functions provided they utilise a postback function. Enable 'Custom Postback' if using non-TorQ Gateway.">
                            <span>
                              <input type="checkbox" className="width-2" checked={this.state.useCustomPostback} onChange={(e) => this.useCustomPostback(e.currentTarget.checked)}/>
                            </span>Custom Postback</InlineFormLabel>
                          </div>       
                      )}
                      <div className="gf-form gf-form--grow">
                        <div className="gf-form-label gf-form-label--grow"></div>
                      </div>
                  </div>
                  {this.state.useAsyncFunction && this.state.useCustomPostback && (
                    <div className="gf-form-inline" style={{ height: '111px;'}}>       
                      <span className="gf-form-label query-keyword width-10" style={{ height: '111px' }}/>
                      <div style={{ height: '111px;'}}>
                      <textarea
                          className="gf-form-textarea width-30"
                          rows={5}
                          style={{ background: '#0b0c0e' }}
                          value={this.state.postbackFunction}
                          placeholder="Enter custom postback function"
                          onChange={this.asyncFieldChanged}
                        />
                      </div>
                      <div className="gf-form gf-form--grow">
                        <div className="gf-form-label gf-form-label--grow" style={{ height: '111px'}}></div>
                      </div>
                    </div>
                  )}
                  </div>
              )}
            {this.state.formatAs && this.state.formatAs !== 'table' && (
            <div className="gf-form-inline">
                <div className="gf-form">
                  <InlineFormLabel className="gf-form-label query-keyword width-15" tooltip="Used to separate selected data into relevant groups. The column specified is the one which contains the groups by which you wish to separate your data.">
                  <span>
                    <input type="checkbox" className="width-2" checked={this.state.useGrouping} onChange={(e) => this.useGrouping(e.currentTarget.checked)}/>
                  </span>Use Grouping</InlineFormLabel>
                </div>
                {this.state.useGrouping && (
                  <div className="gf-form">
                    <InlineFormLabel className="query-keyword">Group By</InlineFormLabel>
                    <SegmentInput
                        value={this.state.groupBy || ''}
                        onChange={(e: string) => {
                          this.onGroupByChange(e);
                        }}
                      />
                  </div>
                )}
                <div className="gf-form gf-form--grow">
                  <div className="gf-form-label gf-form-label--grow"></div>
                </div>
            </div>
            )}
            <div className="gf-form-inline">
              <div className="gf-form" style={{wordBreak: 'break-word', textAlign: 'right'}}>
                <InlineFormLabel className="gf-form-label query-keyword width-15" tooltip="Used to enable a date/time column, acting as a key for each record.">
                  <span>
                    <input type="checkbox" className="width-2" checked={this.state.useTemporalField} onChange={(e) => this.useTemporalField(e.currentTarget.checked)}/>
                  </span>Use Temporal Field</InlineFormLabel>
              </div>
              {this.state.queryTypeStr === 'functionQuery' && this.state.useTemporalField && (
                <SegmentAsync
                  width={20}
                  placeholder="time"
                  loadOptions={this.getTimeColumnSegments.bind(this)}
                  onChange={(e: SelectableValue<string>) => this.onTimeColumnChange(e.value)}
                  value={this.state.timeColumn || ''}
              />
              )}
              <div className="gf-form gf-form--grow">
                <div className="gf-form-label gf-form-label--grow"></div>
              </div>
            </div>
            {this.state.useTemporalField && (
            <div className="gf-form-inline">
              <div className="gf-form">
                <InlineFormLabel className="gf-form-label query-keyword width-15" tooltip="The time series data is divided into 'buckets' of time, then reduced to a single point for each interval bucket.">
                  <span>
                    <input type="checkbox" className="width-2" checked={this.state.useConflation} onChange={(e) => this.useConflation(e.currentTarget.checked)}/>
                  </span>Use Conflation</InlineFormLabel>
                {this.state.useConflation && (
                  <div className="gf-form-inline">
                    <InlineFormLabel className="query-keyword">Duration</InlineFormLabel>
                    <SegmentInput
                      value={this.state.conflation.duration || 5}
                      onChange={(e: number) => {
                        this.onDurationChange(e);
                      }}
                    />
                    <InlineFormLabel className="query-keyword">Units</InlineFormLabel>
                    <Select
                      width={20}
                      options={this.unitOptions}
                      onChange={(e: SelectableValue<string>) => this.onUnitChange(e.value)}
                      value={this.state.conflation.unitType || ''}
                    />
                    <InlineFormLabel className="query-keyword"
                      width={20}
                      tooltip="The data in each bucket are reduced to a single value per bucket via an aggregation. E.G. 'Average' would take the mean of all points within each 5 minute peroid, for every 5 minute period of your time series data. It would then be the means that are plotted."
                    >
                      Default Aggregation
                    </InlineFormLabel>
                    <Select
                      width={20}
                      options={this.aggregateOptions}
                      onChange={(e: SelectableValue<string>) => this.onAggregateChange(e.value)}
                      value={this.state.conflation.aggregate || ''}
                    />
                  </div>
                )}
               </div>
                <div className="gf-form gf-form--grow">
                  <div className="gf-form-label gf-form-label--grow"></div>
                </div>
              </div>
            )}
          </div>
        )}
        <div>
          <div className="gf-form-inline">
            <div className="gf-form">
              <InlineFormLabel className="gf-form-label query-keyword">Format as</InlineFormLabel>
                <Select
                  width={20}
                  options={this.formatOptions}
                  onChange={(e: SelectableValue<string>) => this.onFormatChange(e.value)}
                  value={this.state.formatAs || ''}
                />
            </div>
            <div className="gf-form">
              <InlineFormLabel className="query-keyword" tooltip="An integer used to limit the number of rows loaded by Grafana for performance purposes.">Row Limit</InlineFormLabel>
              <SegmentInput
                value={this.state.rowCountLimit || ''}
                onChange={(e: number) => {
                  this.onRowLimitChange(e);
                }}
              />
            </div>
             <div className="gf-form">
              <Button
                onClick={this.showHelp.bind(this)}
                className="btn btn-primary"
                style={{ background: '#202226', color: '#33A2E5', outline: 'none'}}
               >Show Help
                {!this.state.showHelp && (<i className="fa fa-caret-right"></i>)}
                {this.state.showHelp && (<i className="fa fa-caret-down"></i>)}
               </Button>
            </div>
            <div className="gf-form gf-form--grow">
              <div className="gf-form-label gf-form-label--grow"></div>
            </div>
          </div>
        </div>
        {this.state.showHelp && (
          <div className="gf-form"  >
              <pre className="gf-form-pre alert alert-info"> {`
                Plugin Version:`} {this.version} {`
                First, choose the datasource you wish to query.
                Query Type - Built Query:
                  Essential:
                    From - Select Table:
                    - Click 'Select Table' and type in the table you wish to query. If not tables appear in a drop down, check your datasource is connected.
                    Time Column - Select Time:
                    - Click 'Select Time' and type the column you wish to use as the time axis for the graph. This field can be diabled in on table visualisation.
                    Select - Select Column:
                    - Click 'select column' and type the column you wish to select for your visualisation. More columns may be added using the plus button beside and typing 'Column'.
                    - To remove a column, click 'Column:' and press 'Remove' in the drop-down.
                    - The identification of a column can be customised by clicking the plus button bside the column and entering 'Alias'.
                    - If conflation is used, the aggregate function applied to a column can be changed by clicking the plus button, typing 'Aggregate' and choosing from the drop-down menu. 
                    - If you are creating a table and selecting a time coloumn, you may need to change the 'type' to 'time' in the visualisation menu.
                    Row Limit:
                    - This limits the number of records that can be returned by the server to aid the performance of Grafana. If row limit is reached, either change the number or use conflation.

                  Optional:
                    Where - Expression:
                    - Click the plus button and type 'Expression' to add a where-clause template.
                    - Each element can be changed in the where-clause by clicking on them.
                    - Click 'Expr:' and click 'Remove' to remove an expression.
                    Grouping - Select Field:
                    - To enable grouping, check the box. Then click 'Select Field', type the field by which to categorise your data.
                    Conflation - Duration, Units, Default Aggregation:
                    - To enable conflation, check the box. Then adjust the time-buckets by changing the number and units.
                    - The Default Aggregation is the operation applied across the records per time-bucket. This can be overriden under the 'Select Column' section by using the plus button.
                  
                  Example of using Alias, Where and Conflation:
                  FROM: trade
                  TIME COLUMN: time
                  SELECT: Column: price; Alias: GOOG
                  WHERE: Expr: sym = GOOG
                  USE CONFLATION: Duration - 30; Units - Seconds; Aggregation - Last
                
                  
                Query Type - Free-form Query:
                  Esential:
                    Function - Enter function:
                    - Enter a kdb select statement into the textbox.
                    - If using graph visualisation, ensure time is selected in your statement.
                    Time Column - time (Graph visualisation):
                    - Enter here the time column against which Grafana will plot your timeseries data.
                    - This can be disabled in table visualisation using the checkbox.

                  Optional:
                    Grouping - Select Field:
                    - In the function, ensure to select the column by which to group your data. DO NOT put it in the by-clause of the function for graphical visualisation.
                    - Type the column name into the grouping field.
                    Conflation - Duration, Units, Default Aggregation:
                    - To enable conflation, check the box. Then adjust the time-buckets by changing the number and units.
                    - The Default Aggregation is the operation applied across the records per time-bucket. 
                    - This is not currently independently configurable. To aggregate columns differently, add duplicate your query and change the column and aggregation.

                    
                Query Type - Function:
                    - Click 'Select Function' and type/choose the function to be used.
                    - The plugin will attempt to detect the number of arguments and create segments to be adjusted. If this fails, more argument segments can be added using the plus button.
                    - Conflation and row limit functions are explaining in the Built Query mode.


              `}</pre>
          </div>
        )}
        { error && (
          <Alert title={error.message} />
        // <div className="gf-form">
        //   <pre className="gf-form-pre alert alert-error">{error.message}</pre>
        // </div>
        )}    
      </div>
    );
  }
}
