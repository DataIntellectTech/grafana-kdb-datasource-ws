export declare class SqlPartDef {
    type: string;
    style: string;
    label: string;
    params: any[];
    defaultParams: any[];
    wrapOpen: string;
    wrapClose: string;
    separator: string;
    constructor(options: any);
}
export declare class SqlPart {
    part: any;
    def: SqlPartDef;
    params: any[];
    label: string;
    name: string;
    datatype: string;
    constructor(part: any, def: any);
    updateParam(strValue: any, index: any): void;
}
