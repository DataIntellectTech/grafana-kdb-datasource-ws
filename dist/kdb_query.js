System.register(['lodash', './model/kdb-request-config'], function(exports_1) {
    var lodash_1, kdb_request_config_1;
    var KDBQuery;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (kdb_request_config_1_1) {
                kdb_request_config_1 = kdb_request_config_1_1;
            }],
        execute: function() {
            KDBQuery = (function () {
                /** @ngInject */
                function KDBQuery(target, templateSrv, scopedVars, range) {
                    this.target = target;
                    this.templateSrv = templateSrv;
                    this.scopedVars = scopedVars;
                    this.range = range;
                    target.queryId = this.makeid(8);
                    //Global parameters to be initialsed
                    target.queryType = target.queryType || 'selectQuery';
                    target.format = target.format || 'time series';
                    //Select query initialisation
                    target.select = target.select || [[{ type: 'column', params: ['value'] }]];
                    target.funcTimeCol = target.funcTimeCol || '';
                    target.where = target.where || [];
                    if (typeof target.rowCountLimit == 'undefined') {
                        target.rowCountLimit = kdb_request_config_1.defaultRowCountLimit;
                    }
                    if (typeof target.useGrouping == 'undefined') {
                        target.useGrouping = false;
                    }
                    if (!target.useConflation) {
                        target.useConflation = false;
                        target.conflation;
                        target.conflationDurationMS = 300 * Math.pow(10, 9);
                        target.conflationDefaultAggType = 'avg';
                    }
                    if (!target.panelType) {
                        target.panelType = 'graph';
                    }
                    //use Grouping and panel type
                    if (typeof target.useTemporalField == 'undefined') {
                        target.useTemporalField = true;
                    }
                    ;
                    //Error Messages
                    if (!target.errorFound) {
                        target.errorFound = false;
                        target.lastQueryError = '';
                    }
                    //Functional query initialisation
                    target.kdbFunction = target.kdbFunction || '';
                    target.funcGroupCol = target.funcGroupCol || '';
                    target.col_meta = [];
                    //Taking the date from and date to values from Grafana
                    target.range = this.range;
                    //how does this work.  Should we add it?
                    target.limit = target.limit || 0;
                    //Error handling object
                    target.queryError = {
                        //Errors present: From(table), conflation, Row Count, funcGroupCol
                        error: [false, false, false, false],
                        message: ['', '', '', '']
                    };
                    // give interpolateQueryStr access to this
                    this.interpolateQueryStr = this.interpolateQueryStr.bind(this);
                }
                // remove identifier quoting from identifier to use in metadata queries
                KDBQuery.prototype.unquoteIdentifier = function (value) {
                    if (value[0] === '"' && value[value.length - 1] === '"') {
                        return value.substring(1, value.length - 1).replace(/""/g, '"');
                    }
                    else {
                        return value;
                    }
                };
                KDBQuery.prototype.quoteIdentifier = function (value) {
                    return '"' + value.replace(/"/g, '""') + '"';
                };
                KDBQuery.prototype.quoteLiteral = function (value) {
                    return "'" + value.replace(/'/g, "''") + "'";
                };
                KDBQuery.prototype.escapeLiteral = function (value) {
                    return value.replace(/'/g, "''");
                };
                KDBQuery.prototype.hasTimeGroup = function () {
                    return lodash_1.default.find(this.target.group, function (g) { return g.type === 'time'; });
                };
                KDBQuery.prototype.hasMetricColumn = function () {
                    return this.target.metricColumn !== 'none';
                };
                KDBQuery.prototype.interpolateQueryStr = function (value, variable, defaultFormatFn) {
                    // if no multi or include all do not regexEscape
                    if (!variable.multi && !variable.includeAll) {
                        return this.escapeLiteral(value);
                    }
                    if (typeof value === 'string') {
                        return this.quoteLiteral(value);
                    }
                    var escapedValues = lodash_1.default.map(value, this.quoteLiteral);
                    return escapedValues.join(',');
                };
                KDBQuery.prototype.makeid = function (length) {
                    var result = '';
                    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                    var charactersLength = characters.length;
                    for (var i = 0; i < length; i++) {
                        result += characters.charAt(Math.floor(Math.random() * charactersLength));
                    }
                    return result;
                };
                return KDBQuery;
            })();
            exports_1("default", KDBQuery);
        }
    }
});
//# sourceMappingURL=kdb_query.js.map