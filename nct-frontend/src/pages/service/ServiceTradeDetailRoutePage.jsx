import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getServiceTradeDetail } from '@api/serviceTradeApi';
import ViewSkeleton from '@components/skeleton/ViewSkeleton';
import ServiceTradeDetailPage from './ServiceTradeDetailPage';

const serviceTradeDetailQueryKey = (tradeId) => ['service-trade-detail', tradeId];

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

  const refreshDetail = () => queryClient.invalidateQueries({
    queryKey: serviceTradeDetailQueryKey(tradeId),
  });

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
      trade={detailQuery.data}
      onActionCompleted={refreshDetail}
    />
  );
}
