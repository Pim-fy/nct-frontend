import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FilePlus2, Search } from 'lucide-react';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import MockupAdminStatusBadge from '@components/admin/mockup/MockupAdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import { useAdminNoticeList, useAdminNoticeOptions } from '@hooks/useAdminNotices';
import './adminContentPages.css';

const PAGE_SIZE = 20;

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '-';

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

      {noticesQuery.isLoading && <div className="card admin-content-state">공지 목록을 불러오는 중입니다.</div>}
      {noticesQuery.isError && (
        <div className="card admin-content-state is-error">
          <strong>공지 목록을 불러오지 못했습니다.</strong>
          <button className="btn btn-outline" onClick={() => noticesQuery.refetch()} type="button">다시 시도</button>
        </div>
      )}

      {!noticesQuery.isLoading && !noticesQuery.isError && (
        <section className="card admin-notice-list" aria-label="관리자 공지 목록">
          <div className="admin-notice-list__summary">
            <p>총 <strong>{noticePage?.totalItems ?? 0}</strong>건</p>
            <small>숨김 공지는 사용자 공지사항에서 보이지 않습니다.</small>
          </div>
          <div className="admin-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>번호</th>
                  <th>유형</th>
                  <th>제목</th>
                  <th>상태</th>
                  <th>현재 노출</th>
                  <th>노출 시작</th>
                  <th>노출 종료</th>
                  <th>작성자</th>
                  <th>조회수</th>
                </tr>
              </thead>
              <tbody>
                {(noticePage?.items ?? []).map((notice) => (
                  <tr key={notice.noticeId}>
                    <td>{notice.noticeId}</td>
                    <td>{notice.typeName}</td>
                    <td className="admin-notice-list__title">
                      <Link to={`/admin/notices/${notice.noticeId}`}>
                        {notice.pinned && <span aria-label="중요 공지">[중요] </span>}{notice.title}
                      </Link>
                    </td>
                    <td>
                      <MockupAdminStatusBadge tone={statusTone(notice.statusCode)}>
                        {notice.statusName}
                      </MockupAdminStatusBadge>
                    </td>
                    <td>
                      <MockupAdminStatusBadge tone={notice.visibleNow ? 'success' : 'neutral'}>
                        {notice.visibleNow ? '노출 중' : '미노출'}
                      </MockupAdminStatusBadge>
                    </td>
                    <td>{formatDateTime(notice.postingStartAt)}</td>
                    <td>{formatDateTime(notice.postingEndAt)}</td>
                    <td>{notice.writerName}</td>
                    <td>{notice.viewCount.toLocaleString('ko-KR')}</td>
                  </tr>
                ))}
                {(noticePage?.items ?? []).length === 0 && (
                  <tr>
                    <td className="admin-notice-list__empty" colSpan="9">
                      조건에 맞는 공지가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(noticePage?.totalPages ?? 0) > 1 && (
            <div className="admin-pagination">
              <button
                className="btn btn-outline"
                disabled={page <= 1}
                onClick={() => changeFilters({ page: page - 1 })}
                type="button"
              >
                이전
              </button>
              <span>{page} / {noticePage.totalPages}</span>
              <button
                className="btn btn-outline"
                disabled={page >= noticePage.totalPages}
                onClick={() => changeFilters({ page: page + 1 })}
                type="button"
              >
                다음
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminNoticeListPage;
