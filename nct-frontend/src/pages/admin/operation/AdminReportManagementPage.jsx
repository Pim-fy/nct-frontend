import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Paperclip, ShieldAlert, UnlockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchAdminAuctionOverview } from '@api/adminAuctionApi';
import {
  decideAdminReport,
  getAdminReportFileBlob,
  getAdminReport,
  getAdminReports,
  releaseAdminReportSanction,
} from '@api/adminReportApi';
import AdminDetailDrawer from '@components/admin/AdminDetailDrawer';
import AdminFilterActions from '@components/admin/AdminFilterActions';
import AdminModal from '@components/admin/AdminModal';
import AdminPagination from '@components/admin/AdminPagination';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import AdminTable from '@components/admin/AdminTable';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import PageMeta from '@components/admin/PageMeta';
import { ADMIN_PAGE_SIZE } from '@/constants/adminPagination';
import { formatAdminMemberIdentity } from '@utils/adminMemberIdentity';
import { formatDateTime, toast } from '@utils/common';
import { REPORT_TYPE_FALLBACK_NAMES } from '@/constants/abuseReportTypes';
import '../audit/adminAuditPage.css';
import './adminOperationPages.css';

const REPORT_STATUS = {
  ABRC0005: { label: '접수', tone: 'warning' },
  ABRC0006: { label: '처리 중', tone: 'info' },
  ABRC0007: { label: '완료', tone: 'success' },
  ABRC0008: { label: '반려', tone: 'neutral' },
};

const REPORT_REFERENCE_NAMES = {
  REFC0001: '회원',
  REFC0002: '상품',
  REFC0003: '경매',
  REFC0004: '입찰',
  REFC0005: '거래',
  REFC0006: '거래 분쟁',
  REFC0007: '서비스 요청',
  REFC0008: '견적',
  REFC0009: '포인트 원장',
  REFC0010: '시스템 설정',
  REFC0011: '공지',
  REFC0012: '상품 댓글·문의',
  REFC0013: '1:1 문의',
};

const TRADE_STATUS_NAMES = {
  TRDC0003: '진행 중',
  TRDC0004: '배송·직거래 중',
  TRDC0005: '상대 확인 대기',
  TRDC0006: '완료',
  TRDC0007: '보류',
  TRDC0008: '취소',
};

const formatDate = (value) => (value ? String(value).replace('T', ' ').slice(0, 16) : '-');
const PAGE_SIZE = ADMIN_PAGE_SIZE;
const EMPTY_FILTERS = { statusCode: '', keyword: '' };
const ENFORCEMENT_OPTIONS = [
  {
    value: 'NONE',
    label: '제재 없음',
    description: '신고 위반만 확정하고 계정이나 진행 중인 업무는 변경하지 않습니다.',
  },
  {
    value: 'TEMPORARY_SUSPENSION_7_DAYS',
    label: '7일 이용정지',
    description: '계정과 진행 중인 경매, 서비스 요청, 거래를 멈추고 해제 시 남은 기간으로 복구합니다.',
  },
  {
    value: 'PERMANENT_SUSPENSION',
    label: '영구 이용정지',
    description: '취소 가능한 경매와 요청을 종료하고, 안전하게 자동 취소할 수 없는 거래는 관리자 검토 상태로 둡니다.',
  },
];
const IMPACT_ACTION_NAMES = {
  PAUSED: '일시정지',
  CANCELED: '취소',
  BID_CANCELED: '최고입찰 취소',
  HELD_FOR_REVIEW: '관리자 검토 보류',
};
const DISPUTE_STATUS_NAMES = {
  TRDC0016: '접수',
  TRDC0017: '처리 중',
  TRDC0018: '처리 완료',
  TRDC0019: '반려',
};
const DISPUTE_TYPE_NAMES = {
  TRDC0011: '미방문·연락 두절',
  TRDC0012: '분실·파손·오배송',
  TRDC0013: '서비스 품질·일정',
  TRDC0014: '환불·보관금·정산',
  TRDC0015: '기타',
};
const DISPUTE_RESULT_NAMES = {
  TRDC0021: '처리 완료',
  TRDC0022: '전액 환불',
  TRDC0023: '정산 보류',
};
const IMPACT_STATUS_NAMES = {
  ACTIVE: '적용 중',
  RELEASE_PENDING: '복구 대기',
  RESOLVED: '처리 완료',
  RESTORED: '복구 완료',
  SKIPPED: '자동 복구 제외',
};
const reportTypeName = (code, serverName) => (
  serverName?.trim() || REPORT_TYPE_FALLBACK_NAMES[code] || code || '-'
);
const reportStatus = (code) => REPORT_STATUS[code] ?? { label: code ?? '-', tone: 'neutral' };
const isActionableStatus = (code) => code === 'ABRC0005' || code === 'ABRC0006';
const formatAmount = (value) => (
  value == null ? '-' : `${Number(value).toLocaleString('ko-KR')}P`
);
const auctionStatusTone = (statusCode) => {
  if (statusCode === 'AUCC0005' || statusCode === 'AUCC0006') return 'danger';
  if (statusCode === 'AUCC0002') return 'info';
  return 'neutral';
};
const isAuctionReference = (referenceTypeCode) => (
  String(referenceTypeCode ?? '').trim().toUpperCase() === 'REFC0003'
);
const renderReportReference = ({
  isList = false,
  referenceTypeCode,
  referenceSn,
  targetName,
}) => {
  const normalizedTargetName = targetName?.trim();
  if (!referenceTypeCode && referenceSn == null && !normalizedTargetName) {
    return <span className="admin-operation-reference__empty">관련 항목 없음</span>;
  }

  const referenceName = REPORT_REFERENCE_NAMES[referenceTypeCode]
    ?? referenceTypeCode
    ?? '직접 입력';
  const displayName = normalizedTargetName || referenceName;
  const hasDistinctTitle = Boolean(normalizedTargetName && normalizedTargetName !== referenceName);
  const metaText = referenceSn == null
    ? referenceName
    : hasDistinctTitle
      ? `${referenceName} · #${referenceSn}`
      : `#${referenceSn}`;

  return (
    <div className={`admin-operation-reference${isList ? ' admin-operation-reference--list' : ''}`}>
      <div className="admin-operation-reference__summary">
        <strong title={displayName}>{displayName}</strong>
        <span>{metaText}</span>
      </div>
    </div>
  );
};
const formatProcessor = (value, member) => {
  if (!value) return '-';
  return /^\d+$/.test(String(value))
    ? formatAdminMemberIdentity(member, Number(value))
    : value;
};

/** 담당자 7 · F-OPS-007: 처리 전후 신고를 한 목록에서 조회하고 관리합니다. */
const AdminReportManagementPage = () => {
  const [filterForm, setFilterForm] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [selectedReportSn, setSelectedReportSn] = useState(null);
  const [reason, setReason] = useState('');
  const [enforcementAction, setEnforcementAction] = useState('NONE');
  const [permanentConfirmed, setPermanentConfirmed] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');
  const [fileViewReason, setFileViewReason] = useState('');
  const [fileError, setFileError] = useState('');
  const [openingFileSn, setOpeningFileSn] = useState(null);
  const [referenceAuctionSn, setReferenceAuctionSn] = useState(null);

  const reportsQuery = useQuery({
    queryKey: ['admin', 'reports', 'search', appliedFilters, page],
    queryFn: () => getAdminReports({
      ...appliedFilters,
      page,
      size: PAGE_SIZE,
    }),
  });
  const reportDetailQuery = useQuery({
    queryKey: ['admin', 'reports', selectedReportSn],
    queryFn: () => getAdminReport(selectedReportSn),
    enabled: selectedReportSn != null,
  });
  const referenceAuctionQuery = useQuery({
    queryKey: ['admin-auction-overview', referenceAuctionSn],
    queryFn: () => fetchAdminAuctionOverview(referenceAuctionSn),
    enabled: referenceAuctionSn != null,
  });
  const decisionMutation = useMutation({
    mutationFn: decideAdminReport,
    onSuccess: (_, variables) => {
      const actionLabel = variables.decision === 'PROCESSING'
        ? '처리 시작'
        : variables.decision === 'PROCESSED'
          ? '위반 확정'
          : '반려';
      toast({
        icon: 'success',
        title: `신고 #${variables.reportSn}을 ${actionLabel}했습니다.`,
        timer: 2000,
      });
      setReason('');
      setEnforcementAction('NONE');
      setPermanentConfirmed(false);
      reportsQuery.refetch();
      if (variables.decision === 'PROCESSING' || variables.decision === 'PROCESSED') {
        reportDetailQuery.refetch();
        return;
      }
      setSelectedReportSn(null);
      if (page !== 1) setPage(1);
    },
  });
  const releaseMutation = useMutation({
    mutationFn: releaseAdminReportSanction,
    onSuccess: (_, variables) => {
      toast({
        icon: 'success',
        title: `신고 #${variables.reportSn}의 7일 이용정지를 해제했습니다.`,
        timer: 2000,
      });
      setReleaseReason('');
      reportsQuery.refetch();
      reportDetailQuery.refetch();
    },
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

  const openReport = (reportSn) => {
    setSelectedReportSn(reportSn);
    setReferenceAuctionSn(null);
    setReason('');
    setEnforcementAction('NONE');
    setPermanentConfirmed(false);
    setReleaseReason('');
    setFileViewReason('');
    setFileError('');
    decisionMutation.reset();
    releaseMutation.reset();
  };

  const closeReport = () => {
    if (decisionMutation.isPending || releaseMutation.isPending) return;
    setSelectedReportSn(null);
    setReferenceAuctionSn(null);
    setReason('');
    setEnforcementAction('NONE');
    setPermanentConfirmed(false);
    setReleaseReason('');
    setFileViewReason('');
    setFileError('');
    decisionMutation.reset();
    releaseMutation.reset();
  };

  const columns = [
    { key: 'reportSn', label: '신고 번호', render: (value) => `#${value}` },
    {
      key: 'reportTypeCode',
      label: '유형',
      render: (value, row) => reportTypeName(value, row.reportTypeName),
    },
    {
      key: 'reporterUserSn',
      label: '신고자',
      className: 'admin-table__compact-text',
      render: (value, row) => (value == null
        ? '시스템'
        : formatAdminMemberIdentity(row.reporterMember, value)),
    },
    {
      key: 'reportedUserSn',
      label: '신고 대상',
      className: 'admin-table__compact-text',
      render: (value, row) => formatAdminMemberIdentity(row.reportedMember, value),
    },
    {
      key: 'referenceTypeCode',
      label: '관련 항목',
      className: 'admin-table__compact-text admin-operation-reference-cell',
      render: (value, row) => renderReportReference({
        isList: true,
        referenceTypeCode: value,
        referenceSn: row.referenceSn,
        targetName: row.targetName,
      }),
    },
    { key: 'registeredAt', label: '접수일', render: formatDate },
    {
      key: 'processedAt',
      label: '처리일',
      className: 'admin-table__processed-date',
      render: formatDate,
    },
    {
      key: 'statusCode',
      label: '상태',
      render: (value) => {
        const status = reportStatus(value);
        return <AdminStatusBadge tone={status.tone}>{status.label}</AdminStatusBadge>;
      },
    },
    {
      key: 'manage',
      label: '관리',
      render: (_, row) => (
        <button
          className={`btn ${
            isActionableStatus(row.statusCode) ? 'btn-primary' : 'btn-outline'
          } admin-operation-table__action`}
          onClick={() => openReport(row.reportSn)}
          type="button"
        >
          {isActionableStatus(row.statusCode) ? '처리' : '내역'}
        </button>
      ),
    },
  ];

  const decide = (decision) => {
    const normalizedReason = reason.trim();
    const selectedAction = decision === 'PROCESSED' ? enforcementAction : 'NONE';
    if (!selectedReportSn
      || !normalizedReason
      || decisionMutation.isPending
      || (selectedAction === 'PERMANENT_SUSPENSION' && !permanentConfirmed)) return;
    decisionMutation.mutate({
      reportSn: selectedReportSn,
      decision,
      enforcementAction: selectedAction,
      reason: normalizedReason,
    });
  };

  const releaseSanction = () => {
    const normalizedReason = releaseReason.trim();
    if (!selectedReportSn || !normalizedReason || releaseMutation.isPending) return;
    releaseMutation.mutate({ reportSn: selectedReportSn, reason: normalizedReason });
  };

  const openReportFile = async (file) => {
    const normalizedReason = fileViewReason.trim();
    if (!selectedReportSn || !normalizedReason || openingFileSn != null) {
      setFileError('첨부 원문 열람 사유를 입력해 주세요.');
      return;
    }
    setFileError('');
    setOpeningFileSn(file.fileSn);
    try {
      const response = await getAdminReportFileBlob({
        reportSn: selectedReportSn,
        fileSn: file.fileSn,
        reason: normalizedReason,
      });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noreferrer';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setFileError('첨부파일을 열지 못했습니다. 권한과 파일 상태를 확인해 주세요.');
    } finally {
      setOpeningFileSn(null);
    }
  };

  const detail = reportDetailQuery.data;
  const detailStatus = reportStatus(detail?.statusCode);
  const canStart = detail?.statusCode === 'ABRC0005';
  const canFinalize = detail?.statusCode === 'ABRC0006';
  const isActionable = canStart || canFinalize;
  const selectedEnforcement = ENFORCEMENT_OPTIONS.find(
    (option) => option.value === enforcementAction,
  );
  const hasTemporarySanction = detail?.enforcementAction === 'TEMPORARY_SUSPENSION_7_DAYS';
  const canReleaseSanction = hasTemporarySanction && !detail?.sanctionReleased;
  const referenceOverview = referenceAuctionQuery.data;
  const referenceAuction = referenceOverview?.auction;
  const referenceProduct = referenceOverview?.product;
  const referenceAuctionStatusCode = referenceAuction?.auctionStatusCode;
  const referenceAuctionStatusName = referenceAuction?.auctionStatusName
    ?? referenceAuctionStatusCode
    ?? '-';
  const referenceTradeStatusCode = referenceOverview?.tradeStatusCode;
  const referenceTradeStatusName = TRADE_STATUS_NAMES[referenceTradeStatusCode]
    ?? referenceTradeStatusCode
    ?? '-';
  const referenceSeller = referenceAuction?.sellerName?.trim()
    || formatAdminMemberIdentity(null, referenceAuction?.sellerId ?? referenceProduct?.usrSn);

  return (
    <div className="admin-bjn-page admin-operation-page">
      <PageMeta title="신고 관리" />
      <AdminPageHeader title="신고 관리" />

      <form className="admin-bjn-filters admin-operation-search" onSubmit={submitSearch}>
        <label className="admin-operation-search__status">
          처리 상태
          <select
            onChange={(event) => setFilterForm({
              ...filterForm,
              statusCode: event.target.value,
            })}
            value={filterForm.statusCode}
          >
            <option value="">전체 상태</option>
            <option value="ABRC0005">접수</option>
            <option value="ABRC0006">처리 중</option>
            <option value="ABRC0007">완료</option>
            <option value="ABRC0008">반려</option>
          </select>
        </label>
        <label className="admin-operation-search__keyword">
          신고 검색
          <input
            maxLength={100}
            onChange={(event) => setFilterForm({
              ...filterForm,
              keyword: event.target.value,
            })}
            placeholder="신고 번호·내용"
            value={filterForm.keyword}
          />
        </label>
        <AdminFilterActions disabled={reportsQuery.isFetching} onReset={resetFilters} />
      </form>

      {reportsQuery.isError && (
        <div className="admin-bjn-state is-error">
          신고 목록을 불러오지 못했습니다.
          <button className="btn btn-outline" onClick={() => reportsQuery.refetch()} type="button">
            다시 시도
          </button>
        </div>
      )}
      {!reportsQuery.isError && (
        <AdminSectionCard
          action={!reportsQuery.isLoading && <span>총 {reportsQuery.data?.totalItems ?? 0}건</span>}
          description="접수부터 완료·반려까지 모든 신고와 처리 이력을 확인합니다."
          title="신고 목록"
        >
          <div className="admin-bjn-table-scroll">
            <AdminTable
              columns={columns}
              data={reportsQuery.data?.items ?? []}
              emptyMessage="조건에 맞는 신고가 없습니다."
              loading={reportsQuery.isLoading}
              rowKey={(row) => row.reportSn}
            />
          </div>
          <AdminPagination
            ariaLabel="신고 목록 페이지 이동"
            disabled={reportsQuery.isFetching}
            onPageChange={setPage}
            page={reportsQuery.data?.page ?? page}
            totalPages={reportsQuery.data?.totalPages ?? 0}
          />
        </AdminSectionCard>
      )}

      {selectedReportSn && (
        <AdminDetailDrawer
          eyebrow="신고 관리"
          footer={(
            <button
              className="btn btn-outline"
              disabled={decisionMutation.isPending || releaseMutation.isPending}
              onClick={closeReport}
              type="button"
            >
              닫기
            </button>
          )}
          onClose={() => {
            if (referenceAuctionSn != null) return;
            closeReport();
          }}
          title="신고 상세"
        >
          <section className="admin-operation-detail">
            {reportDetailQuery.isLoading && <div className="admin-bjn-state">상세 내용을 불러오는 중입니다.</div>}
            {reportDetailQuery.isError && (
              <div className="admin-bjn-state is-error">신고 상세를 불러오지 못했습니다.</div>
            )}
            {detail && (
              <>
                <dl>
                  <dt>신고 번호</dt><dd>#{detail.reportSn}</dd>
                  <dt>유형</dt><dd>{reportTypeName(detail.reportTypeCode, detail.reportTypeName)}</dd>
                  <dt>신고자</dt><dd>{detail.reporterUserSn == null ? '시스템' : formatAdminMemberIdentity(detail.reporterMember, detail.reporterUserSn)}</dd>
                  <dt>신고 대상</dt><dd>{formatAdminMemberIdentity(detail.reportedMember, detail.reportedUserSn)}</dd>
                  <dt>관련 항목</dt>
                  <dd>{renderReportReference({
                    referenceTypeCode: detail.referenceTypeCode,
                    referenceSn: detail.referenceSn,
                    targetName: detail.targetName,
                  })}</dd>
                  {isAuctionReference(detail.referenceTypeCode) && detail.referenceSn != null && (
                    <>
                      <dt>원본 확인</dt>
                      <dd>
                        <button
                          className="btn btn-primary admin-operation-reference__action"
                          onClick={() => setReferenceAuctionSn(detail.referenceSn)}
                          type="button"
                        >
                          경매 상세 보기
                        </button>
                      </dd>
                    </>
                  )}
                  <dt>위험 이벤트</dt><dd>{detail.riskEventSn == null ? '-' : `#${detail.riskEventSn}`}</dd>
                  <dt>상태</dt>
                  <dd><AdminStatusBadge tone={detailStatus.tone}>{detailStatus.label}</AdminStatusBadge></dd>
                  <dt>접수일</dt><dd>{formatDate(detail.registeredAt)}</dd>
                  <dt>신고 내용</dt><dd className="admin-operation-detail__content">{detail.content || '-'}</dd>
                  {canFinalize && detail.processReason && (
                    <><dt>처리 시작 사유</dt><dd className="admin-operation-detail__content">{detail.processReason}</dd></>
                  )}
                  {!isActionable && (
                    <>
                      <dt>처리자</dt><dd>{formatProcessor(detail.processedBy, detail.processorMember)}</dd>
                      <dt>처리일</dt><dd>{formatDate(detail.processedAt)}</dd>
                      <dt>처리 사유</dt>
                      <dd className="admin-operation-detail__content">{detail.processReason || '-'}</dd>
                    </>
                  )}
                </dl>
                {detail.linkedDisputeSn && (
                  <section className="admin-report-sanction" aria-label="거래 문제 처리정보">
                    <div className="admin-report-sanction__heading">
                      <div>
                        <span>거래 문제 처리 #{detail.linkedDisputeSn}</span>
                        <h3>{DISPUTE_STATUS_NAMES[detail.linkedDisputeStatusCode]
                          ?? detail.linkedDisputeStatusCode
                          ?? '상태 확인 필요'}</h3>
                      </div>
                      <AdminStatusBadge tone={detail.linkedDisputeStatusCode === 'TRDC0018' ? 'success' : 'warning'}>
                        {DISPUTE_RESULT_NAMES[detail.linkedDisputeResultCode]
                          ?? detail.linkedDisputeResultCode
                          ?? '판정 전'}
                      </AdminStatusBadge>
                    </div>
                    <dl className="admin-report-sanction__meta">
                      <dt>문제 유형</dt>
                      <dd>{DISPUTE_TYPE_NAMES[detail.linkedDisputeTypeCode]
                        ?? detail.linkedDisputeTypeCode
                        ?? '-'}</dd>
                      <dt>접수 전 거래 상태</dt>
                      <dd>{TRADE_STATUS_NAMES[detail.linkedPreviousTradeStatusCode]
                        ?? detail.linkedPreviousTradeStatusCode
                        ?? '-'}</dd>
                    </dl>
                    {['TRDC0016', 'TRDC0017'].includes(detail.linkedDisputeStatusCode) && (
                      <Link
                        className="btn btn-outline"
                        to={`/admin/disputes?disputeSn=${detail.linkedDisputeSn}`}
                      >
                        거래 문제 판정 열기
                      </Link>
                    )}
                  </section>
                )}
                {detail.sanctionSn && (
                  <section className="admin-report-sanction" aria-label="계정 제재 결과">
                    <div className="admin-report-sanction__heading">
                      <div>
                        <span>계정 제재 #{detail.sanctionSn}</span>
                        <h3>
                          {detail.enforcementAction === 'PERMANENT_SUSPENSION'
                            ? '영구 이용정지'
                            : '7일 이용정지'}
                        </h3>
                      </div>
                      <AdminStatusBadge tone={detail.sanctionReleased ? 'neutral' : 'danger'}>
                        {detail.sanctionReleased ? '해제됨' : '적용 중'}
                      </AdminStatusBadge>
                    </div>
                    <dl className="admin-report-sanction__meta">
                      <dt>시작</dt><dd>{formatDate(detail.sanctionStartedAt)}</dd>
                      <dt>종료 예정</dt>
                      <dd>{detail.sanctionEndedAt ? formatDate(detail.sanctionEndedAt) : '기한 없음'}</dd>
                    </dl>
                    {detail.sanctionImpacts?.length > 0 && (
                      <ul className="admin-report-sanction__impacts">
                        {detail.sanctionImpacts.map((impact, index) => (
                          <li key={`${impact.referenceTypeCode}-${impact.referenceSn}-${index}`}>
                            <div>
                              <strong>
                                {REPORT_REFERENCE_NAMES[impact.referenceTypeCode]
                                  ?? impact.referenceTypeCode} #{impact.referenceSn}
                              </strong>
                              <span>
                                {IMPACT_ACTION_NAMES[impact.actionCode] ?? impact.actionCode}
                                {' · '}
                                {IMPACT_STATUS_NAMES[impact.statusCode] ?? impact.statusCode}
                              </span>
                            </div>
                            <p>{impact.result}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    {canReleaseSanction && (
                      <div className="admin-report-sanction__release">
                        <label>
                          조기 해제 사유
                          <textarea
                            disabled={releaseMutation.isPending}
                            maxLength={1000}
                            onChange={(event) => setReleaseReason(event.target.value)}
                            placeholder="7일 이용정지를 조기 해제하는 사유를 입력하세요."
                            value={releaseReason}
                          />
                        </label>
                        {releaseMutation.isError && (
                          <p className="admin-operation-error" role="alert">
                            {releaseMutation.error?.response?.data?.message
                              ?? '이용정지 해제에 실패했습니다. 현재 제재 상태를 확인해 주세요.'}
                          </p>
                        )}
                        <button
                          className="btn btn-outline"
                          disabled={!releaseReason.trim() || releaseMutation.isPending}
                          onClick={releaseSanction}
                          type="button"
                        >
                          <UnlockKeyhole size={16} aria-hidden="true" />
                          {releaseMutation.isPending ? '해제 중…' : '7일 정지 조기 해제'}
                        </button>
                      </div>
                    )}
                  </section>
                )}
                {detail.files?.length > 0 && (
                  <section className="admin-operation-detail__files">
                    <h3><Paperclip size={16} aria-hidden="true" /> 첨부파일</h3>
                    <label>
                      원문 열람 사유
                      <input
                        maxLength={1000}
                        onChange={(event) => {
                          setFileViewReason(event.target.value);
                          setFileError('');
                        }}
                        placeholder="감사로그에 남길 열람 사유를 입력하세요."
                        value={fileViewReason}
                      />
                    </label>
                    <div className="admin-operation-detail__file-list">
                      {detail.files.map((file) => (
                        <button
                          className="btn btn-outline btn-sm"
                          disabled={openingFileSn != null}
                          key={file.fileSn}
                          onClick={() => openReportFile(file)}
                          type="button"
                        >
                          <Paperclip size={14} aria-hidden="true" />
                          {openingFileSn === file.fileSn ? '여는 중…' : file.originalName}
                        </button>
                      ))}
                    </div>
                    {fileError && <p className="admin-operation-error" role="alert">{fileError}</p>}
                  </section>
                )}
                {isActionable && (
                  <>
                    {canFinalize && (
                      <section className="admin-operation-decision">
                        <div className="admin-operation-decision__heading">
                          <strong>위반 확정 조치</strong>
                          <span>신고를 위반으로 확정할 때 계정과 진행 중인 업무에 적용할 조치를 선택합니다.</span>
                        </div>
                        <label className="admin-operation-decision__select">
                          계정 조치
                          <select
                            disabled={decisionMutation.isPending}
                            onChange={(event) => {
                              setEnforcementAction(event.target.value);
                              setPermanentConfirmed(false);
                              decisionMutation.reset();
                            }}
                            value={enforcementAction}
                          >
                            {ENFORCEMENT_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                        <p className={enforcementAction === 'PERMANENT_SUSPENSION'
                          ? 'admin-operation-decision__warning'
                          : 'admin-operation-decision__description'}>
                          {selectedEnforcement?.description}
                        </p>
                        {enforcementAction === 'PERMANENT_SUSPENSION' && (
                          <label className="admin-operation-confirm admin-operation-confirm--danger">
                            <input
                              checked={permanentConfirmed}
                              disabled={decisionMutation.isPending}
                              onChange={(event) => setPermanentConfirmed(event.target.checked)}
                              type="checkbox"
                            />
                            취소 가능한 경매·요청·견적이 즉시 종료되는 것을 확인했습니다.
                          </label>
                        )}
                      </section>
                    )}
                    <label className="admin-operation-detail__reason">
                      {canStart ? '처리 시작 사유' : '최종 판정 사유'}
                      <textarea
                        disabled={decisionMutation.isPending}
                        maxLength={4000}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder={canStart
                          ? '처리를 시작하는 이유나 확인 계획을 입력하세요.'
                          : '위반 확정 또는 반려 사유를 입력하세요.'}
                        value={reason}
                      />
                    </label>
                    {!reason.trim() && (
                      <p className="admin-operation-validation" role="alert">
                        {canStart
                          ? '처리 시작 사유를 입력해야 합니다.'
                          : '최종 판정 사유를 입력해야 위반 확정 또는 반려할 수 있습니다.'}
                      </p>
                    )}
                    {decisionMutation.isError && (
                      <p className="admin-operation-error" role="alert">
                        {decisionMutation.error?.response?.data?.message
                          ?? '신고 처리에 실패했습니다. 이미 처리된 신고인지 확인해 주세요.'}
                      </p>
                    )}
                    <div className="admin-operation-actions">
                      {canStart ? (
                        <button
                          className="btn btn-primary"
                          disabled={!reason.trim() || decisionMutation.isPending}
                          onClick={() => decide('PROCESSING')}
                          type="button"
                        >
                          {decisionMutation.isPending ? '변경 중…' : '처리 시작'}
                        </button>
                      ) : (
                        <>
                          <button
                            className="btn btn-outline"
                            disabled={!reason.trim() || decisionMutation.isPending}
                            onClick={() => decide('REJECTED')}
                            type="button"
                          >
                            반려
                          </button>
                          <button
                            className="btn btn-primary"
                            disabled={!reason.trim()
                              || decisionMutation.isPending
                              || (enforcementAction === 'PERMANENT_SUSPENSION'
                                && !permanentConfirmed)}
                            onClick={() => decide('PROCESSED')}
                            type="button"
                          >
                            <ShieldAlert size={16} aria-hidden="true" />
                            {decisionMutation.isPending ? '처리 중…' : '위반 확정'}
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </AdminDetailDrawer>
      )}

      {referenceAuctionSn != null && (
        <div className="admin-operation-reference-modal-layer">
          <AdminModal
            onClose={() => setReferenceAuctionSn(null)}
            panelClassName="admin-operation-reference-modal"
            title="경매 상세"
          >
            <section
              aria-busy={referenceAuctionQuery.isLoading}
              className="admin-operation-reference-modal__content"
            >
              {referenceAuctionQuery.isLoading && (
                <div className="admin-bjn-state">경매 상세를 불러오는 중입니다.</div>
              )}
              {referenceAuctionQuery.isError && (
                <div className="admin-bjn-state is-error">
                  경매 상세를 불러오지 못했습니다.
                  <button
                    className="btn btn-outline"
                    onClick={() => referenceAuctionQuery.refetch()}
                    type="button"
                  >
                    다시 시도
                  </button>
                </div>
              )}
              {referenceOverview && (
                <>
                  <div className="admin-operation-reference-modal__heading">
                    <span>경매 #{referenceAuctionSn}</span>
                    <h3>
                      {referenceProduct?.prdNm
                        ?? referenceAuction?.title
                        ?? `경매 #${referenceAuctionSn}`}
                    </h3>
                  </div>
                  <dl>
                    <dt>경매 번호</dt><dd>#{referenceAuctionSn}</dd>
                    <dt>상품 번호</dt>
                    <dd>{referenceProduct?.prdSn == null ? '-' : `#${referenceProduct.prdSn}`}</dd>
                    <dt>판매자</dt><dd>{referenceSeller}</dd>
                    <dt>경매 상태</dt>
                    <dd>
                      <AdminStatusBadge tone={auctionStatusTone(referenceAuctionStatusCode)}>
                        {referenceAuctionStatusName}
                      </AdminStatusBadge>
                    </dd>
                    <dt>입찰 수</dt><dd>{referenceAuction?.bidCount ?? 0}건</dd>
                    <dt>현재가</dt><dd>{formatAmount(referenceAuction?.currentPrice)}</dd>
                    <dt>시작가</dt>
                    <dd>{formatAmount(referenceAuction?.startPrice ?? referenceProduct?.prdStartAmt)}</dd>
                    <dt>경매 시작</dt><dd>{formatDateTime(referenceAuction?.startDateTime)}</dd>
                    <dt>경매 종료</dt><dd>{formatDateTime(referenceAuction?.endDateTime)}</dd>
                    <dt>거래 번호</dt>
                    <dd>{referenceOverview.tradeSn == null ? '-' : `#${referenceOverview.tradeSn}`}</dd>
                    <dt>거래 상태</dt><dd>{referenceTradeStatusName}</dd>
                    <dt>등록일</dt><dd>{formatDateTime(referenceProduct?.prdRegDt)}</dd>
                  </dl>
                  <div className="admin-operation-reference-modal__actions">
                    <button
                      className="btn btn-outline"
                      onClick={() => setReferenceAuctionSn(null)}
                      type="button"
                    >
                      닫기
                    </button>
                  </div>
                </>
              )}
            </section>
          </AdminModal>
        </div>
      )}
    </div>
  );
};

export default AdminReportManagementPage;
