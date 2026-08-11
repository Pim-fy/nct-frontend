import { useParams } from 'react-router-dom';
import ServiceTradeDetailPage from './ServiceTradeDetailPage';

// 개발 환경에서 서비스 거래 상세의 상태·반응형·처리 모달을 확인하기 위한 데이터다.
// 실제 API 호출이나 거래 상태 변경 없이 화면 표현만 검토한다.
const PREVIEW_TRADE = {
  tradeId: 1,
  serviceRequestId: 1,
  serviceRequestTitle: '이사 전 입주 청소 서비스를 요청합니다',
  quoteSummary: '정민 제공자 · 입주 청소 · 3시간',
  serviceAddressLabel: '(04158) 서울특별시 마포구 마포대로 122, 101호',
  tradeAmountLabel: '120,000P',
  scheduleLabel: '2026. 08. 10. 14:00',
  escrowStatusLabel: '보관금이 안전하게 예치되어 있습니다.',
  tradeStatusCode: 'TRDC0003',
  viewerRole: 'PROVIDER',
  chatRoomStatus: 'ACTIVE',
  chatAvailable: true,
  availableActions: [
    'REQUEST_COMPLETION',
    'REQUEST_SCHEDULE_CHANGE',
    'REQUEST_SCHEDULE_CANCELLATION',
    'SUBMIT_DISPUTE',
  ],
};

const PREVIEW_SCHEDULE_HISTORY = [
  {
    id: 'admin-refund',
    eventType: 'ADMIN_REFUND',
    occurredAt: '2026. 08. 06. 16:10',
    reason: '관리자 판정에 따라 보관금이 환불되어 거래가 취소되었습니다.',
    actorRole: 'ADMIN',
  },
  {
    id: 'settlement-completed',
    eventType: 'SETTLEMENT_COMPLETED',
    occurredAt: '2026. 08. 06. 12:00',
    reason: '거래가 완료되어 정산이 완료되었습니다.',
  },
  {
    id: 'completion-requested',
    eventType: 'COMPLETION_REQUESTED',
    occurredAt: '2026. 08. 06. 09:30',
    reason: '서비스 완료 요청이 등록되어 의뢰자 확인을 기다립니다.',
    actorRole: 'PROVIDER',
  },
  {
    id: 'dispute-reported',
    eventType: 'DISPUTE_REPORTED',
    occurredAt: '2026. 08. 05. 15:20',
    reason: '거래 문제가 접수되어 거래와 정산이 보류되었습니다.',
    actorRole: 'REQUESTER',
  },
  {
    id: 'escrow-held',
    eventType: 'ESCROW_HELD',
    occurredAt: '2026. 08. 04. 10:00',
    reason: '선택 견적이 확정되어 보관금이 예치되었습니다.',
  },
  {
    id: 'created',
    eventType: 'CHANGE',
    occurredAt: '2026. 08. 03. 10:30',
    reason: '오후 일정으로 변경을 요청했습니다.',
    actorRole: 'PROVIDER',
  },
];

const PREVIEW_DISPUTE_TYPES = [
  { code: 'TRDG0401', label: '서비스 내용 불일치' },
  { code: 'TRDG0402', label: '일정 문제' },
];

const resolvePreviewAction = () => Promise.resolve();

export default function ServiceTradeDetailPreviewPage() {
  const { tradeId } = useParams();
  const resolvedTradeId = Number(tradeId) || PREVIEW_TRADE.tradeId;

  return (
    <ServiceTradeDetailPage
      trade={{ ...PREVIEW_TRADE, tradeId: resolvedTradeId }}
      disputeTypes={PREVIEW_DISPUTE_TYPES}
      scheduleHistory={PREVIEW_SCHEDULE_HISTORY}
      onSubmitDispute={resolvePreviewAction}
      onRequestCompletion={resolvePreviewAction}
      onRequestScheduleChange={resolvePreviewAction}
      onRequestScheduleCancellation={resolvePreviewAction}
    />
  );
}
