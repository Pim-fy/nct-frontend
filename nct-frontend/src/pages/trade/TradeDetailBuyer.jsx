import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import Toast from '@components/common/Toast';
import {
  getTradeDetail,
  requestTradeCompletion,
} from '@api/tradeApi';
import { toTradeDetail } from '@api/tradeAdapter';
import '@assets/css/trade-detail.css';

// 상태 코드표가 확정되기 전까지는 이미 합의된 화면 문구만 제한적으로 표시한다.
const statusInfo = {
  IN_PROGRESS: {
    label: '거래 진행 중',
    description: '물건 또는 직거래 진행 상태를 확인해 주세요.',
    step: 0,
    className: 'trade-status--progress',
  },
  DELIVERING: {
    label: '거래 진행 중',
    description: '물건 또는 직거래 진행 상태를 확인해 주세요.',
    step: 0,
    className: 'trade-status--progress',
  },
  CONFIRM_PENDING: {
    label: '상대 확인 대기',
    description: '완료 확인 요청을 보냈습니다. 상대방 확인 또는 무이의 5일 경과 후 거래가 완료됩니다.',
    step: 1,
    className: 'trade-status--pending',
  },
  WAITING_CONFIRMATION: {
    label: '상대 확인 대기',
    description: '완료 확인 요청을 보냈습니다. 상대방 확인 또는 무이의 5일 경과 후 거래가 완료됩니다.',
    step: 1,
    className: 'trade-status--pending',
  },
  COMPLETED: {
    label: '거래 완료',
    description: '거래가 정상적으로 완료되었습니다.',
    step: 2,
    className: 'trade-status--complete',
  },
  ON_HOLD: {
    label: '거래 보류',
    description: '거래 문제를 확인하는 동안 거래와 정산이 보류됩니다.',
    step: -1,
    className: 'trade-status--problem',
  },
  CANCELED: {
    label: '거래 취소',
    description: '취소된 거래입니다. 거래 내역에서 취소 사유를 확인해 주세요.',
    step: -1,
    className: 'trade-status--canceled',
  },
};

const unknownStatus = {
  label: '상태 확인 필요',
  description: '거래 상태 코드는 API 계약이 확정된 뒤 표시합니다.',
  step: -1,
  className: 'trade-status--pending',
};

const TradeDetailBuyer = () => {
  const { tradeId } = useParams();
  const [trade, setTrade] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [completionAgreed, setCompletionAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  // URL의 거래 번호로 서버 상세를 조회해 직접 URL 접근에도 같은 데이터를 표시한다.
  const loadTrade = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await getTradeDetail(tradeId);

      const detail = toTradeDetail(response);

      setTrade(detail);
    } catch {
      setLoadError('거래 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [tradeId]);

  // 거래 번호가 바뀌면 렌더링 완료 뒤에 해당 거래의 상세를 다시 조회한다.
  useEffect(() => {
    const requestTimer = window.setTimeout(loadTrade, 0);

    return () => window.clearTimeout(requestTimer);
  }, [loadTrade]);

  const currentStatus = statusInfo[trade?.status] ?? unknownStatus;
  const isInProgress = currentStatus.step === 0;
  const hasMeetingSchedule = (
    trade?.meetingDate !== '-'
    && trade?.meetingTime !== '-'
    && trade?.meetingPlace !== '-'
  );

  // 거래 완료 동의와 진행 중 상태가 모두 충족될 때만 완료 요청을 허용한다.
  const canRequestCompletion = () => {
    if (!isInProgress) {
      return false;
    }

    return completionAgreed;
  };

  // 완료 요청 성공 후에만 화면 상태를 대기 상태로 바꿔 서버 상태와 화면을 맞춘다.
  const handleCompletionRequest = async () => {
    if (!canRequestCompletion()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestTradeCompletion(tradeId);

      // 서버가 계산한 자동완료 시각까지 다시 반영해 브라우저 시간과 어긋나지 않게 한다.
      setTrade(toTradeDetail(response));
      setCompletionAgreed(false);
      setNotice('거래 완료 확인 요청을 보냈습니다.');
    } catch {
      setNotice('거래 완료 확인 요청에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || loadError || !trade) {
    return (
      <div className="trade-detail-page trade-detail-page--buyer">
        <main className="container trade-detail-page__state">
          <section className="trade-detail-card" role={loadError ? 'alert' : 'status'}>
            <h1>{loadError ? '거래 정보를 불러오지 못했습니다.' : '거래 정보를 불러오는 중입니다.'}</h1>
            {loadError && (
              <button className="btn btn-outline" type="button" onClick={loadTrade}>
                다시 시도
              </button>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="trade-detail-page trade-detail-page--buyer">
      <div className="container">
        <header className="trade-detail-page__header">
          <div>
            <h1>거래 상세</h1>
            <p>
              물건 거래 · {trade.method === 'DELIVERY' ? '배송 거래' : '직거래'}
            </p>
          </div>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => window.history.back()}
          >
            ← 목록으로
          </button>
        </header>

        <ol className="trade-progress" aria-label="거래 진행 단계">
          {['배송·직거래중', '상대 확인 대기', '완료'].map((step, index) => (
            <li
              className={`trade-progress__item ${
                currentStatus.step === index ? 'trade-progress__item--active' : ''
              }`}
              key={step}
            >
              {step}
            </li>
          ))}
        </ol>

        <div className="trade-detail-grid">
          <section className="trade-detail-card">
            <h2>상품 정보</h2>
            <div className="trade-product">
              <div className="trade-product__image" aria-label="상품 이미지 준비 중">
                상품 이미지
              </div>
              <div>
                <strong>{trade.productName}</strong>
                <p>
                  낙찰가 {trade.price}
                  <span className="badge badge-gray">
                    {trade.method === 'DELIVERY' ? '배송' : '직거래'}
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section className="trade-detail-card">
            <h2>상대방 정보</h2>
            <p>닉네임 {trade.counterpart} · 별점 ★{trade.rating}</p>
            <div className="trade-trust">
              리뷰와 신뢰지표는 거래 완료 후 조회 계약에 연결됩니다.
            </div>
          </section>

          {/* 거래 방식에 따라 배송 정보와 직거래 정보를 동시에 노출하지 않는다. */}
          {trade.method === 'DELIVERY' ? (
            <section className="trade-detail-card">
              <h2>배송 정보</h2>
              <p>배송지: {trade.deliveryAddress}</p>
              <p>
                {trade.deliveryMessage}
                <span className="badge badge-blue">배송 정보</span>
              </p>
              <p className="trade-detail-card__muted">
                배송지와 배송 메모는 거래 시점에 고정된 정보입니다.
              </p>
            </section>
          ) : (
            <section className="trade-detail-card">
              <h2>직거래 정보</h2>
              {hasMeetingSchedule ? (
                <dl className="trade-meeting-summary">
                  <div>
                    <dt>거래 일시</dt>
                    <dd>{trade.meetingDate} {trade.meetingTime}</dd>
                  </div>
                  <div>
                    <dt>거래 장소</dt>
                    <dd>{trade.meetingPlace}</dd>
                  </div>
                  {trade.meetingAddress !== '-' && (
                    <div className="trade-meeting-summary__memo">
                      <dt>상세 주소</dt>
                      <dd>{trade.meetingAddress}</dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p>판매자가 제안한 거래 일시와 장소를 확인해 주세요.</p>
              )}
            </section>
          )}

          <section className="trade-detail-card">
            <h2>거래 상태</h2>
            <p>
              <span className={`trade-status ${currentStatus.className}`}>
                {currentStatus.label}
              </span>
            </p>
            <p>{currentStatus.description}</p>
          </section>
        </div>

        {trade.method === 'OFFLINE' && (
          <section className="trade-detail-card trade-complete-card">
            <h2>직거래 일정 확인</h2>
            <div className="trade-auto-complete">
              <strong>{hasMeetingSchedule ? '일정 제안 완료' : '판매자 제안 대기'}</strong>
              <p>
                {hasMeetingSchedule
                  ? '판매자가 저장한 일정과 장소입니다. 거래를 진행해 주세요.'
                  : '판매자가 거래 일시와 장소를 저장하면 이곳에 표시됩니다.'}
              </p>
            </div>
            <div className="trade-detail-actions">
              <Link className="btn btn-outline" to={`/trades/${trade.id}/chat`}>
                거래 채팅
              </Link>
            </div>
          </section>
        )}

        <section className="trade-detail-card trade-complete-card">
          <h2>거래 완료 확인</h2>
          <div className="trade-auto-complete">
            <strong>
              {isInProgress ? '완료 확인 요청 전' : currentStatus.label}
            </strong>
            <p>
              {trade.autoCompleteAt !== '-'
                ? `${trade.autoCompleteAt} 이후 상대 확인이나 거래 문제 접수가 없으면 자동 완료됩니다.`
                : '거래가 완료되었다면 상대방에게 완료 확인을 요청할 수 있습니다.'}
            </p>
          </div>

          {/* 완료 요청 전 단계에서만 구매자의 완료 동의를 받는다. */}
          {isInProgress && (
            <>
              <label className="trade-complete-card__check">
                <input
                  type="checkbox"
                  checked={completionAgreed}
                  onChange={(event) => setCompletionAgreed(event.target.checked)}
                />
                거래가 완료되었음을 확인합니다
              </label>
              <p className="trade-detail-card__muted">
                확인 요청 이후에는 상대방의 확인 또는 무이의 기간 경과가 필요합니다.
              </p>
            </>
          )}

          <div className="trade-detail-actions">
            {isInProgress && (
              <button
                className="btn btn-primary"
                type="button"
                disabled={!canRequestCompletion() || isSubmitting}
                onClick={handleCompletionRequest}
              >
                {isSubmitting ? '요청 중...' : '거래 완료 확인'}
              </button>
            )}
          </div>
        </section>
      </div>

      {notice && <Toast message={notice} onClose={() => setNotice('')} />}
    </div>
  );
};

export default TradeDetailBuyer;
