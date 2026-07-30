import api from './axios';

/**
 * F-SVC-012: 서비스 거래 당사자가 거래 문제를 접수한다.
 * payload는 disputeTypeCode와 content를 포함하며, 권한·거래 상태·중복 접수는 서버가 검증한다.
 */
export const submitServiceTradeDispute = (tradeId, payload) => (
  api.post(`/trades/${tradeId}/service-disputes`, payload).then((res) => res.data)
);
