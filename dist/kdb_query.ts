///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import _ from 'lodash';
import { defaultRowCountLimit } from './model/kdb-request-config';

export default class KDBQuery {
    target: any;
    templateSrv: any;//TemplateSrv;
    scopedVars: any;
    range: any;


    /** @ngInject */
    constructor(target, templateSrv?, scopedVars?, range?) {
        this.target = target;
        this.templateSrv = templateSrv;
        this.scopedVars = scopedVars;
        this.range = range;

        target.queryId = this.makeid(8);

        //Global parameters to be initialsed
        target.queryType = target.queryType || 'selectQuery';
        target.format = target.format || 'time series';

        //Select query initialisation
        target.select = target.select || [[{type: 'column', params: ['value']}]];
        target.funcTimeCol = target.funcTimeCol || ''; 
        target.where = target.where || [];

        if(typeof target.rowCountLimit == 'undefined') {
            target.rowCountLimit = defaultRowCountLimit;
        }
     
        if(typeof target.useGrouping == 'undefined') {
            target.useGrouping = false;
        }

        if(!target.useConflation) {
            target.useConflation = false;
            target.conflation
            target.conflationDurationMS = 300 * Math.pow(10,9);
            target.conflationDefaultAggType = 'avg';
        }
        if(!target.panelType){
            target.panelType = 'graph';
        }

        //use Grouping and panel type
        if(typeof target.useTemporalField == 'undefined') {
            target.useTemporalField = true;
        };

        //Error Messages
        if(!target.errorFound) {
            target.errorFound = false;
            target.lastQueryError = '';
        }

        //Functional query initialisation
        target.kdbFunction = target.kdbFunction || '';
        target.funcGroupCol = target.funcGroupCol || '';
        target.col_meta = [];

        //Taking the date from and date to values from Grafana
        target.range = this.range;

        //how does this work.  Should we add it?
        target.limit = target.limit || 0;

               //Error handling object
        target.queryError = {
            //Errors present: From(table), conflation, Row Count, funcGroupCol
            error: [false,false,false,false],
            message: ['','','','']
        };


        // give interpolateQueryStr access to this
        this.interpolateQueryStr = this.interpolateQueryStr.bind(this);
    }

    // remove identifier quoting from identifier to use in metadata queries
    unquoteIdentifier(value) {
        if (value[0] === '"' && value[value.length - 1] === '"') {
            return value.substring(1, value.length - 1).replace(/""/g, '"');
        } else {
            return value;
        }
    }

    quoteIdentifier(value) {
        return '"' + value.replace(/"/g, '""') + '"';
    }

    quoteLiteral(value) {
        return "'" + value.replace(/'/g, "''") + "'";
    }

    escapeLiteral(value) {
        return value.replace(/'/g, "''");
    }

    hasTimeGroup() {
        return _.find(this.target.group, (g: any) => g.type === 'time');
    }

    hasMetricColumn() {
        return this.target.metricColumn !== 'none';
    }

    interpolateQueryStr(value, variable, defaultFormatFn) {
        // if no multi or include all do not regexEscape
        if (!variable.multi && !variable.includeAll) {
            return this.escapeLiteral(value);
        }

        if (typeof value === 'string') {
            return this.quoteLiteral(value);
        }

        const escapedValues = _.map(value, this.quoteLiteral);
        return escapedValues.join(',');
    }

    makeid(length) {
        let result           = '';
        let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
     }
     
}
