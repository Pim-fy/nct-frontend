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
        {/* @ai_generated (담당자1, 2026-08-07): trade-progress → trade-stepper 개편에 맞춰
            3단계로 조정(새 스테퍼는 항상 3단계). trade-stepper는 여전히 display:flex라
            자리 배치는 맞는다. */}
        <div className="trade-stepper">
          {Array.from({ length: 3 }).map((_, index) => (
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
