///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
export class KDBMetaQuery {

    subgroupDatatypeLookup: any

    constructor(private target, private queryModel) {
        this.subgroupDatatypeLookup = {
            year:"i",
            month:"m",
            mm:"i",
            week:"d",
            dd:"i",
            hh:"i",
            uu:"i",
            minute:"u",
            ss:"i",
            second:"v",
            date:"d",
            time:"t",
            timestamp:"p",
            timespan:"u",
            datetime:"z"
        }
    }

    getOperators(datatype: string) {
        switch (datatype) {
            //Handling for numeral datatypes
            case 'h':
            case 'i':
            case 'j':
            case 'e':
            case 'f':{
                return ['=', '<>', '<', '<=', '>', '>=','within', 'not within']
            }
            //Handling for temporal datatypes
            case 'p':{
                return ['=', '<>', '<', '<=', '>', '>=','within', 'not within']
            }
            case 'm':
            case 'd':
            case 'u':
            case 'v':
            case 'z':{
                return ['=', '<>', '<', '<=', '>', '>=','within', 'not within']
            }
            case 't': {
                return ['=', '<>', '<', '<=', '>', '>=','within', 'not within']
            }
            //Handling for string datatypes
            case 's':
            case 'c': {
                return ['=', '<>', 'like', 'in', 'not in']
            }
            default: {
                return ['=', '<>']; // removing set operators  , 'in', 'not in'];
            }
        }
    }

    // quote identifier as literal to use in metadata queries
    quoteIdentAsLiteral(value) {
        return this.queryModel.quoteLiteral(this.queryModel.unquoteIdentifier(value));
    }

    findMetricTable() {
        // query that returns first table found that has a timestamp(tz) column and a float column
        const query = 'select[1] table from ([]table:tables[];types:{(0!meta x)`t}each tables[]) where {all "pf" in x}each types';

        return query;
    }

    buildTableConstraint(table: string) {
        let query = '';

        // check for schema qualified table
        if (table.includes('.')) {
            const parts = table.split('.');
            query = 'table_schema = ' + this.quoteIdentAsLiteral(parts[0]);
            query += ' AND table_name = ' + this.quoteIdentAsLiteral(parts[1]);
            return query;
        } else {
            query = 'table_schema = database() AND table_name = ' + this.quoteIdentAsLiteral(table);

            return query;
        }
    }

    buildServerFunctionsQuery() {
        //return all functions in the KDB server root namespace
        return 'select table from ([] table:system"f")'
    }

    buildTableQuery() {
        // return table containing tablenames
        return 'flip enlist[`table]!enlist (asc tables[`.]),asc .Q.dd[`;]each raze {.Q.dd[x;] each tables .Q.dd[`;x]}each key `';
    }

    buildColumnQuery(type?: string) {
        // return table of columns names in table that fit the schema appropriate to type
        let query = 'select[> c] c from meta ' + this.target.table + ' where ';

        switch (type) {
            case 'time': {
                // timestamp, time, timespan, datetime
                query += 't in "pz"';//nt"';  Restricted fields for datetime
                break;
            }
            case 'group':
            case 'metric': {
                // char, symbol
                query += 't in "cs"';
                break;
            }
            case 'value': {
                // boolean, byte, short, int, long, real, float
                query += 't in "bxhijef"';
                // query += ' and C <> ' + this.quoteIdentAsLiteral(this.target.timeColumn);
                break;
            }
            case 'tableValue' : {
                query += 't in "bxhijefcspmdznuvt"';
                break;
            }
            case 'by': {
                query += 't in "bxhijefs", not c in ';
                this.target.select.forEach(select => {
                    query += "`" + select[0].params[0];
                })
            }
            case 'where': {
                query += 't in "bgxhijefcspmdzuvt"'; //have included everything except for timespan
                break;

            }
            case 'grouping': {
                query += 't in "s"' //need to flesh this out a bit more (CHO)
                break
            }
        }

        return query;
    }

    buildConflationUnitsQuery() {
        //return the possible units for Conflation of query results
        return ['seconds', 'minutes', 'hours'];
    }

// Think this is obsolete
    getColumnDataType(column: string) {
        return `meta select ${column} from ${this.target.table}`
    }

    buildValueQuery(column: string, DateRange: any, temporalField: string, temporalDataType: string) {
        let kdbStartDate = new Date(2000, 0, 1, 0, 0).valueOf();
        let fromDate = new Date(DateRange.from._d).valueOf() - (1000 *  3600);
        let toDate = new Date(DateRange.to._d).valueOf() + (1000 * 3600);
        let convPower = temporalDataType == 'p' ? 6 : 0
        let fromKdbNum = (fromDate - kdbStartDate) * Math.pow(10, convPower)
        let toKdbNum = (toDate - kdbStartDate) * Math.pow(10, convPower)
        let query = 'select c:' + column;

        query += ' from select [100] by ' + column;
        query += ' from '  +  this.target.table;
        query += ' where ' + temporalField + ' within ' + fromKdbNum + ' ' + toKdbNum;


        return query;
    }
    buildDatatypeQuery(column: string) {
        let query = 'select t from meta ' + this.target.table + ' where c=`' + column;
        return query;
    }
    
}

