/// <reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
export default class ResponseParser {
    private $q;
    constructor($q: any);
    processQueryResult(res: any, req: any): {};
    mapTableData(res: any, req: any): any[];
    mapGraphData(res: any, req: any): any[];
}
