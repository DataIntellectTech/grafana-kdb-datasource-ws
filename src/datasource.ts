///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import _ from 'lodash';
import ResponseParser from './response_parser';
import KDBQuery from './kdb_query';
//import {KDBMetaQuery} from './meta_query';
import { C } from './c';
import { KdbRequest } from "./model/kdb-request";
import { QueryParam } from "./model/query-param";
import { QueryDictionary } from "./model/queryDictionary";
import { ConflationParams } from "./model/conflationParams";
import { graphFunction } from './model/kdb-request-config';
import { tabFunction,defaultTimeout } from './model/kdb-request-config';
export class KDBDatasource {
    //This is declaring the types of each member
    id: any;
    name: any;
    responseParser: ResponseParser;
    queryModel: KDBQuery;
    interval: string;
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

    /** @ngInject */
    constructor(instanceSettings, private backendSrv, private $q, private templateSrv) {
        this.name = instanceSettings.name;
        this.id = instanceSettings.id;
        this.responseParser = new ResponseParser(this.$q);
        this.queryModel = new KDBQuery({});
        this.interval = (instanceSettings.jsonData || {}).timeInterval;
        if (!instanceSettings.jsonData.timeoutLength) {
            this.timeoutLength = defaultTimeout
        } else {
            this.timeoutLength = Number(instanceSettings.jsonData.timeoutLength)
        };
        this.requestSentList = [];
        this.requestSentIDList = []
        this.responseReceivedList = [];

        this.url = 'http://' + instanceSettings.jsonData.host;
        if (instanceSettings.jsonData.useAuthentication) {
            if(instanceSettings.jsonData.useTLS === true) {
                this.wsUrl = 'wss://' + instanceSettings.jsonData.user + ':' + instanceSettings.jsonData.password + '@' + instanceSettings.jsonData.host;
            } else {
                this.wsUrl = 'ws://' + instanceSettings.jsonData.user + ':' + instanceSettings.jsonData.password + '@' + instanceSettings.jsonData.host;
            }
        }
        else {
            this.wsUrl = 'ws://' + instanceSettings.jsonData.host;
        };

    }

    interpolateVariable = (value, variable) => {
        if (typeof value === 'string') {
            if (variable.multi || variable.includeAll) {
                return this.queryModel.quoteLiteral(value);
            } else {
                return value;
            }
        }

        if (typeof value === 'number') {
            return value;
        }

        const quotedValues = _.map(value, v => {
            return this.queryModel.quoteLiteral(v);
        });
        return quotedValues.join(',');
    };
    //Websocket per request?
    private buildKdbRequest(target) {
        let queryParam = new QueryParam();
        let kdbRequest = new KdbRequest();
        let queryDictionary = new QueryDictionary();
        let conflationParams = new ConflationParams();

        //Need to take into account quotes in line, replace " with \"
        queryDictionary.type = (target.queryType == 'selectQuery') ? '`select' : '`function';
        queryDictionary.value = target.kdbFunction;

        queryParam.query = Object.assign({}, queryDictionary);
        queryParam.table = '`' + target.table;
        queryParam.column = this.buildColumnParams(target);
        queryParam.temporal_field = target.useTemporalField ? this.buildTemporalField(target) : [];
        queryParam.temporal_range = this.buildTemporalRange(target.range);
        queryParam.maxRowCount = target.rowCountLimit
        if (target.queryType == 'selectQuery') queryParam.where = this.buildWhereParams(target.where);
        //conflation
        if (target.useConflation) {
            conflationParams.val = target.conflationDurationMS.toString();
            conflationParams.agg = target.conflationDefaultAggType;
            queryParam.conflation = Object.assign({}, conflationParams);
        }
        else {
            queryParam.conflation = [];
        }

        //add condition, has grouping been selected?
        if (target.useGrouping && target.queryType == 'selectQuery' && target.groupingField) {
            queryParam.grouping = [('`' + target.groupingField)];
        }
        else  if (target.useGrouping && target.queryType == 'functionQuery' && target.funcGroupCol) {
            queryParam.grouping = [('`' + target.funcGroupCol)];
            
        }
        else {
            queryParam.grouping = [];
        }

        kdbRequest.time = this.getTimeStamp(new Date());
        kdbRequest.refId = target.refId;
        kdbRequest.query = ''//query;
        kdbRequest.queryParam = Object.assign({}, queryParam);
        kdbRequest.format = target.format;
        kdbRequest.queryId = target.queryId;
        kdbRequest.version = target.version;

        return [
            ((target.format == 'time series') ? graphFunction : tabFunction),
            Object.assign({}, kdbRequest)];
    }

    //This function 
    private buildTemporalField(queryDetails) {
        if(queryDetails.queryType == 'selectQuery' && queryDetails.timeColumn) {
            return ('`' + queryDetails.timeColumn)
        }
        else if (queryDetails.queryType == 'functionQuery' && queryDetails.funcTimeCol) {
            return ('`' + queryDetails.funcTimeCol);
        }
        else {
            return '';
        };
    };

    private buildTemporalRange(range) {
        let temporalRange: Date[] = [];
        if (range) {
            temporalRange.push(new Date(range.from._d));
            temporalRange.push(new Date(range.to._d));
        }
        return temporalRange;
    };

    private buildWhereParams(queryWhereList): Array<string> {
        let whereArray = [];
        let whereClause = [];

        if (queryWhereList.length > 0) {
            queryWhereList.forEach(clause => {
                let notStatement = false
                if(clause.params[0] !== 'select field' && clause.params[2] !== 'enter value') {
                    whereClause = [];
                    if(clause.params[1].substr(0,3) == "not") {
                        clause.params[1] = clause.params[1].substr(4)
                        whereClause.push(clause.params[1]);
                        notStatement = true
                    } else whereClause.push(clause.params[1]);
                    whereClause.push('`' + clause.params[0]);
                    if (clause.datatype == 's') {
                        if (clause.params[1] == "in") {
                            whereClause.push(clause.params[2].split(",").map(str => "`"+str.trim()))
                        } else if (clause.params[1] == "like") {
                            whereClause.push('\"' + clause.params[2] + '\"');
                        } else
                        whereClause.push('`' + clause.params[2]);
                    }
                    else if (clause.datatype == 'c') {
                        whereClause.push('\"' + clause.params[2] + '\"');
                    }
                    else {
                        if (clause.params[1] == "within") {
                            whereClause.push(clause.params[2].split(",").map(str => str.trim()))
                        } else whereClause.push(clause.params[2]);
                    }
                    if (notStatement === true) {
                        whereClause.push("x")
                    } else whereClause.push("o") 
                    whereArray.push(whereClause);
                }
            })
        }

        return whereArray;
    }//end of building of where clause

    //Builds the list of select functions consisting of the column name and an aggregation function where applicable
    private buildColumnParams(target): Array<string> {
        let columnArray: any[] = [];
        target.select.forEach(select => {
            if (select[0].params[0] !== 'select column') {
                let selectElement = [];
                if (target.useConflation) {
                    if (select.length !== 1) {
                        if (select[1].type == 'aggregate') {
                            selectElement.push(select[1].params[0]);
                        }
                        else {
                            selectElement.push(target.conflationDefaultAggType);
                        }
                    }
                    else {
                        selectElement.push(target.conflationDefaultAggType);
                    }
                }
                else {
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
            meta: {refId: Id, errorReceived:false, errorMessage: ""}
        }} else {
            var returnobj = {
                refId: Id,
                columns: [],
                rows: [],
                meta: {refId: Id, errorReceived:true, errorMessage: errormessage}
            }
        }
        return returnobj   
    };

    errorReturn(errorstring: string) {
        return {payload:[],error:errorstring,success:false}
    };

    query(options) {
        var prefilterResultCount = options.targets.length;
        var allRefIDs = [];
        var blankRefIDs = [];
        var validRequestList = [];
        var errorList = [];

        for(var i = 0; i < prefilterResultCount; i++){
            allRefIDs.push(options.targets[i].refId);
            options.targets[i].range = options.range;
            if ((!options.targets[i].table && options.targets[i].queryType === 'selectQuery') || 
                (options.targets[i].queryType === 'functionQuery' && options.targets[i].kdbFunction === "" ) ||
                (options.targets[i].hide === true)) {
                    blankRefIDs.push(options.targets[i].refId);
                } else if (!options.targets[i].queryError) {
                    blankRefIDs.push(options.targets[i].refId)
                } else if(options.targets[i].queryError.error.indexOf(true) !== -1) {
                    errorList.push({
                        refId: options.targets[i].refId,
                        errorMessage: options.targets[i].queryError.message[options.targets[i].queryError.error.indexOf(true)]
                    });
                } else validRequestList.push(options.targets[i])
        };

        var nrBlankRequests = blankRefIDs.length
        var requestList = validRequestList.map(target => {
            return this.buildKdbRequest(target);
            });

        var nrRequests: number = requestList.length;

        if (!this.ws || this.ws.readyState > 1) return this.connectWS().then(connectStatus => {
            if (connectStatus === true && nrRequests > 0) return this.sendQueries(nrRequests, requestList, nrBlankRequests, blankRefIDs,errorList);
            else if (connectStatus === true && nrRequests === 0) return this.emptyQueries(nrBlankRequests, blankRefIDs, errorList);
            else return this.connectFail(prefilterResultCount, allRefIDs); 
        })
        else {return this.webSocketWait().then(() => {
                if (nrRequests > 0) return this.sendQueries(nrRequests, requestList, nrBlankRequests, blankRefIDs,errorList);
                else return this.emptyQueries(nrBlankRequests, blankRefIDs, errorList);
            })
        }
    };

    sendQueries(nrRequests,requestList,nrBlankRequests,blankRefIDs,errorList) {
        var curRequest: number = 0;
        var resultList = [];

            return new Promise(resolve => {
                
                this.ProcessData(curRequest,nrRequests,resultList,requestList).then(() => {
                    
                    for(var i = 0; i < nrBlankRequests; i++){
                        resultList.push(this.showEmpty(blankRefIDs[i]))
                    };
                    for(var i = 0; i < errorList.length; i++){
                        resultList.push(this.showEmpty(errorList[i].refId, errorList[i].errorMessage))
                    };
                    resolve({data: resultList});

                }).catch(e => {
                });
            })
    };
    connectFail(prefilterResultCount, allRefIDs) {
            return new Promise(resolve => {
                let serverUnavailableResponse = [];
                for(var i = 0; i < prefilterResultCount; i++) {
                    serverUnavailableResponse.push(this.showEmpty(allRefIDs[i],"KDB+ server unavailable."))
                };
                resolve({data: serverUnavailableResponse});
            });
    };

    emptyQueries(nrBlankRequests,blankRefIDs,errorList) {
        return new Promise(resolve => {
            let resultList = [];
            for(var i = 0; i < nrBlankRequests; i++){
                resultList.push(this.showEmpty(blankRefIDs[i]))
            };
            for(var i = 0; i < errorList.length; i++){
                resultList.push(this.showEmpty(errorList[i].refId, errorList[i].errorMessage))
            };
            resolve({data: resultList})
        });
    };

    private ProcessData(curRequest, nrRequests, resultList, requestList) {
        return new Promise(resolve => {
                this.getQueryResult(requestList[curRequest]).then((result) => {
                    var indicies = Object.keys(result);
                    if (result.hasOwnProperty('meta.errorReceived')) {
                        resultList.push(result);
                    }
                    else {
                        for (let i = 0; i < indicies.length; i++) {
                            resultList.push(result[i]);
                        }
                    }

                    if (curRequest == (nrRequests - 1)) {
                        let returnVal = resultList;
                        resolve(returnVal);
                    }
                    else {
                        curRequest++;
                        resolve(this.ProcessData(curRequest, nrRequests, resultList, requestList));
                    }
                })
        })
    }

    //Response parser called here**********************
    private getQueryResult = (request: any): Promise<Object> => {
        let curRequest = request;
        let timeoutError = "Query sent at " + new Date() + " timed out.";
        let malformedResError = "Malformed response. Check KDB+ WebSocket handler is correctly configured."
        let response = new Promise(resolve => {
            this.executeAsyncQuery(curRequest).then((result) => {
                if (Object.keys(result).indexOf("payload") === -1) {return resolve([this.showEmpty(curRequest[1].refId, malformedResError)])} else
                {const processedResult = this.responseParser.processQueryResult(result, curRequest);
                return resolve(processedResult);}
            });
        });
        let timeout = new Promise(resolve => {
            let wait =  setTimeout(() => {
                clearTimeout(wait);
                resolve([this.showEmpty(curRequest[1].refId, timeoutError)]);
            }, this.timeoutLength)
        });
        return Promise.race([timeout, response])
    }

    connectWS() {
        return new Promise (connected => {
        this.ws = new WebSocket(this.wsUrl);
        this.ws.binaryType = 'arraybuffer';
        this.ws.onmessage = (response) => {
            this.executeAsyncReceive(response);
        };

        this.ws.onopen = () => {
            connected(true);
        }
        
        this.ws.onclose = () => {
            connected(false)
        };
        
        this.ws.onerror = () => {
        };
    })
    }

    webSocketWait() {
        return new Promise (ready => {
            if (this.ws.readyState === 0) {
                setTimeout(() => ready(this.webSocketWait()), 20)
            } else ready()
        })
    }

    executeAsyncQuery(request: any) {
        var requestResolve;
        let _c = this.c;
        var requestPromise = new Promise(resolve => {
            let refIDn = Math.round(10000000 * Math.random());
            var wrappedRequest = {i:request, ID:refIDn};
            this.ws.send(_c.serialize(wrappedRequest));
            this.requestSentIDList.push(refIDn);
            requestResolve = resolve;
        });

        Object.assign(requestPromise, {resolve: requestResolve})
        let countSentList = this.requestSentList.length
        this.requestSentList.push(requestPromise);
        return this.requestSentList[countSentList]
        }

    executeAsyncReceive(responseObj) {
        let _c = this.c;
        let deserializedResult = _c.deserialize(responseObj.data);
        if (!deserializedResult.ID) {
            return console.log('received malformed data')
        } else if (this.requestSentIDList.indexOf(deserializedResult.ID) === -1) {
            return console.log('received unrequested data');
        } else {
            var requestNum = this.requestSentIDList.indexOf(deserializedResult.ID);
            this.requestSentList[requestNum].resolve(deserializedResult.o);
        }
    }

    metricFindQuery(kdbRequest: KdbRequest) {
        return new Promise((resolve, reject) => {
            resolve(this.executeAsyncQuery(kdbRequest).then((result) => {
                return result;
            }));
        });

    }

    //This is the function called by Grafana when it is testing a connection on the configuration page
    testDatasource() {
        return this.connect()
            .then((result) => {
                return result;
            });
    };

    connect(): Promise<Object> {
        return new Promise<Object>((resolve, reject) => {
            if ("WebSocket" in window) {
                this.$q.when(this.setupWebSocket()).then(setTimeout(() => {
                    resolve(this.checkConnectionState().then(result => {
                        //clearTimeout;
                        return result;
                    }));
                }, 2000));
            } else {
                resolve(this.buildResponse('Error', 'WebSocket not supported!', 'Error'));
            }
        })
    }

    //This checks the kdb+ connection state for the 'test connection' funciton
    checkConnectionState(): Promise<Object> {
        return new Promise(resolve => {
            return this.connectWS().then(connectStatus => {
                if (connectStatus === false) {
                    resolve(this.buildResponse('fail', 'Data source cannot be connected, if using authentication/TLS check settings as above.', 'Fail'))
                } else {
                    let timeout = new Promise(resolve => {
                        let wait = setTimeout(() => {
                            clearTimeout(wait);
                            resolve(this.buildResponse('fail', 'Web socket connections aren\'t configured correctly for Grafana on your kdb+ instance.  Please speak to your system administrator.', 'Fail'));
                        }, this.timeoutLength)
                    });
                    let response = new Promise(resolve => {
                        this.executeAsyncQuery('.z.ws').then(res => {
                            if (typeof res !== 'string') {
                                resolve(this.buildResponse('fail', 'Malformed response. Check KDB+ WebSocket handler is correctly configured.', 'Fail'));
                            } else if (res.replace(' ', '').includes('ds:-9!x;')) {
                                //if it looks like .z.ws is correctly configured then return success
                                resolve(this.buildResponse('success', 'Data source successfully connected!', 'Success'));
                            } else {
                                //If .z.ws hasn't been configured correctly on the database then return an error message
                                resolve(this.buildResponse('fail', 'Web socket connections aren\'t configured correctly for Grafana on your kdb+ instance.  Please speak to your system administrator.', 'Fail'));
                            }
                        });
                    });
                    return resolve(Promise.race([timeout, response]))
                }
            })
        })}

    setupWebSocket() {
        this.ws = new WebSocket(this.wsUrl);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
        };

        this.ws.onmessage = (messageEvent: MessageEvent) => {
        };

        this.ws.onclose = () => {
        };

        this.ws.onerror = () => {
        }
    }

    buildResponse(status: string, message: string, title: string) {
        return Promise.resolve({
            status,
            message,
            title
        });
    }

}
