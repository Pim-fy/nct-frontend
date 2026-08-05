import { memo } from 'react';
import { ChevronRight } from 'lucide-react';
import TempComment from './TempComment';
import { SkeletonBlock } from '@components/skeleton/AuctionSkeletons';

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

export const AuctionProductDescriptionSection = memo(({ content, sectionId }) => (
  <section
    className="scroll-mt-[208px] border-b border-[#e2e5ea] py-10 md:scroll-mt-[82px] md:py-14"
    id={sectionId}
    aria-labelledby={`${sectionId}-title`}
  >
    <header className="mb-7">
      <h2
        className="m-0 text-h2 font-bold text-[#1d1d1f]"
        id={`${sectionId}-title`}
      >
        상품 설명
      </h2>
    </header>

    <TempComment content={content} />
  </section>
));

AuctionProductDescriptionSection.displayName = 'AuctionProductDescriptionSection';

export const AuctionSellerInformationSection = ({
  auction,
  selectedTradeName,
  sectionId,
  sellerRating,
  sellerReviewCount,
  isSellerTrustLoading = false,
  onSellerReviewsOpen,
  children,
}) => (
  <section
    className="scroll-mt-[208px] py-10 md:scroll-mt-[82px] md:py-14"
    id={sectionId}
    aria-labelledby={`${sectionId}-title`}
  >
    <header className="mb-7">
      <h2
        className="m-0 text-h2 font-bold text-[#1d1d1f]"
        id={`${sectionId}-title`}
      >
        판매자 정보
      </h2>
    </header>

    <dl className="m-0 border-y border-[#e2e5ea]">
      <div className={SELLER_INFO_ITEM_CLASS}>
        <dt className="text-caption font-bold text-[#666]">판매자</dt>
        <dd className="m-0 text-body-md font-semibold text-[#1d1d1f]">
          {auction.sellerName || '판매자'}
        </dd>
      </div>
      <div className={SELLER_INFO_ITEM_CLASS}>
        <dt className="text-caption font-bold text-[#666]">평점</dt>
        <dd className="m-0 text-body-md text-[#1d1d1f]">
          {isSellerTrustLoading
            ? <SkeletonBlock className="h-5 w-28" />
            : formatSellerRating(sellerRating, sellerReviewCount)}
        </dd>
      </div>
      <div className={SELLER_INFO_ITEM_CLASS}>
        <dt className="text-caption font-bold text-[#666]">받은 리뷰</dt>
        <dd className="m-0 text-body-md text-[#1d1d1f]">
          {isSellerTrustLoading
            ? <SkeletonBlock className="h-5 w-20" />
            : Number(sellerReviewCount) > 0 && typeof onSellerReviewsOpen === 'function'
              ? (
                <button
                  className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-body-md font-semibold text-primary hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  type="button"
                  onClick={onSellerReviewsOpen}
                >
                  {formatSellerReviewCount(sellerReviewCount)}
                  <ChevronRight aria-hidden="true" size={17} />
                </button>
              )
              : formatSellerReviewCount(sellerReviewCount)}
        </dd>
      </div>
      <div className={SELLER_INFO_ITEM_CLASS}>
        <dt className="text-caption font-bold text-[#666]">거래 방식</dt>
        <dd className="m-0 text-body-md text-[#1d1d1f]">{selectedTradeName}</dd>
      </div>
      {children && (
        <div className="border-b border-[#eceef1] py-4 last:border-b-0">
          <dt className="sr-only">판매자가 등록한 경매 상품</dt>
          <dd className="m-0">{children}</dd>
        </div>
      )}
    </dl>
  </section>
);
