/// <reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import { KDBDatasource } from './datasource';
import { KDBQueryCtrl } from './query_ctrl';
import { KDBConfigCtrl } from './config_ctrl';
declare class KDBAnnotationsQueryCtrl {
    static templateUrl: string;
    annotation: any;
    /** @ngInject */
    constructor();
}
export { KDBDatasource as Datasource, KDBQueryCtrl as QueryCtrl, KDBConfigCtrl as ConfigCtrl, KDBAnnotationsQueryCtrl as AnnotationsQueryCtrl };
