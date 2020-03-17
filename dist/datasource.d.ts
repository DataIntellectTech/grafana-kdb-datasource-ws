/// <reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import ResponseParser from './response_parser';
import KDBQuery from './kdb_query';
import { C } from './c';
import { KdbRequest } from "./model/kdb-request";
export declare class KDBDatasource {
    private backendSrv;
    private $q;
    private templateSrv;
    id: any;
    name: any;
    responseParser: ResponseParser;
    queryModel: KDBQuery;
    interval: string;
    message: {};
    url: string;
    wsUrl: string;
    ws: WebSocket;
    awaitingResponse: boolean;
    c: C;
    maxRowCount: number;
    connectionStateCycles: number;
    timeoutLength: number;
    requestSentList: any[];
    requestSentIDList: any[];
    responseReceivedList: any[];
    /** @ngInject */
    constructor(instanceSettings: any, backendSrv: any, $q: any, templateSrv: any);
    interpolateVariable: (value: any, variable: any) => any;
    private buildKdbRequest(target);
    private buildTemporalField(queryDetails);
    private buildTemporalRange(range);
    private buildWhereParams(queryWhereList);
    private buildColumnParams(target);
    private getTimeStamp(date);
    showEmpty(Id: string, errormessage?: string): {
        refId: string;
        columns: any[];
        rows: any[];
        meta: {
            refId: string;
            errorReceived: boolean;
            errorMessage: string;
        };
    };
    errorReturn(errorstring: string): {
        payload: any[];
        error: string;
        success: boolean;
    };
    query(options: any): Promise<{}>;
    sendQueries(nrRequests: any, requestList: any, nrBlankRequests: any, blankRefIDs: any, errorList: any): Promise<{}>;
    connectFail(prefilterResultCount: any, allRefIDs: any): Promise<{}>;
    emptyQueries(nrBlankRequests: any, blankRefIDs: any, errorList: any): Promise<{}>;
    private ProcessData(curRequest, nrRequests, resultList, requestList);
    private getQueryResult;
    connectWS(): Promise<{}>;
    webSocketWait(): Promise<{}>;
    executeAsyncQuery(request: any): any;
    executeAsyncReceive(responseObj: any): void;
    metricFindQuery(kdbRequest: KdbRequest): Promise<{}>;
    testDatasource(): Promise<Object>;
    connect(): Promise<Object>;
    checkConnectionState(): Promise<Object>;
    setupWebSocket(): void;
    buildResponse(status: string, message: string, title: string): Promise<{
        status: string;
        message: string;
        title: string;
    }>;
}
