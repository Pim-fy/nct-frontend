import api from './axios';

/** 로그인한 의뢰자·제공자의 서비스 거래 목록을 페이지 단위로 조회한다. */
export const getMyServiceTrades = ({
  role,
  status,
  keyword,
  page = 1,
  size = 10,
} = {}) => (
  api.get('/trades/service', {
    params: {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
      page,
      size,
    },
  }).then((response) => response.data.data)
);

/** 로그인한 거래 당사자의 서비스 거래 상세와 서버 판정 가능 행동을 조회한다. */
export const getServiceTradeDetail = (tradeId) => (
  api.get(`/trades/${tradeId}/service-detail`).then((response) => response.data.data)
);

/**
 * F-SVC-012: 서비스 거래 당사자가 거래 문제를 접수한다.
 * payload는 disputeTypeCode와 content를 포함하며, 권한·거래 상태·중복 접수는 서버가 검증한다.
 */
export const submitServiceTradeDispute = (tradeId, payload) => (
  api.post(`/trades/${tradeId}/service-disputes`, payload).then((res) => res.data)
);

/** F-SVC-014: 서비스 제공자가 완료 요청을 등록하고 의뢰자 확인 기한을 시작한다. */
export const requestServiceCompletion = (tradeId, payload) => (
  api.post(`/trades/${tradeId}/service-completion-requests`, payload).then((res) => res.data)
);

/** F-SVC-011: 서비스 의뢰자가 완료를 확인하면 서버가 정산까지 함께 처리한다. */
export const confirmServiceCompletion = (tradeId) => (
  api.post(`/trades/${tradeId}/service-completions`).then((res) => res.data)
);
