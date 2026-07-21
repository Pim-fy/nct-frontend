import { formatPrice } from '../utils/auctionFormatters';

const AuctionBuyNowModal = ({
  isOpen,
  auction,
  selectedTradeName,
  holdAgreed,
  isBuyNowAvailable,
  isPending,
  onClose,
  onConfirm,
}) => (
  <div className={`detail-modal ${isOpen ? 'open' : ''}`} id="buyNowModal" aria-hidden={!isOpen}>
    <div className="detail-modal-panel" role="dialog" aria-modal="true" aria-labelledby="buyNowModalTitle">
      <div className="detail-modal-head">
        <h2 id="buyNowModalTitle">즉시구매 확인</h2>
        <button className="detail-modal-close" type="button" aria-label="즉시구매 확인 닫기" onClick={onClose}>&times;</button>
      </div>
      <div className="detail-modal-body">
        <p>선택한 조건으로 즉시구매를 진행하시겠습니까?</p>
        <ul className="detail-modal-list">
          <li><strong>상품명</strong><span>{auction.title}</span></li>
          <li><strong>즉시구매가</strong><span>{formatPrice(auction.instantBuyPrice)}</span></li>
          <li><strong>거래 방식</strong><span>{selectedTradeName}</span></li>
          <li><strong>포인트 홀딩</strong><span>{holdAgreed ? '동의 완료' : '동의 필요'}</span></li>
        </ul>
        <div className="actions">
          <button className="btn btn-outline" type="button" onClick={onClose}>취소</button>
          <button
            className="btn btn-primary"
            id="buyNowConfirmBtn"
            type="button"
            disabled={!isBuyNowAvailable || isPending}
            onClick={onConfirm}
          >
            {isPending ? '처리 중' : isBuyNowAvailable ? '확정' : '구매 불가'}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default AuctionBuyNowModal;
