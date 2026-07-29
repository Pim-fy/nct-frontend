import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HeartOff, RotateCcw } from 'lucide-react';
import {
  fetchMyFavoriteAuctions,
  removeAuctionFavorite,
} from '@api/auctionApi';
import { AuctionCardSkeleton } from '@components/skeleton/AuctionSkeletons';
import AuctionCard from './components/AuctionCard';
import AuctionToast from './components/AuctionToast';

const PAGE_SIZE = 12;
const MAX_VISIBLE_PAGES = 5;
const PAGINATION_BUTTON_CLASS = 'min-h-10 rounded-lg border border-[#e2e1dc] bg-white px-3.5 text-base leading-[1.4] font-semibold text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45';
const EMPTY_STATE_CLASS = 'grid min-h-[340px] place-content-center justify-items-center gap-2.5 rounded-lg border border-[#f0efec] bg-[#f8f8f6] p-7 text-center';

const getPageNumber = (searchParams) => {
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const getVisiblePages = (currentPage, totalPages) => {
  const visibleCount = Math.min(MAX_VISIBLE_PAGES, totalPages);
  const half = Math.floor(visibleCount / 2);
  const start = Math.min(
    Math.max(currentPage - half, 1),
    Math.max(totalPages - visibleCount + 1, 1),
  );

  return Array.from({ length: visibleCount }, (_, index) => start + index);
};

const AuctionFavoritesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastMessage, setToastMessage] = useState('');
  const queryClient = useQueryClient();
  const page = getPageNumber(searchParams);

  const {
    data: favoritePage,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['auctionFavorites', page, PAGE_SIZE],
    queryFn: () => fetchMyFavoriteAuctions({ page, size: PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
    refetchOnMount: 'always',
  });

  const favoriteItems = favoritePage?.items || [];
  const totalElements = favoritePage?.totalElements || 0;
  const totalPages = favoritePage?.totalPages || 0;
  const visiblePages = useMemo(
    () => getVisiblePages(page, totalPages),
    [page, totalPages],
  );

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const favoriteMutation = useMutation({
    mutationFn: removeAuctionFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auctionFavorites'] });
      queryClient.invalidateQueries({ queryKey: ['auctionFavoriteStatus'] });
      queryClient.invalidateQueries({ queryKey: ['auctionDetail'] });
      setToastMessage('관심 경매에서 삭제했습니다.');

      if (page > 1 && favoriteItems.length === 1) {
        goToPage(page - 1);
      }
    },
    onError: (error) => {
      setToastMessage(
        error.response?.data?.message || '관심 경매를 삭제하지 못했습니다.',
      );
    },
  });

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timer = window.setTimeout(() => setToastMessage(''), 2500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  return (
    <div className="min-w-0 bg-white text-base leading-[1.6] text-[#1a1a18]">
      <main className="min-h-[520px] w-full pb-8">
        <div className="mb-7 flex items-end justify-between gap-4 border-b border-[#e5e9f0] pb-5 max-md:block">
          <div>
            <h1 className="m-0 text-[32px] leading-[1.25] font-bold max-sm:text-[28px]">관심 상품</h1>
            <p className="mt-1.5 mb-0 text-[#5f5e5a]">관심 등록한 경매를 한곳에서 확인하세요.</p>
          </div>
          {!isLoading && !isError && (
            <span className="text-base leading-[1.4] font-extrabold whitespace-nowrap text-primary-dark max-md:mt-2 max-md:inline-block">
              {totalElements.toLocaleString('ko-KR')}개 상품
            </span>
          )}
        </div>

        {isLoading ? (
          <div
            className="grid w-full grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-[18px]"
            aria-busy="true"
            aria-label="관심 경매를 불러오는 중"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <AuctionCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <div className={EMPTY_STATE_CLASS}>
            <strong className="text-xl leading-[1.4]">관심 경매를 불러오지 못했습니다.</strong>
            <p className="m-0 text-[#5f5e5a]">잠시 후 다시 시도해 주세요.</p>
            <button
              className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-primary bg-primary px-3.5 text-base leading-[1.4] font-semibold text-white"
              type="button"
              onClick={() => refetch()}
            >
              <RotateCcw size={16} />
              다시 시도
            </button>
          </div>
        ) : favoriteItems.length > 0 ? (
          <div className="grid w-full grid-cols-2 gap-6 max-md:grid-cols-1 max-md:gap-[18px]">
            {favoriteItems.map((item) => {
              return (
                <div className="relative min-w-0" key={item.auctionId}>
                  <AuctionCard item={item} />
                  <button
                    className="absolute top-[30px] right-[30px] z-[2] inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-[#e2e2e2] bg-white/95 text-[#d63c3c] shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-colors hover:bg-[#d63c3c] hover:text-white disabled:cursor-wait disabled:opacity-55 max-md:top-[22px] max-md:right-[22px]"
                    type="button"
                    title="관심 경매에서 삭제"
                    aria-label={`${item.title} 관심 경매에서 삭제`}
                    disabled={favoriteMutation.isPending}
                    onClick={() => favoriteMutation.mutate(item.auctionId)}
                  >
                    <HeartOff size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={EMPTY_STATE_CLASS}>
            <strong className="text-xl leading-[1.4]">관심 등록한 경매가 없습니다.</strong>
            <p className="m-0 text-[#5f5e5a]">경매를 둘러보고 관심 있는 상품을 저장해 보세요.</p>
            <Link
              className="mt-[18px] inline-flex min-h-[42px] items-center justify-center rounded-lg bg-[#1d1d1f] px-[18px] text-base leading-[1.4] font-bold text-white no-underline"
              to="/auction"
            >
              경매 둘러보기
            </Link>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2" aria-label="관심 경매 목록 페이지">
            <button
              className={PAGINATION_BUTTON_CLASS}
              type="button"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              이전
            </button>
            {visiblePages.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={pageNumber === page
                  ? 'min-h-10 rounded-lg border border-primary bg-primary px-3.5 text-base leading-[1.4] font-semibold text-white'
                  : PAGINATION_BUTTON_CLASS}
                onClick={() => goToPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              className={PAGINATION_BUTTON_CLASS}
              type="button"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              다음
            </button>
          </div>
        )}
      </main>

      <AuctionToast message={toastMessage} />
    </div>
  );
};

export default AuctionFavoritesPage;
