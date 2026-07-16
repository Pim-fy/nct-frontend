import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Eye, Pin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ViewSkeleton from '@components/skeleton/ViewSkeleton';
import { usePublicNoticeDetail } from '@hooks/usePublicNotices';
import './contentPages.css';

const formatDate = (value) => {
  if (!value) return '게시일 미정';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
};

/** F-COM-013: 공개 공지 한 건을 안전한 일반 텍스트로 표시합니다. */
const NoticeDetailPage = () => {
  const { noticeId: noticeIdParam } = useParams();
  const noticeId = Number(noticeIdParam);
  const isValidNoticeId = Number.isSafeInteger(noticeId) && noticeId > 0;
  const noticeQuery = usePublicNoticeDetail(noticeId);

  if (!isValidNoticeId) {
    return (
      <div className="content-page">
        <Helmet><title>잘못된 공지 주소 | 에누리컷</title></Helmet>
        <div className="content-state content-state--error">
          <strong>잘못된 공지 주소입니다.</strong>
          <Link to="/customersupport/notice">공지 목록으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  if (noticeQuery.isLoading) return <ViewSkeleton />;

  if (noticeQuery.isError) {
    const isNotFound = noticeQuery.error?.response?.status === 404;
    return (
      <div className="content-page">
        <Helmet><title>공지사항 조회 오류 | 에누리컷</title></Helmet>
        <div className="content-state content-state--error">
          <strong>{isNotFound ? '공지를 찾을 수 없습니다.' : '공지를 불러오지 못했습니다.'}</strong>
          <span>
            {isNotFound
              ? '게시 기간이 끝났거나 숨김 처리된 공지일 수 있습니다.'
              : '네트워크 상태를 확인한 뒤 다시 시도해 주세요.'}
          </span>
          {!isNotFound && <button onClick={() => noticeQuery.refetch()} type="button">다시 불러오기</button>}
          <Link to="/customersupport/notice">공지 목록으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const notice = noticeQuery.data;
  return (
    <article className="content-page notice-detail">
      <Helmet><title>{notice.title} | 에누리컷</title></Helmet>
      <Link className="notice-detail__back" to="/customersupport/notice"><ArrowLeft aria-hidden="true" />공지 목록</Link>
      <header className="notice-detail__header">
        <div className="notice-detail__badges">
          <span>{notice.typeName}</span>
          {notice.pinned && <span className="is-pinned"><Pin aria-hidden="true" />상단 고정</span>}
        </div>
        <h1>{notice.title}</h1>
        <div className="notice-detail__meta">
          <span>{formatDate(notice.publishedAt)}</span>
          <span><Eye aria-hidden="true" />{Number(notice.viewCount || 0).toLocaleString('ko-KR')}</span>
        </div>
      </header>
      <div className="notice-detail__content">{notice.content}</div>
    </article>
  );
};

export default NoticeDetailPage;
