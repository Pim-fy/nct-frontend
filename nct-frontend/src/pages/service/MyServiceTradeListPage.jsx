import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BriefcaseBusiness } from 'lucide-react';
import { getMyServiceTrades } from '@api/serviceTradeApi';
import MyPageListSectionLayout from '@components/mypage/MyPageListSectionLayout';
import MyPageListItem from '@components/mypage/MyPageListItem';
import MyPageListEmpty from '@components/mypage/MyPageListEmpty';
import MyPageListError from '@components/mypage/MyPageListError';
import MyPageStatusBadge from '@components/mypage/MyPageStatusBadge';
import MyPageListSkeleton from '@components/skeleton/MyPageListSkeleton';
import Pagination from '@components/common/Pagination';
import { getServiceTradeStatus } from './serviceTradeStatus';

const PAGE_SIZE = 10;

const FILTERS = [
  { label: '전체', value: 'ALL' },
  { label: '진행 중', value: 'TRDC0003' },
  { label: '완료 확인', value: 'TRDC0005' },
  { label: '보류', value: 'TRDC0007' },
  { label: '종료', value: 'CLOSED' },
];

const STATUS_BADGE = {
  progress: 'badge-primary',
  pending: 'badge-warning',
  complete: 'badge-success',
  problem: 'badge-danger',
  canceled: 'badge-outline-gray',
};

const formatPoint = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? `${amount.toLocaleString('ko-KR')}P` : '-';
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const matchesFilter = (trade, filter) => {
  if (filter === 'ALL') return true;
  if (filter === 'CLOSED') {
    return trade.tradeStatusCode === 'TRDC0006' || trade.tradeStatusCode === 'TRDC0008';
  }
  return trade.tradeStatusCode === filter;
};

export default function MyServiceTradeListPage({ fixedRole = null }) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const listQuery = useQuery({
    queryKey: ['my-service-trades', fixedRole ?? 'ALL'],
    queryFn: () => getMyServiceTrades({ role: fixedRole }),
    staleTime: 30 * 1000,
  });

  const trades = useMemo(() => (
    Array.isArray(listQuery.data) ? listQuery.data : []
  ), [listQuery.data]);
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredTrades = useMemo(() => trades.filter((trade) => {
    if (!matchesFilter(trade, activeFilter)) return false;
    if (!normalizedKeyword) return true;

    return [
      trade.serviceRequestTitle,
      trade.quoteSummary,
      trade.counterpartNickname,
    ].some((value) => String(value ?? '').toLowerCase().includes(normalizedKeyword));
  }), [activeFilter, normalizedKeyword, trades]);

  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / PAGE_SIZE));
  const visiblePage = Math.min(page, totalPages);
  const visibleTrades = filteredTrades.slice(
    (visiblePage - 1) * PAGE_SIZE,
    visiblePage * PAGE_SIZE,
  );
  const countByStatus = (statusCode) => (
    trades.filter((trade) => trade.tradeStatusCode === statusCode).length
  );
  const filterCount = (filter) => trades.filter((trade) => matchesFilter(trade, filter)).length;

  const handleFilterChange = (value) => {
    setActiveFilter(value);
    setPage(1);
  };

  const handleSearch = (value) => {
    setKeyword(value);
    setPage(1);
  };

  return (
    <section aria-label="서비스 거래 목록">
      <MyPageListSectionLayout
        title="서비스 거래"
        summaryItems={[
          { label: '진행 중', value: countByStatus('TRDC0003') },
          { label: '완료 확인', value: countByStatus('TRDC0005') },
          { label: '거래 완료', value: countByStatus('TRDC0006') },
        ]}
        filterItems={FILTERS.map((filter) => ({
          ...filter,
          count: filterCount(filter.value),
        }))}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        filterAriaLabel="서비스 거래 상태"
        onSearch={handleSearch}
        searchAriaLabel="서비스 거래 검색"
        searchPlaceholder="요청 제목 또는 거래 상대 검색"
        isLoading={listQuery.isLoading}
      />

      {listQuery.isLoading ? (
        <MyPageListSkeleton count={4} />
      ) : listQuery.isError ? (
        <MyPageListError
          message="서비스 거래 목록을 불러오지 못했습니다."
          onRetry={() => listQuery.refetch()}
        />
      ) : visibleTrades.length === 0 ? (
        <MyPageListEmpty message="해당 조건의 서비스 거래가 없습니다." />
      ) : (
        <>
          <div className="history-list">
            {visibleTrades.map((trade) => {
              const status = getServiceTradeStatus(trade.tradeStatusCode);
              const counterpartLabel = trade.viewerRole === 'REQUESTER' ? '제공자' : '의뢰자';

              return (
                <MyPageListItem
                  key={trade.tradeId}
                  imageFallback={<BriefcaseBusiness aria-hidden="true" size={34} strokeWidth={1.6} />}
                  badge={(
                    <MyPageStatusBadge className={STATUS_BADGE[status.tone] ?? 'badge-outline-gray'}>
                      {status.label}
                    </MyPageStatusBadge>
                  )}
                  title={trade.serviceRequestTitle || '서비스 거래'}
                  actions={(
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/service-trades/${trade.tradeId}`)}
                    >
                      거래 상세
                    </button>
                  )}
                >
                  <p>{counterpartLabel} {trade.counterpartNickname || '-'} · 거래금액 {formatPoint(trade.tradeAmount)}</p>
                  <p>거래 시작 {formatDate(trade.createdAt)} · {trade.quoteSummary || '선택 견적 내용 없음'}</p>
                </MyPageListItem>
              );
            })}
          </div>

          <Pagination
            page={visiblePage}
            totalPages={totalPages}
            onPageChange={setPage}
            maxVisiblePages={5}
          />
        </>
      )}
    </section>
  );
}
