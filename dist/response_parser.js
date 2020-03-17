System.register([], function(exports_1) {
    var ResponseParser;
    return {
        setters:[],
        execute: function() {
            ResponseParser = (function () {
                function ResponseParser($q) {
                    this.$q = $q;
                }
                ResponseParser.prototype.processQueryResult = function (res, req) {
                    var data = {};
                    if (!res)
                        return data;
                    //KDB+ Error Handling
                    if (res.success === false) {
                        var errorMessage = res.error;
                        var meta = {
                            errorReceived: true,
                            errorMessage: errorMessage
                        };
                        var errorReturn = {
                            refId: req[1].refId,
                            columns: [],
                            rows: [],
                            meta: meta
                        };
                        return [errorReturn];
                    }
                    ;
                    if (req[1].format == 'time series') {
                        data = this.mapGraphData(res, req);
                    }
                    else {
                        data = this.mapTableData(res, req);
                    }
                    return data;
                };
                ResponseParser.prototype.mapTableData = function (res, req) {
                    var dataObjectList = [];
                    var table = {
                        columns: [],
                        rows: [],
                        type: 'table',
                        refId: req[1].refId,
                        meta: req[1]
                    };
                    var temporalFieldInc = (typeof req[1].queryParam.temporal_field == 'string') ? true : false;
                    //looping through to add the results to the returned value and update the names
                    if (req[1].queryParam.query.type == '`function') {
                        for (var col = 0; col < res.payload.columns[0].length; col++) {
                            table.columns.push(res.payload.columns[0][col]);
                            if ('`' + res.payload.columns[0][col].text == req[1].queryParam.temporal_field) {
                                table.columns[col].text = 'Time';
                                table.columns[col].alias = req[1].queryParam.temporal_field.replace('`', '');
                            }
                        }
                    }
                    else {
                        for (var col = 0; col < res.payload.columns[0].length; col++) {
                            table.columns.push(res.payload.columns[0][col]);
                            if (temporalFieldInc) {
                                if (col === 0) {
                                    table.columns[col].text = 'Time';
                                    table.columns[col].alias = req[1].queryParam.temporal_field.replace('`', '');
                                }
                                else {
                                    table.columns[col].text = req[1].queryParam.column[col - 1][2] == '::' ? req[1].queryParam.column[col - 1][1] : req[1].queryParam.column[col - 1][2];
                                }
                            }
                            else {
                                table.columns[col].text = req[1].queryParam.column[col][2] == '::' ? req[1].queryParam.column[col][1] : req[1].queryParam.column[col][2];
                            }
                        }
                    }
                    res.payload.rows[0].forEach(function (rowLoop) {
                        var curRow = [];
                        for (var col = 0; col < res.payload.columns[0].length; col++) {
                            if (temporalFieldInc || col == 0) {
                                curRow.push(rowLoop[col].valueOf());
                            }
                            else {
                                curRow.push(rowLoop[col]);
                            }
                        }
                        //dataObj.rows.push(curRow);
                        table.rows.push(curRow);
                    });
                    dataObjectList.push(table);
                    return dataObjectList;
                };
                ResponseParser.prototype.mapGraphData = function (res, req) {
                    var response = res;
                    var dataObjList = [];
                    var targetName = 'x';
                    var colKeys = Object.keys(response.payload[1][0].data[0]);
                    var grpKeys = Object.keys(response.payload[0][0]);
                    //looop for each grouping(sym)*************
                    for (var g = 0; g < response.payload[0].length; g++) {
                        var curCol = 2;
                        //looping through columns if multiple have been selected
                        for (curCol = 2; curCol <= colKeys.length; curCol++) {
                            var fieldName = (req[1].queryParam.query.type == "`select") ? req[1].queryParam.column[curCol - 2][1] : colKeys[curCol - 1];
                            if (req[1].queryParam.query.type == "`select" && req[1].queryParam.column[curCol - 2][2] !== '::') {
                                fieldName = req[1].queryParam.column[curCol - 2][2];
                            }
                            if (response.payload[0][g][grpKeys[0]].toString() == 'x') {
                                targetName = fieldName;
                            }
                            else {
                                targetName = response.payload[0][g][grpKeys[0]].toString() + ' - ' + fieldName;
                            }
                            var dataObj = {
                                target: targetName,
                                datapoints: [],
                                refId: req[1].refId,
                                meta: req[1]
                            };
                            //response.payload.....poll object for names, then this
                            var dataList = [];
                            var timeList = [];
                            response.payload[1][g].data.forEach(function (value) {
                                timeList.push(value[colKeys[0]]);
                                dataList.push(value[colKeys[curCol - 1]]);
                            });
                            //conform object to datapoint
                            for (var i = 0; i < dataList.length; i++) {
                                var dataPoint = [dataList[i], timeList[i].valueOf()];
                                dataObj.datapoints.push(dataPoint);
                            }
                            dataObjList.push(dataObj);
                        }
                    }
                    return dataObjList;
                };
                return ResponseParser;
            })();
            exports_1("default", ResponseParser);
        }
    }
});
//# sourceMappingURL=response_parser.js.map