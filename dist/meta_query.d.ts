/// <reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
export declare class KDBMetaQuery {
    private target;
    private queryModel;
    subgroupDatatypeLookup: any;
    constructor(target: any, queryModel: any);
    getOperators(datatype: string): string[];
    quoteIdentAsLiteral(value: any): any;
    findMetricTable(): string;
    buildTableConstraint(table: string): string;
    buildServerFunctionsQuery(): string;
    buildTableQuery(): string;
    buildColumnQuery(type?: string): string;
    buildConflationUnitsQuery(): string[];
    getColumnDataType(column: string): string;
    buildValueQuery(column: string, DateRange: any, temporalField: string, temporalDataType: string): string;
    buildDatatypeQuery(column: string): string;
}
