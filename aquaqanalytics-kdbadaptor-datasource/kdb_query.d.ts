/// <reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
export default class KDBQuery {
    target: any;
    templateSrv: any;
    scopedVars: any;
    range: any;
    /** @ngInject */
    constructor(target: any, templateSrv?: any, scopedVars?: any, range?: any);
    unquoteIdentifier(value: any): any;
    quoteIdentifier(value: any): string;
    quoteLiteral(value: any): string;
    escapeLiteral(value: any): any;
    hasTimeGroup(): any;
    hasMetricColumn(): boolean;
    interpolateQueryStr(value: any, variable: any, defaultFormatFn: any): any;
    makeid(length: any): string;
}
