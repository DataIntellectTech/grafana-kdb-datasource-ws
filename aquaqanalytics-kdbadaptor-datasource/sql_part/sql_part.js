System.register(['lodash'], function(exports_1) {
    var lodash_1;
    var SqlPartDef, SqlPart;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }],
        execute: function() {
            // TODO find a way to import Grafana's sql_part correctly
            SqlPartDef = (function () {
                function SqlPartDef(options) {
                    this.type = options.type;
                    if (options.label) {
                        this.label = options.label;
                    }
                    else {
                        this.label = this.type[0].toUpperCase() + this.type.substring(1) + ':';
                    }
                    this.style = options.style;
                    if (this.style === 'function') {
                        this.wrapOpen = '(';
                        this.wrapClose = ')';
                        this.separator = ', ';
                    }
                    else {
                        this.wrapOpen = ' ';
                        this.wrapClose = ' ';
                        this.separator = ' ';
                    }
                    this.params = options.params;
                    this.defaultParams = options.defaultParams;
                }
                return SqlPartDef;
            })();
            exports_1("SqlPartDef", SqlPartDef);
            SqlPart = (function () {
                function SqlPart(part, def) {
                    this.part = part;
                    this.def = def;
                    if (!this.def) {
                        throw { message: 'Could not find sql part ' + part.type };
                    }
                    this.datatype = part.datatype;
                    if (part.name) {
                        this.name = part.name;
                        this.label = def.label + ' ' + part.name;
                    }
                    else {
                        this.name = '';
                        this.label = def.label;
                    }
                    part.params = part.params || lodash_1.default.clone(this.def.defaultParams);
                    this.params = part.params;
                }
                SqlPart.prototype.updateParam = function (strValue, index) {
                    // handle optional parameters
                    if (strValue === '' && this.def.params[index].optional) {
                        this.params.splice(index, 1);
                    }
                    else {
                        this.params[index] = strValue;
                    }
                    this.part.params = this.params;
                };
                return SqlPart;
            })();
            exports_1("SqlPart", SqlPart);
        }
    }
});
//# sourceMappingURL=sql_part.js.map