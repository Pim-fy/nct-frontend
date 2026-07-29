import api from './axios';
import {
  getTradePreviewDetail,
  getTradePreviewList,
  updateTradePreviewDetail,
} from '../mocks/tradePreviewData';

const TRADE_ENDPOINT = '/trades';
// 개발 중에는 별도 env 설정 없이 미리보기 경로를 열어 화면을 검증한다.
// 운영 빌드에서는 명시적으로 켜지지 않으므로 개발용 더미 화면이 노출되지 않는다.
export const isTradePreviewEnabled = (
  import.meta.env.DEV
  || import.meta.env.VITE_USE_TRADE_PREVIEW === 'true'
);

// preview 라우트는 개발 확인 전용이다.
// 라우트가 열려 있다면 환경값과 무관하게 목업을 사용해야 실제 API 오류로 빠지지 않는다.
// 로그인 후 사용하는 일반 거래 경로는 항상 백엔드 API를 호출한다.
export const shouldUseTradePreview = () => (
  window.location.pathname.startsWith('/trades/preview')
);

/**
 * 로그인한 사용자의 거래 목록을 역할·상태·검색어 기준으로 조회한다.
 * 백엔드 응답 형식은 추후 거래 API 계약서에 맞춰 화면 어댑터에서 처리한다.
 */
export const getTradeHistory = async (params = {}, options = {}) => {
  // preview 경로만 API 없이 화면 데이터를 반환한다.
  if (options.preview || shouldUseTradePreview()) {
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
    return updateTradePreviewDetail(tradeId, {
      ...payload,
      // 직거래 일정 저장 성공은 거래 진행 시작을 의미한다.
      tradeStatus: 'IN_PROGRESS',
    });
  }

  const response = await api.put(
    `${TRADE_ENDPOINT}/${tradeId}/offline-schedule`,
    payload,
  );

  return response.data;
};

/**
 * 거래 당사자의 완료 확인을 전송한다.
 * 첫 확인은 상대방 대기를 시작하고, 두 번째 확인은 서버에서 거래 완료로 전환한다.
 */
export const requestTradeCompletion = async (tradeId, requesterRole) => {
  // 개발용 화면도 실제 응답과 같은 상세 객체를 돌려줘 화면 갱신 흐름을 함께 검증한다.
  if (shouldUseTradePreview()) {
    const currentTrade = getTradePreviewDetail(tradeId);
    const currentStatus = currentTrade.tradeStatus;
    const firstRequester = currentTrade.completionRequestedBy;

    // 미리보기에서도 서로 다른 두 당사자가 확인해야 완료되는 실제 흐름을 재현한다.
    if (
      ['CONFIRM_PENDING', 'WAITING_CONFIRMATION'].includes(currentStatus)
      && firstRequester
      && firstRequester !== requesterRole
    ) {
      return updateTradePreviewDetail(tradeId, {
        tradeStatus: 'COMPLETED',
        completionRequestedBy: null,
      });
    }

    return updateTradePreviewDetail(tradeId, {
      tradeStatus: 'CONFIRM_PENDING',
      completionRequestedBy: requesterRole,
    });
  }

  const response = await api.post(
    `${TRADE_ENDPOINT}/${tradeId}/completion-requests`,
  );

  return response.data;
};

/** 판매자가 업로드 완료한 배송 인증사진과 메모를 한 번에 거래에 연결한다. */
export const submitTradeDeliveryProof = async (tradeId, payload) => {
  if (shouldUseTradePreview()) {
    return updateTradePreviewDetail(tradeId, {
      deliveryMessage: payload.deliveryMessage,
      deliveryProofFiles: payload.fileIds.map((fileId, index) => ({
        fileId,
        sortOrder: index + 1,
      })),
      tradeStatus: 'DELIVERING',
    });
  }

  const response = await api.post(
    `${TRADE_ENDPOINT}/${tradeId}/delivery-proofs`,
    payload,
  );

  return response.data;
};
