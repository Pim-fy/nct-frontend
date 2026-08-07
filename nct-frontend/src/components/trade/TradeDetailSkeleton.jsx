// @ai_generated
import { Skeleton } from '@components/skeleton/BaseSkeleton';

export default function TradeDetailSkeleton({ embedded = false, role = 'buyer' }) {
  return (
    <div className={`trade-detail-page trade-detail-page--${role}`}>
      <main
        className={embedded ? 'trade-detail-page__content' : 'container'}
        aria-busy="true"
        aria-label="거래 상세 정보를 불러오는 중"
      >
        <div className="trade-progress">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton height={38} key={index} style={{ flex: 1 }} />
          ))}
        </div>
        <div className="trade-detail-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton height={140} key={index} style={{ borderRadius: 12 }} />
          ))}
        </div>
      </main>
    </div>
  );
}
