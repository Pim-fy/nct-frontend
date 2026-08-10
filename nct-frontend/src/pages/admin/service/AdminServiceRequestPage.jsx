import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAdminServiceRequestDetail,
  fetchAdminServiceRequests,
} from '@api/adminServiceRequestApi';
import AdminFilterActions from '@components/admin/AdminFilterActions';
import AdminDetailDrawer from '@components/admin/AdminDetailDrawer';
import AdminPagination from '@components/admin/AdminPagination';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminTable from '@components/admin/AdminTable';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import { ADMIN_HIGH_VOLUME_PAGE_SIZE } from '@/constants/adminPagination';
import { useAdminCategories } from '@hooks/useAdminCategories';
import { formatDateTime } from '@utils/common';
import { formatAdminMemberIdentity } from '@utils/adminMemberIdentity';
import '../notice/adminContentPages.css';
import './adminServiceRequestPage.css';

const INITIAL_FILTERS = {
  categorySn: '',
  statusCode: '',
  registeredFrom: '',
  registeredTo: '',
  keyword: '',
};
const PAGE_SIZE = ADMIN_HIGH_VOLUME_PAGE_SIZE;
const SERVICE_CATEGORY_DOMAIN = 'CATC0002';
const STATUS_OPTIONS = [
  { value: 'SVCC0002', label: '공개' },
  { value: 'SVCC0001', label: '임시저장' },
  { value: 'SVCC0003', label: '매칭완료' },
  { value: 'SVCC0004', label: '종료' },
];

const statusTone = (statusCode) => {
  if (statusCode === 'SVCC0002') return 'info';
  if (statusCode === 'SVCC0003') return 'success';
  return 'neutral';
};

const integratedStatusTone = (statusCode) => {
  if (statusCode === 'COMPLETED') return 'success';
  if (statusCode === 'IN_PROGRESS') return 'info';
  return 'warning';
};

const tradeStatusTone = (statusCode) => {
  if (statusCode === 'TRDC0006') return 'success';
  if (statusCode === 'TRDC0007' || statusCode === 'TRDC0008') return 'danger';
  return 'info';
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
      className: 'admin-notice-list__title admin-table__long-text',
      render: (value) => <strong>{value}</strong>,
    },
    { key: 'categoryName', label: '카테고리' },
    {
      key: 'requesterUserId',
      label: '요청자',
      render: (value, row) => formatAdminMemberIdentity(row.requesterMember, value),
    },
    { key: 'budgetAmount', label: '예산', render: formatAmount },
    {
      key: 'statusName',
      label: '원본 상태',
      render: (value, row) => (
        <AdminStatusBadge tone={statusTone(row.statusCode)}>
          {value ?? row.statusCode}
        </AdminStatusBadge>
      ),
    },
    {
      key: 'integratedStatusName',
      label: '통합 상태',
      render: (value, row) => (
        <AdminStatusBadge tone={integratedStatusTone(row.integratedStatusCode)}>
          {value ?? '-'}
        </AdminStatusBadge>
      ),
    },
    {
      key: 'totalQuoteCount',
      label: '견적',
      render: (value, row) => `${value ?? 0}건${row.activeQuoteCount ? ` · 활성 ${row.activeQuoteCount}` : ''}`,
    },
    {
      key: 'tradeStatusName',
      label: '거래 흐름',
      render: (value, row) => (
        row.tradeId == null ? '-' : (
          <div className="admin-service-list__flow">
            <AdminStatusBadge tone={tradeStatusTone(row.tradeStatusCode)}>
              {value ?? row.tradeStatusCode}
            </AdminStatusBadge>
            {row.activeDisputeId != null && <span>분쟁 진행 중</span>}
            {row.activeEscrowAmount > 0 && <span>보관 {formatAmount(row.activeEscrowAmount)}</span>}
            {row.refundedPointAmount > 0 && <span>환불 {formatAmount(row.refundedPointAmount)}</span>}
            {row.settlementId != null && (
              <span>정산 {row.settlementStatusName ?? row.settlementStatusCode}</span>
            )}
          </div>
        )
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
      <PageMeta title="견적 요청 관리" />
      <AdminPageHeader title="견적 요청 관리" />

      <form
        aria-label="견적 요청 검색"
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
          견적 요청 목록을 불러오지 못했습니다.
          <button className="btn btn-outline" onClick={() => requestsQuery.refetch()} type="button">
            다시 시도
          </button>
        </div>
      )}

      {!requestsQuery.isError && (
        <AdminSectionCard
          action={!requestsQuery.isLoading && <span>총 {requestsQuery.data?.totalItems ?? 0}건</span>}
          className="admin-notice-list admin-service-list"
          title="견적 요청 목록"
        >
          <div className="admin-table-scroll">
            <AdminTable
              columns={columns}
              data={rows}
              emptyMessage="조건에 맞는 견적 요청이 없습니다."
              loading={requestsQuery.isLoading}
              rowKey={(item) => item.serviceRequestId}
            />
          </div>
          <AdminPagination
            ariaLabel="견적 요청 목록 페이지 이동"
            disabled={requestsQuery.isFetching}
            onPageChange={setPage}
            page={requestsQuery.data?.page ?? page}
            totalPages={requestsQuery.data?.totalPages ?? 0}
          />
        </AdminSectionCard>
      )}

      {selected && (
        <AdminDetailDrawer
          eyebrow="견적 요청"
          footer={(
            <button className="btn btn-outline" onClick={() => setSelected(null)} type="button">
              닫기
            </button>
          )}
          onClose={() => setSelected(null)}
          title="요청 상세"
        >
          {detailQuery.isLoading && (
            <div className="admin-service-page__state" aria-live="polite">상세 정보를 불러오는 중입니다.</div>
          )}
          {detailQuery.isError && (
            <div className="admin-service-page__state is-error" role="alert">
              견적 요청 상세를 불러오지 못했습니다.
              <button className="btn btn-outline" onClick={() => detailQuery.refetch()} type="button">
                다시 시도
              </button>
            </div>
          )}
          {!detailQuery.isLoading && !detailQuery.isError && detail && (
            <section className="admin-service-detail">
              <div className="admin-service-detail__summary">
                <div className="admin-service-detail__status-line">
                  <span>요청 #{detail.serviceRequestId}</span>
                  <div className="admin-service-detail__badges">
                    {(detail.statusName || detail.statusCode) && (
                      <AdminStatusBadge tone={statusTone(detail.statusCode)}>
                        원본 · {detail.statusName ?? detail.statusCode}
                      </AdminStatusBadge>
                    )}
                    {detail.integratedStatusName && (
                      <AdminStatusBadge tone={integratedStatusTone(detail.integratedStatusCode)}>
                        통합 · {detail.integratedStatusName}
                      </AdminStatusBadge>
                    )}
                  </div>
                </div>
                <h3>{detail.title}</h3>
              </div>

              <div className="admin-service-detail__facts">
                {detail.categoryName && (
                  <div><span>카테고리</span><strong>{detail.categoryName}</strong></div>
                )}
                {detail.budgetAmount != null && (
                  <div><span>예산</span><strong>{formatAmount(detail.budgetAmount)}</strong></div>
                )}
                {(detail.requesterName || detail.requesterUserId != null) && (
                  <div>
                    <span>요청자</span>
                    <strong>{formatAdminMemberIdentity(
                      detail.requesterMember,
                      detail.requesterUserId,
                    )}</strong>
                  </div>
                )}
                <div>
                  <span>제출 견적</span>
                  <strong>{detail.totalQuoteCount ?? 0}건 · 활성 {detail.activeQuoteCount ?? 0}건</strong>
                </div>
              </div>

              {detail.selectedQuoteId != null && (
                <section className="admin-service-detail__section is-selected-quote">
                  <h4>선택 견적</h4>
                  <dl>
                    <dt>견적</dt><dd>#{detail.selectedQuoteId}</dd>
                    <dt>제공자</dt><dd>{formatAdminMemberIdentity(
                      detail.selectedProviderMember,
                      detail.selectedProviderUserId,
                    )}</dd>
                    <dt>금액</dt><dd>{formatAmount(detail.selectedAmount)}</dd>
                    <dt>원본 상태</dt><dd>{detail.selectedQuoteStatusCode}</dd>
                  </dl>
                </section>
              )}

              {detail.tradeId != null && (
                <section className="admin-service-detail__section is-trade-flow">
                  <h4>거래 · 정산 흐름</h4>
                  <dl>
                    <dt>거래</dt><dd>#{detail.tradeId}</dd>
                    <dt>연결 견적</dt><dd>#{detail.tradeQuoteId}</dd>
                    <dt>거래 상태</dt>
                    <dd>{detail.tradeStatusName ?? detail.tradeStatusCode}</dd>
                    <dt>보관금</dt>
                    <dd>
                      {detail.activeEscrowAmount > 0
                        ? `보관 중 · ${formatAmount(detail.activeEscrowAmount)}`
                        : '활성 보관금 없음'}
                    </dd>
                    <dt>정산</dt>
                    <dd>
                      {detail.settlementId == null
                        ? '정산 건 없음'
                        : `#${detail.settlementId} · ${detail.settlementStatusName ?? detail.settlementStatusCode}`}
                    </dd>
                    {detail.settledPointAmount > 0 && (
                      <><dt>지급 원장</dt><dd>{formatAmount(detail.settledPointAmount)}</dd></>
                    )}
                    {detail.refundedPointAmount > 0 && (
                      <><dt>환불 원장</dt><dd>{formatAmount(detail.refundedPointAmount)}</dd></>
                    )}
                    <dt>진행 분쟁</dt>
                    <dd>
                      {detail.activeDisputeId == null
                        ? '없음'
                        : `#${detail.activeDisputeId} · ${detail.activeDisputeStatusName ?? detail.activeDisputeStatusCode}`}
                    </dd>
                  </dl>
                </section>
              )}

              {detail.content?.trim() && (
                <section className="admin-service-detail__section">
                  <h4>요청 내용</h4>
                  <p>{detail.content}</p>
                </section>
              )}

              {(detail.registeredAt || detail.updatedAt) && (
                <section className="admin-service-detail__section is-record">
                  <h4>기록</h4>
                  <dl>
                    {detail.registeredAt && <><dt>등록</dt><dd>{formatDateTime(detail.registeredAt)}</dd></>}
                    {detail.updatedAt && <><dt>수정</dt><dd>{formatDateTime(detail.updatedAt)}</dd></>}
                  </dl>
                </section>
              )}
            </section>
          )}
        </AdminDetailDrawer>
      )}
    </div>
  );
};

export default AdminServiceRequestPage;
