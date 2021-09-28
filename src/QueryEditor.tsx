import defaults from 'lodash/defaults';
import _ from 'lodash'
import React, { ChangeEvent, PureComponent } from 'react';
import { Button, Checkbox, Field, InlineField, LegacyForms, MultiSelect, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './datasource';
import { defaultQuery, MyDataSourceOptions, MyQuery } from './types';
import {KDBMetaQuery} from './meta_query';
import KDBQuery from './kdb_query';
import { values } from 'lodash';
import sqlPart from './sql_part';
import {SqlPart} from './sql_part/sql_part';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

type State = {
  queryTypeStr: string;
  tableFrom: string;
  selectValues: string[];
  whereValues: SelectableValue<string>[];
  useTemporalField: boolean;
  useConflation: boolean;
  formatAs: string;
  // todo must be number
  rowLimit: string;
  showHelp: boolean;
  timeColumn: string;
  unitOption: string;
  duration: string;
  aggregate: string;
  functionBody: string;
  queryErrorMessage: string;
  isQueryError: boolean;
  useGrouping: boolean;
  funcGroupCol: string
  target: MyQuery
  tableOption: string
  selectOptions: SelectableValue<string>[];
  whereOptions: SelectableValue<string>[];
  whereSegments:  WhereSegment[];
  whereOperators: SelectableValue<string>[];
};

type WhereSegment = {
    expressionField: string
    operator: string
    value: string
}

export const conflationUnitDefault: string = 'm';
export const conflationDurationDefault: string = "5";
export class QueryEditor extends PureComponent<Props, State> {
  uiSegmentSrv: any
  templateSrv: any  
  selectMenu: any[];

  selectParts: SqlPart[][];
  whereParts: SqlPart[]

  list_string_values: any[][] = [];

  constructor(props: Props){
    super(props);

    this.state = {
      queryTypeStr: 'selectQuery',
      tableFrom: null,
      selectValues: [],
      whereValues: [],
      useTemporalField: false,
      useConflation: false,
      formatAs: null,
      rowLimit: null,
      showHelp: false,
      timeColumn: null,
      unitOption: null,
      duration: null,
      aggregate: null,
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
      whereOperators: []
    }
    
  }
  
  onQueryChange(queryType: string) {
    const { onChange, query, onRunQuery } = this.props;
    onChange({...query, queryType: queryType})
    if(queryType == 'selectQuery') {
       this.setState({ isQueryError: false, queryErrorMessage: '' })
    } else if(queryType  == 'functionQuery'){
        this.functionChanged();
    }     
    this.setState( {queryTypeStr: queryType })
    
    onRunQuery();
  }
    //Function Builder
    functionChanged() {
      if(this.state.useGrouping === true && (this.state.funcGroupCol == '' || !this.state.funcGroupCol)) {
         
        this.setState({ isQueryError: true, queryErrorMessage: 'Grouping enabled but no grouping column defined' })
      } else {
        this.setState({ isQueryError: false, queryErrorMessage: '' })
      }
  }
  async onTableFromChange(table: string){  
    const { onChange, query, onRunQuery } = this.props;  
    onChange({...query, table: table})
    this.setState({tableFrom: table}, () => {
      this.getSelectOptions(table)
        .then(options => {
               this.setState({ selectOptions: options});
              })
    })
    onRunQuery();
  }
  onTimeColumnChange(column: string){
    this.setState( {timeColumn: column})
  }

  onFormatChange(format: string){
    this.setState( { formatAs: format})
  }

  onDurationChange(event: ChangeEvent<HTMLInputElement>){
    this.setState( { duration: event.target.value})
  }

  onMultiSelectChange = (item: Array<SelectableValue>) => {
    const { onChange, query, onRunQuery } = this.props;  
    let values: any[] = [];
    let string_values: string[] = [];
    for(const v of item.values()){
      values.push({type: 'test', params: [v.value]});
      string_values.push(v.value)
    }
    this.list_string_values.push(values);
    onChange({...query, select: this.list_string_values})
    // const str = values.join(',');
    this.setState({selectValues: string_values})
    onRunQuery();
  };

  onMultiSelectWhereChange = (item: Array<SelectableValue>) => {
    let values: SelectableValue<string>[] = [];
    for(const v of item.values()){
      values.push(v.value);
    }
    // const str = values.join(',');
    this.setState({whereValues: values})
  };

  onRowLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.setState({rowLimit: event.target.value})
  }

  onUnitChange(unit: string){
    this.setState( { unitOption: unit})
  }
  
  onAggregateChange(value: string){
    this.setState( {aggregate: value})
  }
  
  showHelp(){
    if(this.state.showHelp) {
      this.setState({showHelp: false})
    }else{
      this.setState({showHelp: true})
    }
  }

  useTemporalField = (checked: boolean) => {
    this.setState({ useTemporalField: checked });
  };

  useConflation = (checked: boolean) => {
    this.setState({ useConflation: checked });
  };

  onFunctionChange = (event) => {
    this.setState({functionBody: event.target.value });
  }

  setWhereSegment = (segment: WhereSegment) => {
    let segments = this.state.whereSegments
    let index = segments.indexOf(segment)
    segments[index] = segment
    this.setState({whereSegments: segments})
  }

  async setWhereData(field: string){
    this.getWhereValues(field)
       .then(values => 
          this.setState({whereValues: values}));


  }

  async setWhereOperators(field: string){
    this.getOperators(field)
    .then(operators => 
        this.setState({ whereOperators: operators}));
  }

  async getOperators(field: string){
    let target = {
      table: this.state.tableFrom
    }
    const queryModel = new KDBQuery(target);
    const metaBuilder  = new KDBMetaQuery(target, queryModel);
    
    let query = metaBuilder.buildDatatypeQuery(field)
    let temp: SelectableValue[] = []
    return this.props.datasource
            .metricFindQueryDefault(query)
            .then(result => {
              if (Array.isArray(result)) {
                  if (typeof result[0].t == 'string') {
                      return result[0].t;
                   }
               }
             })
            .then((result: string) => metaBuilder.getOperators(result))
            .then(function(operators){operators.forEach((operator) =>  temp.push({value: operator, label: operator})); return temp})
            // .then(this.transformToOperators({}))
  }

  async getWhereValues(field: string){
    let target = {
      table: this.state.tableFrom
    }
    const queryModel = new KDBQuery(target);
    const metaBuilder  = new KDBMetaQuery(target, queryModel);
    let query = metaBuilder.buildValueQuery(field )
    return this.props.datasource
      .metricFindQuerySym(query)
      .then(this.transformToSegments({}))    
  }

  getTableSegments() {
    let target = {

    }

    const queryModel = new KDBQuery(target);
    const metaBuilder  = new KDBMetaQuery(target, queryModel);
    let values: SelectableValue<string>[] = [];
   
    Promise.resolve( this.props.datasource
        .metricFindQueryDefault(metaBuilder.buildTableQuery())
        .then(this.transformToSegments({}))
        .then(options => {
          options.forEach((option) => values.push({value: option.value, label: option.label}));
        }))
      return values;
        // .catch(this.handleQueryError.bind(this));
  }

  async getSelectOptions(table?){
    //TODO figure this out
    let target = {
      format: 'dummy',
      table: table ? (this.state.tableFrom ? this.state.tableFrom: null) : null
    }
    const queryModel = new KDBQuery(target);
    const metaBuilder  = new KDBMetaQuery(target, queryModel);
    
    return this.props.datasource
          .metricFindQueryDefault(metaBuilder.buildColumnQuery((target.format == 'time series') ? 'value':'tableValue'))
          .then(this.transformToSegments({}));

  }

    transformToSegments(config) {
      return (results: SelectableValue[]) => {
          const segments = _.map(results, segment => {
              return ({
                  label: segment.table ? segment.table : segment.c,
                  value: segment.table ? segment.table : segment.c,
              }) as SelectableValue;
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
              segments.unshift({ label: 'none', value: 'none'});
          }

          return segments;
      };
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

  async addNewWhereSegment(){
    let newSegment: WhereSegment = {
        expressionField: '',
        operator: '',
        value: ''
    }
    let tempSegments = this.state.whereSegments
    tempSegments.push(newSegment)
    this.setState({whereSegments: tempSegments})
  }
  
  render() {
    const query = defaults(this.props.query, defaultQuery);    
    // const { queryType, bid, ask, sym, time } = query;


    let queryOptions: SelectableValue[] = [
          { value: 'selectQuery', label: 'Built Query', },
          {value: 'functionQuery', label: 'free-form Query', }];

    let formatOptions: SelectableValue[] = [
            { value: 'tableFormat', label: 'Table', }];
  
    let timeOptions: SelectableValue[] = [
      { value: 'time', label: 'time' }
    ];

    let unitOptions: SelectableValue[] = [
      { value: 'miliseconds', label: 'Miliseconds'},
      { value: 'seconds', label: 'Seconds'},
      { value: 'minutes', label: 'Minutes'},
      { value: 'hours', label: 'Hours'}
    ];

    let aggregateOptions: SelectableValue[] = [
      {label: 'Average', value: 'avg'},
      {label: 'Count', value: 'count'},
      {label: 'First', value: 'first'},
      {label: 'Last', value: 'last'},
      {label: 'Maximum', value: 'max'},
      {label: 'Median', value: 'med'},
      {label: 'Minimum', value: 'min'},
      {label: 'Sample Std Dev', value: 'sdev'},
      {label: 'Sample Variance', value: 'svar'},
      {texlabelt: 'Sum', value: 'sum'},
      {label: 'Standard Deviation', value: 'dev'},
      {label: 'Variance', value: 'var'}
    ];

    let tableOptions: SelectableValue<string>[] = this.getTableSegments();
    return (
      <div>
        <div className="gf-form-inline">
          <div className="gf-form">
          <InlineField
            label="Query Type"
            labelWidth={20}
            grow={true}
          >
            <Select 
              width={20}
              placeholder="Select Query Type"
              options={queryOptions}
              onChange={(e: SelectableValue<string>) => 
                this.onQueryChange(e.value)
              }
              value={this.state.queryTypeStr || ''}
            />
            </InlineField>
            </div> 
            <div className="gf-form gf-form--grow">
              <div className="gf-form-label gf-form-label--grow"></div>
            </div>
          </div>
          { this.state.queryTypeStr && this.state.queryTypeStr === 'selectQuery' && (
            <div>
              <div className="gf-form-inline">
                <div className="gf-form">
                  <InlineField
                  label="From"
                  labelWidth={20}
                  grow={true}
                >
                  <Select 
                    width={20}
                    placeholder="Select Table"
                    options={tableOptions}
                    onChange={(e: SelectableValue<string>) => 
                      this.onTableFromChange(e.value)
                    }
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
                    tooltip="Time series data is plotted against this column.  Results are also automatically filtered on this field using the date extents of the graph."
                  >
                    <Select 
                      width={20}
                      placeholder="time"
                      options={timeOptions}
                      onChange={(e: SelectableValue<string>) => 
                        this.onTimeColumnChange(e.value)
                      }
                      value={this.state.timeColumn || ''}
                    />
                    </InlineField>
                  </div>
                  <div className="gf-form gf-form--grow">
                    <div className="gf-form-label gf-form-label--grow"></div>
                  </div>
                </div>
              )}
              <div className="gf-form-inline">
                <div className="gf-form">
                  <InlineField
                  label="Select"
                  labelWidth={20}
                  grow={true}
                  >
                  <MultiSelect 
                    width={20}
                    placeholder="Select Field"
                    options={this.state.selectOptions}
                    onChange={this.onMultiSelectChange}
                    value={this.state.selectValues}
                  />
                    </InlineField>
                  </div>
                  <div className="gf-form gf-form--grow">
                    <div className="gf-form-label gf-form-label--grow"></div>
                  </div>
                </div>
                <div className="gf-form-inline">
                 <div className="gf-form">
                    <InlineField
                    label="Where"                
                    labelWidth={20}
                    tooltip="'in' and 'within' operator arguments need to be provided as a comma seperated list (e.g. sym in AAPL,MSFT,IBM). 'within' requires lower bound first (e.g within 75,100; NOT within 100,75)."
                    grow={true}
                  >
                    <Button variant="primary" onClick={this.addNewWhereSegment.bind(this)} style={{ background: '#0b0c0e'}}>+</Button>
                    {/* <MultiSelect 
                      width={20}
                      placeholder="Select Field"
                      options={this.state.whereOptions}
                      onChange={this.onMultiSelectWhereChange}
                      value={this.state.whereValues}
                    /> */}
                    </InlineField>                    
                    {( this.state.whereSegments.map((segment) => {
                          return (
                            <div className="gf-form-inline">
                              <div className="gf-form">
                                <label>Expr:</label>
                                <Select width={20}
                                  onChange={(e: SelectableValue<string>) => {
                                      segment.expressionField = e.value;
                                      this.setWhereSegment(segment)
                                      this.setWhereData(e.value)
                                      this.setWhereOperators(e.value)
                                    }
                                  }
                                  options={this.state.selectOptions}
                                  value={segment.expressionField || 'select field'}
                                  />
                                {/* Fix the loading here */}
                                <Select 
                                  width={20}
                                  onChange={(e: SelectableValue<string>) => {
                                      segment.operator = e.value;
                                      this.setWhereSegment(segment)
                                    }
                                  }
                                  options={this.state.whereOperators}
                                  value={segment.operator || '='}
                                  />
                                  <Select 
                                    width={20}
                                    onChange={(e: SelectableValue<string>) => {
                                        segment.value = e.value;
                                        this.setWhereSegment(segment)
                                      }
                                    }
                                    options={this.state.whereValues}
                                    value={segment.value || 'enter value'}
                                    />
                                  {/* {segment.expressionField ? segment.expressionField: 'select field'} {segment.operator ? segment.operator: '='} {segment.value ? segment.value: 'enter value'} */}
                              </div>
                            </div>
                            )
                        }
                      ))}
                  </div>
                  <div className="gf-form gf-form--grow">
                    <div className="gf-form-label gf-form-label--grow"></div>
                  </div>
                </div>
            </div>
          )}
          {this.state.queryTypeStr && this.state.queryTypeStr == 'functionQuery' && (
            <div>
                <div className="gf-form" style={ { height: '111px' } }>
                    <span className="gf-form-label query-keyword width-10" style={{ height: '111px'}}>Function</span>
                    <textarea className="gf-form-textarea width-30" rows={5} style={{ background: '#0b0c0e'}} value={this.state.functionBody} placeholder="Enter function" onChange={this.onFunctionChange}></textarea>
                </div>
                      
                <div className="gf-form gf-form--grow" style={{height:'111px'}}>
                  <div className="gf-form-label gf-form-label--grow" style={{height:'111px'}}></div>
              </div>
           </div>
          )}
          {this.state.queryTypeStr && this.state.queryTypeStr !== 'kdbSideQuery' && (
            // TODO panelType !== graph / heatmap
          <div>
            <div className="gf-form-inline">
              <div className="gf-form">
                <InlineField
                    label="Use Temporal Field"
                    labelWidth={30}
                    grow={true}
                    tooltip="Used to enable a date/time column, acting as a key for each record."
                  >
                  <Checkbox                   
                    checked={this.state.useTemporalField}
                    onChange={(e) => this.useTemporalField(e.currentTarget.checked)}
                    css=""/>
                  </InlineField>
                </div>
                <div className="gf-form gf-form--grow">
                  <div className="gf-form-label gf-form-label--grow"></div>
                </div>
              </div>
              {this.state.useTemporalField && (
              <div>
                <div className="gf-form-inline">
                  <div className="gf-form">
                    <InlineField
                        label="Use Conflation"
                        labelWidth={30}
                        grow={true}
                        tooltip="The time series data is divided into 'buckets' of time, then reduced to a single point for each interval bucket."
                      >
                      <Checkbox
                        checked={this.state.useConflation}
                        onChange={(e) => this.useConflation(e.currentTarget.checked)}
                        css=""/>
                    </InlineField>
                  </div>
                  {this.state.useConflation && (
                  <div className="gf-form-inline">
                    <div className="gf-form">
                      <FormField
                        label='Duration'
                        value={this.state.duration || ''}
                        labelWidth={20}
                        inputWidth={5}
                        onChange={this.onDurationChange}
                      />
                      </div>
                      <div className="gf-form">
                      <InlineField
                        label="Units"
                        labelWidth={10}
                        grow={true}
                      >
                      <Select 
                        width={10}
                        options={unitOptions}
                        onChange={(e: SelectableValue<string>) => 
                          this.onUnitChange(e.value)
                        }
                        value={this.state.unitOption || ''}
                        />
                      </InlineField>
                    </div>
                    <div className="gf-form">
                      <InlineField
                          label="Default Aggregation"
                          tooltip="The data in each bucket are reduced to a single value per bucket via an aggregation. E.G. 'Average' would take the mean of all points within each 5 minute peroid, for every 5 minute period of your time series data. It would then be the means that are plotted."
                          labelWidth={20}
                          grow={true}
                        >
                        <Select 
                          width={10}
                          options={aggregateOptions}
                          onChange={(e: SelectableValue<string>) => 
                            this.onAggregateChange(e.value)
                          }
                          value={this.state.aggregate || ''}
                          />
                        </InlineField>
                    </div>
                  </div>
                  )}
                  <div className="gf-form gf-form--grow">
                    <div className="gf-form-label gf-form-label--grow"></div>
                  </div>
                </div>
              </div>  
              )}
            </div>
          )}
          <div>
            <div className="gf-form-inline">
              <div className="fg-form">
              <InlineField
                label="Format as"
                labelWidth={10}
              >
                <Select 
                  width={10}
                  options={formatOptions}
                  onChange={(e: SelectableValue<string>) => 
                    this.onFormatChange(e.value)
                  }
                  value={this.state.formatAs || ''}
                /> 
              </InlineField>
              </div>
              <div className="gf-form">
                <FormField
                  label='Row Limit'
                  value={this.state.rowLimit || ''}
                  labelWidth={20}
                  tooltip="An integer used to limit the number of rows loaded by Grafana for performance purposes."
                  placeholder="1000"
                  onChange={this.onRowLimitChange}
                />
              </div>
               <div onClick={this.showHelp}><label>Show Help</label></div>
              <div className="gf-form gf-form--grow">
                <div className="gf-form-label gf-form-label--grow"></div>
              </div>
              </div>
          </div>
          {this.state.showHelp && (
            <div>
              <pre className="gf-form-pre alert alert-info">
                Plugin Version: 
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
