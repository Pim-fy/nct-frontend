import { formatDate, formatDateTime, formatPrice } from '@utils/common';

const getResponseBody = (response) => response?.data ?? response;

// 거래 상태 공통코드(TRDG02)를 기존 거래 화면에서 사용하는 상태값으로 변환한다.
// 미리보기 데이터의 영문 상태값은 그대로 유지해 기존 화면 확인 흐름을 보존한다.
const tradeStatusCodeMap = {
  TRDC0003: 'IN_PROGRESS',
  TRDC0004: 'DELIVERING',
  TRDC0005: 'WAITING_CONFIRMATION',
  TRDC0006: 'COMPLETED',
  TRDC0007: 'ON_HOLD',
  TRDC0008: 'CANCELED',
};

/**
 * 서버 공통코드 또는 기존 화면 상태값을 화면 공통 상태값으로 반환한다.
 */
export const normalizeTradeStatus = (status) => {
  const normalizedStatus = String(status ?? '').trim();

  if (!normalizedStatus) {
    return null;
  }

  return tradeStatusCodeMap[normalizedStatus] ?? normalizedStatus;
};

// 서버의 LocalDateTime을 기존 상세 화면에서 쓰는 날짜·시간 필드로 분리한다.
const splitMeetingDateTime = (meetingDateTime) => {
  const normalizedDateTime = String(meetingDateTime ?? '')
    .trim()
    .replace('T', ' ');

  if (!normalizedDateTime) {
    return {
      date: '-',
      time: '-',
    };
  }

  return {
    date: normalizedDateTime.slice(0, 10) || '-',
    time: normalizedDateTime.slice(11, 16) || '-',
  };
};

/**
 * 공통 응답 래퍼(data, content, items)를 제거해 거래 목록 배열만 반환한다.
 * 백엔드의 최종 응답 형식이 확정되면 이 함수만 계약에 맞게 조정한다.
 */
export const getTradeListItems = (response) => {
  const body = getResponseBody(response);

  if (Array.isArray(body)) {
    return body;
  }

  return body?.content ?? body?.items ?? body?.trades ?? [];
};

/**
 * 서버 거래 DTO를 거래내역 화면에 필요한 표시 데이터로 변환한다.
 * 기존 화면의 필드명은 유지하고, 서버 DTO 의존성은 이 파일에만 둔다.
 */
export const toTradeHistoryItem = (trade) => {
  const meetingDateTime = splitMeetingDateTime(trade.meetingDateTime);

  return {
    id: trade.tradeId ?? trade.id,
    type: trade.userRole ?? trade.role ?? trade.type,
    productName: trade.productName ?? trade.itemName ?? '-',
    productImageUrl: trade.productImageUrl ?? trade.imageUrl ?? trade.thumbnailUrl ?? '',
    counterpart: trade.counterpartNickname ?? trade.counterpart ?? '-',
    amount: formatPrice(trade.price ?? trade.amount ?? trade.tradeAmount),
    date: formatDate(trade.createdAt ?? trade.tradedAt ?? trade.tradeDate),
    completedDate: trade.completedAt ? formatDate(trade.completedAt) : null,
    method: trade.tradeMethod ?? trade.method,
    status: normalizeTradeStatus(trade.tradeStatus ?? trade.status),
    meetingDate: trade.meetingDate ?? (meetingDateTime.date === '-' ? null : meetingDateTime.date),
    meetingTime: trade.meetingTime ?? (meetingDateTime.time === '-' ? null : meetingDateTime.time),
    meetingPlace: trade.meetingPlace ?? null,
  };
};

/**
 * 서버 거래 DTO를 구매자·판매자 상세 화면에서 공통으로 사용할 데이터로 변환한다.
 */
export const toTradeDetail = (response) => {
  const trade = getResponseBody(response);
  const meetingDateTime = splitMeetingDateTime(trade.meetingDateTime);

  return {
    id: trade.tradeId ?? trade.id,
    productName: trade.productName ?? trade.itemName ?? '-',
    productImageUrl: trade.productImageUrl ?? trade.imageUrl ?? trade.thumbnailUrl ?? '',
    price: formatPrice(trade.price ?? trade.amount ?? trade.tradeAmount),
    method: trade.tradeMethod ?? trade.method ?? null,
    status: normalizeTradeStatus(trade.tradeStatus ?? trade.status),
    // 확인 대기 상태에서 첫 완료 확인을 누른 역할을 받아 상대방에게만 두 번째 확인 버튼을 노출한다.
    completionRequestedBy: trade.completionRequestedBy ?? null,
    counterpart: trade.counterpartNickname ?? trade.counterpart ?? '-',
    counterpartUserId: trade.counterpartUserId ?? trade.counterpartUsrSn ?? null,
    rating: trade.counterpartRating ?? trade.rating ?? '-',
    deliveryAddress: trade.deliveryAddress ?? trade.address ?? '-',
    deliveryMessage: trade.deliveryMessage ?? trade.shippingMemo ?? '-',
    carrier: trade.carrier ?? trade.deliveryCarrier ?? '-',
    trackingNumber: trade.trackingNumber ?? trade.invoiceNumber ?? '-',
    autoCompleteAt: formatDateTime(trade.autoCompleteAt),
    recipientName: trade.recipientName ?? '-',
    recipientPhone: trade.recipientPhone ?? '-',
    addressDetail: trade.deliveryDetailAddress ?? trade.addressDetail ?? '-',
    deliveryRequest: trade.deliveryMessage ?? trade.deliveryRequest ?? '-',
    deliveryId: trade.deliveryId ?? trade.trdDlvrSn ?? null,
    deliveryProofFiles: trade.deliveryProofFiles ?? [],
    meetingDate: trade.meetingDate ?? meetingDateTime.date,
    meetingTime: trade.meetingTime ?? meetingDateTime.time,
    meetingPlace: trade.meetingPlace ?? '-',
    meetingAddress: trade.meetingAddress ?? '-',
  };
};
