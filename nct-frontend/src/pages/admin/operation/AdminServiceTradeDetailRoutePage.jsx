import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getAdminServiceTradeDetail } from '@api/serviceTradeApi';
import ViewSkeleton from '@components/skeleton/ViewSkeleton';
import PageMeta from '@components/admin/PageMeta';
import ServiceTradeDetailPage from '@pages/service/ServiceTradeDetailPage';

/** 담당자 7 · F-OPS-005: 관리자 전용 마스킹 거래 상세를 공통 표현 화면에 연결합니다. */
export default function AdminServiceTradeDetailRoutePage() {
  const { tradeId: tradeIdParam } = useParams();
  const tradeId = Number(tradeIdParam);
  const isValidTradeId = Number.isSafeInteger(tradeId) && tradeId > 0;
  const detailQuery = useQuery({
    queryKey: ['admin', 'service-trades', tradeId],
    queryFn: () => getAdminServiceTradeDetail(tradeId),
    enabled: isValidTradeId,
    retry: false,
  });

  if (!isValidTradeId) {
    return <AdminTradeDetailState message="올바른 거래번호가 필요합니다." />;
  }

  if (detailQuery.isLoading) {
    return (
      <main className="service-trade-detail-page">
        <PageMeta title="서비스 거래 상세" />
        <section className="container"><ViewSkeleton /></section>
      </main>
    );
  }

  if (detailQuery.isError) {
    const status = detailQuery.error?.response?.status;
    const message = status === 404
      ? '서비스 거래 정보를 찾을 수 없습니다.'
      : status === 403
        ? '관리자 거래 조회 권한이 없습니다.'
        : detailQuery.error?.response?.data?.message ?? '서비스 거래 정보를 불러오지 못했습니다.';

    return <AdminTradeDetailState message={message} onRetry={() => detailQuery.refetch()} />;
  }

  return (
    <>
      <PageMeta title="서비스 거래 상세" />
      <ServiceTradeDetailPage
        backLabel="분쟁 목록으로"
        backPath="/admin/disputes"
        trade={detailQuery.data}
      />
    </>
  );
}

const AdminTradeDetailState = ({ message, onRetry = null }) => (
  <main className="service-trade-detail-page">
    <PageMeta title="서비스 거래 상세" />
    <section className="container service-trade-detail-page__empty">
      <h1>서비스 거래 상세</h1>
      <p>{message}</p>
      <div className="service-trade-dispute-form__actions">
        <Link className="btn btn-ghost" to="/admin/disputes">분쟁 목록으로</Link>
        {onRetry && (
          <button className="btn btn-primary" onClick={onRetry} type="button">다시 시도</button>
        )}
      </div>
    </section>
  </main>
);
