import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import AdminModal from '@components/admin/AdminModal';
import AdminPagination from '@components/admin/AdminPagination';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminTable from '@components/admin/AdminTable';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import MockupAdminStatusBadge from '@components/admin/mockup/MockupAdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import {
  useAdminProviderApplications,
  useApproveProviderApplication,
  useRejectProviderApplication,
} from '@hooks/useAdminProviderApplications';
import useClientPagination from '@hooks/useClientPagination';
import { getAdminProviderApplicationFileDownloadUrl } from '@api/providerApplicationApi';
import '../notice/adminContentPages.css';
import './adminProviderApprovalPage.css';

/** 담당자 7 · F-PROV-002/003/007: 백엔드 심사 API를 연결한 관리자 화면입니다. */
const FILTERS = {
  status: ['전체', '심사 대기', '승인됨', '반려됨'],
  category: ['전체', '이사', '청소', '레슨', '설치·수리', '인테리어'],
  type: ['전체', '신규', '추가', '갱신'],
};

const EMPTY_FILTER = {
  status: '심사 대기',
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
const PAGE_SIZE = 20;

const toDisplayItem = (item) => ({
  ...item,
  id: item.applicationSn,
  name: item.userName,
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
  reason: item.rejectReason,
  tone: item.statusCode === 'PRVC0003'
    ? 'success'
    : item.statusCode === 'PRVC0004'
      ? 'danger'
      : 'warning',
  files: item.files ?? [],
  area: '-',
});

const AdminProviderApprovalPage = () => {
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
    setFilter((current) => ({ ...current, [target.name]: target.value }));
    resetPage();
  };

  const open = (item) => {
    setSelected(item);
    setRejectReason('');
    setFeedback('');
  };

  const decide = async (decision) => {
    if (!selected || (decision === 'reject' && !rejectReason.trim())) return;
    setFeedback('');

    try {
      if (decision === 'approve') {
        await approveMutation.mutateAsync(selected.id);
      } else {
        await rejectMutation.mutateAsync({
          applicationSn: selected.id,
          reason: rejectReason.trim(),
        });
      }

      setRejectReason('');
      setSelected(null);
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
      render: (value, row) => <MockupAdminStatusBadge tone={row.tone}>{value}</MockupAdminStatusBadge>,
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
      <MockupAdminPageHeader
        action={<MockupAdminStatusBadge tone="success">실제 API 연결</MockupAdminStatusBadge>}
        description="신청 내용을 확인한 뒤 승인 또는 반려합니다. 목록과 처리 결과는 백엔드 상태를 다시 조회합니다."
        title="제공자 심사"
      />

      <section className="card admin-provider-filter" aria-label="제공자 심사 필터">
        {['status', 'category', 'type'].map((name) => (
          <label key={name}>
            {({ status: '심사 상태', category: '카테고리', type: '신청 유형' })[name]}
            <select name={name} onChange={change} value={filter[name]}>
              {FILTERS[name].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        ))}

        <label className="admin-provider-filter__search">
          검색
          <div>
            <Search aria-hidden="true" />
            <input
              name="keyword"
              onChange={change}
              placeholder="신청번호 또는 신청자"
              value={filter.keyword}
            />
          </div>
        </label>
      </section>

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
          description="기본은 심사 대기 건만 보여 주며, 승인·반려 이력은 심사 상태 필터에서 조회합니다."
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
        <AdminModal onClose={() => setSelected(null)} title="제공자 심사">
          <section className="admin-provider-detail">
            <div>
              <span>심사 상세 · API</span>
              <h2>{selected.name}</h2>
              <p>
                {selected.reason
                  ? `반려 사유: ${selected.reason}`
                  : '제출 내용을 검토한 뒤 승인 또는 반려할 수 있습니다.'}
              </p>
            </div>

            <dl>
              <dt>신청번호 / 유형</dt>
              <dd>{selected.id} / {selected.type}</dd>

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
                    >
                      {file.fileTypeName} · {file.fileName}
                    </a>
                  ))
                  : '제출 서류 없음'}
              </dd>

              <dt>심사 상태</dt>
              <dd>
                <MockupAdminStatusBadge tone={selected.tone}>
                  {selected.status}
                </MockupAdminStatusBadge>
              </dd>
            </dl>

            {selected.status === '심사 대기' && (
              <>
                <label className="admin-provider-detail__reason">
                  반려 사유
                  <textarea
                    maxLength="4000"
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="반려 또는 보완 요청 사유를 입력합니다."
                    value={rejectReason}
                  />
                </label>

                <div className="admin-provider-detail__actions">
                  <button
                    className="btn btn-primary"
                    disabled={isPending}
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

            <p className="admin-provider-detail__notice">
              승인·반려는 서버에서 관리자 권한과 현재 상태를 다시 검증합니다. 제출 서류 원문은
              관리자 전용 API로 열람하며, 서버가 신청-파일 연결과 관리자 권한을 다시 확인합니다.
            </p>
          </section>
        </AdminModal>
      )}
    </div>
  );
};

export default AdminProviderApprovalPage;
