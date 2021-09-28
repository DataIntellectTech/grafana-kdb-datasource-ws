import _ from 'lodash';

export default class ResponseParser {
    constructor(private $q) {
    }

    processQueryResult(res, req) {
        let data = {};
        if (!res) return data;
        //KDB+ Error Handling
        if (res.success === false) {
            let errorMessage : string = res.error;

            let meta = {
                errorReceived:true,
                errorMessage: errorMessage
            }
            let errorReturn = {
                refId: req[1].refId,
                columns: [],
                rows: [],
                meta
            }
            return [errorReturn];
        };

        if (req[1].format=='time series') {
            data = this.mapGraphData(res, req);
        } else {
            data = this.mapTableData(res, req);
        }
        return data;
    }

    mapTableData(res,req){

        let dataObjectList = [];

        let table = {
            columns: [],
            rows : [],
            type: 'table',
            refId: req[1].refId,
            meta: req[1]
        }

        let temporalFieldInc = (typeof req[1].queryParam.temporal_field == 'string') ? true : false;
        //looping through to add the results to the returned value and update the names
        if (req[1].queryParam.query.type == '`function') {
            for (let col = 0; col < res.payload.columns[0].length; col++) {
                table.columns.push(res.payload.columns[0][col])
                if ('`' + res.payload.columns[0][col].text == req[1].queryParam.temporal_field) {
                    table.columns[col].text = 'Time'
                    table.columns[col].alias = req[1].queryParam.temporal_field.replace( '`', '');
                }

            }
        }
        else 
        {
            for (let col = 0; col < res.payload.columns[0].length; col++) {
                table.columns.push(res.payload.columns[0][col])
                if (temporalFieldInc) {
                    if (req[1].queryParam.temporal_field === req[1].queryParam.column[col][1]) {
                        table.columns[col].text = 'Time'
                        table.columns[col].alias = req[1].queryParam.temporal_field.replace( '`', '');
                    } else {
                        table.columns[col].text = req[1].queryParam.column[col][2] == '::' ? req[1].queryParam.column[col][1].replace('`','') :req[1].queryParam.column[col][2];
                    }

                } else {
                    table.columns[col].text = req[1].queryParam.column[col][2] == '::' ? req[1].queryParam.column[col][1].replace('`','') :req[1].queryParam.column[col][2];  
                }
            }
        }

        res.payload.rows[0].forEach(function (rowLoop) {
            let curRow = [];
            for (let col = 0; col < res.payload.columns[0].length; col ++) {
                if (req[1].queryParam.temporal_field === req[1].queryParam.column[col][1]){
                    curRow.push(rowLoop[col].valueOf());
                }
                else {
                    curRow.push(rowLoop[col]);
                }
            }         
            //dataObj.rows.push(curRow);
            table.rows.push(curRow);
        })

        dataObjectList.push(table);
        return dataObjectList;
    }

    mapGraphData(res, req) {
        let response = res;
        var dataObjList = [];
        let targetName: string = 'x'
        var colKeys = Object.keys(response.payload[1][0].data[0]);
        var grpKeys = Object.keys(response.payload[0][0]);

        let timeCol = colKeys[colKeys.indexOf(req[1].queryParam.temporal_field.slice(1))];
        colKeys[colKeys.indexOf(req[1].queryParam.temporal_field.slice(1))] = colKeys[0];
        colKeys[0] = timeCol;
        
        //looop for each grouping(sym)*************
        for (let g = 0; g < response.payload[0].length; g++) {
            var curCol = 2;
            //looping through columns if multiple have been selected
            for (curCol = 2; curCol <= colKeys.length; curCol++) {
                var fieldName = (req[1].queryParam.query.type == "`select") ? req[1].queryParam.column[curCol - 2][1].replace('`','') : colKeys[curCol - 1];
              
                if(req[1].queryParam.query.type == "`select" && req[1].queryParam.column[curCol - 2][2] !== '::') {
                   fieldName = req[1].queryParam.column[curCol - 2][2]
                }

                if (response.payload[0][g][grpKeys[0]].toString() == 'x') {
                    targetName = fieldName;
                }
                else {
                    if ( req[1].queryParam.column.length > 1) {
                        targetName = response.payload[0][g][grpKeys[0]].toString() + ' - ' + fieldName;
                    } else {
                        targetName = response.payload[0][g][grpKeys[0]].toString();
                    }
                }

                let dataObj = {
                    target: targetName,
                    datapoints: [],
                    refId: req[1].refId,
                    meta: req[1]
                };

            //response.payload.....poll object for names, then this
            var dataList = [];
            var timeList = [];

            response.payload[1][g].data.forEach(function (value) {
                timeList.push(value[colKeys[0]])
                dataList.push(value[colKeys[curCol - 1]])
            });
            //conform object to datapoint
            for (let i = 0; i < dataList.length; i++) {
                let dataPoint = [dataList[i], timeList[i].valueOf()];
                dataObj.datapoints.push(dataPoint);
            }
            dataObjList.push(dataObj);

            }
        }
        return dataObjList;
    }


}
