System.register(['./datasource', './query_ctrl', './config_ctrl'], function(exports_1) {
    var datasource_1, query_ctrl_1, config_ctrl_1;
    var KDBAnnotationsQueryCtrl;
    return {
        setters:[
            function (datasource_1_1) {
                datasource_1 = datasource_1_1;
            },
            function (query_ctrl_1_1) {
                query_ctrl_1 = query_ctrl_1_1;
            },
            function (config_ctrl_1_1) {
                config_ctrl_1 = config_ctrl_1_1;
            }],
        execute: function() {
            // class KDBConfigCtrl {
            //   static templateUrl = 'partials/config.html';
            // }
            // const defaultQuery = `select[100;> <time_column>]
            //     timesec:<time_column>,
            //     text:<text_column>,
            //     tags:<tags_column>
            //   from <table name>
            //   where time_column within "Z"$("from";"to")
            //   `;
            KDBAnnotationsQueryCtrl = (function () {
                /** @ngInject */
                function KDBAnnotationsQueryCtrl() {
                    // this.annotation.rawQuery = this.annotation.rawQuery || defaultQuery;
                }
                KDBAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
                return KDBAnnotationsQueryCtrl;
            })();
            exports_1("Datasource", datasource_1.KDBDatasource);
            exports_1("QueryCtrl", query_ctrl_1.KDBQueryCtrl);
            exports_1("ConfigCtrl", config_ctrl_1.KDBConfigCtrl);
            exports_1("AnnotationsQueryCtrl", KDBAnnotationsQueryCtrl);
        }
    }
});
//# sourceMappingURL=module.js.map