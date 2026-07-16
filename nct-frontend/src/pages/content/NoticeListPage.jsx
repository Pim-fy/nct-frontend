import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import {
  ContentPageHeader,
  ContentPageShell,
  ContentPagination,
  ContentState,
  NoticeFilterBar,
  NoticeList,
  NoticeListSummary,
} from '@components/content/ContentUi';
import ListSkeleton from '@components/skeleton/ListSkeleton';
import { usePublicNoticeList, usePublicNoticeTypes } from '@hooks/usePublicNotices';

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
    <ContentPageShell>
      <Helmet><title>공지사항 | 에누리컷</title></Helmet>
      <ContentPageHeader
        description="서비스 점검, 정책 변경, 이용 안내와 이벤트 소식을 확인하세요."
        eyebrow="에누리컷 소식"
        title="공지사항"
      />

      <NoticeFilterBar
        hasError={typesQuery.isError}
        onChange={changeFilter}
        onRetry={() => typesQuery.refetch()}
        selectedTypeCode={typeCode}
        types={typesQuery.data ?? []}
      />

      {noticesQuery.isLoading && <ListSkeleton />}

      {noticesQuery.isError && (
        <ContentState
          actionLabel="다시 불러오기"
          description="잠시 후 다시 시도해 주세요."
          onAction={() => noticesQuery.refetch()}
          title="공지사항을 불러오지 못했습니다."
          tone="error"
        />
      )}

      {!noticesQuery.isLoading && !noticesQuery.isError && noticePage?.items?.length === 0 && (
        <ContentState
          description="새로운 안내가 등록되면 이곳에 표시됩니다."
          title="현재 게시 중인 공지가 없습니다."
        />
      )}

      {noticePage?.items?.length > 0 && (
        <>
          <NoticeListSummary total={noticePage.totalItems} />
          <NoticeList notices={noticePage.items} />

          {noticePage.totalPages > 1 && (
            <ContentPagination
              onChange={changePage}
              page={page}
              totalPages={noticePage.totalPages}
            />
          )}
        </>
      )}
    </ContentPageShell>
  );
};

export default NoticeListPage;
