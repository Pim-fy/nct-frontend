import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAdminServiceRequestDetail,
  fetchAdminServiceRequests,
} from '@api/adminServiceRequestApi';
import AdminFilterActions from '@components/admin/AdminFilterActions';
import AdminModal from '@components/admin/AdminModal';
import AdminPagination from '@components/admin/AdminPagination';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminTable from '@components/admin/AdminTable';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import { useAdminCategories } from '@hooks/useAdminCategories';
import { formatDateTime } from '@utils/common';
import '../notice/adminContentPages.css';
import './adminServiceRequestPage.css';

const INITIAL_FILTERS = {
  categorySn: '',
  statusCode: '',
  registeredFrom: '',
  registeredTo: '',
  keyword: '',
};
const PAGE_SIZE = 20;
const SERVICE_CATEGORY_DOMAIN = 'CATC0002';
const STATUS_OPTIONS = [
  { value: 'SVCC0001', label: '임시저장' },
  { value: 'SVCC0002', label: '공개' },
  { value: 'SVCC0003', label: '매칭완료' },
  { value: 'SVCC0004', label: '종료' },
];

const statusTone = (statusCode) => {
  if (statusCode === 'SVCC0002') return 'info';
  if (statusCode === 'SVCC0003') return 'success';
  return 'neutral';
};

const formatAmount = (value) => (
  value == null ? '-' : `${Number(value).toLocaleString('ko-KR')}원`
);

/** 담당자 7: 관리자 서비스 요청을 실제 API로 검색하고 상세 조회하는 화면이다. */
const AdminServiceRequestPage = () => {
  const [filterForm, setFilterForm] = useState(INITIAL_FILTERS);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [filterError, setFilterError] = useState('');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);

  const categoriesQuery = useAdminCategories(SERVICE_CATEGORY_DOMAIN);
  const requestsQuery = useQuery({
    queryKey: ['admin-service-requests', filters, page],
    queryFn: () => fetchAdminServiceRequests({
      keyword: filters.keyword || undefined,
      categorySn: filters.categorySn || undefined,
      statusCode: filters.statusCode || undefined,
      registeredFrom: filters.registeredFrom || undefined,
      registeredTo: filters.registeredTo || undefined,
      page,
      size: PAGE_SIZE,
    }),
  });
  const detailQuery = useQuery({
    queryKey: ['admin-service-request-detail', selected?.serviceRequestId],
    queryFn: () => fetchAdminServiceRequestDetail(selected.serviceRequestId),
    enabled: selected?.serviceRequestId != null,
  });

  const rows = requestsQuery.data?.items ?? [];
  const categories = categoriesQuery.data ?? [];
  const columns = useMemo(() => [
    { key: 'serviceRequestId', label: '요청번호', render: (value) => `#${value}` },
    {
      key: 'title',
      label: '요청명',
      className: 'admin-notice-list__title',
      render: (value) => <strong>{value}</strong>,
    },
    { key: 'categoryName', label: '카테고리' },
    {
      key: 'requesterName',
      label: '요청자',
      render: (value, row) => `${value ?? '-'} (#${row.requesterUserId})`,
    },
    { key: 'budgetAmount', label: '예산', render: formatAmount },
    {
      key: 'statusName',
      label: '상태',
      render: (value, row) => (
        <AdminStatusBadge tone={statusTone(row.statusCode)}>
          {value ?? row.statusCode}
        </AdminStatusBadge>
      ),
    },
    { key: 'registeredAt', label: '등록일', render: formatDateTime },
    {
      key: 'manage',
      label: '관리',
      render: (_, row) => (
        <button className="btn btn-outline" onClick={() => setSelected(row)} type="button">
          상세 보기
        </button>
      ),
    },
  ], []);

  const change = ({ target }) => {
    setFilterForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const submitSearch = (event) => {
    event.preventDefault();
    if (filterForm.registeredFrom && filterForm.registeredTo
      && filterForm.registeredFrom > filterForm.registeredTo) {
      setFilterError('등록 시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }
    setFilterError('');
    setPage(1);
    setFilters({ ...filterForm, keyword: filterForm.keyword.trim() });
  };

  const resetFilters = () => {
    setFilterError('');
    setPage(1);
    setFilterForm(INITIAL_FILTERS);
    setFilters(INITIAL_FILTERS);
  };

  const detail = detailQuery.data ?? selected;

  return (
    <div className="admin-content-page admin-service-page">
      <PageMeta title="서비스 요청 관리" />
      <AdminPageHeader title="서비스 요청 관리" />

      <form
        aria-label="서비스 요청 검색"
        className="card admin-service-filter"
        onSubmit={submitSearch}
      >
        <label>
          카테고리
          <select
            disabled={categoriesQuery.isLoading}
            name="categorySn"
            onChange={change}
            value={filterForm.categorySn}
          >
            <option value="">전체</option>
            {categories.map((category) => (
              <option key={category.categorySn} value={category.categorySn}>
                {category.name}{category.active ? '' : ' (사용 중지)'}
              </option>
            ))}
          </select>
        </label>
        <label>
          상태
          <select name="statusCode" onChange={change} value={filterForm.statusCode}>
            <option value="">전체</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          등록 시작일
          <input name="registeredFrom" onChange={change} type="date" value={filterForm.registeredFrom} />
        </label>
        <label>
          등록 종료일
          <input name="registeredTo" onChange={change} type="date" value={filterForm.registeredTo} />
        </label>
        <label className="admin-service-filter__search">
          검색
          <input
            name="keyword"
            onChange={change}
            placeholder="요청명 · 요청자 · 요청번호"
            value={filterForm.keyword}
          />
        </label>
        <AdminFilterActions disabled={requestsQuery.isFetching} onReset={resetFilters} />
      </form>

      {filterError && <p className="admin-service-page__filter-error" role="alert">{filterError}</p>}
      {categoriesQuery.isError && (
        <p className="admin-service-page__filter-error" role="alert">
          카테고리 필터를 불러오지 못했습니다.
          <button className="btn btn-outline" onClick={() => categoriesQuery.refetch()} type="button">
            다시 시도
          </button>
        </p>
      )}
      {requestsQuery.isError && (
        <div className="admin-service-page__state is-error" role="alert">
          서비스 요청 목록을 불러오지 못했습니다.
          <button className="btn btn-outline" onClick={() => requestsQuery.refetch()} type="button">
            다시 시도
          </button>
        </div>
      )}

      {!requestsQuery.isError && (
        <AdminSectionCard
          action={!requestsQuery.isLoading && <span>총 {requestsQuery.data?.totalItems ?? 0}건</span>}
          className="admin-notice-list admin-service-list"
          title="서비스 요청 목록"
        >
          <div className="admin-table-scroll">
            <AdminTable
              columns={columns}
              data={rows}
              emptyMessage="조건에 맞는 서비스 요청이 없습니다."
              loading={requestsQuery.isLoading}
              rowKey={(item) => item.serviceRequestId}
            />
          </div>
          <AdminPagination
            ariaLabel="서비스 요청 목록 페이지 이동"
            disabled={requestsQuery.isFetching}
            onPageChange={setPage}
            page={requestsQuery.data?.page ?? page}
            totalPages={requestsQuery.data?.totalPages ?? 0}
          />
        </AdminSectionCard>
      )}

      {selected && (
        <AdminModal onClose={() => setSelected(null)} title="서비스 요청 상세">
          {detailQuery.isLoading && (
            <div className="admin-service-page__state" aria-live="polite">상세 정보를 불러오는 중입니다.</div>
          )}
          {detailQuery.isError && (
            <div className="admin-service-page__state is-error" role="alert">
              서비스 요청 상세를 불러오지 못했습니다.
              <button className="btn btn-outline" onClick={() => detailQuery.refetch()} type="button">
                다시 시도
              </button>
            </div>
          )}
          {!detailQuery.isLoading && !detailQuery.isError && detail && (
            <section className="admin-service-detail">
              <div>
                <span>요청 상세</span>
                <h2>{detail.title}</h2>
                <p>{detail.content || '별도로 작성된 요청 내용이 없습니다.'}</p>
              </div>
              <dl>
                <dt>요청번호</dt>
                <dd>#{detail.serviceRequestId}</dd>

                <dt>요청자</dt>
                <dd>{detail.requesterName ?? '-'} (회원 #{detail.requesterUserId})</dd>

                <dt>카테고리</dt>
                <dd>{detail.categoryName ?? '-'}</dd>

                <dt>예산</dt>
                <dd>{formatAmount(detail.budgetAmount)}</dd>

                <dt>상태</dt>
                <dd>
                  <AdminStatusBadge tone={statusTone(detail.statusCode)}>
                    {detail.statusName ?? detail.statusCode}
                  </AdminStatusBadge>
                </dd>

                <dt>등록일</dt>
                <dd>{formatDateTime(detail.registeredAt)}</dd>

                <dt>수정일</dt>
                <dd>{formatDateTime(detail.updatedAt)}</dd>
              </dl>
            </section>
          )}
        </AdminModal>
      )}
    </div>
  );
};

export default AdminServiceRequestPage;
