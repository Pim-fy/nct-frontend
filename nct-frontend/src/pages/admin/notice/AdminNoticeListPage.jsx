import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FilePlus2, Search } from 'lucide-react';
import AdminPagination from '@components/admin/AdminPagination';
import AdminTable from '@components/admin/AdminTable';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import MockupAdminStatusBadge from '@components/admin/mockup/MockupAdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import { useAdminNoticeList, useAdminNoticeOptions } from '@hooks/useAdminNotices';
import { formatDateTime } from '@utils/common';
import './adminContentPages.css';

const PAGE_SIZE = 20;

const statusTone = (statusCode) => {
  if (statusCode === 'NTCC0006') return 'success';
  if (statusCode === 'NTCC0007') return 'danger';
  return 'neutral';
};

/** F-OPS-023: 임시저장·게시·숨김을 모두 확인하는 관리자 공지 목록입니다. */
const AdminNoticeListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keywordInput, setKeywordInput] = useState(searchParams.get('keyword') || '');
  const typeCode = searchParams.get('typeCode') || '';
  const statusCode = searchParams.get('statusCode') || '';
  const keyword = searchParams.get('keyword') || '';
  const requestedPage = Number(searchParams.get('page') || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const filters = { typeCode, statusCode, keyword, page, size: PAGE_SIZE };
  const optionsQuery = useAdminNoticeOptions();
  const noticesQuery = useAdminNoticeList(filters);
  const noticePage = noticesQuery.data;
  const hasActiveFilters = Boolean(typeCode || statusCode || keyword);

  const changeFilters = (changes) => {
    const next = { typeCode, statusCode, keyword, ...changes };
    const params = {};
    if (next.typeCode) params.typeCode = next.typeCode;
    if (next.statusCode) params.statusCode = next.statusCode;
    if (next.keyword) params.keyword = next.keyword;
    if (next.page && next.page > 1) params.page = String(next.page);
    setSearchParams(params);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    changeFilters({ keyword: keywordInput.trim(), page: 1 });
  };

  const columns = useMemo(() => [
    { key: 'noticeId', label: '번호' },
    { key: 'typeName', label: '유형' },
    {
      key: 'title', label: '제목', className: 'admin-notice-list__title',
      render: (value, row) => (
        <Link to={`/admin/notices/${row.noticeId}`}>
          {row.pinned && <span aria-label="중요 공지">[중요] </span>}{value}
        </Link>
      ),
    },
    {
      key: 'statusName', label: '상태',
      render: (value, row) => <MockupAdminStatusBadge tone={statusTone(row.statusCode)}>{value}</MockupAdminStatusBadge>,
    },
    {
      key: 'visibleNow', label: '현재 노출',
      render: (value) => <MockupAdminStatusBadge tone={value ? 'success' : 'neutral'}>{value ? '노출 중' : '미노출'}</MockupAdminStatusBadge>,
    },
    { key: 'postingStartAt', label: '노출 시작', render: formatDateTime },
    { key: 'postingEndAt', label: '노출 종료', render: formatDateTime },
    { key: 'writerName', label: '작성자' },
    { key: 'viewCount', label: '조회수', render: (value) => value.toLocaleString('ko-KR') },
  ], []);

  return (
    <div className="admin-content-page">
      <PageMeta title="공지 관리" />
      <MockupAdminPageHeader
        action={(
          <Link className="btn btn-primary admin-content-page__primary-action" to="/admin/notices/new">
            <FilePlus2 aria-hidden="true" /> 공지 작성
          </Link>
        )}
        description="임시저장·게시·숨김 상태와 노출 기간을 확인하고 공지를 관리합니다."
        eyebrow="F-OPS-023 · REQ-OPS-027"
        title="공지사항 관리"
      />

      <form className="card admin-notice-filters" onSubmit={submitSearch}>
        <label>
          <span>유형</span>
          <select
            onChange={(event) => changeFilters({ typeCode: event.target.value, page: 1 })}
            value={typeCode}
          >
            <option value="">전체 유형</option>
            {(optionsQuery.data?.types ?? []).map((option) => (
              <option key={option.code} value={option.code}>{option.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span>게시 상태</span>
          <select
            onChange={(event) => changeFilters({ statusCode: event.target.value, page: 1 })}
            value={statusCode}
          >
            <option value="">전체 상태</option>
            {(optionsQuery.data?.statuses ?? []).map((option) => (
              <option key={option.code} value={option.code}>{option.name}</option>
            ))}
          </select>
        </label>
        <label className="admin-notice-filters__search">
          <span>제목·내용 검색</span>
          <div>
            <input
              maxLength={100}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="검색어를 입력하세요"
              value={keywordInput}
            />
            <button className="btn btn-outline" type="submit">
              <Search aria-hidden="true" />
              검색
            </button>
          </div>
        </label>
        {hasActiveFilters && (
          <button
            className="btn btn-outline admin-notice-filters__reset"
            onClick={() => {
              setKeywordInput('');
              changeFilters({ typeCode: '', statusCode: '', keyword: '', page: 1 });
            }}
            type="button"
          >
            필터 초기화
          </button>
        )}
      </form>

      {noticesQuery.isError && (
        <div className="card admin-content-state is-error">
          <strong>공지 목록을 불러오지 못했습니다.</strong>
          <button className="btn btn-outline" onClick={() => noticesQuery.refetch()} type="button">다시 시도</button>
        </div>
      )}

      {!noticesQuery.isError && (
        <section className="card admin-notice-list" aria-label="관리자 공지 목록">
          {!noticesQuery.isLoading && (
            <div className="admin-notice-list__summary">
              <p>총 <strong>{noticePage?.totalItems ?? 0}</strong>건</p>
              <small>숨김 공지는 사용자 공지사항에서 보이지 않습니다.</small>
            </div>
          )}
          <div className="admin-table-scroll">
            <AdminTable
              columns={columns}
              data={noticePage?.items ?? []}
              emptyMessage="조건에 맞는 공지가 없습니다."
              loading={noticesQuery.isLoading}
              rowKey={(notice) => notice.noticeId}
            />
          </div>

          <AdminPagination
            onPageChange={(nextPage) => changeFilters({ page: nextPage })}
            page={page}
            totalPages={noticePage?.totalPages ?? 0}
          />
        </section>
      )}
    </div>
  );
};

export default AdminNoticeListPage;
