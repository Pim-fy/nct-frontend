export const SERVICE_TRADE_PREVIEW_DISPUTE_TYPES = [
  { code: 'TRDC0011', label: '노쇼' },
  { code: 'TRDC0012', label: '배송문제' },
  { code: 'TRDC0013', label: '서비스문제' },
  { code: 'TRDC0014', label: '결제정산' },
  { code: 'TRDC0015', label: '기타' },
];

const SERVICE_TRADE_PREVIEW_ITEMS = {
  91: {
    tradeId: 91,
    serviceRequestId: 31,
    viewerRole: 'PROVIDER',
    tradeStatusCode: 'TRDC0003',
    tradeAmount: 150000,
    autoCompleteAt: '2026-08-10T12:00:00',
    serviceRequestTitle: '이사 전 입주 청소를 요청합니다',
    quoteSummary: '전체 청소와 주방·욕실 집중 클리닝',
    scheduleLabel: '2026. 08. 08. 오전 10:00',
    escrowStatusCode: 'ESCROW_HELD',
    escrowStatusLabel: '거래대금 150,000P가 안전하게 보관 중입니다.',
    chatAvailable: true,
    scheduleHistory: [
      {
        id: '91-created',
        title: '서비스 일정 확정',
        occurredAt: '2026. 08. 03. 10:30',
        reason: '의뢰자와 제공자가 방문 일정을 확인했습니다.',
      },
    ],
    availableActions: [
      'REQUEST_COMPLETION',
      'REQUEST_SCHEDULE_CHANGE',
      'REQUEST_SCHEDULE_CANCELLATION',
      'SUBMIT_DISPUTE',
    ],
  },
  92: {
    tradeId: 92,
    serviceRequestId: 32,
    viewerRole: 'REQUESTER',
    tradeStatusCode: 'TRDC0005',
    tradeAmount: 85000,
    autoCompleteAt: '2026-08-10T18:00:00',
    serviceRequestTitle: '원룸 에어컨 분해 청소',
    quoteSummary: '스탠드형 에어컨 1대 분해 및 세척',
    scheduleLabel: '2026. 08. 05. 오후 2:00',
    escrowStatusCode: 'ESCROW_HELD',
    escrowStatusLabel: '거래대금 85,000P가 안전하게 보관 중입니다.',
    chatAvailable: false,
    scheduleHistory: [
      {
        id: '92-completion',
        title: '제공자 완료 요청',
        occurredAt: '2026. 08. 05. 18:00',
        reason: '서비스 작업이 완료되어 의뢰자 확인을 기다리고 있습니다.',
      },
    ],
    availableActions: ['CONFIRM_COMPLETION', 'SUBMIT_DISPUTE'],
  },
};

export const getServiceTradePreview = (tradeId) => (
  SERVICE_TRADE_PREVIEW_ITEMS[tradeId] ?? null
);
