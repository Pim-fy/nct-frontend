import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import {
  addAuctionFavorite,
  buyNowAuction,
  fetchAuctionDetail,
  fetchAuctionFavoriteStatus,
  placeAuctionBid,
  removeAuctionFavorite,
} from '@api/auctionApi';
import { toImageUrl } from '@api/fileApi';
import { useAuth } from '@hooks/useAuth';
import { useAuctionStream } from '@hooks/useAuctionStream';
import { useAuctionViewTracking } from '@hooks/useAuctionViewTracking';
import useCountdown from '@hooks/useCountdown';
import { usePointBalance } from '@hooks/usePoint';
import AuctionBidPanel from './components/AuctionBidPanel';
import AuctionBuyNowModal from './components/AuctionBuyNowModal';
import AuctionImageGallery, { AuctionPreviewRail } from './components/AuctionImageGallery';
import AuctionInfoGrid from './components/AuctionInfoGrid';
import AuctionInquirySection from './components/AuctionInquirySection';
import AuctionShippingGuideSection from './components/AuctionShippingGuideSection';
import AuctionToast from './components/AuctionToast';
import {
  createImageItems,
  formatNumber,
  formatPrice,
  formatRemainingTime,
  formatTimeUntil,
  parseAmount,
  resolveAuctionResultLabel,
} from './utils/auctionFormatters';
import { addRecentItem } from '@components/landing/QuickActions';

const DETAIL_PAGE_CLASS = 'bg-white pb-14 text-[#1d1d1f]';
const DETAIL_CONTAINER_CLASS = 'mx-auto w-[calc(100%_-_52px)] max-w-[1600px] max-lg:w-[calc(100%_-_32px)] max-sm:w-[calc(100%_-_24px)]';
const DETAIL_EMPTY_CLASS = 'grid min-h-[340px] place-content-center justify-items-center gap-2.5 rounded-lg border border-[#e8e8e8] bg-[#f8f8f6] p-7 text-center';
const DETAIL_SECTION_ITEMS = [
  { id: 'auction-product-description', label: '상품설명' },
  { id: 'auction-seller-information', label: '판매자 정보' },
  { id: 'auction-product-inquiries', label: '상품문의' },
  { id: 'auction-shipping-guide', label: '배송 안내' },
];

const AuctionDetailPage = () => {
  const { auctionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, loading: isAuthLoading } = useAuth();
  const authenticatedUserId = user?.id ?? user?.userId ?? user?.userSn ?? user?.usrSn;
  const [bidAmount, setBidAmount] = useState('');
  const [holdAgreed, setHoldAgreed] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeDetailSectionId, setActiveDetailSectionId] = useState(
    DETAIL_SECTION_ITEMS[0].id,
  );
  const [isBuyNowOpen, setIsBuyNowOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [imageNavigationCommand, setImageNavigationCommand] = useState(null);
  const requestedImageIndexRef = useRef(null);
  const imageNavigationIdRef = useRef(0);
  const requestedDetailSectionIdRef = useRef(null);
  const detailSectionUnlockTimerRef = useRef(null);
  const [failedImageUrls, setFailedImageUrls] = useState(() => new Set());
  const requestedReturnPath = location.state?.from;
  const returnPath = typeof requestedReturnPath === 'string'
    && requestedReturnPath.startsWith('/')
    ? requestedReturnPath
    : '/auction';
  const returnLabel = returnPath === '/auction' ? '경매 목록' : '이전 목록';

  const detailQueryKey = useMemo(
    () => ['auctionDetail', auctionId, authenticatedUserId ?? 'anonymous'],
    [auctionId, authenticatedUserId],
  );
  const {
    data: auction,
    isLoading,
    isError,
  } = useQuery({
    queryKey: detailQueryKey,
    queryFn: () => fetchAuctionDetail(auctionId),
    enabled: Boolean(auctionId),
  });
  const isOwnAuction = authenticatedUserId != null
    && auction?.sellerId != null
    && String(authenticatedUserId) === String(auction.sellerId);
  const isAuctionActiveStatus = auction?.auctionStatusCode === 'AUCC0002';
  const pointBalanceQuery = usePointBalance({
    enabled: Boolean(isAuthenticated && auction && !isOwnAuction && isAuctionActiveStatus),
    retry: 3,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
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
  useAuctionStream(auctionId);
  useAuctionViewTracking(auctionId, auction?.productId);
  const now = useCountdown(Boolean(
    (auction?.auctionStatusCode === 'AUCC0001' && auction?.startDateTime)
    || (auction?.auctionStatusCode === 'AUCC0002' && auction?.endDateTime),
  ));

  const showToast = (message) => setToastMessage(message);
  const getErrorMessage = (error) => error?.response?.data?.message || '요청 처리 중 오류가 발생했습니다';
  const handleMutationSuccess = (updatedAuction) => {
    queryClient.setQueryData(detailQueryKey, updatedAuction);
    queryClient.invalidateQueries({ queryKey: ['point', 'balance'] });
    setBidAmount('');
    setHoldAgreed(false);
  };
  const handleAuctionMutationError = (error) => {
    if (error?.response?.data?.code === 'POINT_INSUFFICIENT') {
      queryClient.invalidateQueries({ queryKey: ['point', 'balance'] });
    }
    showToast(getErrorMessage(error));
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
    onError: handleAuctionMutationError,
  });
  const buyNowMutation = useMutation({
    mutationFn: (payload) => buyNowAuction(auctionId, payload),
    onSuccess: (updatedAuction) => {
      handleMutationSuccess(updatedAuction);
      setIsBuyNowOpen(false);
      showToast('즉시구매가 완료되었습니다');
    },
    onError: handleAuctionMutationError,
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
    if (!auction) return;
    const repImage = auction.images?.find((img) => img.representative) ?? auction.images?.[0];
    const imageUrl = repImage?.path ? toImageUrl(repImage.path) : null;
    if (!imageUrl) return;
    addRecentItem({
      id: auctionId,
      image: imageUrl,
      title: auction.title,
      url: `/auction/${auctionId}`,
    });
  }, [auction, auctionId]);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timerId = window.setTimeout(() => setToastMessage(''), 1800);
    return () => window.clearTimeout(timerId);
  }, [toastMessage]);

  useEffect(() => {
    if (!auction?.productId) return undefined;

    let animationFrameId = null;
    const updateActiveSection = () => {
      const stickyOffset = window.innerWidth < 768 ? 136 : 82;
      const activationOffset = stickyOffset + 12;
      const lastSectionId = DETAIL_SECTION_ITEMS[DETAIL_SECTION_ITEMS.length - 1].id;
      const lastSection = document.getElementById(lastSectionId);
      const lastSectionActivationLine = activationOffset
        + ((window.innerHeight - activationOffset) * 0.5);
      const reachedLastSection = lastSection
        && lastSection.getBoundingClientRect().top <= lastSectionActivationLine;
      const reachedPageBottom = window.innerHeight + window.scrollY
        >= document.documentElement.scrollHeight - 2;
      const requestedSectionId = requestedDetailSectionIdRef.current;

      if (requestedSectionId) {
        setActiveDetailSectionId(requestedSectionId);
        return;
      }

      let nextSectionId = DETAIL_SECTION_ITEMS[0].id;

      if (reachedPageBottom || reachedLastSection) {
        nextSectionId = lastSectionId;
      } else {
        DETAIL_SECTION_ITEMS.forEach(({ id }) => {
          const section = document.getElementById(id);
          if (section && section.getBoundingClientRect().top <= activationOffset) {
            nextSectionId = id;
          }
        });
      }

      setActiveDetailSectionId((currentSectionId) => (
        currentSectionId === nextSectionId ? currentSectionId : nextSectionId
      ));
    };
    const scheduleActiveSectionUpdate = () => {
      if (animationFrameId !== null) return;
      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null;
        updateActiveSection();
      });
    };
    const finishRequestedSectionNavigation = () => {
      const requestedSectionId = requestedDetailSectionIdRef.current;
      if (requestedSectionId) {
        setActiveDetailSectionId(requestedSectionId);
      }
      requestedDetailSectionIdRef.current = null;
      if (detailSectionUnlockTimerRef.current !== null) {
        window.clearTimeout(detailSectionUnlockTimerRef.current);
        detailSectionUnlockTimerRef.current = null;
      }
      if (!requestedSectionId) scheduleActiveSectionUpdate();
    };

    updateActiveSection();
    window.addEventListener('scroll', scheduleActiveSectionUpdate, { passive: true });
    window.addEventListener('scrollend', finishRequestedSectionNavigation);
    window.addEventListener('resize', scheduleActiveSectionUpdate);

    return () => {
      window.removeEventListener('scroll', scheduleActiveSectionUpdate);
      window.removeEventListener('scrollend', finishRequestedSectionNavigation);
      window.removeEventListener('resize', scheduleActiveSectionUpdate);
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
      if (detailSectionUnlockTimerRef.current !== null) {
        window.clearTimeout(detailSectionUnlockTimerRef.current);
        detailSectionUnlockTimerRef.current = null;
      }
    };
  }, [auction?.productId]);

  if (isAuthLoading || isLoading) {
    return (
      <main className={DETAIL_PAGE_CLASS}>
        <div className={DETAIL_CONTAINER_CLASS}>
          <div className={DETAIL_EMPTY_CLASS}>
            <strong className="text-lg">경매 상세 정보를 불러오는 중입니다.</strong>
          </div>
        </div>
      </main>
    );
  }

  if (isError || !auction) {
    return (
      <main className={DETAIL_PAGE_CLASS}>
        <div className={DETAIL_CONTAINER_CLASS}>
          <div className={DETAIL_EMPTY_CLASS}>
            <strong className="text-lg">경매 상세 정보를 불러오지 못했습니다.</strong>
            <Link className="inline-flex items-center gap-1.5 font-extrabold text-primary no-underline" to={returnPath}>
              {returnLabel}으로 돌아가기
            </Link>
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
  const currentPrice = Number(auction.currentPrice || auction.startPrice || 0);
  const bidUnitPrice = Number(auction.bidUnitPrice || 1000);
  const minimumBidPrice = currentPrice + bidUnitPrice;
  const isAuctionReady = auction.auctionStatusCode === 'AUCC0001';
  const auctionResultLabel = isAuctionReady ? null : resolveAuctionResultLabel(auction);
  const auctionStartTimestamp = auction.startDateTime
    ? new Date(auction.startDateTime).getTime()
    : null;
  const isAuctionStartDue = isAuctionReady
    && Number.isFinite(auctionStartTimestamp)
    && auctionStartTimestamp <= now;
  const remainingTime = isAuctionReady
    ? (isAuctionStartDue ? '시작 처리 중' : formatTimeUntil(auction.startDateTime, now))
    : formatRemainingTime(auction, now);
  const remainingTimeLabel = isAuctionReady
    ? (isAuctionStartDue ? '경매 상태' : '경매 시작까지 남은 시간')
    : (auctionResultLabel ? '경매 결과' : '경매 종료까지 남은 시간');
  const auctionEndTimestamp = auction.endDateTime
    ? new Date(auction.endDateTime).getTime()
    : null;
  const isAuctionOpen = auction.auctionStatusCode === 'AUCC0002'
    && (auctionEndTimestamp === null || auctionEndTimestamp > now);
  const isBuyNowAvailable = isAuctionOpen
    && !isOwnAuction
    && Number(auction.instantBuyPrice || 0) > 0;
  const isCurrentHighestBidder = Boolean(auction.currentHighestBidder);
  const selectedTradeValue = auction.tradeMethodCode || '';
  const selectedTradeName = auction.tradeMethodName || '거래 방식 미정';
  const displayedBidAmount = bidAmount || formatNumber(currentPrice);
  const requestedBidAmount = parseAmount(displayedBidAmount);
  const hasBidAmountSelection = bidAmount !== '';
  const bidIncrementAmount = requestedBidAmount - currentPrice;
  const isBidAmountUnitValid = requestedBidAmount >= minimumBidPrice
    && bidIncrementAmount % bidUnitPrice === 0;
  const instantBuyPrice = Number(auction.instantBuyPrice || 0);
  const availablePointValue = pointBalanceQuery.data?.available;
  const availablePoint = availablePointValue == null ? null : Number(availablePointValue);
  const hasAvailablePoint = Number.isFinite(availablePoint);
  const isBidPointSufficient = !hasAvailablePoint || availablePoint >= requestedBidAmount;
  const isBuyNowPointSufficient = !hasAvailablePoint || availablePoint >= instantBuyPrice;
  const isPointBalanceLoading = isAuthenticated
    && !hasAvailablePoint
    && pointBalanceQuery.isLoading;
  const isPointBalanceError = isAuthenticated && pointBalanceQuery.isError;
  const handleBidInputChange = (event) => setBidAmount(formatNumber(parseAmount(event.target.value)));
  const handleBidMultiplierSelect = (multiplier) => {
    setBidAmount((value) => formatNumber(
      parseAmount(value || currentPrice) + (bidUnitPrice * multiplier),
    ));
  };
  const handleBidSubmit = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (isOwnAuction) {
      showToast('본인이 등록한 경매에는 입찰할 수 없습니다');
      return;
    }
    if (isCurrentHighestBidder) {
      showToast('현재 최고입찰자입니다');
      return;
    }
    if (!isAuctionOpen) {
      showToast('종료된 경매에는 입찰할 수 없습니다');
      return;
    }
    const amount = requestedBidAmount;
    if (amount < minimumBidPrice) {
      showToast(`최소 ${formatPrice(minimumBidPrice)} 이상 입력해 주세요`);
      return;
    }
    if (!isBidAmountUnitValid) {
      showToast(`${formatPrice(bidUnitPrice)} 단위에 맞는 금액을 입력해 주세요`);
      return;
    }
    if (hasAvailablePoint && availablePoint < amount) {
      showToast(`사용 가능 포인트가 부족합니다. 필요 ${formatNumber(amount)}P, 보유 ${formatNumber(availablePoint)}P`);
      return;
    }
    if (!holdAgreed) {
      showToast('포인트 홀딩 동의가 필요합니다');
      return;
    }
    bidMutation.mutate({
      bidAmount: amount,
      tradeMethod: selectedTradeValue,
    });
  };
  const handleBuyNowOpen = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (isOwnAuction) {
      showToast('본인이 등록한 경매는 즉시구매할 수 없습니다');
      return;
    }
    if (!isAuctionOpen) {
      showToast('종료된 경매에는 즉시구매할 수 없습니다');
      return;
    }
    if (!isBuyNowAvailable) {
      showToast('즉시구매가 제공되지 않는 경매입니다');
      return;
    }
    if (hasAvailablePoint && availablePoint < instantBuyPrice) {
      showToast(`사용 가능 포인트가 부족합니다. 필요 ${formatNumber(instantBuyPrice)}P, 보유 ${formatNumber(availablePoint)}P`);
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
      showToast('즉시구매를 진행할 수 없는 경매입니다');
      return;
    }
    if (hasAvailablePoint && availablePoint < instantBuyPrice) {
      setIsBuyNowOpen(false);
      showToast(`사용 가능 포인트가 부족합니다. 필요 ${formatNumber(instantBuyPrice)}P, 보유 ${formatNumber(availablePoint)}P`);
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
    if (imageItems.length <= 1) return;

    const fromIndex = requestedImageIndexRef.current !== null
      && imageItems[requestedImageIndexRef.current]
      ? requestedImageIndexRef.current
      : activeImageIndex;
    const targetIndex = (fromIndex + direction + imageItems.length) % imageItems.length;
    const command = {
      id: imageNavigationIdRef.current + 1,
      targetIndex,
      status: direction < 0 ? 'LEFT' : 'RIGHT',
    };

    imageNavigationIdRef.current = command.id;
    requestedImageIndexRef.current = targetIndex;
    setSelectedImageIndex(targetIndex);
    setImageNavigationCommand(command);
  };
  const handlePreviewClick = (index) => {
    const fromIndex = requestedImageIndexRef.current !== null
      && imageItems[requestedImageIndexRef.current]
      ? requestedImageIndexRef.current
      : activeImageIndex;
    if (index === fromIndex) return;

    const forwardDistance = (index - fromIndex + imageItems.length) % imageItems.length;
    const backwardDistance = (fromIndex - index + imageItems.length) % imageItems.length;
    const command = {
      id: imageNavigationIdRef.current + 1,
      targetIndex: index,
      status: forwardDistance <= backwardDistance ? 'RIGHT' : 'LEFT',
    };

    imageNavigationIdRef.current = command.id;
    requestedImageIndexRef.current = index;
    setSelectedImageIndex(index);
    setImageNavigationCommand(command);
  };
  const handleImageError = (url) => {
    setFailedImageUrls((prev) => new Set(prev).add(url));
  };
  const handleDetailSectionNavigate = (sectionId) => {
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) return;

    requestedDetailSectionIdRef.current = sectionId;
    if (detailSectionUnlockTimerRef.current !== null) {
      window.clearTimeout(detailSectionUnlockTimerRef.current);
    }
    detailSectionUnlockTimerRef.current = window.setTimeout(() => {
      requestedDetailSectionIdRef.current = null;
      detailSectionUnlockTimerRef.current = null;
    }, 1800);
    setActiveDetailSectionId(sectionId);
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <main className={DETAIL_PAGE_CLASS}>
        <div className={DETAIL_CONTAINER_CLASS}>
          <Link
            className="mt-[34px] inline-flex w-fit items-center gap-1.5 text-sm font-bold text-[#666] no-underline transition-colors hover:text-primary-dark"
            to={returnPath}
          >
            <ChevronLeft size={18} aria-hidden="true" />
            {returnLabel}
          </Link>
          <h1 className="mt-[18px] mb-3.5 text-[30px] leading-tight font-bold text-[#1d1d1f] max-lg:mt-4 max-lg:text-[26px] max-sm:text-[22px]">
            {auction.title}
          </h1>

          <section className="grid items-stretch gap-2 lg:grid-cols-[minmax(360px,0.78fr)_minmax(560px,1.22fr)]">
            <div className="grid min-h-[498px] min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-2 max-lg:min-h-0">
              <AuctionImageGallery
                auction={auction}
                imageItems={imageItems}
                activeImageIndex={activeImageIndex}
                failedImageUrls={failedImageUrls}
                navigationCommand={imageNavigationCommand}
                onMoveImage={moveImage}
                onImageError={handleImageError}
              />
              <AuctionPreviewRail
                imageItems={imageItems}
                activeImageIndex={activeImageIndex}
                onPreviewClick={handlePreviewClick}
              />
            </div>
            <AuctionBidPanel
              auction={auction}
              currentPrice={currentPrice}
              bidUnitPrice={bidUnitPrice}
              remainingTime={remainingTime}
              remainingTimeLabel={remainingTimeLabel}
              selectedTradeName={selectedTradeName}
              displayedBidAmount={displayedBidAmount}
              holdAgreed={holdAgreed}
              isBidPending={bidMutation.isPending}
              isBuyNowPending={buyNowMutation.isPending}
              isAuctionOpen={isAuctionOpen}
              isAuctionReady={isAuctionReady}
              isOwnAuction={isOwnAuction}
              isCurrentHighestBidder={isCurrentHighestBidder}
              isBuyNowAvailable={isBuyNowAvailable}
              isAuthenticated={isAuthenticated}
              availablePoint={availablePoint}
              hasAvailablePoint={hasAvailablePoint}
              isPointBalanceLoading={isPointBalanceLoading}
              isPointBalanceError={isPointBalanceError}
              isBidPointSufficient={isBidPointSufficient}
              isBidAmountUnitValid={isBidAmountUnitValid}
              hasBidAmountSelection={hasBidAmountSelection}
              isBuyNowPointSufficient={isBuyNowPointSufficient}
              isFavoritePending={favoriteMutation.isPending || favoriteStatusQuery.isFetching}
              onBidInputChange={handleBidInputChange}
              onBidMultiplierSelect={handleBidMultiplierSelect}
              onHoldAgreedChange={setHoldAgreed}
              onBidSubmit={handleBidSubmit}
              onBuyNowOpen={handleBuyNowOpen}
              onFavoriteToggle={handleFavoriteToggle}
            />
          </section>
        </div>

        <nav
          className="sticky top-[82px] z-[90] mt-7 h-[54px] border-y border-[#e2e5ea] bg-white shadow-[0_5px_14px_rgba(0,0,0,0.14)] md:top-0 md:z-[110] md:h-[82px]"
          aria-label="경매 상세 구역"
        >
          <div className={`${DETAIL_CONTAINER_CLASS} grid h-full grid-cols-4`}>
            {DETAIL_SECTION_ITEMS.map(({ id, label }) => {
              const isActive = activeDetailSectionId === id;
              return (
                <button
                  className={`relative inline-flex h-full cursor-pointer items-center justify-center border-x-0 border-t-0 border-b-[3px] bg-white px-2 text-sm font-bold transition-colors md:text-base ${
                    isActive
                      ? 'border-b-primary text-primary'
                      : 'border-b-transparent text-[#666] hover:text-[#1d1d1f]'
                  }`}
                  key={id}
                  type="button"
                  aria-current={isActive ? 'location' : undefined}
                  onClick={() => handleDetailSectionNavigate(id)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className={DETAIL_CONTAINER_CLASS}>
          <AuctionInfoGrid
            auction={auction}
            selectedTradeName={selectedTradeName}
            productSectionId={DETAIL_SECTION_ITEMS[0].id}
            sellerSectionId={DETAIL_SECTION_ITEMS[1].id}
          />

          <AuctionInquirySection
            sectionId={DETAIL_SECTION_ITEMS[2].id}
            productId={auction.productId}
            isAuthenticated={isAuthenticated}
            isOwnAuction={isOwnAuction}
            onLoginRequired={() => navigate('/login', { state: { from: location } })}
            onToast={showToast}
          />

          <AuctionShippingGuideSection sectionId={DETAIL_SECTION_ITEMS[3].id} />
        </div>
      </main>

      <AuctionBuyNowModal
        isOpen={isBuyNowOpen}
        auction={auction}
        selectedTradeName={selectedTradeName}
        holdAgreed={holdAgreed}
        isPending={buyNowMutation.isPending}
        isBuyNowAvailable={isBuyNowAvailable}
        onClose={() => setIsBuyNowOpen(false)}
        onConfirm={handleBuyNowConfirm}
      />
      <AuctionToast message={toastMessage} />
    </>
  );
};

export default AuctionDetailPage;
