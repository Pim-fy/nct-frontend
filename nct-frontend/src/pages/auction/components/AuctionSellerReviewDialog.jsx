import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, X } from 'lucide-react';
import { getUserReviews } from '@api/reviewApi';
import Pagination from '@components/common/Pagination';

const PAGE_SIZE = 5;

const AuctionSellerReviewDialog = ({
  isOpen,
  sellerId,
  sellerName,
  onClose,
}) => {
  const [page, setPage] = useState(1);
  const closeButtonRef = useRef(null);
  const numericSellerId = Number(sellerId);
  const hasSellerId = Number.isSafeInteger(numericSellerId) && numericSellerId > 0;
  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'seller-auction', numericSellerId, 'all', page - 1, PAGE_SIZE],
    queryFn: () => getUserReviews(numericSellerId, {
      page: page - 1,
      size: PAGE_SIZE,
    }).then((response) => response?.data ?? response),
    enabled: Boolean(isOpen && hasSellerId),
  });

  const reviews = reviewsQuery.data?.content ?? [];
  const totalCount = Number(reviewsQuery.data?.totalCount ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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

  useEffect(() => {
    if (!reviewsQuery.isSuccess || page <= totalPages) return undefined;

    const pageFrameId = window.requestAnimationFrame(() => setPage(totalPages));
    return () => window.cancelAnimationFrame(pageFrameId);
  }, [page, reviewsQuery.isSuccess, totalPages]);

  if (!isOpen) return null;

  return (
    <div
      aria-labelledby="auction-seller-review-title"
      aria-modal="true"
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="flex max-h-[min(760px,90dvh)] w-full max-w-[680px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_18px_54px_rgba(0,0,0,0.22)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-[#ececec] px-5 md:px-6">
          <div className="min-w-0">
            <h2 className="m-0 truncate text-body-lg font-bold text-[#1d1d1f]" id="auction-seller-review-title">
              {sellerName || '판매자'}님의 받은 리뷰
            </h2>
            {!reviewsQuery.isLoading && !reviewsQuery.isError && (
              <p className="mt-1 mb-0 text-caption text-[#777]">받은 리뷰 {totalCount.toLocaleString('ko-KR')}건</p>
            )}
          </div>
          <button
            ref={closeButtonRef}
            aria-label="판매자 리뷰 닫기"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#d9d9d9] bg-white text-[#555] hover:border-primary hover:text-primary"
            title="닫기"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {reviewsQuery.isLoading && (
            <div className="space-y-3" aria-label="판매자 리뷰를 불러오는 중">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="h-28 animate-pulse rounded-lg bg-[#f3f5f8]" key={index} />
              ))}
            </div>
          )}

          {reviewsQuery.isError && (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <p className="m-0 text-body-sm text-[#b42318]">판매자 리뷰를 불러오지 못했습니다.</p>
                <button
                  className="mt-3 cursor-pointer rounded-lg border border-[#d9d9d9] bg-white px-4 py-2 text-caption font-bold text-[#444] hover:border-primary hover:text-primary"
                  type="button"
                  onClick={() => reviewsQuery.refetch()}
                >
                  다시 불러오기
                </button>
              </div>
            </div>
          )}

          {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length === 0 && (
            <p className="m-0 grid min-h-64 place-items-center text-center text-body-sm text-[#777]">
              아직 받은 리뷰가 없습니다.
            </p>
          )}

          {!reviewsQuery.isLoading && !reviewsQuery.isError && reviews.length > 0 && (
            <>
              <ul className="m-0 list-none divide-y divide-[#eceef1] p-0">
                {reviews.map((review) => (
                  <li className="py-5 first:pt-0" key={review.reviewId}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong
                          aria-label={`평점 ${review.rating}점`}
                          className="inline-flex items-center gap-1 text-body-sm text-[#d97706]"
                        >
                          <Star aria-hidden="true" fill="currentColor" size={17} />
                          {review.rating} / 5
                        </strong>
                        <span className="rounded bg-[#f1f4f8] px-2 py-1 text-caption font-semibold text-[#667085]">
                          {review.dealType === 'service' ? '서비스 거래' : '물건 거래'}
                        </span>
                      </div>
                      <span className="text-caption text-[#888]">{review.createdDate}</span>
                    </div>
                    {review.productTitle && (
                      <p className="mt-2 mb-0 text-body-sm font-semibold text-[#555]">{review.productTitle}</p>
                    )}
                    <p className="mt-2 mb-0 break-words text-body-md leading-7 text-[#1d1d1f]">
                      {review.content || '작성된 리뷰 내용이 없습니다.'}
                    </p>
                    <p className="mt-2 mb-0 text-caption text-[#888]">{review.reviewerName || '구매자'}</p>
                  </li>
                ))}
              </ul>
              <Pagination
                ariaLabel="판매자 리뷰 페이지"
                className="mb-0"
                disabled={reviewsQuery.isFetching}
                maxVisiblePages={5}
                page={page}
                showSinglePage
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default AuctionSellerReviewDialog;
