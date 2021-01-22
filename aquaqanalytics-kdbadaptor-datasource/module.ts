///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
import {KDBDatasource} from './datasource';
import {KDBQueryCtrl} from './query_ctrl';
import {KDBConfigCtrl} from './config_ctrl';
// class KDBConfigCtrl {
//   static templateUrl = 'partials/config.html';
// }

// const defaultQuery = `select[100;> <time_column>]
//     timesec:<time_column>,
//     text:<text_column>,
//     tags:<tags_column>
//   from <table name>
//   where time_column within "Z"$("from";"to")
//   `;

class KDBAnnotationsQueryCtrl {
    static templateUrl = 'partials/annotations.editor.html';

    annotation: any;

    /** @ngInject */
    constructor() {
        // this.annotation.rawQuery = this.annotation.rawQuery || defaultQuery;
    }
}

export {
    KDBDatasource as Datasource,
    KDBQueryCtrl as QueryCtrl,
    KDBConfigCtrl as ConfigCtrl,
    KDBAnnotationsQueryCtrl as AnnotationsQueryCtrl,
};
