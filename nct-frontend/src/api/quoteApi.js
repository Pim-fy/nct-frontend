import api from './axios';

/** F-SVC-005: 견적 제출 */
export const submitQuote = (data) =>
  api.post('/quotes', data).then((res) => res.data);

/** F-SVC-006: 견적 수정 */
export const updateQuote = (quoteId, data) =>
  api.put(`/quotes/${quoteId}`, data).then((res) => res.data);

/** F-SVC-008: 견적 철회 */
export const withdrawQuote = (quoteId) =>
  api.delete(`/quotes/${quoteId}`).then((res) => res.data);

/** 내 견적 목록 (제공자) */
export const getMyQuotes = (params) =>
  api.get('/quotes/me', { params }).then((res) => res.data);

/** 견적 수정 이력 조회 */
export const getQuoteHistory = (quoteId) =>
  api.get(`/quotes/${quoteId}/history`).then((res) => res.data);

/** 받은 견적 목록 조회 (요청자용) */
export const getReceivedQuotes = (svcReqSn) =>
  api.get(`/quotes/service-request/${svcReqSn}`).then((res) => res.data);
