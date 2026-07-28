import { Heart } from 'lucide-react';
import { formatNumber, formatPrice } from '../utils/auctionFormatters';

const BID_UNIT_MULTIPLIERS = [1, 5, 10];

const AuctionBidPanel = ({
  auction,
  currentPrice,
  bidUnitPrice,
  remainingTime,
  remainingTimeLabel,
  selectedTradeName,
  displayedBidAmount,
  holdAgreed,
  isBidPending,
  isBuyNowPending,
  isAuctionOpen,
  isAuctionReady,
  isOwnAuction,
  isCurrentHighestBidder,
  isBuyNowAvailable,
  isAuthenticated,
  availablePoint,
  hasAvailablePoint,
  isPointBalanceLoading,
  isPointBalanceError,
  isBidPointSufficient,
  isBidAmountUnitValid,
  hasBidAmountSelection,
  isBuyNowPointSufficient,
  isFavoritePending,
  onBidInputChange,
  onBidMultiplierSelect,
  onHoldAgreedChange,
  onBidSubmit,
  onBuyNowOpen,
  onFavoriteToggle,
  onChargeClick,
}) => {
  const isBidPointInsufficient = hasAvailablePoint && !isBidPointSufficient;
  const isBuyNowPointInsufficient = hasAvailablePoint && !isBuyNowPointSufficient;
  const showBidAmountUnitError = hasBidAmountSelection && !isBidAmountUnitValid;
  const pointBalanceLabel = !isAuthenticated
    ? '로그인 필요'
    : (hasAvailablePoint
      ? `${formatNumber(availablePoint)}P`
      : (isPointBalanceLoading
        ? '조회 중'
        : (isPointBalanceError ? '확인 불가' : '-')));

  return (
    <aside className="relative grid min-h-[498px] content-start gap-[18px] rounded-lg border border-[#e8e8e8] bg-white px-[38px] pt-[30px] pb-[34px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)] max-lg:min-h-0 max-lg:px-[22px] max-lg:py-7">
      <button
        className={`absolute top-[34px] right-[38px] inline-flex min-h-6 cursor-pointer items-center gap-1 rounded-full border px-3 py-0.5 text-[13px] font-bold transition-colors disabled:cursor-wait disabled:opacity-55 max-lg:top-7 max-lg:right-[22px] max-sm:static max-sm:mt-3 max-sm:w-fit ${
          auction.favorite
            ? 'border-[#f6c6d2] bg-[#fff0f4] text-[#c0184a]'
            : 'border-[#dadada] bg-white text-[#666]'
        }`}
        type="button"
        aria-pressed={Boolean(auction.favorite)}
        disabled={isFavoritePending}
        onClick={onFavoriteToggle}
      >
        <Heart
          size={14}
          fill={auction.favorite ? 'currentColor' : 'none'}
          aria-hidden="true"
        />
        관심
      </button>
      <div className="grid grid-cols-1 items-start gap-y-5 lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,1fr)] lg:gap-x-[38px]">
        <div>
          <div className="mb-[18px] flex flex-wrap items-center gap-2 pr-[106px] max-sm:pr-0">
            <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-primary-light px-[9px] text-xs leading-4 font-bold whitespace-nowrap text-primary-dark">
              <span className="size-[7px] rounded-full bg-current" aria-hidden="true" />
              {auction.auctionStatusName || '진행중'}
            </span>
            {auction.tradeMethodName && (
              <span className="inline-flex h-5 items-center gap-1.5 rounded-full px-[9px] text-xs leading-4 font-bold whitespace-nowrap text-[#3f3f46]">
                <span className="size-[7px] rounded-full bg-primary" aria-hidden="true" />
                {auction.tradeMethodName}
              </span>
            )}
            {isCurrentHighestBidder && (
              <span
                className="inline-flex min-h-6 items-center rounded-lg border border-[#88c9a1] bg-[#edf9f1] px-[9px] py-0.5 text-xs font-bold text-[#176b3a]"
                role="status"
              >
                최고입찰자
              </span>
            )}
          </div>
          <p className="mt-0 mb-3.5 text-base font-bold text-[#3f3f46] max-sm:mt-[30px]">
            {isAuctionReady ? '경매 시작가' : '현재 최고가'}
          </p>
          <p className="m-0 text-[29px] leading-[1.1] font-bold text-primary-dark max-sm:text-[25px]" id="currentPrice">
            {formatPrice(currentPrice)}
          </p>
          <p className="mt-3.5 mb-[18px] text-sm text-[#4d4d4d]">
            {isAuctionReady
              ? `즉시구매가 ${formatPrice(auction.instantBuyPrice)}`
              : `시작가 ${formatPrice(auction.startPrice)} · 즉시구매가 ${formatPrice(auction.instantBuyPrice)}`}
          </p>
          <p
            className="relative top-[18px] m-0 mb-3 grid gap-[7px] leading-[1.1] max-lg:top-0"
            id="countdown"
          >
            <span
              className={`text-base font-bold ${
                isAuctionOpen || isAuctionReady ? 'text-[#3f3f46]' : 'text-[#8a8a8a]'
              }`}
              id="countdownLabel"
            >
              {remainingTimeLabel}
            </span>
            <span
              className={`text-[26px] font-bold tabular-nums max-sm:text-[25px] ${
                isAuctionOpen || isAuctionReady ? 'text-[#1d1d1f]' : 'text-[#8a8a8a]'
              }`}
              id="countdownValue"
            >
              {remainingTime}
            </span>
          </p>
          {isAuctionOpen && (
            <p className="relative top-[18px] text-sm text-[#666] max-lg:top-0">
              마감 10분 이내 유효 입찰 시 자동 연장(1회)
            </p>
          )}
        </div>

        {isAuctionReady ? (
          <div className="grid min-h-36 place-items-center content-center gap-2 pt-[42px] text-center text-[#1d1d1f] max-lg:pt-0" role="status">
            <strong className="text-lg font-bold">경매 시작 전입니다</strong>
            <span className="text-sm text-[#666]">입찰과 즉시구매는 경매가 시작되면 이용할 수 있습니다.</span>
          </div>
        ) : isOwnAuction ? (
          <div
            className="grid min-h-36 place-items-center pt-[42px] text-lg font-bold text-primary-dark max-lg:pt-0"
            role="status"
          >
            본인 경매 상품
          </div>
        ) : (
          <div className="self-start pt-[42px] max-lg:pt-0">
            <div className="mb-3.5 grid gap-2">
              <label className="text-base font-bold text-[#666]" htmlFor="bidAmount">입찰 금액</label>
              <input
                className="min-h-11 w-full rounded-lg border border-[#dadada] bg-white px-3.5 text-[#1d1d1f] outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:bg-[#f3f3f3]"
                id="bidAmount"
                type="text"
                inputMode="numeric"
                value={displayedBidAmount}
                disabled={!isAuctionOpen || isCurrentHighestBidder}
                aria-invalid={showBidAmountUnitError}
                aria-describedby={showBidAmountUnitError ? 'bidAmountPolicy' : undefined}
                onChange={onBidInputChange}
              />
            </div>
            <div className="grid gap-2">
              <span className="text-[13px] text-[#666]">
                입찰 단위 <strong className="ml-1 text-[#1d1d1f]">{formatPrice(bidUnitPrice)}</strong>
              </span>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="입찰 단위 배수 선택">
                {BID_UNIT_MULTIPLIERS.map((multiplier) => (
                  <button
                    className="min-h-10 min-w-[58px] cursor-pointer rounded-lg border border-[#dadada] bg-white text-sm font-bold text-[#1d1d1f] transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    key={multiplier}
                    disabled={!isAuctionOpen || isCurrentHighestBidder}
                    aria-label={`현재가에 입찰 단위 ${multiplier}배 추가`}
                    onClick={() => onBidMultiplierSelect(multiplier)}
                  >
                    +{formatNumber(bidUnitPrice * multiplier)}
                  </button>
                ))}
              </div>
            </div>
            {showBidAmountUnitError && (
              <p className="my-3 text-sm text-[#b42318]" id="bidAmountPolicy" role="alert">
                {formatPrice(bidUnitPrice)} 단위에 맞는 금액을 입력해 주세요
              </p>
            )}
            <div className="grid min-h-7 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2.5 text-[13px] text-[#666]">
              <span>사용 가능 포인트</span>
              <strong className={`text-sm ${isBidPointInsufficient ? 'text-[#b42318]' : 'text-[#1d1d1f]'}`}>
                {pointBalanceLabel}
              </strong>
              {isAuthenticated && (
                <button
                  className="font-bold text-primary-dark underline underline-offset-3"
                  type="button"
                  onClick={onChargeClick}
                >
                  충전
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid max-w-[310px] grid-cols-3 gap-2 pt-7 max-lg:pt-0">
          <div className="grid min-h-12 content-center gap-0.5 rounded-lg border border-[#e8e8e8] bg-white px-2 py-[7px] text-center">
            <span className="text-xs font-medium text-[#666]">입찰횟수</span>
            <strong className="text-[15px] leading-none text-primary-dark">{auction.bidCount || 0}회</strong>
          </div>
          <div className="grid min-h-12 content-center gap-0.5 rounded-lg border border-[#e8e8e8] bg-white px-2 py-[7px] text-center">
            <span className="text-xs font-medium text-[#666]">관심인원</span>
            <strong className="text-[15px] leading-none text-primary-dark">{formatNumber(auction.favoriteCount)}명</strong>
          </div>
          <div className="grid min-h-12 content-center gap-0.5 rounded-lg border border-[#e8e8e8] bg-white px-2 py-[7px] text-center">
            <span className="text-xs font-medium text-[#666]">조회수</span>
            <strong className="text-[15px] leading-none text-primary-dark">{formatNumber(auction.viewCount)}회</strong>
          </div>
        </div>
        <div className="grid gap-2 pt-7 max-lg:pt-0">
          <span className="text-sm leading-5 font-bold text-[#666]">거래 방식</span>
          <strong>{selectedTradeName}</strong>
        </div>

        {!isOwnAuction && (
          <>
            <label className="flex items-center justify-center gap-2 text-sm text-[#666] lg:col-span-2">
              <input
                className="size-4 accent-primary"
                id="holdAgree"
                type="checkbox"
                checked={holdAgreed}
                disabled={!isAuctionOpen}
                onChange={(event) => onHoldAgreedChange(event.target.checked)}
              /> 포인트 홀딩에 동의합니다
            </label>
            <div className="grid grid-cols-2 justify-center gap-1.5 lg:col-span-2 lg:grid-cols-[190px_190px]">
              <button
                className="min-h-[46px] cursor-pointer rounded-lg border border-primary bg-primary text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-55 aria-busy:cursor-progress"
                id="bidBtn"
                type="button"
                aria-busy={isBidPending}
                disabled={!isAuctionOpen
                  || isCurrentHighestBidder
                  || isBidPending
                  || isBidPointInsufficient
                  || !isBidAmountUnitValid}
                onClick={onBidSubmit}
              >
                {!isAuctionOpen
                  ? '입찰 종료'
                  : (isCurrentHighestBidder
                    ? '최고입찰 중'
                    : (isBidPointInsufficient
                      ? '포인트 부족'
                      : (!isBidAmountUnitValid
                        ? (hasBidAmountSelection ? '입찰 단위 확인' : '입찰 금액 선택')
                        : (isBidPending ? '입찰 중' : '입찰하기'))))}
              </button>
              <button
                className="min-h-[46px] cursor-pointer rounded-lg border border-primary bg-white text-[15px] font-bold text-primary disabled:cursor-not-allowed disabled:opacity-55 aria-busy:cursor-progress"
                id="buyNowBtn"
                type="button"
                aria-busy={isBuyNowPending}
                disabled={!isBuyNowAvailable || isBuyNowPending || isBuyNowPointInsufficient}
                onClick={onBuyNowOpen}
              >
                {!isAuctionOpen
                  ? '즉시구매 종료'
                  : (isBuyNowPointInsufficient
                    ? '포인트 부족'
                    : (isBuyNowAvailable
                      ? `즉시구매 ${formatPrice(auction.instantBuyPrice)}`
                      : '즉시구매 불가'))}
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default AuctionBidPanel;
