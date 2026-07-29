import api from './axios';

/** F-PAY-012: 관리자가 수동 환전 지급 결과를 기록하는 계약입니다. */
export const getAdminPointExchangeOrders = () =>
  api.get('/admin/point/exchange/orders').then((response) => response.data.data ?? []);

export const completeAdminPointExchange = (orderSn) =>
  api.post(`/admin/point/exchange/${orderSn}/complete`).then((response) => response.data);

export const rejectAdminPointExchange = ({ orderSn, reason }) =>
  api.post(`/admin/point/exchange/${orderSn}/reject`, { reason })
    .then((response) => response.data);
