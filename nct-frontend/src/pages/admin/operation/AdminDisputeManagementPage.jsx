import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  decideAdminDispute,
  getAdminDispute,
  getAdminDisputeEvidenceBlob,
  getAdminDisputes,
} from '@api/adminDisputeApi';
import { requestDisputeChatView } from '@api/adminAuditApi';
import { fetchReferenceCodes } from '@api/referenceApi';
import AdminFilterActions from '@components/admin/AdminFilterActions';
import AdminDetailDrawer from '@components/admin/AdminDetailDrawer';
import AdminModal from '@components/admin/AdminModal';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import AdminPagination from '@components/admin/AdminPagination';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import AdminTable from '@components/admin/AdminTable';
import PageMeta from '@components/admin/PageMeta';
import { ADMIN_PAGE_SIZE } from '@/constants/adminPagination';
import { getAdminServiceTradeDetailPath } from '@/routes/adminRoutes';
import { formatAdminMemberIdentity } from '@utils/adminMemberIdentity';
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
const formatFileSize = (value) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return '-';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.ceil(bytes / 1024)).toLocaleString('ko-KR')}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};
const formatChatSender = (message) => {
  const loginId = message.senderLoginId?.trim();
  const nickname = message.senderNickname?.trim();
  if (loginId && nickname && loginId !== nickname) return `${loginId} (${nickname})`;
  return loginId || nickname || '회원 정보 없음';
};
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
  const [openingEvidenceFileSn, setOpeningEvidenceFileSn] = useState(null);
  const [evidenceReason, setEvidenceReason] = useState('');
  const [evidenceError, setEvidenceError] = useState('');
  const [chatReason, setChatReason] = useState('');
  const [chatResult, setChatResult] = useState(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const selectedDisputeSnRef = useRef(null);
  const chatRequestVersionRef = useRef(0);

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
  const chatViewMutation = useMutation({
    mutationFn: ({ disputeSn, reason: viewReason, page: requestedPage }) => (
      requestDisputeChatView(disputeSn, {
        reason: viewReason,
        page: requestedPage,
        size: 50,
      })
    ),
    onSuccess: async (data, variables) => {
      if (
        selectedDisputeSnRef.current !== variables.disputeSn
        || data?.disputeSn !== variables.disputeSn
        || chatRequestVersionRef.current !== variables.requestVersion
      ) return;
      setChatResult(data);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'audit', 'logs'] });
    },
  });

  const openDetail = (disputeSn) => {
    selectedDisputeSnRef.current = disputeSn;
    chatRequestVersionRef.current += 1;
    decisionMutation.reset();
    setDecision('');
    setReason('');
    setRefundConfirmed(false);
    setOpeningEvidenceFileSn(null);
    setEvidenceReason('');
    setEvidenceError('');
    setChatReason('');
    setChatResult(null);
    setChatModalOpen(false);
    chatViewMutation.reset();
    setSelectedDisputeSn(disputeSn);
  };

  const closeDetail = () => {
    if (chatModalOpen || decisionMutation.isPending) return;
    selectedDisputeSnRef.current = null;
    chatRequestVersionRef.current += 1;
    decisionMutation.reset();
    setSelectedDisputeSn(null);
    setDecision('');
    setReason('');
    setRefundConfirmed(false);
    setOpeningEvidenceFileSn(null);
    setEvidenceReason('');
    setEvidenceError('');
    setChatReason('');
    setChatResult(null);
    setChatModalOpen(false);
    chatViewMutation.reset();
  };

  const closeChatModal = () => {
    chatRequestVersionRef.current += 1;
    setChatModalOpen(false);
    setChatResult(null);
    chatViewMutation.reset();
  };

  /** 담당자 7 · F-OPS-005: 새 창을 사용자 클릭 시점에 확보한 뒤 보호 API의 Blob만 표시합니다. */
  const openEvidence = async (fileSn) => {
    const reason = evidenceReason.trim();
    if (!selectedDisputeSn || openingEvidenceFileSn != null || !reason) return;

    const previewWindow = window.open('about:blank', '_blank');
    if (!previewWindow) {
      setEvidenceError('브라우저의 팝업 차단을 해제한 뒤 다시 시도해 주세요.');
      return;
    }
    previewWindow.opener = null;
    previewWindow.document.title = '증빙 자료 불러오는 중';
    previewWindow.document.body.textContent = '증빙 자료를 불러오는 중입니다.';

    setOpeningEvidenceFileSn(fileSn);
    setEvidenceError('');
    try {
      const response = await getAdminDisputeEvidenceBlob(selectedDisputeSn, fileSn, reason);
      const objectUrl = URL.createObjectURL(response.data);
      previewWindow.location.replace(objectUrl);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
    } catch (error) {
      previewWindow.close();
      setEvidenceError(
        error.response?.data?.message ?? '증빙 자료를 열지 못했습니다. 파일 상태를 확인해 주세요.',
      );
    } finally {
      setOpeningEvidenceFileSn(null);
    }
  };

  /** 담당자 7 · F-OPS-014: 사유를 포함해 현재 분쟁에 연결된 채팅 페이지만 제한 조회합니다. */
  const viewDisputeChat = (requestedPage = 1) => {
    const viewReason = chatReason.trim();
    if (!selectedDisputeSn || !viewReason || chatViewMutation.isPending) return;
    setChatModalOpen(true);
    const requestVersion = chatRequestVersionRef.current + 1;
    chatRequestVersionRef.current = requestVersion;
    chatViewMutation.mutate({
      disputeSn: selectedDisputeSn,
      reason: viewReason,
      page: requestedPage,
      requestVersion,
    });
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
    {
      key: 'disputerUserSn',
      label: '분쟁 제기자',
      className: 'admin-table__compact-text',
      render: (value, row) => formatAdminMemberIdentity(row.disputerMember, value),
    },
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
      key: 'processedAt',
      label: '처리일',
      className: 'admin-table__processed-date',
      render: formatDate,
    },
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
        ['요청자', detail.requesterUserSn, detail.requesterMember],
        ['제공자', detail.providerUserSn, detail.providerMember],
      ]
    : [
        ['판매자', detail?.sellerUserSn, detail?.sellerMember],
        ['구매자', detail?.buyerUserSn, detail?.buyerMember],
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
            placeholder="분쟁 번호·거래 번호"
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
        <AdminDetailDrawer
          eyebrow="거래 분쟁"
          footer={(
            <button
              className="btn btn-outline"
              disabled={decisionMutation.isPending}
              onClick={closeDetail}
              type="button"
            >
              닫기
            </button>
          )}
          onClose={closeDetail}
          title="거래 분쟁 상세"
        >
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
                  <dt>분쟁 제기자</dt><dd>{formatAdminMemberIdentity(detail.disputerMember, detail.disputerUserSn)}</dd>
                  {participantRows.map(([label, value, member]) => (
                    <FragmentRow key={label} label={label} member={member} value={value} />
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
                      <dd>{formatAdminMemberIdentity(detail.processorMember, detail.processorUserSn)}</dd>
                      <dt>처리일</dt><dd>{formatDate(detail.processedAt)}</dd>
                      <dt>처리 사유</dt>
                      <dd className="admin-operation-detail__content">
                        {detail.processReason || '-'}
                      </dd>
                    </>
                  )}
                </dl>

                <section className="admin-operation-evidence" aria-labelledby="admin-dispute-evidence-title">
                  <div className="admin-operation-evidence__heading">
                    <strong id="admin-dispute-evidence-title">증빙 자료</strong>
                    <span>{detail.evidenceFiles?.length ?? 0}개</span>
                  </div>
                  {(detail.evidenceFiles?.length ?? 0) > 0 && (
                    <label className="admin-operation-evidence__reason">
                      <span>원문 열람 사유</span>
                      <input
                        maxLength={1000}
                        onChange={(event) => {
                          setEvidenceReason(event.target.value);
                          setEvidenceError('');
                        }}
                        placeholder="분쟁 판정에 필요한 열람 사유를 입력하세요."
                        value={evidenceReason}
                      />
                      <small>증빙 원문 열람 시 관리자·분쟁 건·사유·접속 정보가 감사로그에 기록됩니다.</small>
                    </label>
                  )}
                  {(detail.evidenceFiles?.length ?? 0) > 0 ? (
                    <ul>
                      {detail.evidenceFiles.map((file) => (
                        <li key={file.fileSn}>
                          <div>
                            <strong title={file.originalName}>{file.originalName}</strong>
                            <span>{file.extension?.toUpperCase() || 'FILE'} · {formatFileSize(file.sizeAmount)}</span>
                          </div>
                          <button
                            className="btn btn-outline"
                            disabled={openingEvidenceFileSn != null || !evidenceReason.trim()}
                            onClick={() => openEvidence(file.fileSn)}
                            type="button"
                          >
                            {openingEvidenceFileSn === file.fileSn ? '여는 중…' : '열람'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>첨부된 증빙 자료가 없습니다.</p>
                  )}
                  {evidenceError && <p className="admin-operation-error" role="alert">{evidenceError}</p>}
                </section>

                {detail.tradeTypeCode === 'TRDC0002' && (
                  <div className="admin-operation-trade-link">
                    <div>
                      <strong>서비스 거래 상세</strong>
                      <span>주소 원문과 당사자 처리 기능을 제외한 거래 정보를 확인합니다.</span>
                    </div>
                    <Link className="btn btn-outline" to={getAdminServiceTradeDetailPath(detail.tradeSn)}>
                      상세 보기
                    </Link>
                  </div>
                )}

                <section className="admin-operation-chat" aria-labelledby="admin-dispute-chat-title">
                  <div className="admin-operation-chat__heading">
                    <div>
                      <strong id="admin-dispute-chat-title">채팅 내역 열람</strong>
                      <span>사유를 입력한 뒤 별도 창에서 해당 거래의 대화를 확인합니다.</span>
                    </div>
                  </div>
                  <label className="admin-operation-chat__reason">
                    <span>열람 사유</span>
                    <input
                      maxLength={400}
                      onChange={(event) => {
                        chatRequestVersionRef.current += 1;
                        setChatReason(event.target.value);
                        setChatResult(null);
                        chatViewMutation.reset();
                      }}
                      placeholder="분쟁 판정에 필요한 채팅 열람 사유를 입력하세요."
                      value={chatReason}
                    />
                    <small>관리자·분쟁 건·열람 사유·접속 정보가 감사로그에 기록됩니다.</small>
                  </label>
                  <div className="admin-operation-chat__actions">
                    <button
                      className="btn btn-outline"
                      disabled={!chatReason.trim() || chatViewMutation.isPending}
                      onClick={() => viewDisputeChat(1)}
                      type="button"
                    >
                      {chatViewMutation.isPending ? '불러오는 중…' : '채팅 내역 보기'}
                    </button>
                  </div>
                </section>

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
        </AdminDetailDrawer>
      )}

      {chatModalOpen && (
        <div className="admin-operation-chat-modal-layer">
          <AdminModal
            onClose={closeChatModal}
            panelClassName="admin-operation-chat-modal"
            title="채팅 내역"
          >
            <div className="admin-operation-chat-modal__summary">
              <div><span>분쟁</span><strong>#{selectedDisputeSn}</strong></div>
              <div><span>거래</span><strong>#{detail?.tradeSn ?? '-'}</strong></div>
              <b>읽기 전용</b>
            </div>
            <p className="admin-operation-chat-modal__notice">
              해당 분쟁 거래에 연결된 채팅만 표시되며 열람 기록은 감사로그에 남습니다.
            </p>

            {chatViewMutation.isPending && !chatResult && (
              <div className="admin-bjn-state">채팅 내역을 불러오는 중입니다.</div>
            )}
            {chatViewMutation.isError && (
              <div className="admin-operation-chat-modal__error" role="alert">
                <p>
                  {chatViewMutation.error?.response?.data?.message
                    ?? '채팅 내역을 불러오지 못했습니다.'}
                </p>
                <button className="btn btn-outline" onClick={() => viewDisputeChat(1)} type="button">
                  다시 시도
                </button>
              </div>
            )}
            {chatResult && !chatResult.chatRoomExists && (
              <p className="admin-operation-chat__empty">이 거래에는 생성된 채팅방이 없습니다.</p>
            )}
            {chatResult?.chatRoomExists && chatResult.totalItems === 0 && (
              <p className="admin-operation-chat__empty">주고받은 채팅이 없습니다.</p>
            )}
            {(chatResult?.messages?.length ?? 0) > 0 && (
              <>
                <div className="admin-operation-chat-modal__count">
                  총 {chatResult.totalItems ?? 0}건
                </div>
                <ol className="admin-operation-chat__messages">
                  {chatResult.messages.map((message) => (
                    <li key={message.messageSn}>
                      <div className="admin-operation-chat__meta">
                        <strong>{formatChatSender(message)}</strong>
                        <time>{message.sentAt || '-'}</time>
                      </div>
                      <p>{message.content || '-'}</p>
                    </li>
                  ))}
                </ol>
              </>
            )}
            {chatResult && chatResult.totalPages > 1 && (
              <div className="admin-operation-chat__pagination">
                <button
                  className="btn btn-outline"
                  disabled={chatViewMutation.isPending || chatResult.page >= chatResult.totalPages}
                  onClick={() => viewDisputeChat(chatResult.page + 1)}
                  type="button"
                >
                  더 이전 대화
                </button>
                <span>{chatResult.page} / {chatResult.totalPages}</span>
                <button
                  className="btn btn-outline"
                  disabled={chatViewMutation.isPending || chatResult.page <= 1}
                  onClick={() => viewDisputeChat(chatResult.page - 1)}
                  type="button"
                >
                  더 최근 대화
                </button>
              </div>
            )}
            <div className="admin-operation-chat-modal__actions">
              <button className="btn btn-outline" onClick={closeChatModal} type="button">닫기</button>
            </div>
          </AdminModal>
        </div>
      )}
    </div>
  );
};

const FragmentRow = ({ label, member, value }) => (
  <>
    <dt>{label}</dt><dd>{formatAdminMemberIdentity(member, value)}</dd>
  </>
);

export default AdminDisputeManagementPage;
