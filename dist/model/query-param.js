System.register([], function(exports_1) {
    var WhereObject, QueryParam;
    return {
        setters:[],
        execute: function() {
            WhereObject = (function () {
                function WhereObject() {
                }
                return WhereObject;
            })();
            QueryParam = (function () {
                function QueryParam() {
                    this.column = [];
                    //where: WhereObject;
                    this.where = [];
                    this.temporal_range = [];
                    this.grouping = [];
                }
                return QueryParam;
            })();
            exports_1("QueryParam", QueryParam);
        }
    }
});
//# sourceMappingURL=query-param.js.map