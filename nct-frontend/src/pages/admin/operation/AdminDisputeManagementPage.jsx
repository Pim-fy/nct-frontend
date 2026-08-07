import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAdminDispute, getAdminDisputes } from '@api/adminDisputeApi';
import { fetchReferenceCodes } from '@api/referenceApi';
import AdminFilterActions from '@components/admin/AdminFilterActions';
import AdminModal from '@components/admin/AdminModal';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import AdminPagination from '@components/admin/AdminPagination';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import AdminTable from '@components/admin/AdminTable';
import PageMeta from '@components/admin/PageMeta';
import { ADMIN_PAGE_SIZE } from '@/constants/adminPagination';
import '../audit/adminAuditPage.css';
import './adminOperationPages.css';

const PAGE_SIZE = ADMIN_PAGE_SIZE;
const EMPTY_FILTERS = { disputeStatusCode: '', disputeTypeCode: '', keyword: '' };
const formatDate = (value) => (value ? String(value).replace('T', ' ').slice(0, 16) : '-');
const statusTone = (code) => ({
  TRDC0016: 'warning',
  TRDC0017: 'info',
  TRDC0018: 'success',
}[code] ?? 'neutral');

/** 담당자 7 · F-OPS-005: 관리자 분쟁 목록과 조회 전용 상세를 제공합니다. */
const AdminDisputeManagementPage = () => {
  const [filterForm, setFilterForm] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedDisputeSn, setSelectedDisputeSn] = useState(null);

  const disputeTypesQuery = useQuery({
    queryKey: ['reference', 'codes', 'TRDG04'],
    queryFn: () => fetchReferenceCodes('TRDG04'),
    staleTime: 5 * 60 * 1000,
  });
  const disputeStatusesQuery = useQuery({
    queryKey: ['reference', 'codes', 'TRDG05'],
    queryFn: () => fetchReferenceCodes('TRDG05'),
    staleTime: 5 * 60 * 1000,
  });
  const disputesQuery = useQuery({
    queryKey: ['admin', 'disputes', appliedFilters, page],
    queryFn: () => getAdminDisputes({
      ...appliedFilters,
      page,
      size: PAGE_SIZE,
    }),
  });
  const detailQuery = useQuery({
    queryKey: ['admin', 'disputes', selectedDisputeSn],
    queryFn: () => getAdminDispute(selectedDisputeSn),
    enabled: selectedDisputeSn != null,
  });

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

  const columns = [
    { key: 'disputeSn', label: '분쟁 번호', render: (value) => `#${value}` },
    { key: 'tradeSn', label: '거래 번호', render: (value) => `#${value}` },
    { key: 'disputeTypeName', label: '분쟁 유형' },
    {
      key: 'disputeStatusName',
      label: '처리 상태',
      render: (value, row) => (
        <AdminStatusBadge tone={statusTone(row.disputeStatusCode)}>{value}</AdminStatusBadge>
      ),
    },
    {
      key: 'tradeStatusName',
      label: '거래 상태',
      render: (value, row) => value || row.tradeStatusCode || '-',
    },
    {
      key: 'settlementStatusName',
      label: '정산 상태',
      render: (value, row) => (
        <AdminStatusBadge tone={row.settlementOnHold ? 'danger' : 'neutral'}>
          {row.settlementOnHold ? '보류' : (value || '정산 없음')}
        </AdminStatusBadge>
      ),
    },
    { key: 'registeredAt', label: '접수일', render: formatDate },
    {
      key: 'manage',
      label: '관리',
      render: (_, row) => (
        <button
          className="btn btn-outline admin-operation-table__action"
          onClick={() => setSelectedDisputeSn(row.disputeSn)}
          type="button"
        >
          상세
        </button>
      ),
    },
  ];

  const detail = detailQuery.data;
  const participantRows = detail?.tradeTypeCode === 'TRDC0002'
    ? [
        ['요청자', detail.requesterUserSn],
        ['제공자', detail.providerUserSn],
      ]
    : [
        ['판매자', detail?.sellerUserSn],
        ['구매자', detail?.buyerUserSn],
      ];

  return (
    <div className="admin-bjn-page admin-operation-page">
      <PageMeta title="거래 분쟁" />
      <AdminPageHeader title="거래 분쟁" />

      <form className="admin-bjn-filters admin-operation-search" onSubmit={submitSearch}>
        <label className="admin-operation-search__status">
          분쟁 유형
          <select
            disabled={disputeTypesQuery.isLoading}
            onChange={(event) => setFilterForm({
              ...filterForm,
              disputeTypeCode: event.target.value,
            })}
            value={filterForm.disputeTypeCode}
          >
            <option value="">전체 유형</option>
            {(disputeTypesQuery.data ?? []).map((option) => (
              <option key={option.code} value={option.code}>{option.name}</option>
            ))}
          </select>
        </label>
        <label className="admin-operation-search__status">
          처리 상태
          <select
            disabled={disputeStatusesQuery.isLoading}
            onChange={(event) => setFilterForm({
              ...filterForm,
              disputeStatusCode: event.target.value,
            })}
            value={filterForm.disputeStatusCode}
          >
            <option value="">전체 상태</option>
            {(disputeStatusesQuery.data ?? []).map((option) => (
              <option key={option.code} value={option.code}>{option.name}</option>
            ))}
          </select>
        </label>
        <label className="admin-operation-search__keyword">
          분쟁 검색
          <input
            maxLength={100}
            inputMode="numeric"
            onChange={(event) => setFilterForm({
              ...filterForm,
              keyword: event.target.value,
            })}
            placeholder="분쟁 번호·거래 번호·회원 번호"
            value={filterForm.keyword}
          />
        </label>
        <AdminFilterActions disabled={disputesQuery.isFetching} onReset={resetFilters} />
      </form>

      {disputesQuery.isError && (
        <div className="admin-bjn-state is-error">
          거래 분쟁 목록을 불러오지 못했습니다.
          <button className="btn btn-outline" onClick={() => disputesQuery.refetch()} type="button">
            다시 시도
          </button>
        </div>
      )}

      {!disputesQuery.isError && (
        <AdminSectionCard
          action={!disputesQuery.isLoading && <span>총 {disputesQuery.data?.totalItems ?? 0}건</span>}
          description="접수된 거래 분쟁과 거래·정산 보류 상태를 조회합니다."
          title="분쟁 목록"
        >
          <div className="admin-bjn-table-scroll">
            <AdminTable
              columns={columns}
              data={disputesQuery.data?.items ?? []}
              emptyMessage="조건에 맞는 거래 분쟁이 없습니다."
              loading={disputesQuery.isLoading}
              rowKey={(row) => row.disputeSn}
            />
          </div>
          <AdminPagination
            ariaLabel="거래 분쟁 목록 페이지 이동"
            disabled={disputesQuery.isFetching}
            onPageChange={setPage}
            page={disputesQuery.data?.page ?? page}
            totalPages={disputesQuery.data?.totalPages ?? 0}
          />
        </AdminSectionCard>
      )}

      {selectedDisputeSn && (
        <AdminModal onClose={() => setSelectedDisputeSn(null)} title="거래 분쟁 상세">
          <section className="admin-operation-detail">
            {detailQuery.isLoading && (
              <div className="admin-bjn-state">분쟁 상세를 불러오는 중입니다.</div>
            )}
            {detailQuery.isError && (
              <div className="admin-bjn-state is-error">분쟁 상세를 불러오지 못했습니다.</div>
            )}
            {detail && (
              <>
                <dl>
                  <dt>분쟁 번호</dt><dd>#{detail.disputeSn}</dd>
                  <dt>거래 번호</dt><dd>#{detail.tradeSn}</dd>
                  <dt>분쟁 유형</dt><dd>{detail.disputeTypeName || detail.disputeTypeCode}</dd>
                  <dt>처리 상태</dt>
                  <dd>
                    <AdminStatusBadge tone={statusTone(detail.disputeStatusCode)}>
                      {detail.disputeStatusName || detail.disputeStatusCode}
                    </AdminStatusBadge>
                  </dd>
                  <dt>거래 유형</dt><dd>{detail.tradeTypeName || detail.tradeTypeCode}</dd>
                  <dt>거래 상태</dt><dd>{detail.tradeStatusName || detail.tradeStatusCode}</dd>
                  <dt>분쟁 제기자</dt><dd>회원 #{detail.disputerUserSn}</dd>
                  {participantRows.map(([label, value]) => (
                    <FragmentRow key={label} label={label} value={value} />
                  ))}
                  <dt>원본 대상</dt>
                  <dd>
                    {detail.serviceRequestSn
                      ? `견적 요청 #${detail.serviceRequestSn}`
                      : `상품 #${detail.productSn}`}
                  </dd>
                  <dt>정산 상태</dt>
                  <dd>
                    <AdminStatusBadge tone={detail.settlementOnHold ? 'danger' : 'neutral'}>
                      {detail.settlementOnHold
                        ? '보류'
                        : (detail.settlementStatusName || '정산 없음')}
                    </AdminStatusBadge>
                  </dd>
                  <dt>접수일</dt><dd>{formatDate(detail.registeredAt)}</dd>
                  <dt>최종 갱신일</dt><dd>{formatDate(detail.updatedAt)}</dd>
                </dl>

                <div className="admin-operation-detail__notice">
                  <strong>증빙 자료</strong>
                  <span>
                    현재 거래 분쟁에는 증빙 파일 연결 계약이 없어 파일을 표시할 수 없습니다.
                  </span>
                </div>

                <div className="admin-operation-detail__notice">
                  <strong>거래 상세</strong>
                  <span>
                    기존 거래 상세는 당사자 전용입니다. 관리자 읽기 계약이 연결되면 이동 기능을 제공합니다.
                  </span>
                </div>
              </>
            )}
          </section>
        </AdminModal>
      )}
    </div>
  );
};

const FragmentRow = ({ label, value }) => (
  <>
    <dt>{label}</dt><dd>{value == null ? '-' : `회원 #${value}`}</dd>
  </>
);

export default AdminDisputeManagementPage;
