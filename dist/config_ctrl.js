///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register([], function(exports_1) {
    var KDBConfigCtrl;
    return {
        setters:[],
        execute: function() {
            KDBConfigCtrl = (function () {
                function KDBConfigCtrl($scope, backendSrv, $q) {
                    if (typeof this.current.jsonData.useTLS == "undefined")
                        this.current.jsonData.useTLS = true;
                }
                KDBConfigCtrl.templateUrl = 'partials/config.html';
                return KDBConfigCtrl;
            })();
            exports_1("KDBConfigCtrl", KDBConfigCtrl);
        }
    }
});
//# sourceMappingURL=config_ctrl.js.map