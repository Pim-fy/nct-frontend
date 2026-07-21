import { formatNumber, formatPrice } from '../utils/auctionFormatters';

const AuctionBidPanel = ({
  auction,
  currentPrice,
  bidUnitPrice,
  remainingTime,
  selectedTradeName,
  displayedBidAmount,
  holdAgreed,
  isBidPending,
  isBuyNowPending,
  isAuctionOpen,
  isBuyNowAvailable,
  isFavoritePending,
  onBidInputChange,
  onQuickAdd,
  onHoldAgreedChange,
  onBidSubmit,
  onBuyNowOpen,
  onFavoriteToggle,
}) => (
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
        </div>

        <p className="label">현재 최고가</p>
        <p className="price" id="currentPrice">{formatPrice(currentPrice)}</p>
        <p className="subcopy">
          시작가 {formatPrice(auction.startPrice)} · 즉시구매가 {formatPrice(auction.instantBuyPrice)}
        </p>
        <p className="timer price-timer" id="countdown">
          <span className="timer-label" id="countdownLabel">경매 종료까지 남은 시간</span>
          <span className="timer-value mono" id="countdownValue">{remainingTime}</span>
        </p>
        <p className="small timer-small">마감 10분 이내 유효 입찰 시 자동 연장(1회)</p>
      </div>

      <div className="bid-controls">
        <div className="field">
          <label htmlFor="bidAmount">입찰 금액</label>
          <input
            className="input"
            id="bidAmount"
            type="text"
            inputMode="numeric"
            value={displayedBidAmount}
            disabled={!isAuctionOpen}
            onChange={onBidInputChange}
          />
        </div>

        <div className="quick-row">
          <button className="chip quick" type="button" data-add="5000" disabled={!isAuctionOpen} onClick={() => onQuickAdd(5000)}>+5천</button>
          <button className="chip quick" type="button" data-add="10000" disabled={!isAuctionOpen} onClick={() => onQuickAdd(10000)}>+1만</button>
          <button className="chip quick" type="button" data-add="30000" disabled={!isAuctionOpen} onClick={() => onQuickAdd(30000)}>+3만</button>
          <button className="chip quick" type="button" data-add="50000" disabled={!isAuctionOpen} onClick={() => onQuickAdd(50000)}>+5만</button>
        </div>

        <p className="hint">현재가+{bidUnitPrice.toLocaleString('ko-KR')}원 이상 입력</p>
      </div>

      <div className="meta-stats">
        <div className="metric-box"><span>입찰횟수</span><strong>{auction.bidCount || 0}회</strong></div>
        <div className="metric-box"><span>관심인원</span><strong>{formatNumber(auction.favoriteCount)}명</strong></div>
        <div className="metric-box"><span>조회수</span><strong>{formatNumber(auction.viewCount)}회</strong></div>
      </div>

      <div className="trade-choice">
        <span className="trade-choice-label">거래 방식</span>
        <strong>{selectedTradeName}</strong>
      </div>

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
          disabled={!isAuctionOpen || isBidPending}
          onClick={onBidSubmit}
        >
          {!isAuctionOpen ? '입찰 종료' : (isBidPending ? '입찰 중' : '입찰하기')}
        </button>
        <button
          className="btn btn-outline"
          id="buyNowBtn"
          type="button"
          disabled={!isBuyNowAvailable || isBuyNowPending}
          onClick={onBuyNowOpen}
        >
          {!isAuctionOpen
            ? '즉시구매 종료'
            : (isBuyNowAvailable
              ? `즉시구매 ${formatPrice(auction.instantBuyPrice)}`
              : '즉시구매 불가')}
        </button>
      </div>
    </div>
  </aside>
);

export default AuctionBidPanel;
