import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addAuctionFavorite,
  buyNowAuction,
  fetchAuctionDetail,
  fetchAuctionFavoriteStatus,
  placeAuctionBid,
  removeAuctionFavorite,
} from '@api/auctionApi';
import { useAuth } from '@hooks/useAuth';
import AuctionBidPanel from './components/AuctionBidPanel';
import AuctionBuyNowModal from './components/AuctionBuyNowModal';
import AuctionDetailModal from './components/AuctionDetailModal';
import AuctionImageGallery, { AuctionPreviewRail } from './components/AuctionImageGallery';
import AuctionInfoGrid from './components/AuctionInfoGrid';
import AuctionToast from './components/AuctionToast';
import useCountdown from './hooks/useCountdown';
import {
  createImageItems,
  formatNumber,
  formatPrice,
  formatRemainingTime,
  parseAmount,
} from './utils/auctionFormatters';
import '@assets/css/auction.css';

const AuctionDetailPage = () => {
  const { auctionId } = useParams();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [bidAmount, setBidAmount] = useState('');
  const [holdAgreed, setHoldAgreed] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [detailModalKey, setDetailModalKey] = useState(null);
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [failedImageUrls, setFailedImageUrls] = useState(() => new Set());

  const detailQueryKey = useMemo(() => ['auctionDetail', auctionId], [auctionId]);
  const {
    data: auction,
    isLoading,
    isError,
  } = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => fetchAuctionDetail(auctionId),
    enabled: Boolean(auctionId),
  });
  const favoriteStatusQuery = useQuery({
    queryKey: ['auctionFavoriteStatus', auctionId],
    queryFn: () => fetchAuctionFavoriteStatus(auctionId),
    enabled: Boolean(
      auctionId
      && auction
      && isAuthenticated
      && typeof auction.favorite !== 'boolean'
    ),
  });
  const now = useCountdown(Boolean(auction?.endDateTime && auction?.auctionStatusCode === 'AUCC0002'));

  const showToast = (message) => setToastMessage(message);
  const getErrorMessage = (error) => error?.response?.data?.message || '요청 처리 중 오류가 발생했습니다';
  const handleMutationSuccess = (updatedAuction) => {
    queryClient.setQueryData(detailQueryKey, updatedAuction);
    setBidAmount('');
    setHoldAgreed(false);
  };
  const applyFavoriteStatus = useCallback((status) => {
    queryClient.setQueryData(detailQueryKey, (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        favorite: status.favorite,
        favoriteCount: status.favoriteCount,
      };
    });
  }, [detailQueryKey, queryClient]);

  const bidMutation = useMutation({
    mutationFn: (payload) => placeAuctionBid(auctionId, payload),
    onSuccess: (updatedAuction) => {
      handleMutationSuccess(updatedAuction);
      showToast('입찰이 등록되었습니다');
    },
    onError: (error) => showToast(getErrorMessage(error)),
  });
  const buyNowMutation = useMutation({
    mutationFn: (payload) => buyNowAuction(auctionId, payload),
    onSuccess: (updatedAuction) => {
      handleMutationSuccess(updatedAuction);
      setIsBuyNowOpen(false);
      showToast('즉시구매가 완료되었습니다');
    },
    onError: (error) => showToast(getErrorMessage(error)),
  });
  const favoriteMutation = useMutation({
    mutationFn: () => (auction?.favorite
      ? removeAuctionFavorite(auctionId)
      : addAuctionFavorite(auctionId)),
    onSuccess: (status) => {
      applyFavoriteStatus(status);
      showToast(status.favorite ? '관심 상품에 추가되었습니다' : '관심 상품에서 해제되었습니다');
    },
    onError: (error) => showToast(getErrorMessage(error)),
  });

  useEffect(() => {
    if (favoriteStatusQuery.data) {
      applyFavoriteStatus(favoriteStatusQuery.data);
    }
  }, [applyFavoriteStatus, favoriteStatusQuery.data]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timerId = window.setTimeout(() => setToastMessage(''), 1800);
    return () => window.clearTimeout(timerId);
  }, [toastMessage]);

  if (isLoading) {
    return (
      <main className="auction-detail-page">
        <div className="auction-detail-container">
          <div className="auction-empty">
            <strong>경매 상세 정보를 불러오는 중입니다.</strong>
          </div>
        </div>
      </main>
    );
  }

  if (isError || !auction) {
    return (
      <main className="auction-detail-page">
        <div className="auction-detail-container">
          <div className="auction-empty">
            <strong>경매 상세 정보를 불러오지 못했습니다.</strong>
            <Link className="auction-detail-link" to="/auction">목록으로 돌아가기</Link>
          </div>
        </div>
      </main>
    );
  }

  const imageItems = createImageItems(auction.images || []);
  const representativeIndex = imageItems.findIndex((image) => image.representative === 'Y');
  const defaultImageIndex = representativeIndex >= 0 ? representativeIndex : 0;
  const activeImageIndex = selectedImageIndex !== null && imageItems[selectedImageIndex]
    ? selectedImageIndex
    : defaultImageIndex;
  const activeImageItem = imageItems[activeImageIndex];
  const mainImageUrl = activeImageItem?.url;
  const isMainImageVisible = Boolean(mainImageUrl && !failedImageUrls.has(mainImageUrl));
  const currentPrice = Number(auction.currentPrice || auction.startPrice || 0);
  const bidUnitPrice = Number(auction.bidUnitPrice || 1000);
  const minimumBidPrice = currentPrice + bidUnitPrice;
  const remainingTime = formatRemainingTime(
    auction.endDateTime,
    auction.auctionStatusCode,
    auction.auctionStatusName,
    now,
  );
  const auctionEndTimestamp = auction.endDateTime
    ? new Date(auction.endDateTime).getTime()
    : null;
  const isAuctionOpen = auction.auctionStatusCode === 'AUCC0002'
    && (auctionEndTimestamp === null || auctionEndTimestamp > now);
  const isBuyNowAvailable = isAuctionOpen && Number(auction.instantBuyPrice || 0) > 0;
  const selectedTradeValue = auction.tradeMethodCode || '';
  const selectedTradeName = auction.tradeMethodName || '거래 방식 미정';
  const displayedBidAmount = bidAmount || formatNumber(minimumBidPrice);
  const sellerSummary = `${auction.sellerName || '판매자'} · ${selectedTradeName}`;
  const detailModalContent = detailModalKey === 'seller'
    ? {
      title: '판매자 정보',
      rows: [
        ['판매자', auction.sellerName || '판매자'],
        ['거래 방식', selectedTradeName],
      ],
    }
    : {
      title: '상품 설명',
      rows: [
        ['상품명', auction.title],
        ['카테고리', auction.categoryName || '-'],
        ['설명', auction.content || '등록된 상품 설명이 없습니다.'],
        ['경매 상태', auction.auctionStatusName || '-'],
      ],
    };

  const handleBidInputChange = (event) => setBidAmount(formatNumber(parseAmount(event.target.value)));
  const handleQuickAdd = (amount) => setBidAmount((value) => formatNumber(parseAmount(value || displayedBidAmount) + amount));
  const handleBidSubmit = () => {
    if (!isAuctionOpen) {
      showToast('종료된 경매에는 입찰할 수 없습니다');
      return;
    }
    const amount = parseAmount(displayedBidAmount);
    if (!holdAgreed) {
      showToast('포인트 홀딩 동의가 필요합니다');
      return;
    }
    if (amount < minimumBidPrice) {
      showToast(`최소 ${formatPrice(minimumBidPrice)} 이상 입력해 주세요`);
      return;
    }
    bidMutation.mutate({
      bidAmount: amount,
      tradeMethod: selectedTradeValue,
    });
  };
  const handleBuyNowOpen = () => {
    if (!isAuctionOpen) {
      showToast('종료된 경매에는 즉시구매할 수 없습니다');
      return;
    }
    if (!isBuyNowAvailable) {
      showToast('즉시구매가 제공되지 않는 경매입니다');
      return;
    }
    if (!holdAgreed) {
      showToast('포인트 홀딩 동의가 필요합니다');
      return;
    }
    setIsBuyNowOpen(true);
  };
  const handleBuyNowConfirm = () => {
    if (!isBuyNowAvailable) {
      setIsBuyNowOpen(false);
      showToast('현재 즉시구매를 진행할 수 없습니다');
      return;
    }
    buyNowMutation.mutate({
      tradeMethod: selectedTradeValue,
    });
  };
  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      showToast('로그인 후 관심 상품을 등록할 수 있습니다');
      return;
    }
    favoriteMutation.mutate();
  };
  const moveImage = (direction) => {
    if (imageItems.length === 0) return;
    setSelectedImageIndex((index) => {
      const currentIndex = index !== null && imageItems[index] ? index : activeImageIndex;
      return (currentIndex + direction + imageItems.length) % imageItems.length;
    });
  };
  const handleImageError = (url) => {
    setFailedImageUrls((prev) => new Set(prev).add(url));
  };

  return (
    <>
      <main className="auction-detail-page">
        <div className="auction-detail-container">
          <h2 className="product-title">{auction.title}</h2>

          <section className="hero-grid">
            <AuctionImageGallery
              auction={auction}
              imageItems={imageItems}
              activeImageIndex={activeImageIndex}
              mainImageUrl={mainImageUrl}
              isMainImageVisible={isMainImageVisible}
              onMoveImage={moveImage}
              onImageError={handleImageError}
            />
            <AuctionBidPanel
              auction={auction}
              currentPrice={currentPrice}
              bidUnitPrice={bidUnitPrice}
              remainingTime={remainingTime}
              selectedTradeName={selectedTradeName}
              displayedBidAmount={displayedBidAmount}
              holdAgreed={holdAgreed}
              isAuctionOpen={isAuctionOpen}
              isBuyNowAvailable={isBuyNowAvailable}
              isBidPending={bidMutation.isPending}
              isBuyNowPending={buyNowMutation.isPending}
              isFavoritePending={favoriteMutation.isPending || favoriteStatusQuery.isFetching}
              onBidInputChange={handleBidInputChange}
              onQuickAdd={handleQuickAdd}
              onHoldAgreedChange={setHoldAgreed}
              onBidSubmit={handleBidSubmit}
              onBuyNowOpen={handleBuyNowOpen}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </section>

          <AuctionPreviewRail
            imageItems={imageItems}
            activeImageIndex={activeImageIndex}
            onPreviewClick={setSelectedImageIndex}
          />

          <AuctionInfoGrid
            auction={auction}
            sellerSummary={sellerSummary}
            onInfoOpen={setDetailModalKey}
          />
        </div>
      </main>

      <AuctionDetailModal
        isOpen={Boolean(detailModalKey)}
        content={detailModalContent}
        onClose={() => setDetailModalKey(null)}
      />
      <AuctionBuyNowModal
        isOpen={isBuyNowOpen}
        auction={auction}
        selectedTradeName={selectedTradeName}
        holdAgreed={holdAgreed}
        isBuyNowAvailable={isBuyNowAvailable}
        isPending={buyNowMutation.isPending}
        onClose={() => setIsBuyNowOpen(false)}
        onConfirm={handleBuyNowConfirm}
      />
      <AuctionToast message={toastMessage} />
    </>
  );
};

export default AuctionDetailPage;
