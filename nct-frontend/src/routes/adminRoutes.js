/** 담당자 7 · F-OPS-005/010/011/024: 관리자 UI의 하이픈 없는 경로 계약을 한곳에서 관리합니다. */
export const ADMIN_PROVIDER_APPLICATIONS_ROUTE = 'providers/applications';
export const ADMIN_PROVIDER_APPLICATIONS_PATH = `/admin/${ADMIN_PROVIDER_APPLICATIONS_ROUTE}`;

export const ADMIN_OPERATIONS_RECORDS_ROUTE = 'operations/records';
export const ADMIN_OPERATIONS_RECORDS_PATH = `/admin/${ADMIN_OPERATIONS_RECORDS_ROUTE}`;

export const ADMIN_SETTINGS_ROUTE = 'settings';
export const ADMIN_SETTINGS_PATH = `/admin/${ADMIN_SETTINGS_ROUTE}`;

export const ADMIN_SERVICE_TRADE_DETAIL_ROUTE = 'services/trades/:tradeId';

export const getAdminServiceTradeDetailPath = (tradeId) => (
  `/admin/services/trades/${tradeId}`
);
