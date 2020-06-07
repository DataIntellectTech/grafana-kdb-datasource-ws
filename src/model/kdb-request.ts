import {QueryParam} from "./query-param";

export class KdbRequest {

    refId: string;
    queryId: string;
    query: string;
    queryParam: QueryParam;
    format: string;
}