import { useEffect, useRef } from 'react';
import { useMyTradeReview } from '@hooks/useReview';
import TradeReviewForm from '@components/trade/TradeReviewForm';
import AsyncRouteError from '@components/common/AsyncRouteError';

/**
 * 서비스 거래 완료(TRDC0006) 후 리뷰 작성·수정 진입용 모달.
 * ServiceTradeDetailPage(담당자4)에서 소비한다.
 *
 * @param {string|number} tradeId  서비스 거래 ID
 * @param {boolean}       isOpen   모달 열림 여부
 * @param {() => void}    onClose  닫기 콜백 (backdrop 클릭 / 닫기 버튼 / ESC)
 * @param {() => void}    onDone   리뷰 등록·수정 완료 콜백 (onClose 자동 포함)
 */
export default function ServiceTradeReviewModal({ tradeId, isOpen, onClose, onDone }) {
  const closeButtonRef = useRef(null);
  const reviewQuery = useMyTradeReview(tradeId);
  const review = reviewQuery.data;
  const isWritten = review?.status === 'WRITTEN';

  useEffect(() => {
    if (!isOpen) return undefined;

    const focusFrameId = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrameId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDone = () => {
    onDone?.();
    onClose?.();
  };

  return (
    <div
      className="service-trade-dialog-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="service-trade-dialog flex flex-col max-h-[min(760px,90dvh)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="svc-review-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="service-trade-dialog__header shrink-0">
          <div>
            <p>서비스 거래</p>
            <h2 id="svc-review-modal-title">{isWritten ? '리뷰 수정' : '리뷰 작성'}</h2>
          </div>
          <button
            ref={closeButtonRef}
            className="service-trade-dialog__close"
            type="button"
            aria-label="리뷰 작성 창 닫기"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {reviewQuery.isLoading && (
            <p className="text-[#666]">리뷰 상태를 확인하는 중입니다.</p>
          )}
          {reviewQuery.isError && (
            <AsyncRouteError
              error={reviewQuery.error}
              onRetry={() => reviewQuery.refetch()}
              compact
            />
          )}
          {!reviewQuery.isLoading && !reviewQuery.isError && (
            <TradeReviewForm
              key={review?.reviewId ?? 'new'}
              tradeId={tradeId}
              review={isWritten ? review : undefined}
              onDone={handleDone}
            />
          )}
        </div>
      </section>
    </div>
  );
}
