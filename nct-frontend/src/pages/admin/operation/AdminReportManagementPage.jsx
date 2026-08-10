import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  decideAdminReport,
  getAdminReport,
  getAdminReports,
} from '@api/adminReportApi';
import AdminDetailDrawer from '@components/admin/AdminDetailDrawer';
import AdminFilterActions from '@components/admin/AdminFilterActions';
import AdminPagination from '@components/admin/AdminPagination';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import AdminTable from '@components/admin/AdminTable';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import PageMeta from '@components/admin/PageMeta';
import { ADMIN_PAGE_SIZE } from '@/constants/adminPagination';
import { formatAdminMemberIdentity } from '@utils/adminMemberIdentity';
import { toast } from '@utils/common';
import '../audit/adminAuditPage.css';
import './adminOperationPages.css';

const REPORT_TYPE_NAMES = {
  ABRC0001: '콘텐츠',
  ABRC0002: '사용자',
  ABRC0003: '스팸·광고',
  ABRC0004: '기타',
};

const REPORT_STATUS = {
  ABRC0005: { label: '접수', tone: 'warning' },
  ABRC0006: { label: '처리 중', tone: 'info' },
  ABRC0007: { label: '완료', tone: 'success' },
  ABRC0008: { label: '반려', tone: 'neutral' },
};

const formatDate = (value) => (value ? String(value).replace('T', ' ').slice(0, 16) : '-');
const PAGE_SIZE = ADMIN_PAGE_SIZE;
const EMPTY_FILTERS = { statusCode: '', keyword: '' };
const reportTypeName = (code) => REPORT_TYPE_NAMES[code] ?? code ?? '-';
const reportStatus = (code) => REPORT_STATUS[code] ?? { label: code ?? '-', tone: 'neutral' };
const isDecidableStatus = (code) => code === 'ABRC0005' || code === 'ABRC0006';
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
  const decisionMutation = useMutation({
    mutationFn: decideAdminReport,
    onSuccess: (_, variables) => {
      toast({
        icon: 'success',
        title: `신고 #${variables.reportSn}을 ${
          variables.decision === 'PROCESSED' ? '처리 완료' : '반려'
        }했습니다.`,
        timer: 2000,
      });
      setSelectedReportSn(null);
      setReason('');
      if (page === 1) {
        reportsQuery.refetch();
      } else {
        setPage(1);
      }
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
    setReason('');
    decisionMutation.reset();
  };

  const closeReport = () => {
    if (decisionMutation.isPending) return;
    setSelectedReportSn(null);
    setReason('');
    decisionMutation.reset();
  };

  const columns = [
    { key: 'reportSn', label: '신고 번호', render: (value) => `#${value}` },
    { key: 'reportTypeCode', label: '유형', render: reportTypeName },
    {
      key: 'reporterUserSn',
      label: '신고자',
      render: (value, row) => (value == null
        ? '시스템'
        : formatAdminMemberIdentity(row.reporterMember, value)),
    },
    {
      key: 'reportedUserSn',
      label: '신고 대상',
      render: (value, row) => formatAdminMemberIdentity(row.reportedMember, value),
    },
    {
      key: 'referenceTypeCode',
      label: '참조 대상',
      render: (value, row) => (value ? `${value} #${row.referenceSn}` : '-'),
    },
    { key: 'registeredAt', label: '접수일', render: formatDate },
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
            isDecidableStatus(row.statusCode) ? 'btn-primary' : 'btn-outline'
          } admin-operation-table__action`}
          onClick={() => openReport(row.reportSn)}
          type="button"
        >
          {isDecidableStatus(row.statusCode) ? '처리' : '내역'}
        </button>
      ),
    },
  ];

  const decide = (decision) => {
    const normalizedReason = reason.trim();
    if (!selectedReportSn || !normalizedReason || decisionMutation.isPending) return;
    decisionMutation.mutate({
      reportSn: selectedReportSn,
      decision,
      reason: normalizedReason,
    });
  };

  const detail = reportDetailQuery.data;
  const detailStatus = reportStatus(detail?.statusCode);
  const canDecide = isDecidableStatus(detail?.statusCode);

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
              disabled={decisionMutation.isPending}
              onClick={closeReport}
              type="button"
            >
              닫기
            </button>
          )}
          onClose={closeReport}
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
                  <dt>유형</dt><dd>{reportTypeName(detail.reportTypeCode)}</dd>
                  <dt>신고자</dt><dd>{detail.reporterUserSn == null ? '시스템' : formatAdminMemberIdentity(detail.reporterMember, detail.reporterUserSn)}</dd>
                  <dt>신고 대상</dt><dd>{formatAdminMemberIdentity(detail.reportedMember, detail.reportedUserSn)}</dd>
                  <dt>참조 대상</dt><dd>{detail.referenceTypeCode ? `${detail.referenceTypeCode} #${detail.referenceSn}` : '-'}</dd>
                  <dt>위험 이벤트</dt><dd>{detail.riskEventSn == null ? '-' : `#${detail.riskEventSn}`}</dd>
                  <dt>상태</dt>
                  <dd><AdminStatusBadge tone={detailStatus.tone}>{detailStatus.label}</AdminStatusBadge></dd>
                  <dt>접수일</dt><dd>{formatDate(detail.registeredAt)}</dd>
                  <dt>신고 내용</dt><dd className="admin-operation-detail__content">{detail.content || '-'}</dd>
                  {!canDecide && (
                    <>
                      <dt>처리자</dt><dd>{formatProcessor(detail.processedBy, detail.processorMember)}</dd>
                      <dt>처리일</dt><dd>{formatDate(detail.processedAt)}</dd>
                      <dt>처리 사유</dt>
                      <dd className="admin-operation-detail__content">{detail.processReason || '-'}</dd>
                    </>
                  )}
                </dl>
                {canDecide && (
                  <>
                    <label className="admin-operation-detail__reason">
                      처리 사유
                      <textarea
                        disabled={decisionMutation.isPending}
                        maxLength={4000}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="처리 또는 반려 사유를 입력하세요."
                        value={reason}
                      />
                    </label>
                    {!reason.trim() && (
                      <p className="admin-operation-validation" role="alert">
                        처리 사유를 입력해야 완료 또는 반려할 수 있습니다.
                      </p>
                    )}
                    {decisionMutation.isError && (
                      <p className="admin-operation-error" role="alert">
                        {decisionMutation.error?.response?.data?.message
                          ?? '신고 처리에 실패했습니다. 이미 처리된 신고인지 확인해 주세요.'}
                      </p>
                    )}
                    <div className="admin-operation-actions">
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
                        disabled={!reason.trim() || decisionMutation.isPending}
                        onClick={() => decide('PROCESSED')}
                        type="button"
                      >
                        {decisionMutation.isPending ? '처리 중…' : '처리 완료'}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        </AdminDetailDrawer>
      )}
    </div>
  );
};

export default AdminReportManagementPage;
