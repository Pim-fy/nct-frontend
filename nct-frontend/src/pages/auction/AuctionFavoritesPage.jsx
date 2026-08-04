import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HeartOff, RotateCcw } from 'lucide-react';
import {
  fetchMyFavoriteAuctions,
  removeAuctionFavorite,
} from '@api/auctionApi';
import CardGridSkeleton from '@components/skeleton/CardGridSkeleton';
import MyPageContentHeader from '@components/mypage/MyPageContentHeader';
import AuctionCard from './components/AuctionCard';
import AuctionToast from './components/AuctionToast';
import '@assets/css/my-active-auctions.css';

const PAGE_SIZE = 12;

const MAX_VISIBLE_PAGES = 5;
const PAGINATION_BUTTON_CLASS =
  'min-h-10 rounded-lg border border-[#e2e1dc] bg-white px-3.5 text-sm font-semibold text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45';

const EMPTY_STATE_CLASS =
  'grid min-h-[340px] place-content-center justify-items-center gap-2.5 rounded-lg border border-[#f0efec] bg-[#f8f8f6] p-7 text-center';

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

const AuctionFavoritesPage = ({ embedded = false }) => {
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
    onMutate: async (auctionId) => {
      const queryKey = ['auctionFavorites', page, PAGE_SIZE];
      await queryClient.cancelQueries({ queryKey: ['auctionFavorites'] });
      const previousPage = queryClient.getQueryData(queryKey);
      const wasLastItemOnPage = previousPage?.items?.length === 1;

      queryClient.setQueryData(queryKey, (currentPage) => {
        if (!currentPage?.items) return currentPage;

        const nextItems = currentPage.items.filter((item) => item.auctionId !== auctionId);
        if (nextItems.length === currentPage.items.length) return currentPage;

        const nextTotalElements = Math.max(0, (currentPage.totalElements || 0) - 1);
        return {
          ...currentPage,
          items: nextItems,
          totalElements: nextTotalElements,
          totalPages: Math.ceil(nextTotalElements / PAGE_SIZE),
        };
      });

      return { previousPage, queryKey, wasLastItemOnPage };
    },
    onSuccess: (_status, _auctionId, context) => {
      setToastMessage('관심 경매에서 삭제했습니다.');

      if (page > 1 && context?.wasLastItemOnPage) {
        goToPage(page - 1);
      }
    },
    onError: (error, _auctionId, context) => {
      if (context?.previousPage && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousPage);
      }
      setToastMessage(
        error.response?.data?.message || '관심 경매를 삭제하지 못했습니다.',
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['auctionFavorites'] });
      queryClient.invalidateQueries({ queryKey: ['auctionFavoriteStatus'] });
      queryClient.invalidateQueries({ queryKey: ['auctionDetail'] });
      queryClient.invalidateQueries({ queryKey: ['landing-curation', 'auctions', 'popular'] });
    },
  });

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timer = window.setTimeout(() => setToastMessage(''), 2500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const content = (
    <section className="my-active-auctions">
      <MyPageContentHeader
        title="관심 경매"
        actions={!isLoading && !isError ? (
          <span className="inline-flex min-h-9 items-center text-sm font-extrabold whitespace-nowrap text-primary-dark">
            {totalElements.toLocaleString('ko-KR')}개 경매
          </span>
        ) : null}
      />

      {isLoading ? (
        <CardGridSkeleton cardHeight={410} columns={3} count={6} />
      ) : isError ? (
        <div className={EMPTY_STATE_CLASS}>
          <strong className="text-lg">관심 경매를 불러오지 못했습니다.</strong>
          <p className="m-0 text-[#5f5e5a]">잠시 후 다시 시도해 주세요.</p>
          <button
            className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg border border-primary bg-primary px-3.5 text-sm font-semibold text-white"
            type="button"
            onClick={() => refetch()}
          >
            <RotateCcw size={16} />
            다시 시도
          </button>
        </div>
      ) : favoriteItems.length > 0 ? (
        <div className="grid w-full grid-cols-3 gap-[45px] max-xl:grid-cols-2 max-xl:gap-6 max-md:grid-cols-1 max-md:gap-[18px]">
          {favoriteItems.map((item) => (
            <div className="relative min-w-0" key={item.auctionId}>
              <AuctionCard item={item} />
              <button
                className="absolute top-[30px] right-[30px] z-[2] inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-[#e2e2e2] bg-white/95 text-[#d63c3c] shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-colors hover:bg-[#d63c3c] hover:text-white disabled:cursor-wait disabled:opacity-55 max-md:top-[22px] max-md:right-[22px]"
                type="button"
                title="관심 경매에서 삭제"
                aria-label={`${item.title} 관심 경매에서 삭제`}
                aria-busy={favoriteMutation.isPending
                  && favoriteMutation.variables === item.auctionId}
                disabled={favoriteMutation.isPending
                  && favoriteMutation.variables === item.auctionId}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  favoriteMutation.mutate(item.auctionId);
                }}
              >
                <HeartOff size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={EMPTY_STATE_CLASS}>
          <strong className="text-lg">관심 등록한 경매가 없습니다.</strong>
          <p className="m-0 text-[#5f5e5a]">경매를 둘러보고 관심 있는 상품을 저장해 보세요.</p>
          <Link
            className="mt-[18px] inline-flex min-h-[42px] items-center justify-center rounded-lg bg-[#1d1d1f] px-[18px] text-sm font-bold text-white no-underline"
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
                ? 'min-h-10 rounded-lg border border-primary bg-primary px-3.5 text-sm font-semibold text-white'
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
    </section>
  );

  return (
    <div className="min-h-full bg-white text-[#1a1a18]">
      {embedded ? content : (
        <main
          className="container min-h-[calc(100vh-180px)]"
          style={{ paddingTop: '28px', paddingBottom: '52px' }}
        >
          {content}
        </main>
      )}
      <AuctionToast message={toastMessage} />
    </div>
  );
};

export default AuctionFavoritesPage;
