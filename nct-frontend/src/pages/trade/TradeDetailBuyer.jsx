import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import Toast from '@components/common/Toast';
import {
  getTradeDetail,
  requestTradeCompletion,
} from '@api/tradeApi';
import { getDeliveryProofBlob } from '@api/fileApi';
import { toTradeDetail } from '@api/tradeAdapter';
import TradeTrustSummary from '@components/trade/TradeTrustSummary';
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
    label: '판매자 확인 대기',
    description: '판매자의 완료 확인 또는 무이의 기간 경과 후 거래가 완료됩니다.',
    step: 1,
    className: 'trade-status--pending',
  },
  WAITING_CONFIRMATION: {
    label: '판매자 확인 대기',
    description: '판매자의 완료 확인 또는 무이의 기간 경과 후 거래가 완료됩니다.',
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

const TradeDetailBuyer = ({
  embedded = false,
  tradeId: selectedTradeId,
  onBack,
  onOpenChat,
}) => {
  const { tradeId: routeTradeId } = useParams();
  const tradeId = selectedTradeId ?? routeTradeId;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [trade, setTrade] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [completionAgreed, setCompletionAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [deliveryProofUrls, setDeliveryProofUrls] = useState([]);
  const [selectedDeliveryProofIndex, setSelectedDeliveryProofIndex] = useState(null);
  const [isCompletionResultOpen, setIsCompletionResultOpen] = useState(false);
  const isPreview = pathname.startsWith('/trades/preview');
  const chatPath = isPreview
    ? `/trades/preview/${tradeId}/chat?from=buyer`
    : `/trades/${tradeId}/chat?from=buyer`;

  // 마이페이지에서 진입한 상세는 브라우저 이력 대신 거래내역 탭으로 명확하게 복귀한다.
  const handleBackToList = () => {
    if (embedded && onBack) {
      onBack();
      return;
    }

    if (searchParams.get('from') === 'mypage') {
      const returnSection = searchParams.get('section');
      const myPageSection = returnSection === 'auction-bids'
        ? 'auction-bids'
        : 'auction-bids';
      const myPagePath = pathname.startsWith('/trades/preview')
        ? `/user/mypage/preview/trades?verify=1&section=${myPageSection}`
        : `/user/mypage?section=${myPageSection}`;

      navigate(myPagePath);
      return;
    }

    navigate(isPreview
      ? '/user/mypage/preview/trades?verify=1&section=auction-bids'
      : '/user/mypage?section=auction-bids');
  };

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

  // 보호된 배송 사진은 axios 요청으로 Blob을 받아, 브라우저가 인증 쿠키를 빠뜨리지 않게 표시한다.
  useEffect(() => {
    if (!trade?.deliveryId || !trade.deliveryProofFiles.length) {
      setDeliveryProofUrls([]);
      setSelectedDeliveryProofIndex(null);
      return undefined;
    }

    let isActive = true;
    const objectUrls = [];

    const loadDeliveryProofs = async () => {
      try {
        const files = await Promise.all(trade.deliveryProofFiles.map(async (file) => {
          const response = await getDeliveryProofBlob(trade.deliveryId, file.fileId);
          const objectUrl = URL.createObjectURL(response.data);

          objectUrls.push(objectUrl);
          return {
            ...file,
            objectUrl,
          };
        }));

        if (isActive) {
          setDeliveryProofUrls(files);
        }
      } catch {
        if (isActive) {
          setDeliveryProofUrls([]);
        }
      }
    };

    loadDeliveryProofs();

    return () => {
      isActive = false;
      objectUrls.forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    };
  }, [trade?.deliveryId, trade?.deliveryProofFiles]);

  const currentStatus = trade?.method === 'OFFLINE' && trade?.status === 'DELIVERING'
    ? {
      ...statusInfo.DELIVERING,
      label: '직거래 중',
      description: '판매자가 제안한 일정과 장소에서 직거래를 진행해 주세요.',
    }
    : statusInfo[trade?.status] ?? unknownStatus;
  const selectedDeliveryProof = selectedDeliveryProofIndex === null
    ? null
    : deliveryProofUrls[selectedDeliveryProofIndex] ?? null;
  const isInProgress = currentStatus.step === 0;
  // 구매자는 진행 중 첫 확인을 시작하거나, 판매자가 먼저 요청한 확인에 응답할 수 있다.
  const canRequestBuyerCompletion = (
    isInProgress
    || (
      ['CONFIRM_PENDING', 'WAITING_CONFIRMATION'].includes(trade?.status)
      && trade?.completionRequestedBy === 'SELLER'
    )
  );
  const hasMeetingSchedule = (
    trade?.meetingDate !== '-'
    && trade?.meetingTime !== '-'
    && trade?.meetingPlace !== '-'
  );
  // 직거래는 판매자 일정이 확정된 뒤에만 실제 만남과 완료 확인이 가능하다.
  const isOfflineSchedulePending = (
    trade?.method === 'OFFLINE'
    && !hasMeetingSchedule
  );

  // 거래 완료 동의와 본인 확인 순서가 모두 충족될 때만 완료 요청을 허용한다.
  const canRequestCompletion = () => {
    if (!canRequestBuyerCompletion) {
      return false;
    }

    return completionAgreed && !isOfflineSchedulePending;
  };

  // 완료 요청 성공 후에만 화면 상태를 대기 상태로 바꿔 서버 상태와 화면을 맞춘다.
  const handleCompletionRequest = async () => {
    if (!canRequestCompletion()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestTradeCompletion(tradeId, 'BUYER');
      const updatedTrade = toTradeDetail(response);

      // 서버가 계산한 자동완료 시각까지 다시 반영해 브라우저 시간과 어긋나지 않게 한다.
      setTrade(updatedTrade);
      setCompletionAgreed(false);
      setIsCompletionResultOpen(true);
      setNotice(
        updatedTrade.status === 'COMPLETED'
          ? '판매자와 구매자의 완료 확인이 모두 끝나 거래가 완료되었습니다.'
          : '거래 완료 확인을 보냈습니다. 판매자의 확인을 기다려 주세요.',
      );
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
            onClick={handleBackToList}
          >
            ← 목록으로
          </button>
        </header>

        <ol className="trade-progress" aria-label="거래 진행 단계">
          {['배송·직거래중', '판매자 확인 대기', '완료'].map((step, index) => (
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
            <p>닉네임 {trade.counterpart}</p>
            <TradeTrustSummary counterpartUserId={trade.counterpartUserId} />
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
              {deliveryProofUrls.length > 0 && (
                <div className="trade-delivery-proof-gallery">
                  <strong>판매자 발송 인증사진</strong>
                  <div>
                    {deliveryProofUrls.map((file, index) => (
                      <button
                        className="trade-delivery-proof-gallery__item"
                        key={file.fileId}
                        type="button"
                        onClick={() => setSelectedDeliveryProofIndex(index)}
                      >
                        <img
                          src={file.objectUrl}
                          alt={`판매자 발송 인증 사진 ${index + 1} 크게 보기`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
            {hasMeetingSchedule && (
              <div className="trade-detail-actions">
                {onOpenChat ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => onOpenChat(tradeId)}
                  >
                    {trade.status === 'COMPLETED' ? '거래 채팅 기록 보기' : '거래 채팅'}
                  </button>
                ) : (
                  <Link className="btn btn-outline" to={chatPath}>
                    {trade.status === 'COMPLETED' ? '거래 채팅 기록 보기' : '거래 채팅'}
                  </Link>
                )}
              </div>
            )}
          </section>
        )}

        {!isOfflineSchedulePending && (
          <section className="trade-detail-card trade-complete-card">
            <h2>거래 완료 확인</h2>
            <div className="trade-auto-complete">
              <strong>
                {trade.status === 'COMPLETED'
                  ? '거래 완료'
                  : '판매자 확인 대기'}
              </strong>
              <p>
                {trade.autoCompleteAt !== '-'
                  ? `${trade.autoCompleteAt}까지 양쪽 확인이 완료되지 않으면 자동 완료됩니다.`
                  : '거래가 완료되었다면 판매자와 서로 완료 확인을 진행해 주세요.'}
              </p>
            </div>

            {/* 첫 요청 또는 판매자 요청에 대한 응답일 때만 구매자의 완료 동의를 받는다. */}
            {canRequestBuyerCompletion && (
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
              {canRequestBuyerCompletion && (
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
        )}
      </div>

      {selectedDeliveryProof && (
        <div
          className="trade-modal"
          role="dialog"
          aria-modal="true"
          aria-label="발송 인증 사진 크게 보기"
        >
          <div className="trade-modal__content trade-image-modal">
            <div className="trade-modal__header">
              <h2>발송 인증 사진</h2>
              <button
                className="trade-modal__close"
                type="button"
                onClick={() => setSelectedDeliveryProofIndex(null)}
                aria-label="사진 크게 보기 닫기"
              >
                ×
              </button>
            </div>
            <img
              src={selectedDeliveryProof.objectUrl}
              alt="판매자 발송 인증 사진 크게 보기"
            />
            {deliveryProofUrls.length > 1 && (
              <div className="trade-image-modal__navigation">
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => setSelectedDeliveryProofIndex((currentIndex) => (
                    currentIndex === 0
                      ? deliveryProofUrls.length - 1
                      : currentIndex - 1
                  ))}
                >
                  ← 이전 사진
                </button>
                <span>
                  {selectedDeliveryProofIndex + 1} / {deliveryProofUrls.length}
                </span>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => setSelectedDeliveryProofIndex((currentIndex) => (
                    currentIndex === deliveryProofUrls.length - 1
                      ? 0
                      : currentIndex + 1
                  ))}
                >
                  다음 사진 →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isCompletionResultOpen && (
        <div
          className="trade-modal"
          role="dialog"
          aria-modal="true"
          aria-label="거래 완료 확인 요청 안내"
        >
          <div className="trade-modal__content">
            <div className="trade-modal__header">
              <h2>완료 확인 요청을 보냈습니다</h2>
              <button
                className="trade-modal__close"
                type="button"
                onClick={() => setIsCompletionResultOpen(false)}
                aria-label="완료 확인 요청 안내 닫기"
              >
                ×
              </button>
            </div>
            <p>
              판매자 확인 또는 무이의 기간 경과 후 거래가 완료됩니다.
              현재 거래 상태는 판매자 확인 대기입니다.
            </p>
            <div className="trade-modal__actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => setIsCompletionResultOpen(false)}
              >
                거래 상세에서 확인
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && <Toast message={notice} onClose={() => setNotice('')} />}
    </div>
  );
};

export default TradeDetailBuyer;
