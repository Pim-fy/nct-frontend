import api from './axios';
import {
  getTradePreviewDetail,
  getTradePreviewList,
  createTradePreviewCancellationProposal,
  createTradePreviewScheduleProposal,
  respondToTradePreviewScheduleProposal,
  updateTradePreviewDetail,
  withdrawTradePreviewScheduleProposal,
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

// @ai_generated
/** 경매 번호를 외부 식별자로 사용해 현재 사용자의 물건 거래 상세를 조회한다. */
export const getTradeDetailByAuctionId = async (auctionId) => {
  const response = await api.get(`${TRADE_ENDPOINT}/auction/${auctionId}`);

  return response.data;
};

/**
 * 거래 당사자가 직거래 일정 신규 제안 또는 변경 제안을 등록한다.
 * 서버는 거래 당사자 여부와 직거래 방식 여부를 함께 검증한다.
 */
export const proposeTradeOfflineSchedule = async (tradeId, payload) => {
  // preview 경로에서는 저장 형식만 반환해 폼 동작을 확인한다.
  if (shouldUseTradePreview()) {
    return createTradePreviewScheduleProposal(tradeId, payload);
  }

  const response = await api.post(
    `${TRADE_ENDPOINT}/${tradeId}/offline-schedule/proposals`,
    payload,
  );

  return response.data;
};

/** 확정 직거래 일정 취소를 상대방에게 제안한다. */
export const requestOfflineScheduleCancellation = async (tradeId) => {
  if (shouldUseTradePreview()) {
    return createTradePreviewCancellationProposal(tradeId);
  }

  const response = await api.post(
    `${TRADE_ENDPOINT}/${tradeId}/offline-schedule/cancel-requests`,
  );

  return response.data;
};

/** 상대방이 제안한 직거래 일정을 수락한다. */
export const acceptOfflineScheduleProposal = async (tradeId, proposalId) => {
  if (shouldUseTradePreview()) {
    return respondToTradePreviewScheduleProposal(tradeId, true);
  }

  const response = await api.post(
    `${TRADE_ENDPOINT}/${tradeId}/offline-schedule/proposals/${proposalId}/accept`,
  );

  return response.data;
};

/** 상대방이 제안한 직거래 일정을 거절한다. */
export const rejectOfflineScheduleProposal = async (tradeId, proposalId) => {
  if (shouldUseTradePreview()) {
    return respondToTradePreviewScheduleProposal(tradeId, false);
  }

  const response = await api.post(
    `${TRADE_ENDPOINT}/${tradeId}/offline-schedule/proposals/${proposalId}/reject`,
  );

  return response.data;
};

/** 본인이 등록한 대기 중 직거래 일정 제안을 철회한다. */
export const withdrawOfflineScheduleProposal = async (tradeId, proposalId) => {
  if (shouldUseTradePreview()) {
    return withdrawTradePreviewScheduleProposal(tradeId);
  }

  const response = await api.delete(
    `${TRADE_ENDPOINT}/${tradeId}/offline-schedule/proposals/${proposalId}`,
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

/** 직거래 완료 요청을 받은 상대방이 동의해 완료하거나 거절해 거래 진행으로 되돌린다. */
export const respondOfflineTradeCompletionRequest = async (tradeId, requesterRole, approve) => {
  if (shouldUseTradePreview()) {
    return updateTradePreviewDetail(tradeId, approve
      ? {
        tradeStatus: 'COMPLETED',
        completionRequestedBy: null,
      }
      : {
        tradeStatus: 'DELIVERING',
        completionRequestedBy: null,
      });
  }

  const response = await api.post(
    `${TRADE_ENDPOINT}/${tradeId}/offline-completion-requests/respond`,
    null,
    { params: { approve, requesterRole } },
  );

  return response.data;
};

/** 담당자 7 · REQ-AUC-027/F-SVC-012: 상품·서비스 공통 거래 문제 접수 계약입니다. */
export const submitTradeDispute = async (tradeId, payload) => {
  const response = await api.post(
    `${TRADE_ENDPOINT}/${tradeId}/disputes`,
    payload,
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
