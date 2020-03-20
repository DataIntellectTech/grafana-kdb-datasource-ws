System.register(['lodash', './response_parser', './kdb_query', './c', "./model/kdb-request", "./model/query-param", "./model/queryDictionary", "./model/conflationParams", './model/kdb-request-config'], function(exports_1) {
    var lodash_1, response_parser_1, kdb_query_1, c_1, kdb_request_1, query_param_1, queryDictionary_1, conflationParams_1, kdb_request_config_1, kdb_request_config_2;
    var KDBDatasource;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (response_parser_1_1) {
                response_parser_1 = response_parser_1_1;
            },
            function (kdb_query_1_1) {
                kdb_query_1 = kdb_query_1_1;
            },
            function (c_1_1) {
                c_1 = c_1_1;
            },
            function (kdb_request_1_1) {
                kdb_request_1 = kdb_request_1_1;
            },
            function (query_param_1_1) {
                query_param_1 = query_param_1_1;
            },
            function (queryDictionary_1_1) {
                queryDictionary_1 = queryDictionary_1_1;
            },
            function (conflationParams_1_1) {
                conflationParams_1 = conflationParams_1_1;
            },
            function (kdb_request_config_1_1) {
                kdb_request_config_1 = kdb_request_config_1_1;
                kdb_request_config_2 = kdb_request_config_1_1;
            }],
        execute: function() {
            KDBDatasource = (function () {
                /** @ngInject */
                function KDBDatasource(instanceSettings, backendSrv, $q, templateSrv) {
                    var _this = this;
                    this.backendSrv = backendSrv;
                    this.$q = $q;
                    this.templateSrv = templateSrv;
                    this.message = {};
                    this.c = new c_1.C();
                    this.interpolateVariable = function (value, variable) {
                        if (typeof value === 'string') {
                            if (variable.multi || variable.includeAll) {
                                return _this.queryModel.quoteLiteral(value);
                            }
                            else {
                                return value;
                            }
                        }
                        if (typeof value === 'number') {
                            return value;
                        }
                        var quotedValues = lodash_1.default.map(value, function (v) {
                            return _this.queryModel.quoteLiteral(v);
                        });
                        return quotedValues.join(',');
                    };
                    //Response parser called here**********************
                    this.getQueryResult = function (request) {
                        var curRequest = request;
                        var timeoutError = "Query sent at " + new Date() + " timed out.";
                        var malformedResError = "Malformed response. Check KDB+ WebSocket handler is correctly configured.";
                        var response = new Promise(function (resolve) {
                            _this.executeAsyncQuery(curRequest).then(function (result) {
                                if (Object.keys(result).indexOf("payload") === -1) {
                                    return resolve([_this.showEmpty(curRequest[1].refId, malformedResError)]);
                                }
                                else {
                                    var processedResult = _this.responseParser.processQueryResult(result, curRequest);
                                    return resolve(processedResult);
                                }
                            });
                        });
                        var timeout = new Promise(function (resolve) {
                            var wait = setTimeout(function () {
                                clearTimeout(wait);
                                resolve([_this.showEmpty(curRequest[1].refId, timeoutError)]);
                            }, _this.timeoutLength);
                        });
                        return Promise.race([timeout, response]);
                    };
                    this.name = instanceSettings.name;
                    this.id = instanceSettings.id;
                    this.responseParser = new response_parser_1.default(this.$q);
                    this.queryModel = new kdb_query_1.default({});
                    this.interval = (instanceSettings.jsonData || {}).timeInterval;
                    if (!instanceSettings.jsonData.timeoutLength) {
                        this.timeoutLength = kdb_request_config_2.defaultTimeout;
                    }
                    else {
                        this.timeoutLength = Number(instanceSettings.jsonData.timeoutLength);
                    }
                    ;
                    this.requestSentList = [];
                    this.requestSentIDList = [];
                    this.responseReceivedList = [];
                    this.url = 'http://' + instanceSettings.jsonData.host;
                    if (instanceSettings.jsonData.useAuthentication) {
                        if (instanceSettings.jsonData.useTLS === true) {
                            this.wsUrl = 'wss://' + instanceSettings.jsonData.user + ':' + instanceSettings.jsonData.password + '@' + instanceSettings.jsonData.host;
                        }
                        else {
                            this.wsUrl = 'ws://' + instanceSettings.jsonData.user + ':' + instanceSettings.jsonData.password + '@' + instanceSettings.jsonData.host;
                        }
                    }
                    else {
                        this.wsUrl = 'ws://' + instanceSettings.jsonData.host;
                    }
                    ;
                }
                //Websocket per request?
                KDBDatasource.prototype.buildKdbRequest = function (target) {
                    var queryParam = new query_param_1.QueryParam();
                    var kdbRequest = new kdb_request_1.KdbRequest();
                    var queryDictionary = new queryDictionary_1.QueryDictionary();
                    var conflationParams = new conflationParams_1.ConflationParams();
                    //Need to take into account quotes in line, replace " with \"
                    queryDictionary.type = (target.queryType == 'selectQuery') ? '`select' : '`function';
                    queryDictionary.value = target.kdbFunction;
                    queryParam.query = Object.assign({}, queryDictionary);
                    queryParam.table = '`' + target.table;
                    queryParam.column = this.buildColumnParams(target);
                    queryParam.temporal_field = target.useTemporalField ? this.buildTemporalField(target) : [];
                    queryParam.temporal_range = this.buildTemporalRange(target.range);
                    queryParam.maxRowCount = target.rowCountLimit;
                    if (target.queryType == 'selectQuery')
                        queryParam.where = this.buildWhereParams(target.where);
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
                    else if (target.useGrouping && target.queryType == 'functionQuery' && target.funcGroupCol) {
                        queryParam.grouping = [('`' + target.funcGroupCol)];
                    }
                    else {
                        queryParam.grouping = [];
                    }
                    kdbRequest.time = this.getTimeStamp(new Date());
                    kdbRequest.refId = target.refId;
                    kdbRequest.query = ''; //query;
                    kdbRequest.queryParam = Object.assign({}, queryParam);
                    kdbRequest.format = target.format;
                    kdbRequest.queryId = target.queryId;
                    kdbRequest.version = target.version;
                    return [
                        ((target.format == 'time series') ? kdb_request_config_1.graphFunction : kdb_request_config_2.tabFunction),
                        Object.assign({}, kdbRequest)];
                };
                //This function 
                KDBDatasource.prototype.buildTemporalField = function (queryDetails) {
                    if (queryDetails.queryType == 'selectQuery' && queryDetails.timeColumn) {
                        return ('`' + queryDetails.timeColumn);
                    }
                    else if (queryDetails.queryType == 'functionQuery' && queryDetails.funcTimeCol) {
                        return ('`' + queryDetails.funcTimeCol);
                    }
                    else {
                        return '';
                    }
                    ;
                };
                ;
                KDBDatasource.prototype.buildTemporalRange = function (range) {
                    var temporalRange = [];
                    if (range) {
                        temporalRange.push(new Date(range.from._d));
                        temporalRange.push(new Date(range.to._d));
                    }
                    return temporalRange;
                };
                ;
                KDBDatasource.prototype.buildWhereParams = function (queryWhereList) {
                    var whereArray = [];
                    var whereClause = [];
                    if (queryWhereList.length > 0) {
                        queryWhereList.forEach(function (clause) {
                            var notStatement = false;
                            if (clause.params[0] !== 'select field' && clause.params[2] !== 'enter value') {
                                whereClause = [];
                                if (clause.params[1].substr(0, 3) == "not") {
                                    clause.params[1] = clause.params[1].substr(4);
                                    whereClause.push(clause.params[1]);
                                    notStatement = true;
                                }
                                else
                                    whereClause.push(clause.params[1]);
                                whereClause.push('`' + clause.params[0]);
                                if (clause.datatype == 's') {
                                    if (clause.params[1] == "in") {
                                        whereClause.push(clause.params[2].split(",").map(function (str) { return "`" + str.trim(); }));
                                    }
                                    else if (clause.params[1] == "like") {
                                        whereClause.push('\"' + clause.params[2] + '\"');
                                    }
                                    else
                                        whereClause.push('`' + clause.params[2]);
                                }
                                else if (clause.datatype == 'c') {
                                    whereClause.push('\"' + clause.params[2] + '\"');
                                }
                                else {
                                    if (clause.params[1] == "within") {
                                        whereClause.push(clause.params[2].split(",").map(function (str) { return str.trim(); }));
                                    }
                                    else
                                        whereClause.push(clause.params[2]);
                                }
                                if (notStatement === true) {
                                    whereClause.push("x");
                                }
                                else
                                    whereClause.push("o");
                                whereArray.push(whereClause);
                            }
                        });
                    }
                    return whereArray;
                }; //end of building of where clause
                //Builds the list of select functions consisting of the column name and an aggregation function where applicable
                KDBDatasource.prototype.buildColumnParams = function (target) {
                    var columnArray = [];
                    target.select.forEach(function (select) {
                        if (select[0].params[0] !== 'select column') {
                            var selectElement = [];
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
                            var alias = '::';
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
                };
                KDBDatasource.prototype.getTimeStamp = function (date) {
                    var dateString = date.valueOf().toString();
                    return dateString.substring(0, dateString.length - 3);
                };
                KDBDatasource.prototype.showEmpty = function (Id, errormessage) {
                    if (typeof errormessage === 'undefined') {
                        var returnobj = {
                            refId: Id,
                            columns: [],
                            rows: [],
                            meta: { refId: Id, errorReceived: false, errorMessage: "" }
                        };
                    }
                    else {
                        var returnobj = {
                            refId: Id,
                            columns: [],
                            rows: [],
                            meta: { refId: Id, errorReceived: true, errorMessage: errormessage }
                        };
                    }
                    return returnobj;
                };
                ;
                KDBDatasource.prototype.errorReturn = function (errorstring) {
                    return { payload: [], error: errorstring, success: false };
                };
                ;
                KDBDatasource.prototype.query = function (options) {
                    var _this = this;
                    var prefilterResultCount = options.targets.length;
                    var allRefIDs = [];
                    var blankRefIDs = [];
                    var validRequestList = [];
                    var errorList = [];
                    for (var i = 0; i < prefilterResultCount; i++) {
                        allRefIDs.push(options.targets[i].refId);
                        options.targets[i].range = options.range;
                        if ((!options.targets[i].table && options.targets[i].queryType === 'selectQuery') ||
                            (options.targets[i].queryType === 'functionQuery' && options.targets[i].kdbFunction === "") ||
                            (options.targets[i].hide === true)) {
                            blankRefIDs.push(options.targets[i].refId);
                        }
                        else if (!options.targets[i].queryError) {
                            blankRefIDs.push(options.targets[i].refId);
                        }
                        else if (options.targets[i].queryError.error.indexOf(true) !== -1) {
                            errorList.push({
                                refId: options.targets[i].refId,
                                errorMessage: options.targets[i].queryError.message[options.targets[i].queryError.error.indexOf(true)]
                            });
                        }
                        else
                            validRequestList.push(options.targets[i]);
                    }
                    ;
                    var nrBlankRequests = blankRefIDs.length;
                    var requestList = validRequestList.map(function (target) {
                        return _this.buildKdbRequest(target);
                    });
                    var nrRequests = requestList.length;
                    if (!this.ws || this.ws.readyState > 1)
                        return this.connectWS().then(function (connectStatus) {
                            if (connectStatus === true && nrRequests > 0)
                                return _this.sendQueries(nrRequests, requestList, nrBlankRequests, blankRefIDs, errorList);
                            else if (connectStatus === true && nrRequests === 0)
                                return _this.emptyQueries(nrBlankRequests, blankRefIDs, errorList);
                            else
                                return _this.connectFail(prefilterResultCount, allRefIDs);
                        });
                    else {
                        return this.webSocketWait().then(function () {
                            if (nrRequests > 0)
                                return _this.sendQueries(nrRequests, requestList, nrBlankRequests, blankRefIDs, errorList);
                            else
                                return _this.emptyQueries(nrBlankRequests, blankRefIDs, errorList);
                        });
                    }
                };
                ;
                KDBDatasource.prototype.sendQueries = function (nrRequests, requestList, nrBlankRequests, blankRefIDs, errorList) {
                    var _this = this;
                    var curRequest = 0;
                    var resultList = [];
                    return new Promise(function (resolve) {
                        _this.ProcessData(curRequest, nrRequests, resultList, requestList).then(function () {
                            for (var i = 0; i < nrBlankRequests; i++) {
                                resultList.push(_this.showEmpty(blankRefIDs[i]));
                            }
                            ;
                            for (var i = 0; i < errorList.length; i++) {
                                resultList.push(_this.showEmpty(errorList[i].refId, errorList[i].errorMessage));
                            }
                            ;
                            resolve({ data: resultList });
                        }).catch(function (e) {
                        });
                    });
                };
                ;
                KDBDatasource.prototype.connectFail = function (prefilterResultCount, allRefIDs) {
                    var _this = this;
                    return new Promise(function (resolve) {
                        var serverUnavailableResponse = [];
                        for (var i = 0; i < prefilterResultCount; i++) {
                            serverUnavailableResponse.push(_this.showEmpty(allRefIDs[i], "KDB+ server unavailable."));
                        }
                        ;
                        resolve({ data: serverUnavailableResponse });
                    });
                };
                ;
                KDBDatasource.prototype.emptyQueries = function (nrBlankRequests, blankRefIDs, errorList) {
                    var _this = this;
                    return new Promise(function (resolve) {
                        var resultList = [];
                        for (var i = 0; i < nrBlankRequests; i++) {
                            resultList.push(_this.showEmpty(blankRefIDs[i]));
                        }
                        ;
                        for (var i = 0; i < errorList.length; i++) {
                            resultList.push(_this.showEmpty(errorList[i].refId, errorList[i].errorMessage));
                        }
                        ;
                        resolve({ data: resultList });
                    });
                };
                ;
                KDBDatasource.prototype.ProcessData = function (curRequest, nrRequests, resultList, requestList) {
                    var _this = this;
                    return new Promise(function (resolve) {
                        _this.getQueryResult(requestList[curRequest]).then(function (result) {
                            var indicies = Object.keys(result);
                            if (result.hasOwnProperty('meta.errorReceived')) {
                                resultList.push(result);
                            }
                            else {
                                for (var i = 0; i < indicies.length; i++) {
                                    resultList.push(result[i]);
                                }
                            }
                            if (curRequest == (nrRequests - 1)) {
                                var returnVal = resultList;
                                resolve(returnVal);
                            }
                            else {
                                curRequest++;
                                resolve(_this.ProcessData(curRequest, nrRequests, resultList, requestList));
                            }
                        });
                    });
                };
                KDBDatasource.prototype.connectWS = function () {
                    var _this = this;
                    return new Promise(function (connected) {
                        _this.ws = new WebSocket(_this.wsUrl);
                        _this.ws.binaryType = 'arraybuffer';
                        _this.ws.onmessage = function (response) {
                            _this.executeAsyncReceive(response);
                        };
                        _this.ws.onopen = function () {
                            connected(true);
                        };
                        _this.ws.onclose = function () {
                            connected(false);
                        };
                        _this.ws.onerror = function () {
                        };
                    });
                };
                KDBDatasource.prototype.webSocketWait = function () {
                    var _this = this;
                    return new Promise(function (ready) {
                        if (_this.ws.readyState === 0) {
                            setTimeout(function () { return ready(_this.webSocketWait()); }, 20);
                        }
                        else
                            ready();
                    });
                };
                KDBDatasource.prototype.executeAsyncQuery = function (request) {
                    var _this = this;
                    var requestResolve;
                    var _c = this.c;
                    var requestPromise = new Promise(function (resolve) {
                        var refIDn = Math.round(10000000 * Math.random());
                        var wrappedRequest = { i: request, ID: refIDn };
                        _this.ws.send(_c.serialize(wrappedRequest));
                        _this.requestSentIDList.push(refIDn);
                        requestResolve = resolve;
                    });
                    Object.assign(requestPromise, { resolve: requestResolve });
                    var countSentList = this.requestSentList.length;
                    this.requestSentList.push(requestPromise);
                    return this.requestSentList[countSentList];
                };
                KDBDatasource.prototype.executeAsyncReceive = function (responseObj) {
                    var _c = this.c;
                    var deserializedResult = _c.deserialize(responseObj.data);
                    if (!deserializedResult.ID) {
                        return console.log('received malformed data');
                    }
                    else if (this.requestSentIDList.indexOf(deserializedResult.ID) === -1) {
                        return console.log('received unrequested data');
                    }
                    else {
                        var requestNum = this.requestSentIDList.indexOf(deserializedResult.ID);
                        this.requestSentList[requestNum].resolve(deserializedResult.o);
                    }
                };
                KDBDatasource.prototype.metricFindQuery = function (kdbRequest) {
                    var _this = this;
                    return new Promise(function (resolve, reject) {
                        resolve(_this.executeAsyncQuery(kdbRequest).then(function (result) {
                            return result;
                        }));
                    });
                };
                //This is the function called by Grafana when it is testing a connection on the configuration page
                KDBDatasource.prototype.testDatasource = function () {
                    return this.connect()
                        .then(function (result) {
                        return result;
                    });
                };
                ;
                KDBDatasource.prototype.connect = function () {
                    var _this = this;
                    return new Promise(function (resolve, reject) {
                        if ("WebSocket" in window) {
                            _this.$q.when(_this.setupWebSocket()).then(setTimeout(function () {
                                resolve(_this.checkConnectionState().then(function (result) {
                                    //clearTimeout;
                                    return result;
                                }));
                            }, 2000));
                        }
                        else {
                            resolve(_this.buildResponse('Error', 'WebSocket not supported!', 'Error'));
                        }
                    });
                };
                //This checks the kdb+ connection state for the 'test connection' funciton
                KDBDatasource.prototype.checkConnectionState = function () {
                    var _this = this;
                    return new Promise(function (resolve) {
                        return _this.connectWS().then(function (connectStatus) {
                            if (connectStatus === false) {
                                resolve(_this.buildResponse('fail', 'Data source cannot be connected, if using authentication/TLS check settings as above.', 'Fail'));
                            }
                            else {
                                var timeout = new Promise(function (resolve) {
                                    var wait = setTimeout(function () {
                                        clearTimeout(wait);
                                        resolve(_this.buildResponse('fail', 'Web socket connections aren\'t configured correctly for Grafana on your kdb+ instance.  Please speak to your system administrator.', 'Fail'));
                                    }, _this.timeoutLength);
                                });
                                var response = new Promise(function (resolve) {
                                    _this.executeAsyncQuery('.z.ws').then(function (res) {
                                        if (typeof res !== 'string') {
                                            resolve(_this.buildResponse('fail', 'Malformed response. Check KDB+ WebSocket handler is correctly configured.', 'Fail'));
                                        }
                                        else if (res.replace(' ', '').includes('ds:-9!x;')) {
                                            //if it looks like .z.ws is correctly configured then return success
                                            resolve(_this.buildResponse('success', 'Data source successfully connected!', 'Success'));
                                        }
                                        else {
                                            //If .z.ws hasn't been configured correctly on the database then return an error message
                                            resolve(_this.buildResponse('fail', 'Web socket connections aren\'t configured correctly for Grafana on your kdb+ instance.  Please speak to your system administrator.', 'Fail'));
                                        }
                                    });
                                });
                                return resolve(Promise.race([timeout, response]));
                            }
                        });
                    });
                };
                KDBDatasource.prototype.setupWebSocket = function () {
                    this.ws = new WebSocket(this.wsUrl);
                    this.ws.binaryType = 'arraybuffer';
                    this.ws.onopen = function () {
                    };
                    this.ws.onmessage = function (messageEvent) {
                    };
                    this.ws.onclose = function () {
                    };
                    this.ws.onerror = function () {
                    };
                };
                KDBDatasource.prototype.buildResponse = function (status, message, title) {
                    return Promise.resolve({
                        status: status,
                        message: message,
                        title: title
                    });
                };
                return KDBDatasource;
            })();
            exports_1("KDBDatasource", KDBDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map