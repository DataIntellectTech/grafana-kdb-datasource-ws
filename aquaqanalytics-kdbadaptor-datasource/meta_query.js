System.register([], function(exports_1) {
    var KDBMetaQuery;
    return {
        setters:[],
        execute: function() {
            ///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
            KDBMetaQuery = (function () {
                function KDBMetaQuery(target, queryModel) {
                    this.target = target;
                    this.queryModel = queryModel;
                    this.subgroupDatatypeLookup = {
                        year: "i",
                        month: "m",
                        mm: "i",
                        week: "d",
                        dd: "i",
                        hh: "i",
                        uu: "i",
                        minute: "u",
                        ss: "i",
                        second: "v",
                        date: "d",
                        time: "t",
                        timestamp: "p",
                        timespan: "u",
                        datetime: "z"
                    };
                }
                KDBMetaQuery.prototype.getOperators = function (datatype) {
                    switch (datatype) {
                        //Handling for numeral datatypes
                        case 'h':
                        case 'i':
                        case 'j':
                        case 'e':
                        case 'f': {
                            return ['=', '<>', '<', '<=', '>', '>=', 'within', 'not within'];
                        }
                        //Handling for temporal datatypes
                        case 'p': {
                            return ['=', '<>', '<', '<=', '>', '>=', 'within', 'not within'];
                        }
                        case 'm':
                        case 'd':
                        case 'u':
                        case 'v':
                        case 'z': {
                            return ['=', '<>', '<', '<=', '>', '>=', 'within', 'not within'];
                        }
                        case 't': {
                            return ['=', '<>', '<', '<=', '>', '>=', 'within', 'not within'];
                        }
                        //Handling for string datatypes
                        case 's':
                        case 'c': {
                            return ['=', '<>', 'like', 'in', 'not in'];
                        }
                        default: {
                            return ['=', '<>']; // removing set operators  , 'in', 'not in'];
                        }
                    }
                };
                // quote identifier as literal to use in metadata queries
                KDBMetaQuery.prototype.quoteIdentAsLiteral = function (value) {
                    return this.queryModel.quoteLiteral(this.queryModel.unquoteIdentifier(value));
                };
                KDBMetaQuery.prototype.findMetricTable = function () {
                    // query that returns first table found that has a timestamp(tz) column and a float column
                    var query = 'select[1] table from ([]table:tables[];types:{(0!meta x)`t}each tables[]) where {all "pf" in x}each types';
                    return query;
                };
                KDBMetaQuery.prototype.buildTableConstraint = function (table) {
                    var query = '';
                    // check for schema qualified table
                    if (table.includes('.')) {
                        var parts = table.split('.');
                        query = 'table_schema = ' + this.quoteIdentAsLiteral(parts[0]);
                        query += ' AND table_name = ' + this.quoteIdentAsLiteral(parts[1]);
                        return query;
                    }
                    else {
                        query = 'table_schema = database() AND table_name = ' + this.quoteIdentAsLiteral(table);
                        return query;
                    }
                };
                KDBMetaQuery.prototype.buildServerFunctionsQuery = function () {
                    //return all functions in the KDB server root namespace
                    return 'select table from ([] table:system"f")';
                };
                KDBMetaQuery.prototype.buildTableQuery = function () {
                    // return table containing tablenames
                    return 'flip enlist[`table]!enlist (asc tables[`.]),asc .Q.dd[`;]each raze {.Q.dd[x;] each tables .Q.dd[`;x]}each key `';
                };
                KDBMetaQuery.prototype.buildColumnQuery = function (type) {
                    // return table of columns names in table that fit the schema appropriate to type
                    var query = 'select[> c] c from meta ' + this.target.table + ' where ';
                    switch (type) {
                        case 'time': {
                            // timestamp, time, timespan, datetime
                            query += 't in "pz"'; //nt"';  Restricted fields for datetime
                            break;
                        }
                        case 'group':
                        case 'metric': {
                            // char, symbol
                            query += 't in "cs"';
                            break;
                        }
                        case 'value': {
                            // boolean, byte, short, int, long, real, float
                            query += 't in "bxhijef"';
                            // query += ' and C <> ' + this.quoteIdentAsLiteral(this.target.timeColumn);
                            break;
                        }
                        case 'tableValue': {
                            query += 't in "bxhijefcspmdznuvt"';
                            break;
                        }
                        case 'by': {
                            query += 't in "bxhijefs", not c in ';
                            this.target.select.forEach(function (select) {
                                query += "`" + select[0].params[0];
                            });
                        }
                        case 'where': {
                            query += 't in "bgxhijefcspmdzuvt"'; //have included everything except for timespan
                            break;
                        }
                        case 'grouping': {
                            query += 't in "s"'; //need to flesh this out a bit more (CHO)
                            break;
                        }
                    }
                    return query;
                };
                KDBMetaQuery.prototype.buildConflationUnitsQuery = function () {
                    //return the possible units for Conflation of query results
                    return ['seconds', 'minutes', 'hours'];
                };
                // Think this is obsolete
                KDBMetaQuery.prototype.getColumnDataType = function (column) {
                    return "meta select " + column + " from " + this.target.table;
                };
                KDBMetaQuery.prototype.buildValueQuery = function (column, DateRange, temporalField, temporalDataType) {
                    var kdbStartDate = new Date(2000, 0, 1, 0, 0).valueOf();
                    var fromDate = new Date(DateRange.from._d).valueOf() - (1000 * 3600);
                    var toDate = new Date(DateRange.to._d).valueOf() + (1000 * 3600);
                    var convPower = temporalDataType == 'p' ? 6 : 0;
                    var fromKdbNum = (fromDate - kdbStartDate) * Math.pow(10, convPower);
                    var toKdbNum = (toDate - kdbStartDate) * Math.pow(10, convPower);
                    var query = 'select c:' + column;
                    query += ' from select [100] by ' + column;
                    query += ' from ' + this.target.table;
                    query += ' where ' + temporalField + ' within ' + fromKdbNum + ' ' + toKdbNum;
                    return query;
                };
                KDBMetaQuery.prototype.buildDatatypeQuery = function (column) {
                    var query = 'select t from meta ' + this.target.table + ' where c=`' + column;
                    return query;
                };
                return KDBMetaQuery;
            })();
            exports_1("KDBMetaQuery", KDBMetaQuery);
        }
    }
});
//# sourceMappingURL=meta_query.js.map