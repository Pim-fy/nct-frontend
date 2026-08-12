import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { fetchReferenceCodes } from '@api/referenceApi';
import {
  getServiceTradeDetail,
  decideServiceScheduleCancellation,
  requestServiceScheduleCancellation,
  requestServiceScheduleChange,
} from '@api/serviceTradeApi';
import ViewSkeleton from '@components/skeleton/ViewSkeleton';
import TradeReviewSection from '@components/trade/TradeReviewSection';
import { SERVICE_TRADE_DISPUTE_TYPE_GROUP_CODE } from '@/constants/serviceTrade';
import ServiceTradeDetailPage from './ServiceTradeDetailPage';

const serviceTradeDetailQueryKey = (tradeId) => ['service-trade-detail', tradeId];

const SERVICE_TRADE_DISPUTE_TYPE_LABELS = {
  TRDC0011: '제공자 미방문·연락 두절',
  TRDC0013: '작업 내용·품질·일정 문제',
  TRDC0014: '보관금·환불·정산 문제',
  TRDC0015: '기타 서비스 거래 문제',
};

export default function ServiceTradeDetailRoutePage() {
  const { tradeId: tradeIdParam } = useParams();
  const queryClient = useQueryClient();
  const tradeId = Number(tradeIdParam);
  const isValidTradeId = Number.isSafeInteger(tradeId) && tradeId > 0;
  const detailQuery = useQuery({
    queryKey: serviceTradeDetailQueryKey(tradeId),
    queryFn: () => getServiceTradeDetail(tradeId),
    enabled: isValidTradeId,
    retry: false,
  });
  const disputeTypesQuery = useQuery({
    queryKey: ['reference-codes', SERVICE_TRADE_DISPUTE_TYPE_GROUP_CODE],
    queryFn: () => fetchReferenceCodes(SERVICE_TRADE_DISPUTE_TYPE_GROUP_CODE),
    enabled: isValidTradeId,
    select: (codes) => codes
      .filter((code) => code.code && SERVICE_TRADE_DISPUTE_TYPE_LABELS[code.code])
      .map((code) => ({
        code: code.code,
        label: SERVICE_TRADE_DISPUTE_TYPE_LABELS[code.code],
      })),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  // 담당자 7: 거래 상태 변경 후 상세와 마이페이지 목록/대시보드를 함께 최신화합니다.
  const refreshTradeData = () => Promise.all([
    queryClient.invalidateQueries({
      queryKey: serviceTradeDetailQueryKey(tradeId),
    }),
    queryClient.invalidateQueries({
      queryKey: ['my-service-trades'],
    }),
  ]);

  if (!isValidTradeId) {
    return (
      <main className="service-trade-detail-page">
        <section className="container service-trade-detail-page__empty">
          <h1>서비스 거래 상세</h1>
          <p>올바른 거래번호가 필요합니다.</p>
        </section>
      </main>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <main className="service-trade-detail-page">
        <section className="container">
          <ViewSkeleton />
        </section>
      </main>
    );
  }

  if (detailQuery.isError) {
    const status = detailQuery.error?.response?.status;
    const message = status === 403
      ? '이 서비스 거래의 당사자만 상세 내용을 확인할 수 있습니다.'
      : status === 404
        ? '서비스 거래 정보를 찾을 수 없습니다.'
        : detailQuery.error?.response?.data?.message ?? '서비스 거래 정보를 불러오지 못했습니다.';

    return (
      <main className="service-trade-detail-page">
        <section className="container service-trade-detail-page__empty">
          <h1>서비스 거래 상세</h1>
          <p>{message}</p>
          <button className="btn btn-primary" type="button" onClick={() => detailQuery.refetch()}>
            다시 시도
          </button>
        </section>
      </main>
    );
  }

  return (
    <ServiceTradeDetailPage
      disputeTypes={disputeTypesQuery.data ?? []}
      disputeTypesError={disputeTypesQuery.isError}
      disputeTypesLoading={disputeTypesQuery.isLoading}
      onRetryDisputeTypes={() => disputeTypesQuery.refetch()}
      onActionCompleted={refreshTradeData}
      onRequestScheduleChange={requestServiceScheduleChange}
      onRequestScheduleCancellation={requestServiceScheduleCancellation}
      onDecideScheduleCancellation={decideServiceScheduleCancellation}
      trade={detailQuery.data}
      reviewSlot={(
        <TradeReviewSection
          tradeId={tradeId}
          isTradeCompleted={detailQuery.data?.tradeStatusCode === 'TRDC0006'}
          guidanceText="요청한 작업 내용과 결과가 일치했는지, 일정 준수와 소통은 어땠는지, 좋았거나 아쉬웠던 점을 구체적으로 남겨주세요."
        />
      )}
    />
  );
}
