import { Eye, Pin } from 'lucide-react';
import { Link } from 'react-router-dom';
import './mockupContentComponents.css';

const formatDate = (value) => {
  if (!value) return '게시일 미정';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
};

// 공지·가이드 목업에서만 쓰는 임시 부품들입니다.
// 정식 공통 컴포넌트가 도착하면 각 페이지의 import만 교체할 수 있게 한 파일에 모았습니다.
export const MockupContentPageHeader = ({ eyebrow, title, description, action }) => (
  <header className="mockup-content-page-header">
    <div>
      {eyebrow && <span>{eyebrow}</span>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {action && <div className="mockup-content-page-header__action">{action}</div>}
  </header>
);

export const MockupNoticeCard = ({ notice }) => (
  <Link className="card mockup-notice-card" to={`/customersupport/notice/${notice.id}`}>
    <div className="mockup-notice-card__top">
      <span className="badge badge-blue">{notice.typeName}</span>
      {notice.pinned && <span className="badge badge-warning"><Pin aria-hidden="true" />상단 고정</span>}
    </div>
    <h2>{notice.title}</h2>
    <p>{notice.summary || '공지 상세에서 내용을 확인할 수 있습니다.'}</p>
    <div className="mockup-notice-card__meta">
      <span>{formatDate(notice.publishedAt)}</span>
      <span><Eye aria-hidden="true" />{Number(notice.viewCount || 0).toLocaleString('ko-KR')}</span>
    </div>
  </Link>
);

export const MockupGuideFlowCard = ({ guide, onOpen }) => (
  <button
    aria-label={`${guide.title} 예시 흐름 보기`}
    className="card mockup-guide-flow-card"
    onClick={() => onOpen(guide)}
    type="button"
  >
    <span className="mockup-guide-flow-card__number">{guide.order}</span>
    <span className="mockup-guide-flow-card__copy">
      <strong>{guide.title}</strong>
      <small>{guide.summary}</small>
    </span>
    <span className="mockup-guide-flow-card__action">예시 흐름 보기</span>
  </button>
);
