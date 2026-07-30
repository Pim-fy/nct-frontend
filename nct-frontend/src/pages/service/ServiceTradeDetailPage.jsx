import { Link } from 'react-router-dom';
import {
  getServiceTradeStatus,
  SERVICE_TRADE_STEPS,
} from './serviceTradeStatus';
import '@assets/css/service-trade-detail.css';

// 담당자4 서비스 거래 상세의 표현 전용 화면이다.
// 조회·완료·분쟁 API와 공통 route는 계약 확정 뒤 연결한다.
export default function ServiceTradeDetailPage({ trade = null }) {
  if (!trade) {
    return (
      <main className="service-trade-detail-page">
        <section className="container service-trade-detail-page__empty">
          <h1>서비스 거래 상세</h1>
          <p>서비스 거래 API 계약이 연결되면 거래 정보를 표시합니다.</p>
        </section>
      </main>
    );
  }

  const status = getServiceTradeStatus(trade.tradeStatusCode);
  const isRequester = trade.viewerRole === 'REQUESTER';
  const isProvider = trade.viewerRole === 'PROVIDER';
  const canRequestCompletion = isProvider && trade.availableActions?.includes('REQUEST_COMPLETION');
  const canConfirmCompletion = isRequester && trade.availableActions?.includes('CONFIRM_COMPLETION');
  const canSubmitDispute = trade.availableActions?.includes('SUBMIT_DISPUTE');

  return (
    <main className="service-trade-detail-page">
      <div className="container">
        <header className="service-trade-detail-page__header">
          <div>
            <p className="service-trade-detail-page__eyebrow">서비스 거래</p>
            <h1>{trade.serviceRequestTitle}</h1>
            <p>{status.description}</p>
          </div>
          <span className={`service-trade-status service-trade-status--${status.tone}`}>
            {status.label}
          </span>
        </header>

        <ol className="service-trade-progress" aria-label="서비스 거래 진행 상태">
          {SERVICE_TRADE_STEPS.map((step, index) => (
            <li
              className={index <= status.step ? 'service-trade-progress__item service-trade-progress__item--active' : 'service-trade-progress__item'}
              key={step}
            >
              {step}
            </li>
          ))}
        </ol>

        <section className="service-trade-detail-grid">
          <article className="service-trade-card">
            <h2>서비스 요청 및 선택 견적</h2>
            <dl className="service-trade-detail-list">
              <div><dt>서비스 요청</dt><dd>{trade.serviceRequestTitle}</dd></div>
              <div><dt>선택 견적</dt><dd>{trade.quoteSummary}</dd></div>
              <div><dt>거래 금액</dt><dd>{trade.tradeAmountLabel}</dd></div>
              <div><dt>서비스 일정</dt><dd>{trade.scheduleLabel ?? '일정 협의 중'}</dd></div>
            </dl>
          </article>

          <aside className="service-trade-card service-trade-card--escrow">
            <h2>서비스 보관금</h2>
            <strong>{trade.tradeAmountLabel}</strong>
            <p>{trade.escrowStatusLabel ?? '보관금 상태를 확인하고 있습니다.'}</p>
          </aside>
        </section>

        <section className="service-trade-card service-trade-card--timeline">
          <h2>거래 이력</h2>
          <p>서비스 거래 API가 연결되면 상태 변경과 일정 이력을 시간순으로 표시합니다.</p>
        </section>

        {(canRequestCompletion || canConfirmCompletion || canSubmitDispute) && (
          <section className="service-trade-detail-actions" aria-label="서비스 거래 처리">
            {canRequestCompletion && <button className="btn btn-success" type="button">완료 요청 작성</button>}
            {canConfirmCompletion && <button className="btn btn-primary" type="button">완료 확인</button>}
            {canSubmitDispute && <button className="btn btn-danger" type="button">거래 문제 접수</button>}
          </section>
        )}

        <div className="service-trade-detail-page__links">
          <Link className="btn btn-ghost" to={`/service-requests/${trade.serviceRequestId}`}>요청 상세</Link>
        </div>
      </div>
    </main>
  );
}
