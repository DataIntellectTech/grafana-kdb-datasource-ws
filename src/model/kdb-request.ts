import {QueryParam} from "./query-param";

export class KdbRequest {

    time: string;
    refId: string;
    queryId: string;
    query: string;
    queryParam: QueryParam;
    format: string;
    version: string;
}