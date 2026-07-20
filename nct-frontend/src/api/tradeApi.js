import api from './axios';
import {
  getTradePreviewDetail,
  getTradePreviewList,
} from '../mocks/tradePreviewData';

const TRADE_ENDPOINT = '/trades';
export const isTradePreviewEnabled = (
  import.meta.env.VITE_USE_TRADE_PREVIEW === 'true'
);

/**
 * 로그인한 사용자의 거래 목록을 역할·상태·검색어 기준으로 조회한다.
 * 백엔드 응답 형식은 추후 거래 API 계약서에 맞춰 화면 어댑터에서 처리한다.
 */
export const getTradeHistory = async (params = {}) => {
  // 개발용 플래그가 명시된 경우에만 API 없이 화면 데이터를 반환한다.
  if (isTradePreviewEnabled) {
    return getTradePreviewList(params);
  }

  const response = await api.get(TRADE_ENDPOINT, {
    params,
  });

  return response.data;
};

/**
 * 거래 당사자의 역할을 서버에서 검증한 뒤 거래 상세 정보를 조회한다.
 */
export const getTradeDetail = async (tradeId) => {
  // 실제 API 연결 전에도 목록에서 상세 화면 이동을 확인할 수 있게 한다.
  if (isTradePreviewEnabled) {
    return getTradePreviewDetail(tradeId);
  }

  const response = await api.get(`${TRADE_ENDPOINT}/${tradeId}`);

  return response.data;
};

/**
 * 판매자가 택배사·운송장 번호·발송 메모를 등록한다.
 * payload는 carrier, trackingNumber, shippingMemo를 사용하도록 백엔드와 합의가 필요하다.
 */
export const registerTradeShipping = async (tradeId, payload) => {
  // 개발용 화면에서는 폼 유효성 검사와 완료 상태 전환만 확인한다.
  if (isTradePreviewEnabled) {
    return {
      tradeId,
      ...payload,
    };
  }

  const response = await api.post(
    `${TRADE_ENDPOINT}/${tradeId}/shipping`,
    payload,
  );

  return response.data;
};

/**
 * 구매자의 거래 완료 확인 요청을 전송한다.
 * 실제 완료 여부와 무이의 기간은 서버가 상태 전이 규칙으로 판단한다.
 */
export const requestTradeCompletion = async (tradeId) => {
  // 개발용 화면에서는 구매 확인 요청 뒤의 상태 변경만 확인한다.
  if (isTradePreviewEnabled) {
    return { tradeId };
  }

  const response = await api.post(
    `${TRADE_ENDPOINT}/${tradeId}/completion-requests`,
  );

  return response.data;
};
