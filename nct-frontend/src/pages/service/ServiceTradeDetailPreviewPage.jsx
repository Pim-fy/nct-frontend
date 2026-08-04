import { useParams } from 'react-router-dom';
import ServiceTradeDetailPage from './ServiceTradeDetailPage';

// 개발 환경에서 서비스 거래 상세 화면의 상태·반응형 구성을 확인하기 위한 데이터다.
// 정식 조회 계약이 연결되면 실제 API 응답 어댑터로 교체한다.
const PREVIEW_TRADE = {
  tradeId: 1,
  serviceRequestId: 1,
  serviceRequestTitle: '이사 전 청소 서비스를 요청합니다',
  quoteSummary: '정민 제공자 · 입주 청소 · 3시간',
  tradeAmountLabel: '120,000P',
  scheduleLabel: '2026. 08. 05. 14:00',
  escrowStatusLabel: '보관금이 안전하게 예치되어 있습니다.',
  tradeStatusCode: 'TRDC0003',
  viewerRole: 'PROVIDER',
  availableActions: [
    'REQUEST_COMPLETION',
    'REQUEST_SCHEDULE_CHANGE',
    'REQUEST_SCHEDULE_CANCELLATION',
    'SUBMIT_DISPUTE',
  ],
};

const PREVIEW_SCHEDULE_HISTORY = [
  {
    id: 'created',
    title: '서비스 일정 확정',
    occurredAt: '2026. 08. 03. 10:30',
    reason: '의뢰자와 제공자가 일정을 확인했습니다.',
  },
];

const PREVIEW_DISPUTE_TYPES = [
  { code: 'DISPUTE_SERVICE', label: '서비스 내용 불일치' },
  { code: 'DISPUTE_SCHEDULE', label: '일정 문제' },
];

const resolvePreviewAction = () => Promise.resolve();

export default function ServiceTradeDetailPreviewPage() {
  const { tradeId } = useParams();

  return (
    <ServiceTradeDetailPage
      trade={{ ...PREVIEW_TRADE, tradeId: Number(tradeId) || PREVIEW_TRADE.tradeId }}
      disputeTypes={PREVIEW_DISPUTE_TYPES}
      scheduleHistory={PREVIEW_SCHEDULE_HISTORY}
      onSubmitDispute={resolvePreviewAction}
      onRequestCompletion={resolvePreviewAction}
      onRequestScheduleChange={resolvePreviewAction}
      onRequestScheduleCancellation={resolvePreviewAction}
    />
  );
}
