// @ai_generated
import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { getTradeDetail } from '@api/tradeApi';
import { getMyReviewRouteContext } from '@api/reviewApi';
import AsyncRouteError from '@components/common/AsyncRouteError';

const unwrapData = (response) => response?.data ?? response;

export default function LegacyReviewRedirect({ mode }) {
  const { id } = useParams();
  const location = useLocation();
  const contextQuery = useQuery({
    queryKey: ['legacy-review-route', mode, String(id)],
    queryFn: async () => {
      if (mode === 'new') {
        const trade = unwrapData(await getTradeDetail(id));
        return { auctionId: trade?.auctionId };
      }
      return unwrapData(await getMyReviewRouteContext(id));
    },
  });

  if (contextQuery.isLoading) {
    return <div className="container py-16">리뷰 경로를 확인하는 중입니다.</div>;
  }

  if (contextQuery.isError) {
    return <AsyncRouteError error={contextQuery.error} onRetry={() => contextQuery.refetch()} />;
  }

  if (!contextQuery.data?.auctionId) {
    return <AsyncRouteError error={{ status: 404 }} onRetry={() => contextQuery.refetch()} />;
  }

  return (
    <Navigate
      replace
      to={`/auction/${contextQuery.data.auctionId}/trade/review/${mode}`}
      // @ai_generated (담당자1, 2026-08-07): LegacyTradeRedirect와 달리 state를 전달하지 않아
      // ReviewListPage가 넘긴 breadcrumb state.from이 유실됐다(P4-3).
      state={location.state}
    />
  );
}
