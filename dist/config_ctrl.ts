///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

export class KDBConfigCtrl {
    static templateUrl = 'partials/config.html';
    current:any

    constructor($scope, backendSrv, $q) {
        if(typeof this.current.jsonData.useTLS == "undefined") this.current.jsonData.useTLS = true;
    }
}
