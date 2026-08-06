import { useParams } from 'react-router-dom';
import {
  getServiceTradePreview,
  SERVICE_TRADE_PREVIEW_DISPUTE_TYPES,
} from '@/mocks/serviceTradePreviewData';
import ServiceTradeDetailPage from './ServiceTradeDetailPage';

const resolvePreviewAction = () => Promise.resolve();

export default function ServiceTradeDetailPreviewPage() {
  const { tradeId: tradeIdParam } = useParams();
  const tradeId = Number(tradeIdParam);
  const trade = getServiceTradePreview(tradeId);

  if (!trade) {
    return (
      <main className="service-trade-detail-page">
        <section className="container service-trade-detail-page__empty">
          <h1>서비스 거래 미리보기</h1>
          <p>확인할 수 있는 미리보기 거래번호는 91, 92입니다.</p>
        </section>
      </main>
    );
  }

  return (
    <ServiceTradeDetailPage
      disputeTypes={SERVICE_TRADE_PREVIEW_DISPUTE_TYPES}
      onConfirmCompletion={resolvePreviewAction}
      onRequestCompletion={resolvePreviewAction}
      onRequestScheduleCancellation={resolvePreviewAction}
      onRequestScheduleChange={resolvePreviewAction}
      onSubmitDispute={resolvePreviewAction}
      scheduleHistory={trade.scheduleHistory ?? []}
      trade={trade}
    />
  );
}
