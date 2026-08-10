import { useMemo, useState } from 'react';
import AdminDetailDrawer from '@components/admin/AdminDetailDrawer';
import AdminFilterActions from '@components/admin/AdminFilterActions';
import AdminPagination from '@components/admin/AdminPagination';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminTable from '@components/admin/AdminTable';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import { ADMIN_PAGE_SIZE } from '@/constants/adminPagination';
import {
  useAdminProviderApplications,
  useApproveProviderApplication,
  useRejectProviderApplication,
} from '@hooks/useAdminProviderApplications';
import useClientPagination from '@hooks/useClientPagination';
import { getAdminProviderApplicationFileDownloadUrl } from '@api/providerApplicationApi';
import { formatDateTime, toast } from '@utils/common';
import { formatAdminMemberIdentity } from '@utils/adminMemberIdentity';
import '../notice/adminContentPages.css';
import './adminProviderApprovalPage.css';

/** 담당자 7 · F-PROV-002/003/007: 백엔드 심사 API를 연결한 관리자 화면입니다. */
const FILTERS = {
  status: ['전체', '심사 대기', '승인됨', '반려됨'],
  category: ['전체', '이사', '청소', '레슨', '설치·수리', '인테리어'],
  type: ['전체', '신규', '추가', '갱신'],
};

const EMPTY_FILTER = {
  status: '전체',
  category: '전체',
  type: '전체',
  keyword: '',
};

const STATUS_CODES = {
  '심사 대기': 'PRVC0002',
  승인됨: 'PRVC0003',
  반려됨: 'PRVC0004',
};

const TYPE_NAMES = {
  PRVC0009: '신규',
  PRVC0010: '추가',
  PRVC0011: '갱신',
};
const PAGE_SIZE = ADMIN_PAGE_SIZE;

const toDisplayItem = (item) => ({
  ...item,
  id: item.applicationSn,
  name: formatAdminMemberIdentity(item.applicantMember, item.userSn),
  category: item.categoryName,
  type: TYPE_NAMES[item.applicationTypeCode] ?? item.applicationTypeCode ?? '-',
  status: item.statusCode === 'PRVC0002'
    ? '심사 대기'
    : item.statusCode === 'PRVC0003'
      ? '승인됨'
      : item.statusCode === 'PRVC0004'
        ? '반려됨'
        : item.statusName,
  date: item.requestedAt
    ? new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(item.requestedAt))
    : '-',
  reason: item.processedReason ?? item.rejectReason,
  tone: item.statusCode === 'PRVC0003'
    ? 'success'
    : item.statusCode === 'PRVC0004'
      ? 'danger'
      : 'warning',
  files: item.files ?? [],
  area: '-',
});

const AdminProviderApprovalPage = () => {
  const [filterForm, setFilterForm] = useState(EMPTY_FILTER);
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const statusCode = STATUS_CODES[filter.status];
  const applicationsQuery = useAdminProviderApplications(statusCode);
  const approveMutation = useApproveProviderApplication();
  const rejectMutation = useRejectProviderApplication();
  const isPending = approveMutation.isPending || rejectMutation.isPending;
  const applies = useMemo(
    () => (applicationsQuery.data ?? []).map(toDisplayItem),
    [applicationsQuery.data],
  );

  const filtered = useMemo(
    () => applies.filter((item) => {
      const keyword = filter.keyword.trim().toLowerCase();
      const searchableText = `${item.id} ${item.name}`.toLowerCase();

      return (filter.category === '전체' || item.category === filter.category)
        && (filter.type === '전체' || item.type === filter.type)
        && (!keyword || searchableText.includes(keyword));
    }),
    [applies, filter],
  );
  const {
    page,
    pagedItems: pagedApplications,
    resetPage,
    setPage,
    totalItems,
    totalPages,
  } = useClientPagination(filtered, PAGE_SIZE);

  const change = ({ target }) => {
    setFilterForm((current) => ({ ...current, [target.name]: target.value }));
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setFilter({ ...filterForm, keyword: filterForm.keyword.trim() });
    resetPage();
  };

  const resetFilters = () => {
    setFilterForm(EMPTY_FILTER);
    setFilter(EMPTY_FILTER);
    resetPage();
  };

  const open = (item) => {
    setSelected(item);
    setRejectReason('');
    setFeedback('');
  };

  const closeDetail = () => {
    if (isPending) return;
    setSelected(null);
  };

  const decide = async (decision) => {
    if (!selected || !rejectReason.trim()) return;
    setFeedback('');

    try {
      if (decision === 'approve') {
        await approveMutation.mutateAsync({
          applicationSn: selected.id,
          reason: rejectReason.trim(),
        });
      } else {
        await rejectMutation.mutateAsync({
          applicationSn: selected.id,
          reason: rejectReason.trim(),
        });
      }

      toast({
        icon: 'success',
        title: `제공자 신청을 ${decision === 'approve' ? '승인' : '반려'}했습니다.`,
        timer: 1800,
      });
      setRejectReason('');
      closeDetail();
    } catch (error) {
      setFeedback(error?.response?.data?.message || '심사 처리 중 오류가 발생했습니다.');
    }
  };

  const columns = useMemo(() => [
    { key: 'id', label: '신청번호' },
    { key: 'name', label: '신청자', className: 'admin-provider-list__applicant', render: (value) => <strong>{value}</strong> },
    { key: 'category', label: '카테고리' },
    { key: 'type', label: '신청유형' },
    { key: 'date', label: '신청일' },
    {
      key: 'status', label: '심사 상태',
      render: (value, row) => <AdminStatusBadge tone={row.tone}>{value}</AdminStatusBadge>,
    },
    { key: 'files', label: '서류', render: (value) => (value.length ? `${value.length}건` : '-') },
    {
      key: 'manage', label: '관리',
      render: (_, row) => (
        <button className="btn btn-outline" disabled={isPending} onClick={() => open(row)} type="button">
          {row.status === '심사 대기' ? '심사하기' : '상세보기'}
        </button>
      ),
    },
  ], [isPending]);

  return (
    <div className="admin-content-page admin-provider-approval-page">
      <PageMeta title="제공자 심사" />
      <AdminPageHeader title="제공자 심사" />

      <form
        aria-label="제공자 심사 필터"
        className="card admin-provider-filter"
        onSubmit={submitSearch}
      >
        {['status', 'category', 'type'].map((name) => (
          <label key={name}>
            {({ status: '심사 상태', category: '카테고리', type: '신청 유형' })[name]}
            <select name={name} onChange={change} value={filterForm[name]}>
              {FILTERS[name].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        ))}

        <label className="admin-provider-filter__search">
          검색
          <input
            name="keyword"
            onChange={change}
            placeholder="신청번호 또는 신청자"
            value={filterForm.keyword}
          />
        </label>
        <AdminFilterActions disabled={applicationsQuery.isFetching} onReset={resetFilters} />
      </form>

      {applicationsQuery.isError && (
        <div className="card admin-content-state is-error">
          제공자 신청 목록을 불러오지 못했습니다. 관리자 권한과 백엔드 연결을 확인해 주세요.
        </div>
      )}

      {feedback && (
        <p className="admin-provider-feedback" role="alert">{feedback}</p>
      )}

      {!applicationsQuery.isError && (
        <AdminSectionCard
          action={!applicationsQuery.isLoading && <span>총 {totalItems}건</span>}
          className="admin-notice-list admin-provider-list"
          description="전체 신청을 표시하며, 심사 대기 건부터 상태별 최신 신청순으로 조회합니다."
          title="제공자 신청 목록"
        >
          <div className="admin-table-scroll">
            <AdminTable
              columns={columns}
              data={pagedApplications}
              emptyMessage="조건에 맞는 신청 자료가 없습니다."
              loading={applicationsQuery.isLoading}
              rowKey={(item) => item.id}
            />
          </div>
          <AdminPagination
            ariaLabel="제공자 신청 목록 페이지 이동"
            disabled={applicationsQuery.isFetching}
            onPageChange={setPage}
            page={page}
            totalPages={totalPages}
          />
        </AdminSectionCard>
      )}

      {selected && (
        <AdminDetailDrawer
          eyebrow={`신청 #${selected.id}`}
          footer={(
            <button
              className="btn btn-outline"
              disabled={isPending}
              onClick={closeDetail}
              type="button"
            >
              닫기
            </button>
          )}
          onClose={closeDetail}
          title="제공자 심사"
        >
          <section className="admin-provider-detail">
            <div>
              <span>심사 상세</span>
              <h2>{selected.name}</h2>
              <p>
                {selected.reason
                  ? `처리 사유: ${selected.reason}`
                  : '제출 내용을 검토한 뒤 승인 또는 반려할 수 있습니다.'}
              </p>
            </div>

            <dl>
              <dt>신청번호 / 유형</dt>
              <dd>{selected.id} / {selected.type}</dd>

              <dt>신청자</dt>
              <dd>{selected.name}</dd>

              <dt>신청 일시</dt>
              <dd>{formatDateTime(selected.requestedAt)}</dd>

              <dt>신청 카테고리</dt>
              <dd>{selected.category}</dd>

              <dt>제출 서류</dt>
              <dd className="admin-provider-detail__files">
                {selected.files.length
                  ? selected.files.map((file) => (
                    <a
                      href={getAdminProviderApplicationFileDownloadUrl({
                        applicationSn: selected.id,
                        flSn: file.flSn,
                      })}
                      key={file.applicationFileSn}
                      rel="noreferrer"
                      target="_blank"
                      title={`${file.fileTypeName} · ${file.fileName}`}
                    >
                      {file.fileTypeName} · {file.fileName}
                    </a>
                  ))
                  : '제출 서류 없음'}
              </dd>

              <dt>심사 상태</dt>
              <dd>
                <AdminStatusBadge tone={selected.tone}>
                  {selected.status}
                </AdminStatusBadge>
              </dd>

              {selected.processedAt && (
                <>
                  <dt>처리자</dt>
                  <dd>{formatAdminMemberIdentity(
                    selected.processorMember,
                    selected.processorUserSn,
                  )}</dd>
                  <dt>처리 일시</dt>
                  <dd>{formatDateTime(selected.processedAt)}</dd>
                  <dt>처리 사유</dt>
                  <dd>{selected.reason ?? '기록 없음'}</dd>
                </>
              )}
            </dl>

            {selected.status === '심사 대기' && (
              <>
                <label className="admin-provider-detail__reason">
                  처리 사유
                  <textarea
                    maxLength="4000"
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="승인 또는 반려 처리 사유를 입력합니다."
                    value={rejectReason}
                  />
                </label>

                <div className="admin-provider-detail__actions">
                  <button
                    className="btn btn-primary"
                    disabled={isPending || !rejectReason.trim()}
                    onClick={() => decide('approve')}
                    type="button"
                  >
                    승인
                  </button>
                  <button
                    className="btn btn-outline"
                    disabled={isPending || !rejectReason.trim()}
                    onClick={() => decide('reject')}
                    type="button"
                  >
                    반려
                  </button>
                </div>
              </>
            )}

          </section>
        </AdminDetailDrawer>
      )}
    </div>
  );
};

export default AdminProviderApprovalPage;
