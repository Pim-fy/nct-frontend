// @ai_generated
import { useParams } from 'react-router-dom';
import TradeDetailBuyer from '@pages/trade/TradeDetailBuyer';
import TradeDetailSeller from '@pages/trade/TradeDetailSeller';
import TradeReviewSection from '@components/trade/TradeReviewSection';
import { useAuctionTrade } from '@hooks/useAuctionTrade';
import AsyncRouteError from '@components/common/AsyncRouteError';
import TradeDetailSkeleton from '@components/trade/TradeDetailSkeleton';

export default function AuctionTradeDetailPage() {
  const { auctionId } = useParams();
  const tradeQuery = useAuctionTrade(auctionId);

  if (tradeQuery.isLoading) {
    return <TradeDetailSkeleton />;
  }

  if (tradeQuery.isError) {
    return <AsyncRouteError error={tradeQuery.error} onRetry={() => tradeQuery.refetch()} />;
  }

  if (!tradeQuery.data?.tradeId) {
    return <AsyncRouteError error={{ status: 404 }} onRetry={() => tradeQuery.refetch()} />;
  }

  const trade = tradeQuery.data;
  const viewerRole = trade.viewerRole ?? trade.userRole;
  const DetailPage = viewerRole === 'SELLER' ? TradeDetailSeller : TradeDetailBuyer;

  return (
    <div className="container auction-trade-detail-shell">
      {/* @ai_generated (담당자1, 2026-08-07): 이미 조회한 상세를 initialTrade로 주입해
          TradeDetailBuyer/Seller가 같은 상세를 다시 GET하지 않게 한다(3중 API 호출 제거).
          trade.tradeId를 key로 둬 다른 거래로 바뀌면 내부 상태를 새로 초기화한다. */}
      {/* @ai_generated (담당자1, 2026-08-07): auctionId를 넘겨야 완료 확인/발송 인증/일정 저장
          성공 후 이 컴포넌트가 부모(useAuctionTrade) 캐시를 무효화할 수 있다 - 안 넘기면 재조회를
          멈춘 대가로 완료 문구·리뷰 버튼이 새로고침 전까지 갱신되지 않는다. */}
      <DetailPage
        key={trade.tradeId}
        embedded
        tradeId={trade.tradeId}
        initialTrade={trade}
        auctionId={auctionId}
      />
      {/* @ai_generated (담당자1, 2026-08-07): UNAVAILABLE 문구를 진행 중/삭제 이력 두 경우로
          나누기 위해 거래 완료 여부를 함께 전달한다(TRDC0006 = 완료). */}
      <TradeReviewSection
        auctionId={auctionId}
        tradeId={trade.tradeId}
        isTradeCompleted={trade.tradeStatus === 'TRDC0006'}
      />
    </div>
  );
}
