import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import AdminFilterActions from '@components/admin/AdminFilterActions';
import AdminPagination from '@components/admin/AdminPagination';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import AdminTable from '@components/admin/AdminTable';
import PageMeta from '@components/admin/PageMeta';
import { ADMIN_PAGE_SIZE } from '@/constants/adminPagination';
import { Skeleton } from '@components/skeleton/BaseSkeleton';
import {
  useAdminRiskEvents,
  useAdminRiskEventSummary,
} from '@hooks/useAdminRiskEvents';
import { formatDateTime } from '@utils/common';
import './operationsIntegrationPreview.css';

const EMPTY_FILTERS = { typeCode: '', processed: '', keyword: '' };

/** 담당자 7 · F-OPS-011/013: 운영 위험 이벤트를 읽기 전용으로 확인하는 화면입니다. */
const OperationsIntegrationPreview = () => {
  const [filterForm, setFilterForm] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const { keyword, processed, typeCode } = appliedFilters;

  const filters = useMemo(
    () => ({
      typeCode: typeCode || undefined,
      processed: processed || undefined,
      keyword: keyword || undefined,
      page,
      size: ADMIN_PAGE_SIZE,
    }),
    [keyword, page, processed, typeCode],
  );

  const eventsQuery = useAdminRiskEvents(filters);
  const summaryQuery = useAdminRiskEventSummary();

  const columns = useMemo(() => [
    {
      key: 'riskEventId',
      label: '이벤트 번호',
      className: 'operations-table__id',
    },
    { key: 'typeName', label: '유형' },
    {
      key: 'referenceTypeCode',
      label: '관련 대상',
      render: (value, row) => (
        value && row.referenceSn != null ? `${value} #${row.referenceSn}` : '전체 범위'
      ),
    },
    {
      key: 'content',
      label: '내용',
      className: 'operations-table__content',
    },
    {
      key: 'registeredAt',
      label: '등록일',
      render: formatDateTime,
    },
    {
      key: 'processedYn',
      label: '처리 상태',
      render: (value) => (
        <AdminStatusBadge tone={value === 'Y' ? 'success' : 'warning'}>
          {value === 'Y' ? '처리 완료' : '미처리'}
        </AdminStatusBadge>
      ),
    },
  ], []);

  const submitSearch = (event) => {
    event.preventDefault();
    setAppliedFilters({
      ...filterForm,
      keyword: filterForm.keyword.trim(),
    });
    setPage(1);
  };

  const resetFilters = () => {
    setFilterForm(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };


  return (
    <div className="operations-preview">
      <PageMeta title="위험 이벤트 조회" />

      <AdminPageHeader
        action={<AdminStatusBadge tone="info">읽기 전용</AdminStatusBadge>}
        title="위험 이벤트"
      />

      <section
        className={`operations-summary${summaryQuery.isLoading ? ' is-loading' : ''}`}
        aria-label="위험 이벤트 유형별 건수"
      >
        {summaryQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <article className="operations-summary__card" key={index}>
              <Skeleton circle height={42} style={{ flexShrink: 0, width: 42 }} />
              <div>
                <Skeleton height={13} style={{ maxWidth: 90 }} />
                <Skeleton height={25} style={{ maxWidth: 60 }} />
              </div>
            </article>
          ))
        ) : (
          (summaryQuery.data ?? []).map((item) => (
            <article className="operations-summary__card" key={item.typeCode}>
              <div className="operations-summary__icon operations-summary__icon--danger">
                <AlertTriangle size={20} />
              </div>
              <div>
                <span>{item.typeName}</span>
                <strong>{item.count}건</strong>
                <small>전체 위험 이벤트</small>
              </div>
            </article>
          ))
        )}
      </section>

      <AdminSectionCard
        action={<span>총 {eventsQuery.data?.totalItems ?? 0}건</span>}
        className="operations-card"
        description="내용에는 원문 개인정보 대신 서버에서 마스킹된 정보만 표시됩니다."
        title="위험 이벤트 목록"
      >
        <form className="operations-filters" onSubmit={submitSearch}>
          <label>
            <span>유형</span>
            <select
              onChange={(event) => setFilterForm({
                ...filterForm,
                typeCode: event.target.value,
              })}
              value={filterForm.typeCode}
            >
              <option value="">전체</option>
              {(summaryQuery.data ?? []).map((item) => (
                <option key={item.typeCode} value={item.typeCode}>
                  {item.typeName}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>처리 상태</span>
            <select
              onChange={(event) => setFilterForm({
                ...filterForm,
                processed: event.target.value,
              })}
              value={filterForm.processed}
            >
              <option value="">전체</option>
              <option value="N">미처리</option>
              <option value="Y">처리 완료</option>
            </select>
          </label>

          <label className="operations-search">
            <span>검색</span>
            <input
              onChange={(event) => setFilterForm({
                ...filterForm,
                keyword: event.target.value,
              })}
              maxLength={100}
              placeholder="번호, 유형, 내용 검색"
              value={filterForm.keyword}
            />
          </label>
          <AdminFilterActions disabled={eventsQuery.isFetching} onReset={resetFilters} />
        </form>

        <div className="operations-table-wrap">
          <AdminTable
            columns={columns}
            data={eventsQuery.isError ? [] : (eventsQuery.data?.items ?? [])}
            emptyMessage={eventsQuery.isError
              ? '위험 이벤트를 불러오지 못했습니다.'
              : '조건에 맞는 위험 이벤트가 없습니다.'}
            loading={eventsQuery.isLoading}
            rowKey={(item) => item.riskEventId}
          />
        </div>

        <AdminPagination
          ariaLabel="위험 이벤트 페이지 이동"
          className="operations-pagination"
          disabled={eventsQuery.isFetching}
          onPageChange={setPage}
          page={eventsQuery.data?.page ?? page}
          totalPages={eventsQuery.data?.totalPages ?? 0}
        />
      </AdminSectionCard>
    </div>
  );
};

export default OperationsIntegrationPreview;
