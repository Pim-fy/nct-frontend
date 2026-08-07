// @ai_generated
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteReview } from '@api/reviewApi';
import { toImageUrl } from '@api/fileApi';
import { reviewQueryKeys, useMyTradeReview } from '@hooks/useReview';
import StarRatingDisplay from '@components/review/StarRatingDisplay';
import { confirm, toast } from '@utils/common';
import AsyncRouteError from '@components/common/AsyncRouteError';

export default function TradeReviewSection({ auctionId, tradeId, isTradeCompleted }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reviewQuery = useMyTradeReview(tradeId);
  const review = reviewQuery.data;

  const handleDelete = async () => {
    const ok = await confirm({
      title: '리뷰를 삭제하시겠습니까?',
      text: '삭제한 리뷰는 복구하거나 다시 작성할 수 없습니다.',
    });
    if (!ok) return;

    try {
      await deleteReview(review.reviewId);
      await queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all });
      toast({ icon: 'success', title: '리뷰가 삭제되었습니다.' });
    } catch (error) {
      toast({
        icon: 'error',
        title: error.response?.data?.message || '리뷰 삭제에 실패했습니다.',
      });
    }
  };

  return (
    <aside className="auction-trade-detail-shell__review" aria-label="거래 리뷰">
      <div className="trade-detail-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-black">거래 리뷰</h2>
            <p className="mt-1 text-sm text-[#666]">이 거래의 상대방에게 남기는 리뷰입니다.</p>
          </div>

          {review?.status === 'WRITABLE' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(`/auction/${auctionId}/trade/review/new`)}
            >
              리뷰 등록
            </button>
          )}

          {review?.status === 'WRITTEN' && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate(`/auction/${auctionId}/trade/review/edit`)}
              >
                수정
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>삭제</button>
            </div>
          )}
        </div>

        {reviewQuery.isLoading && <p className="mt-5 text-[#666]">리뷰 상태를 확인하는 중입니다.</p>}
        {reviewQuery.isError && (
          <AsyncRouteError error={reviewQuery.error} onRetry={() => reviewQuery.refetch()} compact />
        )}

        {review?.status === 'WRITTEN' && (
          <div className="mt-5 border-t border-[#ebebeb] pt-5">
            <StarRatingDisplay rating={review.rating} size={20} />
            <p className="mt-3 whitespace-pre-wrap text-[#333]">{review.content}</p>
            {/* @ai_generated (담당자1, 2026-08-07): 백엔드가 이미 내려주는 photos를 렌더링하지
                않아 마이페이지 목록에서는 보이던 사진이 거래 상세에서는 사라졌었다(P4-7). */}
            {review.photos?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {review.photos.map((photo, index) => (
                  <img
                    key={photo}
                    src={toImageUrl(photo)}
                    alt={`리뷰 첨부 사진 ${index + 1}`}
                    className="size-20 rounded-lg border border-[#ebebeb] object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* @ai_generated (담당자1, 2026-08-07): UNAVAILABLE은 "거래 미완료"와 "삭제 이력
            존재"라는 서로 다른 원인을 하나로 묶은 상태라, 거래 완료 여부로 문구를 구분한다. */}
        {review?.status === 'UNAVAILABLE' && !isTradeCompleted && (
          <p className="mt-5 border-t border-[#ebebeb] pt-5 text-[#666]">
            거래가 완료된 후 리뷰를 작성할 수 있습니다.
          </p>
        )}

        {review?.status === 'UNAVAILABLE' && isTradeCompleted && (
          <p className="mt-5 border-t border-[#ebebeb] pt-5 text-[#666]">
            삭제한 리뷰는 다시 작성하거나 수정할 수 없습니다.
          </p>
        )}
      </div>
    </aside>
  );
}
