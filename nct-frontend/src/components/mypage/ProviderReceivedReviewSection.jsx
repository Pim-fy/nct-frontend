import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserReviews } from '@api/reviewApi';
import Pagination from '@components/common/Pagination';
import MyPageContentHeader from '@components/mypage/MyPageContentHeader';
import { useMyProviderProfile } from '@hooks/useProviderProfile';

const PAGE_SIZE = 10;

/**
 * 담당자 7 · F-PROV-009/REQ-COM-012: 제공자가 받은 서비스 리뷰 전체 목록입니다.
 * 물건 거래 리뷰와 섞지 않고 기존 리뷰 조회 계약의 dealType=service만 소비합니다.
 */
export default function ProviderReceivedReviewSection() {
  const [page, setPage] = useState(1);
  const profileQuery = useMyProviderProfile();
  const providerUserSn = Number(profileQuery.data?.userSn);
  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'received', providerUserSn, 'service', page - 1, PAGE_SIZE],
    queryFn: () => getUserReviews(providerUserSn, {
      dealType: 'service',
      page: page - 1,
      size: PAGE_SIZE,
    }).then((response) => response?.data ?? response),
    enabled: Number.isSafeInteger(providerUserSn) && providerUserSn > 0,
  });

  const reviews = reviewsQuery.data?.content ?? [];
  const totalCount = Number(reviewsQuery.data?.totalCount ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const isLoading = profileQuery.isLoading || reviewsQuery.isLoading;
  const isError = profileQuery.isError || reviewsQuery.isError;

  useEffect(() => {
    if (!reviewsQuery.isSuccess || page <= totalPages) return undefined;

    const animationFrameId = window.requestAnimationFrame(() => setPage(totalPages));
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [page, reviewsQuery.isSuccess, totalPages]);

  const retry = () => {
    if (profileQuery.isError) {
      profileQuery.refetch();
      return;
    }
    reviewsQuery.refetch();
  };

  return (
    <section className="w-full" aria-labelledby="provider-received-review-title">
      <MyPageContentHeader title="받은 리뷰" />

      <div className="min-h-[360px] rounded-[15px] border border-[rgba(0,0,0,0.11)] bg-white">
        <div className="flex min-h-[60px] items-center justify-between gap-4 border-b border-[#e5e5e5] bg-[rgba(0,100,255,0.05)] px-5">
          <div>
            <h2 id="provider-received-review-title" className="text-[18px] font-bold text-[#3a3a3a]">
              서비스 이용자가 남긴 리뷰
            </h2>
            <p className="mt-1 text-sm text-[#6b7788]">서비스 거래 리뷰만 최신순으로 표시합니다.</p>
          </div>
          {!isLoading && !isError && (
            <span className="shrink-0 text-sm font-semibold text-[#0064ff]">{totalCount}건</span>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3 p-6" aria-label="받은 리뷰를 불러오는 중">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-xl bg-[#f3f6fa]" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex min-h-[299px] flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-[15px] text-[#b42318]">받은 리뷰를 불러오지 못했습니다.</p>
            <button
              type="button"
              className="text-sm font-semibold text-[#0064ff] hover:underline"
              onClick={retry}
            >
              다시 불러오기
            </button>
          </div>
        )}

        {!isLoading && !isError && reviews.length === 0 && (
          <div className="flex min-h-[299px] items-center justify-center px-6 text-center">
            <p className="text-[15px] text-[#6b7788]">아직 받은 서비스 리뷰가 없습니다.</p>
          </div>
        )}

        {!isLoading && !isError && reviews.length > 0 && (
          <>
            <ul className="divide-y divide-[#edf0f4] px-6">
              {reviews.map((review) => (
                <li key={review.reviewId} className="py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-[15px] text-[#f59e0b]" aria-label={`평점 ${review.rating}점`}>
                      ★ {review.rating}
                    </strong>
                    <span className="text-sm text-[#8a96a8]">{review.createdDate}</span>
                  </div>
                  {review.productTitle && (
                    <p className="mt-2 text-sm font-semibold text-[#637085]">{review.productTitle}</p>
                  )}
                  <p className="mt-2 break-words text-[15px] leading-7 text-[#27364b]">{review.content}</p>
                  <p className="mt-2 text-sm text-[#8a96a8]">{review.reviewerName}</p>
                </li>
              ))}
            </ul>
            <Pagination
              maxVisiblePages={5}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              showSinglePage
            />
          </>
        )}
      </div>
    </section>
  );
}
