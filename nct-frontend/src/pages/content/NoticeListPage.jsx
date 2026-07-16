import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import {
  MockupContentPageHeader,
  MockupNoticeCard,
} from '@components/content/mockup/MockupContentComponents';
import ListSkeleton from '@components/skeleton/ListSkeleton';
import { usePublicNoticeList, usePublicNoticeTypes } from '@hooks/usePublicNotices';
import './contentPages.css';

const PAGE_SIZE = 10;

/** F-COM-013: 공개 조건을 만족한 공지만 보여 주는 목록 화면입니다. */
const NoticeListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeCode = searchParams.get('type') || '';
  const requestedPage = Number(searchParams.get('page') || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const typesQuery = usePublicNoticeTypes();
  const noticesQuery = usePublicNoticeList({ typeCode, page, size: PAGE_SIZE });
  const noticePage = noticesQuery.data;

  const changeFilter = (nextTypeCode) => {
    const next = {};
    if (nextTypeCode) next.type = nextTypeCode;
    setSearchParams(next);
  };

  const changePage = (nextPage) => {
    const next = {};
    if (typeCode) next.type = typeCode;
    if (nextPage > 1) next.page = String(nextPage);
    setSearchParams(next);
  };

  return (
    <div className="content-page">
      <Helmet><title>공지사항 | 에누리컷</title></Helmet>
      <MockupContentPageHeader
        description="서비스 점검, 정책 변경, 이용 안내와 이벤트 소식을 확인하세요."
        eyebrow="에누리컷 소식"
        title="공지사항"
      />

      <div className="notice-filters" aria-label="공지 유형 필터">
        <button
          aria-pressed={!typeCode}
          className={!typeCode ? 'is-active' : ''}
          onClick={() => changeFilter('')}
          type="button"
        >
          전체
        </button>
        {(typesQuery.data ?? []).map((type) => (
          <button
            aria-pressed={typeCode === type.code}
            className={typeCode === type.code ? 'is-active' : ''}
            key={type.code}
            onClick={() => changeFilter(type.code)}
            type="button"
          >
            {type.name}
          </button>
        ))}
      </div>

      {typesQuery.isError && (
        <div className="notice-filter-error" role="status">
          <span>공지 유형을 불러오지 못해 전체 공지만 표시합니다.</span>
          <button onClick={() => typesQuery.refetch()} type="button">유형 다시 불러오기</button>
        </div>
      )}

      {noticesQuery.isLoading && <ListSkeleton />}

      {noticesQuery.isError && (
        <div className="content-state content-state--error">
          <strong>공지사항을 불러오지 못했습니다.</strong>
          <span>잠시 후 다시 시도해 주세요.</span>
          <button onClick={() => noticesQuery.refetch()} type="button">다시 불러오기</button>
        </div>
      )}

      {!noticesQuery.isLoading && !noticesQuery.isError && noticePage?.items?.length === 0 && (
        <div className="content-state">
          <strong>현재 게시 중인 공지가 없습니다.</strong>
          <span>새로운 안내가 등록되면 이곳에 표시됩니다.</span>
        </div>
      )}

      {noticePage?.items?.length > 0 && (
        <>
          <p className="notice-total">총 <strong>{noticePage.totalItems.toLocaleString('ko-KR')}</strong>건</p>
          <div className="notice-list">
            {noticePage.items.map((notice) => <MockupNoticeCard key={notice.id} notice={notice} />)}
          </div>

          {noticePage.totalPages > 1 && (
            <nav className="content-pagination" aria-label="공지사항 페이지 이동">
              <button disabled={page <= 1} onClick={() => changePage(page - 1)} type="button">이전</button>
              <span>{page} / {noticePage.totalPages}</span>
              <button disabled={page >= noticePage.totalPages} onClick={() => changePage(page + 1)} type="button">다음</button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default NoticeListPage;
