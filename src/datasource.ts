import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  MetricFindValue,
  FieldType,
  DataQueryError,
} from '@grafana/data';

import ResponseParser from './response_parser';
import KDBQuery from './kdb_query';
import { MyQuery, MyDataSourceOptions } from './types';
import { tabFunction, defaultTimeout, kdbEpoch, durationMap } from './model/kdb-request-config';
import { KdbRequest } from './model/kdb-request';
import { QueryParam } from './model/query-param';
import { C } from './c';
import { QueryDictionary } from './model/queryDictionary';
import { ConflationParams } from './model/conflationParams';
import { graphFunction } from './model/kdb-request-config';
import { conflationUnitDefault } from './QueryEditor';
import _ from 'lodash';
import { getTemplateSrv } from '@grafana/runtime';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  //This is declaring the types of each member
  id: any;
  name: any;
  variables: any;
  responseParser: ResponseParser;
  queryModel: KDBQuery;
  //  interval: string;
  message = {};
  url: string;
  wsUrl: string;
  ws: WebSocket;
  awaitingResponse: boolean;
  c: C = new C();
  maxRowCount: number;
  connectionStateCycles: number;
  timeoutLength: number;

  //WebSocket communication variables
  requestSentList: any[];
  requestSentIDList: any[];
  responseReceivedList: any[];

  constructor(
    instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>,
    private backendSrv,
    private $q,
    private templateSrv
  ) {
    super(instanceSettings);

    this.templateSrv = templateSrv;
    this.name = instanceSettings.name;
    this.id = instanceSettings.id;
    this.responseParser = new ResponseParser(this.$q);
    this.queryModel = new KDBQuery({});
    this.interval = (instanceSettings.jsonData || {}).timeInterval;
    if (!instanceSettings.jsonData.timeoutLength) {
      this.timeoutLength = defaultTimeout;
    } else {
      this.timeoutLength = Number(instanceSettings.jsonData.timeoutLength);
    }
    this.requestSentList = [];
    this.requestSentIDList = [];
    this.responseReceivedList = [];

    this.url = 'http://' + instanceSettings.jsonData.host;
    if (instanceSettings.jsonData.useAuthentication) {
      if (instanceSettings.jsonData.useTLS === true) {
        this.wsUrl =
          'wss://' +
          instanceSettings.jsonData.user +
          ':' +
          instanceSettings.jsonData.password +
          '@' +
          instanceSettings.jsonData.host;
      } else {
        this.wsUrl =
          'ws://' +
          instanceSettings.jsonData.user +
          ':' +
          instanceSettings.jsonData.password +
          '@' +
          instanceSettings.jsonData.host;
      }
    } else {
      this.wsUrl = 'ws://' + instanceSettings.jsonData.host;
    }
  }

  query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    var prefilterResultCount = options.targets.length;

    if (prefilterResultCount == 0) {
      return new Promise((resolve) => {
        resolve({ data: [] });
      });
    }

    var allRefIDs = [];
    var blankRefIDs = [];
    var validRequestList = [];
    var errorList = [];

    for (var i = 0; i < prefilterResultCount; i++) {
      //Inject variables into target
      this.injectVariables(options.targets[i], options.scopedVars, options.range);

      // for some reason randomWalk is defaulted
      if (options.targets[i].queryType == 'randomWalk') {
        options.targets[i].queryType = 'selectQuery';
      }
      allRefIDs.push(options.targets[i].refId);
      options.targets[i].range = options.range;
      if (
        (!options.targets[i].table && options.targets[i].queryType === 'selectQuery') ||
        (options.targets[i].queryType === 'functionQuery' && options.targets[i].kdbFunction === '') ||
        options.targets[i].hide === true
      ) {
        blankRefIDs.push(options.targets[i].refId);
      } else if (!options.targets[i].queryError) {
        blankRefIDs.push(options.targets[i].refId);
      } else if (options.targets[i].queryError.error.indexOf(true) !== -1) {
        errorList.push({
          refId: options.targets[i].refId,
          errorMessage: options.targets[i].queryError.message[options.targets[i].queryError.error.indexOf(true)],
        });
      } else validRequestList.push(options.targets[i]);
    }

    var nrBlankRequests = blankRefIDs.length;
    var requestList = validRequestList.map((target) => {
      return this.buildKdbRequest(target);
    });

    var nrRequests: number = requestList.length;
    if (!this.ws || this.ws.readyState > 1)
      return this.connectWS().then((connectStatus) => {
        if (connectStatus === true && nrRequests > 0)
          return this.sendQueries(nrRequests, requestList, nrBlankRequests, blankRefIDs, errorList).then(
            (series: any) => {
              return this.buildDataFrames(series);
            }
          );
        else if (connectStatus === true && nrRequests === 0)
          return this.emptyQueries(nrBlankRequests, blankRefIDs, errorList).then(() => {
            return { data: [] };
          });
        else
          return this.connectFail(prefilterResultCount, allRefIDs).then(() => {
            return { data: [] };
          });
      });
    else {
      return this.webSocketWait().then(() => {
        if (nrRequests > 0)
          return this.sendQueries(nrRequests, requestList, nrBlankRequests, blankRefIDs, errorList).then(
            (series: any) => {
              return this.buildDataFrames(series);
            }
          );
        else
          return this.emptyQueries(nrBlankRequests, blankRefIDs, errorList).then(() => {
            return { data: [] };
          });
      });
    }
  }

  // Build the DataFrames to return to Grafana
  buildDataFrames(series) {
    let data: MutableDataFrame[] = [];
    let error = {} as DataQueryError;

    series.data.forEach((target) => {
      if (target.meta.errorMessage) {
        error.message = target.meta.errorMessage;
        throw new Error(target.meta.errorMessage);
      }
      if (target.columns) {
        var fields = [];
        target.columns.forEach((column) => {
          fields.push({ name: column.text });
        });
        const frame = new MutableDataFrame({
          refId: target.refId,
          fields: fields,
        });
        target.rows.forEach((element) => {
          var row = [];
          element.forEach((entry) => {
            row.push(entry);
          });
          frame.appendRow(row);
        });
        data.push(frame);
      } else {
        // time series

        let datapoints = target.datapoints;
        const timeValues = datapoints.map((datapoint) => datapoint[1]);
        const values = datapoints.map((datapoint) => datapoint[0]);

        const fields = [
          { name: 'Time', values: timeValues, type: FieldType.time },
          {
            name: target.target,
            values: values,
          },
        ];

        data.push(
          new MutableDataFrame({
            refId: target.refId,
            fields: fields,
          })
        );
      }
    });
    return { data, state: 'done' };
  }

  //This is the function called by Grafana when it is testing a connection on the configuration page
  testDatasource() {
    return this.connect().then((result) => {
      return result;
    });
  }
  //Replace variables with their values
  private variablesReplace(target: any, search: string, replace: any) {
    //Format Options as array or scalar
    if (Array.isArray(replace)) {
      target.kdbFunction = target.kdbFunction.replace(search, replace.join(','));
    } else {
      target.kdbFunction = target.kdbFunction.replace(search, replace);
    }
    //Replace Table Variables
    target.table = this.fieldInjectVariables(target.table, search, replace);
    //Replace select clause variables
    if (target.select !== [] && target.select.length > 0) {
      for (let i = 0; i < target.select[0].length; i++) {
        for (let y = 0; y < target.select[0][i].params.length; y++) {
          target.select[0][i].params[y] = target.select[0][i].params[y].replace(search, replace);
        }
      }
    }
    //Replace where clause variables
    if (target.where !== []) {
      for (let i = 0; i < target.where.length; i++) {
        for (let y = 0; y < target.where[i].params.length; y++) {
          if (Array.isArray(replace) && replace.length > 1) {
            if (target.where[i].params[y] === search) target.where[i].params[y] = replace;
          } else if ('string' == typeof target.where[i].params[y]) {
            target.where[i].params[y] = target.where[i].params[y].replace(search, replace);
          }
        }
      }
    }
    //Replace time, grouping and funcGroup columns if required
    target.timeColumn = this.fieldInjectVariables(target.timeColumn, search, replace);
    target.groupingField = this.fieldInjectVariables(target.groupingField, search, replace);
    target.funcGroupCol = this.fieldInjectVariables(target.funcGroupCol, search, replace);
    //Check row count is formatted correctly
    if ('string' == typeof target.rowCountLimit) {
      if (target.rowCountLimit === search) {
        if (Number.isInteger(Number(replace)) && Number(replace) > 0) {
          target.rowCountLimit = Number(replace);
        } else {
          target.queryError.error[2] = true;
          target.queryError.message[2] = 'Row count limit not a positive integer';
        }
      }
    }
    //Check conflation params are formatted correctly
    if ('string' == typeof target.conflationDuration) {
      if (target.conflationDuration === search) {
        if (isNaN(Number(replace))) {
          target.queryError.error[1] = true;
          target.queryError.message[1] = 'Conflation duration not a number';
        } else {
          target.conflationDuration = Number(replace);
        }
      }
    }
  }

  //Check if attribute needs replacing, then replace if so
  private fieldInjectVariables(attrib: any, search: string, replace: any) {
    // console.log('s',search)
    // console.log('r',replace)
    if (attrib) {
      attrib = attrib.replace(search, replace);
      // console.log('a1',attrib)
      return attrib;
    } else {
      // console.log('a2',attrib)
      return attrib;
    }
  }

  private injectVariables(target, scoped, range) {
    let instVariables = this.newGetVariables(getTemplateSrv());
    // console.log('TEMPLATESRV:', this.templateSrv);
    // console.log('VARIABLES: ', instVariables);
    // console.log('scp',scoped)
    let scopedVarArray = Object.keys(scoped);
    let scopedValueArray = [];
    //scoped variables inject
    for (let k = 0; k < scopedVarArray.length; k++) {
      scopedValueArray.push(scoped[scopedVarArray[k]].value);
      scopedVarArray[k] = '$' + scopedVarArray[k];
    }
    //local variables inject (user variables)
    for (let i = 0; i < instVariables.length; i++) {
      let varname = '${' + instVariables[i].name + '}';

      // console.log(varname.length)
      // console.log('vname:',varname)
      if (scopedVarArray.indexOf(varname) == -1) {
        scopedVarArray.push(varname);
        if (instVariables[i].current.text === 'All') {
          // console.log('trig1')
          scopedValueArray.push(instVariables[i].allValue);
        } else {
          // console.log('trig2')
          scopedValueArray.push(instVariables[i].current.value);
        }
      }
    }
    // console.log('scopedval',scopedValueArray)
    //$__from & $__to inject
    scopedVarArray.push('${__from}');
    scopedValueArray.push('(`timestamp$' + this.buildKdbTimestamp(range.from._d) + ')');
    scopedVarArray.push('${__to}');
    scopedValueArray.push('(`timestamp$' + this.buildKdbTimestamp(range.to._d) + ')');
    //Replace variables
    // console.log('TARGET: ',target);
    // console.log('SCOPEDVARARRAY:', scopedVarArray);
    // console.log('SCOPEDVALUEARRAY:', scopedValueArray);
    for (let kv = 0; kv < scopedVarArray.length; kv++) {
      this.variablesReplace(target, scopedVarArray[kv], scopedValueArray[kv]);
    }
  }

  //Change templateSrv object to be handled as variables
  private newGetVariables(templatesrv) {
    let instVariables = [];
    let variables = JSON.parse(JSON.stringify(templatesrv.getVariables()));
    for (let i = 0; i < variables.length; i++) {
      //Set the 'all' value if the option is enabled
      if (variables[i].options[0] && variables[i].options[0].text === 'All') {
        let valueArray = [];
        for (let j = 1; j < variables[i].options.length; j++) {
          valueArray.push(variables[i].options[j].value);
        }
        variables[i].allValue = valueArray;
      }
      instVariables.push(variables[i]);
    }
    return instVariables;
  }

  //Websocket per request?
  private buildKdbRequest(target) {
    let queryParam = new QueryParam();
    let kdbRequest = new KdbRequest();
    let queryDictionary = new QueryDictionary();
    let conflationParams = new ConflationParams();

    //Need to take into account quotes in line, replace " with \"
    queryDictionary.type = target.queryType == 'selectQuery' ? '`select' : '`function';
    queryDictionary.value = target.kdbFunction;

    queryParam.query = Object.assign({}, queryDictionary);
    queryParam.table = '`' + target.table;
    queryParam.column = this.buildColumnParams(target);
    queryParam.temporal_field = target.useTemporalField ? this.buildTemporalField(target) : [];
    queryParam.temporal_range = this.buildTemporalRange(target.range);
    queryParam.maxRowCount = target.rowCountLimit;
    // if (target.postbackFunction) queryParam.postbackFunction = target.postbackFunction;

    if (target.queryType == 'selectQuery') queryParam.where = this.buildWhereParams(target.where ? target.where : []);
    //conflation
    if (target.useConflation) {
      this.buildConflation(target);
      conflationParams.val = target.conflationDurationMS.toString();
      conflationParams.agg = target.conflation.aggregate;
      queryParam.conflation = Object.assign({}, conflationParams);
    } else {
      queryParam.conflation = [];
    }

    //add condition, has grouping been selected?
    if (target.useGrouping && target.queryType == 'selectQuery' && target.groupingField) {
      queryParam.grouping = ['`' + target.groupingField];
    } else if (target.useGrouping && target.queryType == 'functionQuery' && target.funcGroupCol) {
      queryParam.grouping = ['`' + target.funcGroupCol];
    } else {
      queryParam.grouping = [];
    }

    kdbRequest.time = this.getTimeStamp(new Date());
    kdbRequest.refId = target.refId;
    kdbRequest.query = ''; //query;
    kdbRequest.queryParam = Object.assign({}, queryParam);
    kdbRequest.format = target.format;
    kdbRequest.queryId = target.queryId;
    kdbRequest.version = target.version;
    // if (target.useAsyncFunction) kdbRequest.useAsyncFunction = target.useAsyncFunction;
    // if (target.useCustomPostback) kdbRequest.useCustomPostback = target.useCustomPostback;
    // if (target.asyncProcTypes) kdbRequest.asyncProcTypes = target.asyncProcTypes;

    for (let i = 0; i < target.queryError.error.length; i++) {
      if (target.queryError.error[i]) {
        throw new Error(target.queryError.message[i]);
      }
    }

    return [target.format == 'time series' ? graphFunction : tabFunction, Object.assign({}, kdbRequest)];
  }

  //This function
  private buildTemporalField(queryDetails) {
    if (queryDetails.queryType == 'selectQuery' && queryDetails.timeColumn) {
      return '`' + queryDetails.timeColumn;
    } else if (queryDetails.queryType == 'functionQuery' && queryDetails.funcTimeCol) {
      return '`' + queryDetails.funcTimeCol;
    } else {
      return [];
    }
  }

  private buildConflation(queryDetails) {
    if (['s', 'm', 'h', 'ms'].indexOf(queryDetails.conflation.unitType) == -1) {
      queryDetails.conflationUnit = conflationUnitDefault;
      queryDetails.queryError.error[1] = true;
      queryDetails.queryError.message[1] =
        'Conflation unit not support. Please post conflation settings on our GitHub page.';
    }
    queryDetails.conflationDurationMS =
      queryDetails.conflation.duration * durationMap[queryDetails.conflation.unitType];
  }

  private buildKdbTimestamp(date: Date) {
    return 1000000 * (date.valueOf() - kdbEpoch);
  }

  //Getting it to work via strings would require supporting timezones fully. Rabbit hole.
  /* private ES2015padStart(obj: string, length: number, fill: string) {
    //Effectively polyfill for String.padStart (fill length will only fill up to 10 missing characters)
    let f = length - obj.length;
    return f > 0 ? fill.repeat(10).substr(0,f) + obj : obj
}

private buildKdbTimestampString(date : Date) {
    let dt = date.getFullYear().toString() + '.' + 
        this.ES2015padStart((date.getMonth() + 1).toString(), 2, "0") + '.' + 
        this.ES2015padStart(date.getDate().toString(), 2, "0");
    let tm = this.ES2015padStart(date.getHours().toString(), 2, "0") + ':' + 
        this.ES2015padStart(date.getMinutes().toString(), 2, "0") + ':' + 
        this.ES2015padStart(date.getSeconds().toString(), 2, "0") + '.' + 
        this.ES2015padStart(date.getMilliseconds().toString(), 3, "0");
    return dt + 'D' + tm;
} */

  private buildTemporalRange(range) {
    let temporalRange: number[] = [];
    if (range) {
      temporalRange.push(this.buildKdbTimestamp(range.from._d));
      temporalRange.push(this.buildKdbTimestamp(range.to._d));
    }
    return temporalRange;
  }

  private buildWhereParams(queryWhereList): Array<string> {
    let whereArray = [];
    let whereClause = [];

    if (queryWhereList.length > 0) {
      queryWhereList.forEach((clause) => {
        let notStatement = false;
        if (clause.params[0] !== 'select field' && clause.params[2] !== 'enter value') {
          whereClause = [];
          if (clause.params[1].substr(0, 3) == 'not') {
            clause.params[1] = clause.params[1].substr(4);
            whereClause.push(clause.params[1]);
            notStatement = true;
          } else whereClause.push(clause.params[1]);
          whereClause.push('`' + clause.params[0]);
          //                    if (clause.datatype == 's') {
          if (['in', 'within'].indexOf(clause.params[1]) != -1) {
            if ('string' == typeof clause.params[2]) {
              whereClause.push(clause.params[2].split(',').map((str) => str.trim()));
            } else {
              whereClause.push(clause.params[2]);
            }
          } else if (clause.params[1] == 'like') {
            whereClause.push('"' + clause.params[2] + '"');
          } else whereClause.push(clause.params[2]);
          //                    }
          //                    else if (clause.datatype == 'c') {
          //                        whereClause.push('\"' + clause.params[2] + '\"');
          //                    }
          //                    else {
          //                        if (clause.params[1] == "within") {
          //                            whereClause.push(clause.params[2].split(",").map(str => str.trim()))
          //                        } else whereClause.push(clause.params[2]);
          //                    }
          if (notStatement === true) {
            // console.log('WHERECLAUSE', whereClause)
            whereClause.push('x');
          } else whereClause.push('o');
          whereArray.push(whereClause);
        }
      });
    }

    return whereArray;
  } //end of building of where clause

  //Builds the list of select functions consisting of the column name and an aggregation function where applicable
  private buildColumnParams(target): Array<string> {
    let columnArray: any[] = [];

    if (target.select) {
      target.select.forEach((select) => {
        if (select[0].params[0] !== 'select column') {
          let selectElement = [];
          if (target.useConflation) {
            if (select.length !== 1) {
              if (select[1].type == 'aggregate') {
                selectElement.push(select[1].params[0]);
              } else {
                selectElement.push(target.conflation.aggregate);
              }
            } else {
              selectElement.push(target.conflation.aggregate);
            }
          } else {
            selectElement.push('::'); //dummy value for kdb function
          }
          selectElement.push('`' + select[0].params[0]);

          //dealing with aliasing
          let alias = '::';
          if (select.length > 1) {
            if (select[1].type == 'alias') {
              alias = select[1].params[0];
            }
          }
          if (select.length == 3) {
            if (select[2].type == 'alias') {
              alias = select[2].params[0];
            }
          }

          selectElement.push(alias);
          columnArray.push(selectElement);
        }
      });
    } else {
      //temporary fix
      columnArray.push(['::', '`value', '::']);
    }
    return columnArray;
  }

  private getTimeStamp(date: Date): string {
    let dateString = date.valueOf().toString();
    return dateString.substring(0, dateString.length - 3);
  }

  showEmpty(Id: string, errormessage?: string) {
    if (typeof errormessage === 'undefined') {
      var returnobj = {
        refId: Id,
        columns: [],
        rows: [],
        meta: { refId: Id, errorReceived: false, errorMessage: '' },
      };
    } else {
      var returnobj = {
        refId: Id,
        columns: [],
        rows: [],
        meta: { refId: Id, errorReceived: true, errorMessage: errormessage },
      };
    }
    return returnobj;
  }

  errorReturn(errorstring: string) {
    return { payload: [], error: errorstring, success: false };
  }

  sendQueries(nrRequests, requestList, nrBlankRequests, blankRefIDs, errorList) {
    var curRequest: number = 0;
    var resultList = [];

    return new Promise((resolve) => {
      this.ProcessData(curRequest, nrRequests, resultList, requestList)
        .then(() => {
          for (var i = 0; i < nrBlankRequests; i++) {
            resultList.push(this.showEmpty(blankRefIDs[i]));
          }
          for (var i = 0; i < errorList.length; i++) {
            resultList.push(this.showEmpty(errorList[i].refId, errorList[i].errorMessage));
          }
          resolve({ data: resultList });
        })
        .catch((e) => {});
    });
  }
  connectFail(prefilterResultCount, allRefIDs) {
    return new Promise((resolve) => {
      let serverUnavailableResponse = [];
      for (var i = 0; i < prefilterResultCount; i++) {
        serverUnavailableResponse.push(this.showEmpty(allRefIDs[i], 'KDB+ server unavailable.'));
      }
      resolve({ data: serverUnavailableResponse });
    });
  }

  emptyQueries(nrBlankRequests, blankRefIDs, errorList) {
    return new Promise((resolve) => {
      let resultList = [];
      for (var i = 0; i < nrBlankRequests; i++) {
        resultList.push(this.showEmpty(blankRefIDs[i]));
      }
      for (var i = 0; i < errorList.length; i++) {
        resultList.push(this.showEmpty(errorList[i].refId, errorList[i].errorMessage));
      }
      resolve({ data: resultList });
    });
  }

  private ProcessData(curRequest, nrRequests, resultList, requestList) {
    return new Promise((resolve) => {
      this.getQueryResult(requestList[curRequest]).then((result) => {
        var indicies = Object.keys(result);
        if (result.hasOwnProperty('meta.errorReceived')) {
          resultList.push(result);
        } else {
          for (let i = 0; i < indicies.length; i++) {
            resultList.push(result[i]);
          }
        }

        if (curRequest == nrRequests - 1) {
          let returnVal = resultList;
          resolve(returnVal);
        } else {
          curRequest++;
          resolve(this.ProcessData(curRequest, nrRequests, resultList, requestList));
        }
      });
    });
  }

  //Response parser called here**********************
  private getQueryResult = (request: any): Promise<Object> => {
    let curRequest = request;
    let timeoutError = 'Query sent at ' + new Date() + ' timed out.';
    let malformedResError = 'Malformed response. Check KDB+ WebSocket handler is correctly configured.';
    let response = new Promise((resolve) => {
      this.executeAsyncQuery(curRequest).then((result) => {
        {
          const processedResult = this.responseParser.processQueryResult(result, curRequest);
          if (Object.keys(result).indexOf('payload') === -1) {
            return resolve([this.showEmpty(curRequest[1].refId, malformedResError)]);
          } else return resolve(processedResult);
        }
      });
    });
    let timeout = new Promise((resolve) => {
      let wait = setTimeout(() => {
        clearTimeout(wait);
        resolve([this.showEmpty(curRequest[1].refId, timeoutError)]);
      }, this.timeoutLength);
    });
    return Promise.race([timeout, response]);
  };

  connectWS() {
    return new Promise((connected) => {
      if (this.ws) {
        if (this.ws.readyState == 1) {
          connected(true);
          return;
        }
        if (this.ws.readyState > 1) {
          connected(false);
          return;
        }
        this.ws.addEventListener('onopen', function () { connected(true); });
        this.ws.addEventListener('onclose', function () { connected(false); });
        return;
      }

      this.ws = new WebSocket(this.wsUrl);
      this.ws.binaryType = 'arraybuffer';
      this.ws.onmessage = (response) => {
        this.executeAsyncReceive(response);
      };

      this.ws.onopen = () => {
        connected(true);
      };

      this.ws.onclose = () => {
        connected(false);
      };

      this.ws.onerror = () => {};
    });
  }

  webSocketWait() {
    return new Promise((ready) => {
      if (this.ws.readyState === 0) {
        setTimeout(() => ready(this.webSocketWait()), 20);
      } else ready('');
    });
  }

  executeAsyncQuery(request: any) {
    var requestResolve;
    let _c = this.c;
    var requestPromise = new Promise((resolve) => {
      let refIDn = Math.round(10000000 * Math.random());
      var wrappedRequest = { i: request, ID: refIDn };
      this.ws.send(_c.serialize(wrappedRequest));
      this.requestSentIDList.push(refIDn);
      requestResolve = resolve;
    });

    Object.assign(requestPromise, { resolve: requestResolve });
    let countSentList = this.requestSentList.length;
    this.requestSentList.push(requestPromise);
    return this.requestSentList[countSentList];
  }

  executeAsyncReceive(responseObj) {
    let _c = this.c;
    let deserializedResult = _c.deserialize(responseObj.data);
    if (!deserializedResult.ID) {
      // return console.log('received malformed data')
    } else if (this.requestSentIDList.indexOf(deserializedResult.ID) === -1) {
      // return console.log('received unrequested data');
    } else {
      var requestNum = this.requestSentIDList.indexOf(deserializedResult.ID);
      this.requestSentList[requestNum].resolve(deserializedResult.o);
    }
  }

  //Called for query variables
  metricFindQuery(kdbRequest: KdbRequest): Promise<MetricFindValue[]> {
    kdbRequest = this.injectUserVars(kdbRequest);
    return new Promise((resolve, reject) => {
      return this.connectWS().then((connectStatus) => {
        if (connectStatus === true){
            resolve(
              this.executeAsyncQuery(kdbRequest).then((result) => {
                const values = [];
                var properties = [];
                if (Array.isArray(result)) {
                  if (typeof result[0] === 'string') {
                    for (let i = 0; i < result.length; i++) {
                      values.push({ text: result[i] });
                    }
                  } else if (typeof result[0] === 'object') {
                    if (Object.keys(result[0]).length > 1) {
                      //checking that multiple rows for multiple columns don't come back as the preview tab only shows single values (not objects)
                      const errorResponse =
                        'Can only select single values. Attempted to return an object of key-value pairs. Unsafe query';
                      throw new Error(errorResponse);
                    }
                    for (var key in result[0]) {
                      if (result[0].hasOwnProperty(key) && typeof result[0][key] !== 'function') {
                        properties.push(key);
                      }
                    }
                    for (let i = 0; i < result.length; i++) {
                      values.push({ text: result[i][properties[0]] });
                    }
                  }
                } else if (typeof result === 'string') {
                  const errorResponse = `Check Query. Syntax error with: [ ${result} ]`;
                  throw new Error(errorResponse);
                }
                return values;
              })
            );
          }else{
            resolve([]);
          }
      });
    });
  }

  // Possibly not needed? Can reuse injectVariables instead possibly (no scoped/ranged vars though)
  injectUserVars(kdbRequest) {
    let instVariables = this.newGetVariables(getTemplateSrv());
    let localVarArray = [];
    let localValueArray = [];
    //local variables inject (user variables)
    for (let i = 0; i < instVariables.length; i++) {
      localVarArray.push('$' + instVariables[i].name);

      // Make sure length of current is greater than 0, otherwise an option hasn't been selected yet
      if (Object.keys(instVariables[i].current).length > 0 && instVariables[i].current.text[0] === 'All') {
        localValueArray.push(instVariables[i].allValue);
      } else {
        localValueArray.push(instVariables[i].current.value);
      }
    }
    for (let kv = 0; kv < localVarArray.length; kv++) {
      kdbRequest = kdbRequest.replace(localVarArray[kv], localValueArray[kv]);
    }
    return kdbRequest;
  }

  metricFindQueryDefault(/*kdbRequest: KdbRequest*/ kdbRequest: any) {
    // console.log('met',kdbRequest)
    return new Promise((resolve, reject) => {
      resolve(
        this.executeAsyncQuery(kdbRequest).then((result) => {
          return result;
        })
      );
    });
  }

  //Called for dropdowns of type s
  metricFindQuerySym(/*kdbRequest: KdbRequest*/ kdbRequest: any) {
    // console.log('met',kdbRequest)
    return new Promise((resolve, reject) => {
      resolve(
        this.executeAsyncQuery(kdbRequest).then((result) => {
          // console.log('res',result)
          let properties = [];
          for (var key in result[0]) {
            if (result[0].hasOwnProperty(key) && typeof result[0][key] !== 'function') {
              properties.push(key);
            }
          }
          for (let i = 0; i < result.length; i++) {
            result[i][properties[0]] = '`' + result[i][properties[0]];
          }

          return result;
        })
      );
    });
  }

  connect(): Promise<Object> {
    return new Promise<Object>((resolve, reject) => {
      if ('WebSocket' in window) {
        this.$q.when().then(
          setTimeout(() => {
            resolve(
              this.checkConnectionState().then((result) => {
                //clearTimeout;
                return result;
              })
            );
          }, 2000)
        );
      } else {
        resolve(this.buildResponse('Error', 'WebSocket not supported!', 'Error'));
      }
    });
  }

  //This checks the kdb+ connection state for the 'test connection' funciton
  checkConnectionState(): Promise<Object> {
    return new Promise((resolve) => {
      return this.connectWS().then((connectStatus) => {
        if (connectStatus === false) {
          resolve(
            this.buildResponse(
              'fail',
              'Data source cannot be connected, if using authentication/TLS check settings as above.',
              'Fail'
            )
          );
        } else {
          let timeout = new Promise((resolve) => {
            let wait = setTimeout(() => {
              clearTimeout(wait);
              resolve(
                this.buildResponse(
                  'fail',
                  "Web socket connections aren't configured correctly for Grafana on your kdb+ instance.  Please speak to your system administrator.",
                  'Fail'
                )
              );
            }, this.timeoutLength);
          });
          let response = new Promise((resolve) => {
            this.executeAsyncQuery('.z.ws').then((res) => {
              if (typeof res !== 'string') {
                resolve(
                  this.buildResponse(
                    'fail',
                    'Malformed response. Check KDB+ WebSocket handler is correctly configured.',
                    'Fail'
                  )
                );
              } else if (res.replace(' ', '').includes('ds:-9!x;')) {
                //if it looks like .z.ws is correctly configured then return success
                resolve(this.buildResponse('success', 'Data source successfully connected!', 'Success'));
              } else {
                //If .z.ws hasn't been configured correctly on the database then return an error message
                resolve(
                  this.buildResponse(
                    'fail',
                    "Web socket connections aren't configured correctly for Grafana on your kdb+ instance.  Please speak to your system administrator.",
                    'Fail'
                  )
                );
              }
            });
          });
          return resolve(Promise.race([timeout, response]));
        }
      });
    });
  }

  buildResponse(status: string, message: string, title: string) {
    return Promise.resolve({
      status,
      message,
      title,
    });
  }
}
