import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  decideAdminReport,
  getAdminReport,
  getAdminReports,
} from '@api/adminReportApi';
import AdminModal from '@components/admin/AdminModal';
import AdminFilterActions from '@components/admin/AdminFilterActions';
import AdminPagination from '@components/admin/AdminPagination';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import AdminTable from '@components/admin/AdminTable';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import PageMeta from '@components/admin/PageMeta';
import useClientPagination from '@hooks/useClientPagination';
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
const PAGE_SIZE = 20;
const reportTypeName = (code) => REPORT_TYPE_NAMES[code] ?? code ?? '-';
const reportStatus = (code) => REPORT_STATUS[code] ?? { label: code ?? '-', tone: 'neutral' };

/** 담당자 7 · F-OPS-007: 서버의 신고 처리 계약을 관리자 화면에 연결합니다. */
const AdminReportManagementPage = () => {
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedReportSn, setSelectedReportSn] = useState(null);
  const [reason, setReason] = useState('');

  const reportsQuery = useQuery({
    queryKey: ['admin', 'reports', 'pending'],
    queryFn: getAdminReports,
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
      reportsQuery.refetch();
    },
  });

  const rows = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return reportsQuery.data ?? [];

    return (reportsQuery.data ?? []).filter((report) => [
      report.reportSn,
      report.reporterUserSn,
      report.reportedUserSn,
      report.referenceTypeCode,
      report.referenceSn,
      report.content,
      reportTypeName(report.reportTypeCode),
    ].join(' ').toLowerCase().includes(normalized));
  }, [keyword, reportsQuery.data]);
  const {
    page,
    pagedItems: pagedReports,
    resetPage,
    setPage,
    totalItems,
    totalPages,
  } = useClientPagination(rows, PAGE_SIZE);

  const submitSearch = (event) => {
    event.preventDefault();
    setKeyword(keywordInput.trim());
    resetPage();
  };

  const resetFilters = () => {
    setKeywordInput('');
    setKeyword('');
    resetPage();
  };

  const columns = useMemo(() => [
    { key: 'reportSn', label: '신고 번호', render: (value) => `#${value}` },
    { key: 'reportTypeCode', label: '유형', render: reportTypeName },
    {
      key: 'reporterUserSn',
      label: '신고자',
      render: (value) => (value == null ? '시스템' : `회원 #${value}`),
    },
    {
      key: 'reportedUserSn',
      label: '신고 대상',
      render: (value) => (value == null ? '-' : `회원 #${value}`),
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
          className="btn btn-primary admin-operation-table__action"
          onClick={() => {
            setSelectedReportSn(row.reportSn);
            setReason('');
          }}
          type="button"
        >
          처리
        </button>
      ),
    },
  ], []);

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

  return (
    <div className="admin-bjn-page admin-operation-page">
      <PageMeta title="신고 처리" />
      <AdminPageHeader title="신고 처리" />

      <form className="admin-bjn-filters admin-operation-search" onSubmit={submitSearch}>
        <label>
          신고 검색
          <input
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="신고 번호·회원 번호·내용"
            value={keywordInput}
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
          action={!reportsQuery.isLoading && <span>처리 대기 {totalItems}건</span>}
          title="접수·처리 중 신고"
        >
          <div className="admin-bjn-table-scroll">
            <AdminTable
              columns={columns}
              data={pagedReports}
              loading={reportsQuery.isLoading}
              rowKey={(row) => row.reportSn}
            />
          </div>
          <AdminPagination
            ariaLabel="신고 목록 페이지 이동"
            disabled={reportsQuery.isFetching}
            onPageChange={setPage}
            page={page}
            totalPages={totalPages}
          />
        </AdminSectionCard>
      )}

      {selectedReportSn && (
        <AdminModal
          onClose={() => !decisionMutation.isPending && setSelectedReportSn(null)}
          title="신고 처리"
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
                  <dt>신고자</dt><dd>{detail.reporterUserSn == null ? '시스템' : `회원 #${detail.reporterUserSn}`}</dd>
                  <dt>신고 대상</dt><dd>{detail.reportedUserSn == null ? '-' : `회원 #${detail.reportedUserSn}`}</dd>
                  <dt>참조 대상</dt><dd>{detail.referenceTypeCode ? `${detail.referenceTypeCode} #${detail.referenceSn}` : '-'}</dd>
                  <dt>위험 이벤트</dt><dd>{detail.riskEventSn == null ? '-' : `#${detail.riskEventSn}`}</dd>
                  <dt>접수일</dt><dd>{formatDate(detail.registeredAt)}</dd>
                  <dt>신고 내용</dt><dd className="admin-operation-detail__content">{detail.content || '-'}</dd>
                </dl>
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
          </section>
        </AdminModal>
      )}
    </div>
  );
};

export default AdminReportManagementPage;
