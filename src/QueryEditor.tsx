import defaults from 'lodash/defaults';
import _ from 'lodash';
import React, { ChangeEvent, PureComponent } from 'react';
import {
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
  SegmentInput,
  Select,
  TextArea,
  Tooltip,
  WithContextMenu,
} from '@grafana/ui';
import { PanelProps, QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import { KDBMetaQuery } from './meta_query';
import KDBQuery from './kdb_query';
import { values } from 'lodash';
import sqlPart from './sql_part';
import { SqlPart } from './sql_part/sql_part';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;
type pProps = PanelProps
type State = {
  queryTypeStr: string;
  tableFrom: string;
  selectValues: string[];
  whereValues: SelectableValue<string>[];
  useTemporalField: boolean;
  useConflation: boolean;
  conflationDuration: number;
  formatAs: string;
  // todo must be number
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
  tableOption: string;
  selectOptions: SelectableValue<string>[];
  whereOptions: SelectableValue<string>[];
  whereSegments: WhereSegment[];
  selectSegments: SelectSegment[];
  firstWhere: boolean;
  whereOperators: SelectableValue<string>[];
  groupBy: string;
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
  duration: string;
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
  

   constructor(props: Props) {
    super(props);

    const { onRunQuery } = this.props;
    this.state = {
      queryTypeStr: 'selectQuery',
      tableFrom: null,
      selectValues: [],
      whereValues: [],
      useTemporalField: false,
      useConflation: false,
      conflationDuration: 5,
      formatAs: null,
      rowCountLimit: null,
      showHelp: false,
      timeColumn: null,
      conflation: null,
      functionBody: null,
      isQueryError: false,
      queryErrorMessage: null,
      useGrouping: false,
      funcGroupCol: null,
      target: null,
      tableOption: null,
      selectOptions: [],
      whereOptions: [],
      whereSegments: [],
      whereOperators: [],
      firstWhere: true,
      selectSegments: [],
      groupBy: null,
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
      this.getSelectOptions(table).then((options) => {
        this.setState({ selectOptions: options });
      });
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

  onDurationChange(duration: string) {
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

  onMultiSelectChange = (item: Array<SelectableValue>) => {
    const { onChange, query, onRunQuery } = this.props;
    let string_values = [];
    let list_string_values = [];
    for (const v of item.values()) {
      list_string_values.push([{ type: 'column', params: [v.value] }]);
      string_values.push(v.value);
    }
    onChange({ ...query, select: list_string_values });
    // const str = values.join(',');
    this.setState({ selectValues: string_values });
    onRunQuery();
  };

  onMultiSelectWhereChange = (item: Array<SelectableValue>) => {
    let values: SelectableValue<string>[] = [];
    for (const v of item.values()) {
      values.push(v.value);
    }
    // const str = values.join(',');
    this.setState({ whereValues: values });
  };

  onRowLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    let rowLimit = Number(event.target.value)

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
    onChange({ ...query, useTemporalField: checked });
    this.setState({ useTemporalField: checked });
    onRunQuery();
  };

  useGrouping = (checked: boolean) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, useGrouping: checked });
    onRunQuery();
    this.setState({ useGrouping: checked });
  };

  useConflation = (checked: boolean) => {
    let conflation: Conflation = {
      unitType: '',
      duration: '',
      aggregate: '' 
    };
    this.allConflationSettingsSet(conflation, checked)
    this.setState({ useConflation: checked, conflation: conflation });
  };

  onFunctionChange = (event) => {
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

  async setWhereData(field: string) {
    this.getWhereValues(field).then((values) => this.setState({ whereValues: values }));
  }

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
    // .then(this.transformToOperators({}))
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
    let values: SelectableValue<string>[] = [];

    Promise.resolve(
      this.props.datasource
        .metricFindQueryDefault(metaBuilder.buildTableQuery())
        .then(this.transformToSegments({}))
        .then((options) => {
          options.forEach((option) => values.push({ value: option.value, label: option.label }));
        })
    );
    return values;
    // .catch(this.handleQueryError.bind(this));
  }

  async getSelectOptions(table?) {
    //TODO figure this out
    let target = {
      format: 'dummy',
      table: table ? (this.state.tableFrom ? this.state.tableFrom : null) : null,
    };
    const queryModel = new KDBQuery(target);
    const metaBuilder = new KDBMetaQuery(target, queryModel);

    return this.props.datasource
      .metricFindQueryDefault(metaBuilder.buildColumnQuery(target.format == 'time series' ? 'value' : 'tableValue'))
      .then(this.transformToSegments({}));
  }

  transformToSegments(config) {
    return (results: SelectableValue[]) => {
      const segments = _.map(results, (segment) => {
        return {
          label: segment.table ? segment.table : segment.c,
          value: segment.table ? segment.table : segment.c,
        } as SelectableValue;
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

    onChange({ ...query, groupingField: groupBy });
    onRunQuery();

    this.setState({groupBy: groupBy})
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

  render() {
    const query = defaults(this.props.query, defaultQuery);
    // const { queryType, bid, ask, sym, time } = query;

    const version = this.props.datasource.meta.info.version
    
    let queryOptions: SelectableValue[] = [
      { value: 'selectQuery', label: 'Built Query' },
      { value: 'functionQuery', label: 'free-form Query' },
    ];

    let formatOptions: SelectableValue[] = [{ value: 'table', label: 'Table' }, { value: 'time series', label: 'Time series' }];

    let timeOptions: SelectableValue[] = [{ value: 'time', label: 'time' }];

    let unitOptions: SelectableValue[] = [
      { value: 'ms', label: 'Miliseconds' },
      { value: 's', label: 'Seconds' },
      { value: 'm', label: 'Minutes' },
      { value: 'h', label: 'Hours' },
    ];

    let aggregateOptions: SelectableValue[] = [
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

    let selectAddButtonOptions: SelectableValue[] = [
      { label: 'Add Column', value: 'add'},
      { label: 'Define Alias', value: 'alias'},
      { label: 'Aggregate Functions', value: 'aggregate'}
    ];    

    if(!this.state.useConflation)
    {
      selectAddButtonOptions = selectAddButtonOptions.filter((o) => o.value !== 'aggregate')
    }

    let removeOption: SelectableValue[] = [{ label: 'remove', value: 'remove' }];

    let tableOptions: SelectableValue<string>[] = this.getTableSegments();
    return (
      <div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <InlineField label="Query Type" labelWidth={20} color={'#33A2E5'} grow={true}>
              <Select
                width={20}
                placeholder="Select Query Type"
                options={queryOptions}
                onChange={(e: SelectableValue<string>) => this.onQueryChange(e.value)}
                value={this.state.queryTypeStr || ''}
              />
            </InlineField>
          </div>
          <div className="gf-form gf-form--grow">
            <div className="gf-form-label gf-form-label--grow"></div>
          </div>
        </div>
        {this.state.queryTypeStr && this.state.queryTypeStr === 'selectQuery' && (
          <div>
            <div className="gf-form-inline">
              <div className="gf-form">
                <InlineField label="From" labelWidth={20} style={{color: '#33A2E5'}} grow={true}>
                  <Segment
                    width={20}
                    placeholder="Select Table"
                    options={tableOptions}
                    onChange={(e: SelectableValue<string>) => this.onTableFromChange(e.value)}
                    value={this.state.tableFrom || ''}
                  />
                </InlineField>
              </div>
              <div className="gf-form gf-form--grow">
                <div className="gf-form-label gf-form-label--grow"></div>
              </div>
            </div>
            {this.state.useTemporalField && (
              <div className="gf-form-inline">
                <div className="gf-form">
                  <InlineField
                    label="Time Column"
                    labelWidth={20}
                    grow={true} 
                    style={{color: '#33A2E5'}}
                    tooltip="Time series data is plotted against this column.  Results are also automatically filtered on this field using the date extents of the graph."
                  >
                    <Segment
                      width={20}
                      placeholder="time"
                      options={timeOptions}
                      onChange={(e: SelectableValue<string>) => this.onTimeColumnChange(e.value)}
                      value={this.state.timeColumn || ''}
                    />
                  </InlineField>
                </div>
                <div className="gf-form gf-form--grow">
                  <div className="gf-form-label gf-form-label--grow"></div>
                </div>
              </div>
            )}
            {/* <div className="gf-form-inline"> */}
              {this.state.selectSegments.length == 0 && (
                <div className="gf-form-inline">
                  <InlineFormLabel width={10}>Select</InlineFormLabel>
                  
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
                      <InlineFormLabel width={10}>Select</InlineFormLabel>
                    </div>
                  )}
                  {this.state.selectSegments.indexOf(segment) > 0 && (
                    <label className="gf-form-label query-keyword width-10" />
                  )}
                  <div className="gf-form">
                    <InlineSegmentGroup>
                      <InlineLabel>
                        <Segment
                          value="Column:"
                          options={removeOption}
                          onChange={() => this.removeSelectSegment(segment)}
                        />
                        <Segment
                          onChange={(e: SelectableValue<string>) => {
                            segment.value = e.value;
                            this.setSelectSegment(segment);
                          }}
                          options={this.state.selectOptions}
                          value={segment.value || ''}
                          placeholder="Select field"
                        />
                      </InlineLabel>
                    </InlineSegmentGroup>
                  </div>
                    {segment.alias && (
                      <div className="gf-form-inline">
                        <InlineSegmentGroup>
                          <InlineLabel>
                            <Segment
                              value="Alias:"
                              options={removeOption}
                              onChange={() => this.removeSelectSegmentAlias(segment)}
                            />
                            <SegmentInput
                              onChange={(e: string) => {
                                segment.alias = e;
                                this.setSelectSegment(segment);
                              }}
                              value={segment.alias || ''}
                            />
                          </InlineLabel>
                        </InlineSegmentGroup>
                      </div>
                    )}
                    {segment.aggregate && (
                      <div className="gf-form-inline">
                      <InlineSegmentGroup>
                        <InlineLabel>
                          <Segment
                            value="Aggregate:"
                            options={removeOption}
                            onChange={() => this.removeSelectSegmentAggregate(segment)}
                          />
                          <Segment
                            onChange={(e: SelectableValue<string>) => {
                              segment.aggregate = e.value;
                              this.setSelectSegment(segment);
                            }}
                            options={aggregateOptions}
                            value={segment.aggregate || ''}
                          />
                        </InlineLabel>
                      </InlineSegmentGroup>
                    </div>                      
                    )}
                    <div className="gf-form-inline">
                      <ButtonSelect
                          options={selectAddButtonOptions}
                          onChange={(e: SelectableValue<string>) => this.onSelectAddButtonPress(e, segment)}
                          className="btn btn-primary"
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
                  <InlineFormLabel
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
                      <InlineFormLabel
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
                    <InlineSegmentGroup>
                      <InlineLabel>
                        <Segment value="Expr" options={removeOption} onChange={() => this.removeSegment(segment)} />
                        <Segment
                          onChange={(e: SelectableValue<string>) => {
                            segment.expressionField = e.value;
                            this.setWhereSegment(segment);
                            // this.setWhereData(e.value)
                            this.setWhereOperators(e.value);
                          }}
                          options={this.state.selectOptions}
                          value={segment.expressionField || ''}
                          placeholder="Select field"
                        />
                        <Segment
                          onChange={(e: SelectableValue<string>) => {
                            segment.operator = e.value;
                            this.setWhereSegment(segment);
                          }}
                          options={this.state.whereOperators}
                          value={segment.operator || ''}
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
                      </InlineLabel>
                    </InlineSegmentGroup>
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
          <div>
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
          // TODO panelType !== graph / heatmap
          <div>
            {this.state.formatAs && this.state.formatAs !== 'table' && (
            <div className="gf-form-inline">
                <div className="gf-form">
                  <InlineFormLabel
                    width={20}
                    tooltip="Used to separate selected data into relevant groups. The column specified is the one which contains the groups by which you wish to separate your data."
                  >
                  <Checkbox
                    checked={this.state.useGrouping}
                    onChange={(e) => this.useGrouping(e.currentTarget.checked)}
                    css=""
                  />
                    Use Grouping
                  </InlineFormLabel>
                </div>
                {this.state.useGrouping && (
                  <div className="gf-form">
                    <InlineFormLabel>Group By</InlineFormLabel>
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
                <InlineFormLabel className="gf-form-label width-13" tooltip="Used to enable a date/time column, acting as a key for each record.">
                  <span>
                    <input type="checkbox" className="width-2" onChange={(e) => this.useTemporalField(e.currentTarget.checked)}/>
                  </span>Use Temporal Field</InlineFormLabel>
              </div>
              <div className="gf-form gf-form--grow">
                <div className="gf-form-label gf-form-label--grow"></div>
              </div>
            </div>
            {this.state.useTemporalField && (
            <div className="gf-form-inline">
              <div className="gf-form">
                <InlineFormLabel className="gf-form-label width-13" tooltip="The time series data is divided into 'buckets' of time, then reduced to a single point for each interval bucket.">
                  <span>
                    <input type="checkbox" className="width-2" onChange={(e) => this.useConflation(e.currentTarget.checked)}/>
                  </span>Use Conflation</InlineFormLabel>
                {this.state.useConflation && (
                  <div className="gf-form-inline">
                    <InlineFormLabel>Duration</InlineFormLabel>
                    <SegmentInput
                      value={this.state.conflation.duration || 5}
                      onChange={(e: string) => {
                        this.onDurationChange(e);
                      }}
                    />
                    <InlineFormLabel>Units</InlineFormLabel>
                    <Select
                      width={20}
                      options={unitOptions}
                      onChange={(e: SelectableValue<string>) => this.onUnitChange(e.value)}
                      value={this.state.conflation.unitType || ''}
                    />
                    <InlineFormLabel
                      width={20}
                      tooltip="The data in each bucket are reduced to a single value per bucket via an aggregation. E.G. 'Average' would take the mean of all points within each 5 minute peroid, for every 5 minute period of your time series data. It would then be the means that are plotted."
                    >
                      Default Aggregation
                    </InlineFormLabel>
                    <Select
                      width={20}
                      options={aggregateOptions}
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
            <div className="fg-form">
              <InlineField label="Format as" labelWidth={10} color={'#33A2E5'}>
                <Select
                  width={20}
                  options={formatOptions}
                  onChange={(e: SelectableValue<string>) => this.onFormatChange(e.value)}
                  value={this.state.formatAs || ''}
                />
              </InlineField>
            </div>
            <div className="gf-form">
              <FormField
                label="Row Limit"
                value={this.state.rowCountLimit || ''}
                labelWidth={10} 
                style={{color: '#33A2E5'}}
                tooltip="An integer used to limit the number of rows loaded by Grafana for performance purposes."
                placeholder="1000"
                onChange={this.onRowLimitChange}
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
              <pre className="gf-form-pre alert alert-info">
                Plugin Version: {version}
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


              </pre>
          </div>
        )}
      </div>
    );
  }
}
