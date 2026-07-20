const getResponseBody = (response) => response?.data ?? response;

const formatAmount = (amount) => {
  if (typeof amount === 'number') {
    return `${amount.toLocaleString('ko-KR')}원`;
  }

  return amount || '-';
};

const formatDate = (date) => {
  if (!date) {
    return '-';
  }

  return String(date).replaceAll('-', '.').slice(0, 10);
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
export const toTradeHistoryItem = (trade) => ({
  id: trade.tradeId ?? trade.id,
  type: trade.userRole ?? trade.role ?? trade.type,
  productName: trade.productName ?? trade.itemName ?? '-',
  counterpart: trade.counterpartNickname ?? trade.counterpart ?? '-',
  amount: formatAmount(trade.price ?? trade.amount ?? trade.tradeAmount),
  date: formatDate(trade.createdAt ?? trade.tradedAt ?? trade.tradeDate),
  method: trade.tradeMethod ?? trade.method,
  status: trade.tradeStatus ?? trade.status,
});

/**
 * 서버 거래 DTO를 구매자·판매자 상세 화면에서 공통으로 사용할 데이터로 변환한다.
 */
export const toTradeDetail = (response) => {
  const trade = getResponseBody(response);

  return {
    id: trade.tradeId ?? trade.id,
    productName: trade.productName ?? trade.itemName ?? '-',
    price: formatAmount(trade.price ?? trade.amount ?? trade.tradeAmount),
    method: trade.tradeMethod ?? trade.method ?? null,
    status: trade.tradeStatus ?? trade.status,
    counterpart: trade.counterpartNickname ?? trade.counterpart ?? '-',
    rating: trade.counterpartRating ?? trade.rating ?? '-',
    deliveryAddress: trade.deliveryAddress ?? trade.address ?? '-',
    deliveryMessage: trade.deliveryMessage ?? trade.shippingMemo ?? '-',
    carrier: trade.carrier ?? trade.deliveryCarrier ?? '-',
    trackingNumber: trade.trackingNumber ?? trade.invoiceNumber ?? '-',
    autoCompleteAt: trade.autoCompleteAt ?? '-',
    recipientName: trade.recipientName ?? '-',
    recipientPhone: trade.recipientPhone ?? '-',
    addressDetail: trade.addressDetail ?? '-',
    deliveryRequest: trade.deliveryRequest ?? '-',
    meetingDate: trade.meetingDate ?? '-',
    meetingTime: trade.meetingTime ?? '-',
    meetingPlace: trade.meetingPlace ?? '-',
    meetingMemo: trade.meetingMemo ?? '-',
    meetingConfirmed: trade.meetingConfirmed ?? false,
  };
};
