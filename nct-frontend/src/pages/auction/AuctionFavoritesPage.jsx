import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HeartOff, RotateCcw } from 'lucide-react';
import {
  fetchMyFavoriteAuctions,
  removeAuctionFavorite,
} from '@api/auctionApi';
import AuctionCard from './components/AuctionCard';
import AuctionToast from './components/AuctionToast';
import '@assets/css/auction.css';

const PAGE_SIZE = 12;
const MAX_VISIBLE_PAGES = 5;

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
    <div className="auction-page auction-favorites-page">
      <main className="auction-container auction-main">
        <div className="auction-page-title">
          <div>
            <h1>관심 경매</h1>
            <p>관심 등록한 경매를 한곳에서 확인하세요.</p>
          </div>
          {!isLoading && !isError && (
            <span>{totalElements.toLocaleString('ko-KR')}개 상품</span>
          )}
        </div>

        {isLoading ? (
          <div className="auction-empty">
            <strong>관심 경매를 불러오는 중입니다.</strong>
          </div>
        ) : isError ? (
          <div className="auction-empty">
            <strong>관심 경매를 불러오지 못했습니다.</strong>
            <p>잠시 후 다시 시도해 주세요.</p>
            <button type="button" onClick={() => refetch()}>
              <RotateCcw size={16} />
              다시 시도
            </button>
          </div>
        ) : favoriteItems.length > 0 ? (
          <div className="auction-grid auction-favorites-grid">
            {favoriteItems.map((item) => {
              return (
                <div className="auction-favorite-item" key={item.auctionId}>
                  <AuctionCard item={item} />
                  <button
                    className="auction-favorite-remove"
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
          <div className="auction-empty">
            <strong>관심 등록한 경매가 없습니다.</strong>
            <p>경매를 둘러보고 관심 있는 상품을 저장해 보세요.</p>
            <Link className="auction-empty-link" to="/auction">
              경매 둘러보기
            </Link>
          </div>
        )}

        {totalPages > 1 && (
          <div className="auction-pagination" aria-label="관심 경매 목록 페이지">
            <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              이전
            </button>
            {visiblePages.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={pageNumber === page ? 'active' : ''}
                onClick={() => goToPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
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
