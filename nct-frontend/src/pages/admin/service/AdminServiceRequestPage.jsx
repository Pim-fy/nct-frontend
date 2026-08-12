import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelAdminServiceRequest,
  changeAdminServiceRequestVisibility,
  fetchAdminServiceRequestDetail,
  fetchAdminServiceRequests,
  invalidateAdminQuote,
} from '@api/adminServiceRequestApi';
import AdminFilterActions from '@components/admin/AdminFilterActions';
import AdminDetailDrawer from '@components/admin/AdminDetailDrawer';
import AdminModal from '@components/admin/AdminModal';
import AdminPagination from '@components/admin/AdminPagination';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminTable from '@components/admin/AdminTable';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import { ADMIN_HIGH_VOLUME_PAGE_SIZE } from '@/constants/adminPagination';
import { useAdminCategories } from '@hooks/useAdminCategories';
import { formatDateTime, toast } from '@utils/common';
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
  { value: 'SVCC0004', label: '취소' },
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

const QUOTE_STATUS_META = {
  QUTC0001: { label: '제출', tone: 'info' },
  QUTC0002: { label: '수정', tone: 'info' },
  QUTC0003: { label: '만료', tone: 'neutral' },
  QUTC0004: { label: '선택', tone: 'success' },
  QUTC0005: { label: '철회', tone: 'danger' },
};

const quoteStatusMeta = (statusCode) => (
  QUOTE_STATUS_META[statusCode] ?? { label: statusCode ?? '-', tone: 'neutral' }
);

const tradeStatusTone = (statusCode) => {
  if (statusCode === 'TRDC0006') return 'success';
  if (statusCode === 'TRDC0007' || statusCode === 'TRDC0008') return 'danger';
  return 'info';
};

const formatAmount = (value) => (
  value == null ? '-' : `${Number(value).toLocaleString('ko-KR')}P`
);
const createRequestId = () => globalThis.crypto?.randomUUID?.()
  ?? `admin-service-operation-${Date.now()}-${Math.random().toString(16).slice(2)}`;

/** 담당자 7: 관리자 서비스 요청을 실제 API로 검색하고 상세 조회하는 화면이다. */
const AdminServiceRequestPage = () => {
  const [filterForm, setFilterForm] = useState(INITIAL_FILTERS);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [filterError, setFilterError] = useState('');
  const [selected, setSelected] = useState(null);
  const [operation, setOperation] = useState(null);
  const [operationReason, setOperationReason] = useState('');
  const [operationFeedback, setOperationFeedback] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

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

  const refreshServiceRequest = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-service-requests'] }),
      queryClient.invalidateQueries({
        queryKey: ['admin-service-request-detail', selected?.serviceRequestId],
      }),
    ]);
  };
  const operationMutation = useMutation({
    mutationFn: (variables) => {
      if (variables.type === 'CANCEL_REQUEST') return cancelAdminServiceRequest(variables);
      if (variables.type === 'CHANGE_VISIBILITY') {
        return changeAdminServiceRequestVisibility(variables);
      }
      return invalidateAdminQuote(variables);
    },
    onSuccess: async (_, variables) => {
      await refreshServiceRequest();
      toast({
        icon: 'success',
        title: variables.successMessage,
        timer: 1800,
      });
      setOperation(null);
      setOperationReason('');
      setOperationFeedback('');
    },
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
    { key: 'categoryName', label: '카테고리', className: 'admin-table__compact-text' },
    {
      key: 'requesterUserId',
      label: '요청자',
      className: 'admin-table__compact-text',
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
  const quotes = detail?.quotes ?? [];
  const canOperateRequest = detail?.statusCode === 'SVCC0002' && detail?.tradeId == null;

  const openOperation = (nextOperation) => {
    setOperation(nextOperation);
    setOperationReason('');
    setOperationFeedback('');
  };

  const closeOperation = () => {
    if (operationMutation.isPending) return;
    setOperation(null);
    setOperationReason('');
    setOperationFeedback('');
  };

  const submitOperation = async () => {
    const reason = operationReason.trim();
    if (!operation || !reason || operationMutation.isPending) return;
    setOperationFeedback('');
    try {
      await operationMutation.mutateAsync({
        ...operation,
        serviceRequestId: detail.serviceRequestId,
        reason,
        requestId: createRequestId(),
      });
    } catch (error) {
      setOperationFeedback(
        error?.response?.data?.message || '운영 처리를 완료하지 못했습니다.',
      );
    }
  };

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
                    <AdminStatusBadge tone={detail.visible ? 'success' : 'danger'}>
                      {detail.visible ? '노출' : '숨김'}
                    </AdminStatusBadge>
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

              <section className="admin-service-detail__section is-quotes">
                <div className="admin-service-detail__section-heading">
                  <h4>제출 견적</h4>
                  <span>{quotes.length}건</span>
                </div>
                {quotes.length === 0 ? (
                  <p className="admin-service-detail__empty">제출된 견적이 없습니다.</p>
                ) : (
                  <div className="admin-service-detail__quote-list">
                    {quotes.map((quote) => {
                      const quoteStatus = quoteStatusMeta(quote.statusCode);
                      return (
                        <article
                          className={`admin-service-detail__quote-card${quote.selected ? ' is-selected' : ''}`}
                          key={quote.quoteId}
                        >
                          <div className="admin-service-detail__quote-header">
                            <strong>견적 #{quote.quoteId}</strong>
                            <AdminStatusBadge tone={quoteStatus.tone}>
                              {quoteStatus.label}
                            </AdminStatusBadge>
                          </div>
                          <dl>
                            <div className="admin-service-detail__quote-provider">
                              <dt>제공자</dt>
                              <dd>{formatAdminMemberIdentity(
                                quote.providerMember,
                                quote.providerUserId,
                              )}</dd>
                            </div>
                            <div>
                              <dt>금액</dt>
                              <dd>{formatAmount(quote.amount)}</dd>
                            </div>
                            <div>
                              <dt>최초 제출일</dt>
                              <dd>{formatDateTime(quote.submittedAt)}</dd>
                            </div>
                            <div>
                              <dt>수정일</dt>
                              <dd>{formatDateTime(quote.updatedAt)}</dd>
                            </div>
                            <div>
                              <dt>수정 횟수</dt>
                              <dd>{quote.reviseCount ?? 0}회</dd>
                            </div>
                          </dl>
                          {canOperateRequest
                            && ['QUTC0001', 'QUTC0002'].includes(quote.statusCode) && (
                              <div className="admin-service-detail__quote-actions">
                                <button
                                  className="btn btn-outline"
                                  onClick={() => openOperation({
                                    type: 'INVALIDATE_QUOTE',
                                    quoteId: quote.quoteId,
                                    title: `견적 #${quote.quoteId} 무효화`,
                                    description: '제출·수정 상태의 견적만 철회 상태로 전환합니다.',
                                    confirmLabel: '견적 무효화',
                                    successMessage: `견적 #${quote.quoteId}를 무효화했습니다.`,
                                  })}
                                  type="button"
                                >
                                  견적 무효화
                                </button>
                              </div>
                            )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

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

              {canOperateRequest && (
                <section className="admin-service-detail__section is-operations">
                  <h4>운영 처리</h4>
                  <p>거래 생성 전 공개 요청만 숨김·복구하거나 취소할 수 있습니다.</p>
                  <div className="admin-service-detail__operation-actions">
                    <button
                      className="btn btn-outline"
                      onClick={() => openOperation({
                        type: 'CHANGE_VISIBILITY',
                        visible: !detail.visible,
                        title: detail.visible ? '견적 요청 숨김' : '견적 요청 노출 복구',
                        description: detail.visible
                          ? '요청과 견적 이력은 유지하고 제공자 목록에서만 숨깁니다.'
                          : '제공자 견적 요청 목록에 다시 노출합니다.',
                        confirmLabel: detail.visible ? '숨김 처리' : '노출 복구',
                        successMessage: detail.visible
                          ? '견적 요청을 숨김 처리했습니다.'
                          : '견적 요청 노출을 복구했습니다.',
                      })}
                      type="button"
                    >
                      {detail.visible ? '요청 숨김' : '노출 복구'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => openOperation({
                        type: 'CANCEL_REQUEST',
                        title: '견적 요청 취소',
                        description: '요청을 취소하고 제출·수정 상태의 활성 견적을 함께 철회합니다.',
                        confirmLabel: '요청 취소',
                        successMessage: '견적 요청을 취소했습니다.',
                      })}
                      type="button"
                    >
                      요청 취소
                    </button>
                  </div>
                </section>
              )}
            </section>
          )}
        </AdminDetailDrawer>
      )}

      {operation && (
        <AdminModal onClose={closeOperation} title={operation.title}>
          <section className="admin-service-operation-modal">
            <p>{operation.description}</p>
            <label>
              처리 사유
              <textarea
                disabled={operationMutation.isPending}
                maxLength="1000"
                onChange={(event) => setOperationReason(event.target.value)}
                placeholder="관리자 처리 사유를 입력하세요."
                value={operationReason}
              />
            </label>
            {!operationReason.trim() && (
              <p className="admin-service-operation-modal__validation" role="alert">
                처리 사유를 입력해야 실행할 수 있습니다.
              </p>
            )}
            {operationFeedback && (
              <p className="admin-service-operation-modal__feedback" role="alert">
                {operationFeedback}
              </p>
            )}
            <div className="admin-service-operation-modal__actions">
              <button
                className="btn btn-outline"
                disabled={operationMutation.isPending}
                onClick={closeOperation}
                type="button"
              >
                취소
              </button>
              <button
                className="btn btn-danger"
                disabled={!operationReason.trim() || operationMutation.isPending}
                onClick={submitOperation}
                type="button"
              >
                {operationMutation.isPending ? '처리 중…' : operation.confirmLabel}
              </button>
            </div>
          </section>
        </AdminModal>
      )}
    </div>
  );
};

export default AdminServiceRequestPage;
