import {QueryParam} from "./query-param";

export class KdbRequest {

    time: string;
    refId: string;
    queryId: string;
    query: string;
    queryParam: QueryParam;
    format: string;
    formatFunc: string;
    version: string;
    useAsyncFunction: boolean;
    useCustomPostback: boolean;
    asyncProcTypes: string[];
    asyncPostbackFunction: string;
}