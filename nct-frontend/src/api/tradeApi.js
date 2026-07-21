import api from './axios';
import {
  getTradePreviewDetail,
  getTradePreviewList,
} from '../mocks/tradePreviewData';

const TRADE_ENDPOINT = '/trades';
export const isTradePreviewEnabled = (
  import.meta.env.VITE_USE_TRADE_PREVIEW === 'true'
);

// 개발 플래그가 켜져 있어도 preview 경로에서만 목업을 사용해야
// 로그인 후 실제 거래 화면이 백엔드 API를 호출할 수 있다.
export const shouldUseTradePreview = () => (
  isTradePreviewEnabled
  && window.location.pathname.startsWith('/trades/preview')
);

/**
 * 로그인한 사용자의 거래 목록을 역할·상태·검색어 기준으로 조회한다.
 * 백엔드 응답 형식은 추후 거래 API 계약서에 맞춰 화면 어댑터에서 처리한다.
 */
export const getTradeHistory = async (params = {}) => {
  // preview 경로만 API 없이 화면 데이터를 반환한다.
  if (shouldUseTradePreview()) {
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
  // preview 경로에서만 API 없이 상세 화면 이동을 확인할 수 있게 한다.
  if (shouldUseTradePreview()) {
    return getTradePreviewDetail(tradeId);
  }

  const response = await api.get(`${TRADE_ENDPOINT}/${tradeId}`);

  return response.data;
};

/**
 * 판매자가 본인 직거래의 일시·장소·상세 주소를 저장하거나 수정한다.
 * 서버는 판매자 여부와 직거래 방식 여부를 함께 검증한다.
 */
export const proposeTradeOfflineSchedule = async (tradeId, payload) => {
  // preview 경로에서는 저장 형식만 반환해 폼 동작을 확인한다.
  if (shouldUseTradePreview()) {
    return {
      tradeId,
      ...payload,
    };
  }

  const response = await api.put(
    `${TRADE_ENDPOINT}/${tradeId}/offline-schedule`,
    payload,
  );

  return response.data;
};

/**
 * 구매자의 거래 완료 확인 요청을 전송한다.
 * 실제 완료 여부와 무이의 기간은 서버가 상태 전이 규칙으로 판단한다.
 */
export const requestTradeCompletion = async (tradeId) => {
  // 개발용 화면도 실제 응답과 같은 상세 객체를 돌려줘 화면 갱신 흐름을 함께 검증한다.
  if (shouldUseTradePreview()) {
    return {
      ...getTradePreviewDetail(tradeId),
      tradeStatus: 'CONFIRM_PENDING',
    };
  }

  const response = await api.post(
    `${TRADE_ENDPOINT}/${tradeId}/completion-requests`,
  );

  return response.data;
};

/** 판매자가 업로드 완료한 배송 인증사진과 메모를 한 번에 거래에 연결한다. */
export const submitTradeDeliveryProof = async (tradeId, payload) => {
  if (shouldUseTradePreview()) {
    return {
      ...getTradePreviewDetail(tradeId),
      deliveryMessage: payload.deliveryMessage,
      deliveryProofFiles: payload.fileIds.map((fileId, index) => ({
        fileId,
        sortOrder: index + 1,
      })),
      tradeStatus: 'DELIVERING',
    };
  }

  const response = await api.post(
    `${TRADE_ENDPOINT}/${tradeId}/delivery-proofs`,
    payload,
  );

  return response.data;
};
