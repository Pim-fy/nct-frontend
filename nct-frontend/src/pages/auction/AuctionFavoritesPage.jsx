import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Heart, HeartOff, RotateCcw } from 'lucide-react';
import {
  fetchMyFavoriteAuctions,
  removeAuctionFavorite,
} from '@api/auctionApi';
import { toImageUrl } from '@api/fileApi';
import {
  MyAuctionAction,
  MyAuctionBadge,
  MyAuctionCard,
  MyAuctionDetail,
  MyAuctionHeader,
  MyAuctionList,
  MyAuctionListSkeleton,
  MyAuctionPagination,
  MyAuctionSection,
  MyAuctionState,
  MyAuctionSummary,
} from '@components/mypage/MyAuctionSectionUi';
import AuctionToast from './components/AuctionToast';

const PAGE_SIZE = 12;

const getPageNumber = (searchParams) => {
  const page = Number.parseInt(searchParams.get('page') || '1', 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const formatPrice = (value) => (
  value == null ? '-' : `${Number(value).toLocaleString('ko-KR')}원`
);

const getStatusTone = (statusCode) => {
  if (statusCode === 'AUCC0002') return 'blue';
  if (statusCode === 'AUCC0003') return 'green';
  if (statusCode === 'AUCC0004' || statusCode === 'AUCC0005') return 'gray';
  return 'orange';
};

const AuctionFavoritesPage = () => {
  const location = useLocation();
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
    <MyAuctionSection className="min-h-[520px] pb-8">
      <MyAuctionHeader
        title="관심 상품"
        description="관심 등록한 경매를 한곳에서 확인하세요."
      />

      {!isLoading && !isError && (
        <MyAuctionSummary items={[
          {
            key: 'favorites',
            label: '관심 상품',
            value: `${totalElements.toLocaleString('ko-KR')}개`,
          },
        ]} />
      )}

      {isLoading ? (
        <MyAuctionListSkeleton />
      ) : isError ? (
        <MyAuctionState
          tone="error"
          title="관심 경매를 불러오지 못했습니다."
          description="잠시 후 다시 시도해 주세요."
          action={(
            <MyAuctionAction onClick={() => refetch()}>
              <RotateCcw size={16} />
              다시 시도
            </MyAuctionAction>
          )}
        />
      ) : favoriteItems.length > 0 ? (
        <>
          <MyAuctionList>
            {favoriteItems.map((item) => (
              <MyAuctionCard
                key={item.auctionId}
                imageUrl={toImageUrl(item.thumbnailPath)}
                imageAlt={item.title}
                imageFallback={item.categoryName || '경매'}
                badges={(
                  <>
                    <MyAuctionBadge tone={getStatusTone(item.auctionStatusCode)}>
                      {item.auctionStatusName || item.statusName || '상태 확인 중'}
                    </MyAuctionBadge>
                    {item.tradeMethodName && <MyAuctionBadge>{item.tradeMethodName}</MyAuctionBadge>}
                  </>
                )}
                title={item.title || `경매 #${item.auctionId}`}
                description={`판매자 ${item.sellerName || '-'}`}
                details={(
                  <>
                    <MyAuctionDetail label="현재가" value={formatPrice(item.currentPrice)} />
                    <MyAuctionDetail label="입찰" value={`${item.bidCount ?? 0}회`} />
                  </>
                )}
                actions={(
                  <>
                    <MyAuctionAction
                      variant="danger"
                      title="관심 경매에서 삭제"
                      ariaLabel={`${item.title} 관심 경매에서 삭제`}
                      disabled={favoriteMutation.isPending}
                      onClick={() => favoriteMutation.mutate(item.auctionId)}
                    >
                      <HeartOff size={18} />
                      삭제
                    </MyAuctionAction>
                    <MyAuctionAction
                      to={`/auction/${item.auctionId}`}
                      state={{ from: location.pathname + location.search }}
                    >
                      경매 상세
                      <ChevronRight size={17} />
                    </MyAuctionAction>
                  </>
                )}
              />
            ))}
          </MyAuctionList>
          <MyAuctionPagination page={page} totalPages={totalPages} onPageChange={goToPage} />
        </>
      ) : (
        <MyAuctionState
          icon={<Heart size={28} />}
          title="관심 등록한 경매가 없습니다."
          description="경매를 둘러보고 관심 있는 상품을 저장해 보세요."
          action={(
            <MyAuctionAction variant="primary" to="/auction">
              경매 둘러보기
            </MyAuctionAction>
          )}
        />
      )}

      <AuctionToast message={toastMessage} />
    </MyAuctionSection>
  );
};

export default AuctionFavoritesPage;
