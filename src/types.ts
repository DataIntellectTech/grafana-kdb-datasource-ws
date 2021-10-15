import { DataQuery, DataSourceJsonData } from '@grafana/data';
import { Conflation } from './QueryEditor';
export interface MyQuery extends DataQuery {
  range: any;
  queryId: any;
  queryType: any;
  dataTopic: any;
  table: any;
  kdbFunction: any;
  queryError: any;
  format: any;
  select: any;
  funcTimeCol: any;
  timeColumn: any;
  timeColumnType: any;
  where: any;
  useGrouping: any;
  useConflation: any;
  conflation: Conflation;
  conflationDurationMS: any;
  conflationDefaultAggType: any;
  panelType: any;
  useTemporalField: any;
  errorFound: any;
  lastQueryError: any;
  funcGroupCol: any;
  col_meta: any;
  limit: any;
  groupingField: any;
  metricColumn: any;
  fontWeight: any;
  rowCountLimit: number;
  version: any;
  error: string;
  useAsyncFunction: boolean;
  useCustomPostback: boolean;
  asyncProcTypes: string;
  postbackFunction: string;
}

export const defaultQuery: Partial<MyQuery> = {
  kdbFunction: '',
  queryError: {
    error: [false, false, false, false],
    message: ['', '', '', ''],
  },
  format: 'table',
  queryId: '',
  rowCountLimit: 100000,
  version: 2,
  queryType: 'selectQuery',
  timeColumn: '',
  timeColumnType: '',
  conflationDurationMS: '',
  conflationDefaultAggType: '',
  conflation: {
    unitType: '',
    duration: 0,
    aggregate: '',
  },
  where: [] = [],
  select: [] = [],
  error: '',
  lastQueryError: '',
  // useAsyncFunction: false,
  // useCustomPostback: false,
  // asyncProcTypes: '',
  // postbackFunction: '',
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  host?: string;
  timeoutLength?: string;
  useAuthentication?: boolean;
  useTLS?: boolean;
  user?: string;
  password?: string;
  timeInterval: string;
}
