import TempComment from './TempComment';

const SELLER_INFO_ITEM_CLASS = 'grid min-h-[72px] content-center gap-1 border-b border-[#eceef1] py-3 last:border-b-0 md:grid-cols-[140px_minmax(0,1fr)] md:items-center md:gap-6';

const formatSellerRating = (rating, reviewCount) => {
  if (reviewCount == null) return '평점 정보 없음';
  if (reviewCount === 0 || rating == null) return '등록된 평점 없음';
  return `${Number(rating).toFixed(1)} / 5.0`;
};

const formatSellerReviewCount = (reviewCount) => {
  if (reviewCount == null) return '리뷰 정보 없음';
  return `${Number(reviewCount).toLocaleString('ko-KR')}개`;
};

const AuctionInfoGrid = ({
  auction,
  selectedTradeName,
  productSectionId,
  sellerSectionId,
}) => (
  <>
    <section
      className="scroll-mt-[136px] border-b border-[#e2e5ea] py-10 md:scroll-mt-[82px] md:py-14"
      id={productSectionId}
      aria-labelledby={`${productSectionId}-title`}
    >
      <header className="mb-7">
        <h2
          className="m-0 text-[24px] leading-tight font-bold text-[#1d1d1f] md:text-[28px]"
          id={`${productSectionId}-title`}
        >
          상품 설명
        </h2>
      </header>

      <TempComment content={auction.content} />
    </section>

    <section
      className="scroll-mt-[136px] border-b border-[#e2e5ea] py-10 md:scroll-mt-[82px] md:py-14"
      id={sellerSectionId}
      aria-labelledby={`${sellerSectionId}-title`}
    >
      <header className="mb-7">
        <h2
          className="m-0 text-[24px] leading-tight font-bold text-[#1d1d1f] md:text-[28px]"
          id={`${sellerSectionId}-title`}
        >
          판매자 정보
        </h2>
      </header>

      <dl className="m-0 border-y border-[#e2e5ea]">
        <div className={SELLER_INFO_ITEM_CLASS}>
          <dt className="text-sm font-bold text-[#666]">판매자</dt>
          <dd className="m-0 text-[15px] font-semibold text-[#1d1d1f]">
            {auction.sellerName || '판매자'}
          </dd>
        </div>
        <div className={SELLER_INFO_ITEM_CLASS}>
          <dt className="text-sm font-bold text-[#666]">평점</dt>
          <dd className="m-0 text-[15px] text-[#1d1d1f]">
            {formatSellerRating(auction.sellerRating, auction.sellerReviewCount)}
          </dd>
        </div>
        <div className={SELLER_INFO_ITEM_CLASS}>
          <dt className="text-sm font-bold text-[#666]">받은 리뷰</dt>
          <dd className="m-0 text-[15px] text-[#1d1d1f]">
            {formatSellerReviewCount(auction.sellerReviewCount)}
          </dd>
        </div>
        <div className={SELLER_INFO_ITEM_CLASS}>
          <dt className="text-sm font-bold text-[#666]">거래 방식</dt>
          <dd className="m-0 text-[15px] text-[#1d1d1f]">{selectedTradeName}</dd>
        </div>
      </dl>
    </section>
  </>
);

export default AuctionInfoGrid;
