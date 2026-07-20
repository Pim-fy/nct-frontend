const AuctionInfoGrid = ({ auction, sellerSummary, onInfoOpen }) => (
  <section className="info-grid">
    <div
      className="info-card"
      role="button"
      tabIndex={0}
      data-detail-key="product"
      onClick={() => onInfoOpen('product')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onInfoOpen('product');
      }}
    >
      <h2>상품 설명</h2>
      <p>{auction.content || '등록된 상품 설명이 없습니다.'}</p>
      <p className="detail-hint">상세 정보 보기</p>
    </div>
    <div
      className="info-card"
      role="button"
      tabIndex={0}
      data-detail-key="seller"
      onClick={() => onInfoOpen('seller')}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onInfoOpen('seller');
      }}
    >
      <h2>판매자 정보</h2>
      <p>{sellerSummary}</p>
      <p className="detail-hint">상세 정보 보기</p>
    </div>
  </section>
);

export default AuctionInfoGrid;
