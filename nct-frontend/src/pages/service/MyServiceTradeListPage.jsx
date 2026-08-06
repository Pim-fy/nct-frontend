import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
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
  { label: '거래 완료', value: 'TRDC0006' },
  { label: '거래 취소', value: 'TRDC0008' },
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

export default function MyServiceTradeListPage({ fixedRole = null }) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const listQuery = useQuery({
    queryKey: ['my-service-trades', fixedRole ?? 'ALL', activeFilter, keyword, { page, size: PAGE_SIZE }],
    queryFn: () => getMyServiceTrades({
      role: fixedRole,
      status: activeFilter === 'ALL' ? undefined : activeFilter,
      keyword,
      page,
      size: PAGE_SIZE,
    }),
    staleTime: 30 * 1000,
  });
  const countQueries = useQueries({
    queries: FILTERS.map((filter) => ({
      queryKey: ['my-service-trades', fixedRole ?? 'ALL', filter.value, 'count'],
      queryFn: () => getMyServiceTrades({
        role: fixedRole,
        status: filter.value === 'ALL' ? undefined : filter.value,
        page: 1,
        size: 1,
      }),
      staleTime: 30 * 1000,
    })),
  });
  const countByFilter = Object.fromEntries(FILTERS.map((filter, index) => [
    filter.value,
    countQueries[index].data?.totalCount ?? 0,
  ]));
  const visibleTrades = listQuery.data?.content ?? [];
  const totalPages = Math.max(1, listQuery.data?.totalPages ?? 0);
  const visiblePage = Math.min(page, totalPages);

  const handleFilterChange = (value) => {
    setActiveFilter(value);
    setPage(1);
  };

  const handleSearch = (value) => {
    setKeyword(value);
    setPage(1);
  };

  return (
    <section aria-label="견적 진행 내역 목록">
      <MyPageListSectionLayout
        title="견적 진행 내역"
        summaryItems={[
          { label: '진행 중', value: countByFilter.TRDC0003 },
          { label: '완료 확인', value: countByFilter.TRDC0005 },
          { label: '거래 완료', value: countByFilter.TRDC0006 },
        ]}
        filterItems={FILTERS.map((filter) => ({
          ...filter,
          count: countByFilter[filter.value],
        }))}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        filterAriaLabel="견적 진행 내역 상태"
        onSearch={handleSearch}
        searchAriaLabel="견적 진행 내역 검색"
        searchPlaceholder="요청 제목 또는 거래 상대 검색"
        isLoading={listQuery.isLoading || countQueries.some((query) => query.isLoading)}
      />

      {listQuery.isLoading ? (
        <MyPageListSkeleton count={4} />
      ) : listQuery.isError ? (
        <MyPageListError
          message="견적 진행 내역을 불러오지 못했습니다."
          onRetry={() => listQuery.refetch()}
        />
      ) : visibleTrades.length === 0 ? (
        <MyPageListEmpty message="해당 조건의 견적 진행 내역이 없습니다." />
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
                  title={trade.serviceRequestTitle || '견적 진행 내역'}
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
