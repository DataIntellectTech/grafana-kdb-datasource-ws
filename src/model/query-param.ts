import {QueryDictionary} from "./queryDictionary";

class WhereObject {
    type: string;
    datatype: string;
    name: string
    params: string[] | string[][]
}

export class QueryParam {

    table: string;
    column: any[] = [];
    //where: WhereObject;
    where: string[] = []
    temporal_field: any;
    temporal_range: number[] = [];
    grouping: string[] = [];
    conflation: any;
    query: QueryDictionary;
    maxRowCount: number | string;
}