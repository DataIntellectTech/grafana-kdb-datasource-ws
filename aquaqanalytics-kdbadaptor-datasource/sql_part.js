System.register(['./sql_part/sql_part'], function(exports_1) {
    var sql_part_1;
    var index;
    function createPart(part) {
        var def = index[part.type];
        if (!def) {
            return null;
        }
        return new sql_part_1.SqlPart(part, def);
    }
    function register(options) {
        index[options.type] = new sql_part_1.SqlPartDef(options);
    }
    return {
        setters:[
            function (sql_part_1_1) {
                sql_part_1 = sql_part_1_1;
            }],
        execute: function() {
            index = [];
            register({
                type: 'column',
                style: 'label',
                params: [{ type: 'column', dynamicLookup: true }],
                defaultParams: ['value'],
            });
            register({
                type: 'expression',
                style: 'expression',
                label: 'Expr:',
                params: [
                    { name: 'left', type: 'string', dynamicLookup: true },
                    { name: 'op', type: 'string', dynamicLookup: true },
                    { name: 'right', type: 'string', dynamicLookup: true },
                ],
                defaultParams: ['value', '=', 'value'],
            });
            register({
                type: 'macro',
                style: 'label',
                label: 'Macro:',
                params: [],
                defaultParams: [],
            });
            register({
                type: 'aggregate',
                style: 'label',
                params: [
                    {
                        name: 'name',
                        type: 'string',
                        options: ['avg', 'count', 'min', 'max', 'sum', 'med', 'dev', 'var', 'sdev', 'svar'],
                    },
                ],
                defaultParams: ['avg'],
            });
            register({
                // x binaryFunc y, where y is the value selected, and x is the 'left' argument
                type: 'binaryFunc',
                style: 'label',
                params: [
                    {
                        name: 'leftArg',
                        type: 'string',
                        options: []
                    },
                    {
                        name: 'name',
                        type: 'string',
                        options: ['cor', 'cov', 'scov', 'wavg', 'wsum', 'ema', 'mavg', 'mcount', 'mdev', 'mmax', 'mmin', 'msum']
                    }
                ],
                defaultParams: ['wavg', 'duration'],
            });
            register({
                type: 'bucket',
                style: 'label',
                params: [
                    {
                        name: 'size',
                        type: 'string',
                        options: []
                    },
                    {
                        name: 'value',
                        type: 'string',
                        options: []
                    }
                ],
                defaultParams: ['60', 'time.minute'],
            });
            register({
                type: 'alias',
                style: 'label',
                params: [{ name: 'name', type: 'string', quote: 'double' }],
                defaultParams: ['alias'],
            });
            register({
                type: 'time',
                style: 'function',
                label: 'time',
                params: [
                    {
                        name: 'interval',
                        type: 'interval',
                        options: ['$__interval', '1s', '10s', '1m', '5m', '10m', '15m', '1h'],
                    },
                    {
                        name: 'fill',
                        type: 'string',
                        options: ['none', 'NULL', 'previous', '0'],
                    },
                ],
                defaultParams: ['$__interval', 'none'],
            });
            exports_1("default",{
                create: createPart,
            });
        }
    }
});
//# sourceMappingURL=sql_part.js.map