import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  decideAdminDispute,
  getAdminDispute,
  getAdminDisputes,
} from '@api/adminDisputeApi';
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
const DECISIONS = [
  { value: 'COMPLETE', label: '처리 완료', description: '분쟁 전 거래 상태로 복구하고 보류 정산을 재개합니다.' },
  { value: 'REFUND', label: '전액 환불', description: '거래를 취소하고 구매자 또는 요청자에게 보관금 전액을 환불합니다.' },
  { value: 'HOLD', label: '정산 보류', description: '분쟁을 처리 중으로 유지하고 거래와 정산 보류를 계속합니다.' },
  { value: 'REJECT', label: '반려', description: '분쟁을 반려하고 분쟁 전 거래 상태와 정산 흐름을 복구합니다.' },
];
const formatDate = (value) => (value ? String(value).replace('T', ' ').slice(0, 16) : '-');
const statusTone = (code) => ({
  TRDC0016: 'warning',
  TRDC0017: 'info',
  TRDC0018: 'success',
}[code] ?? 'neutral');

/** 담당자 7 · F-OPS-005/006: 관리자 분쟁 조회와 판정 처리를 제공합니다. */
const AdminDisputeManagementPage = () => {
  const queryClient = useQueryClient();
  const [filterForm, setFilterForm] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedDisputeSn, setSelectedDisputeSn] = useState(null);
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [refundConfirmed, setRefundConfirmed] = useState(false);

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
  const decisionMutation = useMutation({
    mutationFn: (payload) => decideAdminDispute(selectedDisputeSn, payload),
    onSuccess: async () => {
      setDecision('');
      setReason('');
      setRefundConfirmed(false);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    },
  });

  const openDetail = (disputeSn) => {
    decisionMutation.reset();
    setDecision('');
    setReason('');
    setRefundConfirmed(false);
    setSelectedDisputeSn(disputeSn);
  };

  const closeDetail = () => {
    if (decisionMutation.isPending) return;
    decisionMutation.reset();
    setSelectedDisputeSn(null);
    setDecision('');
    setReason('');
    setRefundConfirmed(false);
  };

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
          onClick={() => openDetail(row.disputeSn)}
          type="button"
        >
          상세
        </button>
      ),
    },
  ];

  const detail = detailQuery.data;
  const canDecide = ['TRDC0016', 'TRDC0017'].includes(detail?.disputeStatusCode);
  const selectedDecision = DECISIONS.find((option) => option.value === decision);
  const canSubmitDecision = Boolean(
    decision
    && reason.trim()
    && (decision !== 'REFUND' || refundConfirmed),
  );
  const submitDecision = (event) => {
    event.preventDefault();
    if (!canDecide || !canSubmitDecision || decisionMutation.isPending) return;
    decisionMutation.mutate({ decision, reason: reason.trim() });
  };
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
        <AdminModal onClose={closeDetail} title="거래 분쟁 상세">
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
                  <dt>분쟁 내용</dt>
                  <dd className="admin-operation-detail__content">
                    {detail.disputeContent || '-'}
                  </dd>
                  <dt>접수일</dt><dd>{formatDate(detail.registeredAt)}</dd>
                  <dt>최종 갱신일</dt><dd>{formatDate(detail.updatedAt)}</dd>
                  {!canDecide && (
                    <>
                      <dt>판정 결과</dt>
                      <dd>{detail.disputeResultName || detail.disputeResultCode || '반려'}</dd>
                      <dt>처리자</dt>
                      <dd>{detail.processorUserSn ? `관리자 #${detail.processorUserSn}` : '-'}</dd>
                      <dt>처리일</dt><dd>{formatDate(detail.processedAt)}</dd>
                      <dt>처리 사유</dt>
                      <dd className="admin-operation-detail__content">
                        {detail.processReason || '-'}
                      </dd>
                    </>
                  )}
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

                {canDecide && (
                  <form className="admin-operation-decision" onSubmit={submitDecision}>
                    <div className="admin-operation-decision__heading">
                      <strong>관리자 판정</strong>
                      <span>거래·정산·보관금 처리가 하나의 트랜잭션으로 실행됩니다.</span>
                    </div>
                    <label className="admin-operation-decision__select">
                      판정 결과
                      <select
                        disabled={decisionMutation.isPending}
                        onChange={(event) => {
                          setDecision(event.target.value);
                          setRefundConfirmed(false);
                          decisionMutation.reset();
                        }}
                        value={decision}
                      >
                        <option value="">판정 결과를 선택하세요</option>
                        {DECISIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    {selectedDecision && (
                      <p className={decision === 'REFUND'
                        ? 'admin-operation-decision__warning'
                        : 'admin-operation-decision__description'}>
                        {selectedDecision.description}
                      </p>
                    )}
                    <label className="admin-operation-detail__reason">
                      처리 사유
                      <textarea
                        disabled={decisionMutation.isPending}
                        maxLength={1000}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="판정 근거와 후속 처리 내용을 입력하세요."
                        value={reason}
                      />
                    </label>
                    {decision === 'REFUND' && (
                      <label className="admin-operation-confirm">
                        <input
                          checked={refundConfirmed}
                          disabled={decisionMutation.isPending}
                          onChange={(event) => setRefundConfirmed(event.target.checked)}
                          type="checkbox"
                        />
                        거래 취소와 보관금 전액 환불이 실행됨을 확인했습니다.
                      </label>
                    )}
                    {decisionMutation.isError && (
                      <p className="admin-operation-error" role="alert">
                        {decisionMutation.error?.response?.data?.message
                          ?? '분쟁 판정에 실패했습니다. 현재 상태를 다시 확인해 주세요.'}
                      </p>
                    )}
                    <div className="admin-operation-actions">
                      <button
                        className="btn btn-outline"
                        disabled={decisionMutation.isPending}
                        onClick={closeDetail}
                        type="button"
                      >
                        닫기
                      </button>
                      <button
                        className="btn btn-primary"
                        disabled={!canSubmitDecision || decisionMutation.isPending}
                        type="submit"
                      >
                        {decisionMutation.isPending ? '처리 중…' : '판정 적용'}
                      </button>
                    </div>
                  </form>
                )}
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
