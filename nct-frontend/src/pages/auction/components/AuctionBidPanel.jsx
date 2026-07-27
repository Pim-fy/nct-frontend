import { Link } from 'react-router-dom';
import { formatNumber, formatPrice } from '../utils/auctionFormatters';

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
  isBuyNowPointSufficient,
  isFavoritePending,
  onBidInputChange,
  onQuickAdd,
  onHoldAgreedChange,
  onBidSubmit,
  onBuyNowOpen,
  onFavoriteToggle,
}) => {
  const isBidPointInsufficient = hasAvailablePoint && !isBidPointSufficient;
  const isBuyNowPointInsufficient = hasAvailablePoint && !isBuyNowPointSufficient;
  const pointBalanceLabel = !isAuthenticated
    ? '로그인 필요'
    : (hasAvailablePoint
      ? `${formatNumber(availablePoint)}P`
      : (isPointBalanceLoading
        ? '조회 중'
        : (isPointBalanceError ? '확인 불가' : '-')));

  return (
    <aside className="bid-card">
      <button
        className={`favorite-toggle${auction.favorite ? ' active' : ''}`}
        type="button"
        aria-pressed={Boolean(auction.favorite)}
        disabled={isFavoritePending}
        onClick={onFavoriteToggle}
      >
        {auction.favorite ? '♥ 관심' : '♡ 관심'}
      </button>
      <div className="bid-layout">
        <div>
          <div className="status-row">
            <span className="badge">{auction.auctionStatusName || '진행중'}</span>
            {auction.tradeMethodName && (
              <span className="deal-badge">{auction.tradeMethodName}</span>
            )}
            {isCurrentHighestBidder && (
              <span className="highest-bidder-badge" role="status">최고입찰자</span>
            )}
          </div>
          <p className="label">{isAuctionReady ? '경매 시작가' : '현재 최고가'}</p>
          <p className="price" id="currentPrice">{formatPrice(currentPrice)}</p>
          <p className="subcopy">
            {isAuctionReady
              ? `즉시구매가 ${formatPrice(auction.instantBuyPrice)}`
              : `시작가 ${formatPrice(auction.startPrice)} · 즉시구매가 ${formatPrice(auction.instantBuyPrice)}`}
          </p>
          <p className={`timer price-timer${isAuctionOpen || isAuctionReady ? '' : ' ended'}`} id="countdown">
            <span className="timer-label" id="countdownLabel">{remainingTimeLabel}</span>
            <span className="timer-value mono" id="countdownValue">{remainingTime}</span>
          </p>
          {isAuctionOpen && (
            <p className="small timer-small">마감 10분 이내 유효 입찰 시 자동 연장(1회)</p>
          )}
        </div>

        {isAuctionReady ? (
          <div className="auction-ready-state" role="status">
            <strong>경매 시작 전입니다</strong>
            <span>입찰과 즉시구매는 경매가 시작되면 이용할 수 있습니다.</span>
          </div>
        ) : isOwnAuction ? (
          <div className="owner-auction-state" role="status">본인 경매 상품</div>
        ) : (
          <div className="bid-controls">
            <div className="field">
              <label htmlFor="bidAmount">입찰 금액</label>
              <input
                className="input"
                id="bidAmount"
                type="text"
                inputMode="numeric"
                value={displayedBidAmount}
                disabled={!isAuctionOpen || isCurrentHighestBidder}
                onChange={onBidInputChange}
              />
            </div>
            <div className="quick-row">
              <button className="chip quick" type="button" disabled={!isAuctionOpen || isCurrentHighestBidder} onClick={() => onQuickAdd(5000)}>+5천</button>
              <button className="chip quick" type="button" disabled={!isAuctionOpen || isCurrentHighestBidder} onClick={() => onQuickAdd(10000)}>+1만</button>
              <button className="chip quick" type="button" disabled={!isAuctionOpen || isCurrentHighestBidder} onClick={() => onQuickAdd(30000)}>+3만</button>
              <button className="chip quick" type="button" disabled={!isAuctionOpen || isCurrentHighestBidder} onClick={() => onQuickAdd(50000)}>+5만</button>
            </div>
            <p className="hint">현재가+{bidUnitPrice.toLocaleString('ko-KR')}원 이상 입력</p>
            <div className={`bid-point-balance${isBidPointInsufficient ? ' insufficient' : ''}`}>
              <span>사용 가능 포인트</span>
              <strong>{pointBalanceLabel}</strong>
              {isAuthenticated && <Link to="/user/point?action=charge">충전</Link>}
            </div>
          </div>
        )}

        <div className="meta-stats">
          <div className="metric-box"><span>입찰횟수</span><strong>{auction.bidCount || 0}회</strong></div>
          <div className="metric-box"><span>관심인원</span><strong>{formatNumber(auction.favoriteCount)}명</strong></div>
          <div className="metric-box"><span>조회수</span><strong>{formatNumber(auction.viewCount)}회</strong></div>
        </div>
        <div className="trade-choice">
          <span className="trade-choice-label">거래 방식</span>
          <strong>{selectedTradeName}</strong>
        </div>

        {!isOwnAuction && (
          <>
            <label className="agree hold-agree">
              <input
                id="holdAgree"
                type="checkbox"
                checked={holdAgreed}
                disabled={!isAuctionOpen}
                onChange={(event) => onHoldAgreedChange(event.target.checked)}
              /> 포인트 홀딩에 동의합니다
            </label>
            <div className="actions bid-actions">
              <button
                className="btn btn-primary"
                id="bidBtn"
                type="button"
                aria-busy={isBidPending}
                disabled={!isAuctionOpen || isCurrentHighestBidder || isBidPending || isBidPointInsufficient}
                onClick={onBidSubmit}
              >
                {!isAuctionOpen
                  ? '입찰 종료'
                  : (isCurrentHighestBidder
                    ? '최고입찰 중'
                    : (isBidPointInsufficient
                      ? '포인트 부족'
                      : (isBidPending ? '입찰 중' : '입찰하기')))}
              </button>
              <button
                className="btn btn-outline"
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
