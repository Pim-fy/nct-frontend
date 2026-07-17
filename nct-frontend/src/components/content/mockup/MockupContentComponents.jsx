import { ArrowLeft, Eye, Pin, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import './mockupContentComponents.css';
import './mockupContentPages.css';

const formatDate = (value) => {
  if (!value) return '게시일 미정';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '게시일 미정';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const formatPeriod = (start, end) => {
  if (!start && !end) return '상시 공개';
  return `${formatDate(start)}${end ? ` ~ ${formatDate(end)}` : '부터'}`;
};

// UI목업_v3를 React로 옮긴 임시 공통 부품입니다.
// 페이지는 ContentUi facade만 사용하므로 피그마 확정 컴포넌트가 오면 이 구현만 교체합니다.
export const MockupContentPageShell = ({ children, className = '' }) => (
  <div className={`content-page${className ? ` ${className}` : ''}`}>
    {children}
  </div>
);

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

export const MockupContentState = ({
  tone = 'default',
  title,
  description,
  actionLabel,
  onAction,
  backLabel,
  backTo,
}) => (
  <div
    className={`content-state${tone === 'error' ? ' content-state--error' : ''}`}
    role={tone === 'error' ? 'alert' : 'status'}
  >
    <strong>{title}</strong>
    {description && <span>{description}</span>}
    {actionLabel && onAction && <button onClick={onAction} type="button">{actionLabel}</button>}
    {backLabel && backTo && <Link to={backTo}>{backLabel}</Link>}
  </div>
);

export const MockupNoticeFilterBar = ({
  selectedTypeCode,
  types = [],
  onChange,
  hasError = false,
  onRetry,
}) => (
  <>
    <div className="notice-filters" aria-label="공지 유형 필터">
      <button
        aria-pressed={!selectedTypeCode}
        className={!selectedTypeCode ? 'is-active' : ''}
        onClick={() => onChange('')}
        type="button"
      >
        전체
      </button>
      {types.map((type) => (
        <button
          aria-pressed={selectedTypeCode === type.code}
          className={selectedTypeCode === type.code ? 'is-active' : ''}
          key={type.code}
          onClick={() => onChange(type.code)}
          type="button"
        >
          {type.name}
        </button>
      ))}
    </div>

    {hasError && (
      <div className="notice-filter-error" role="status">
        <span>공지 유형을 불러오지 못해 전체 공지만 표시합니다.</span>
        <button onClick={onRetry} type="button">유형 다시 불러오기</button>
      </div>
    )}
  </>
);

/**
 * 담당자 7 | F-COM-013 공개 공지 목록 행
 *
 * 공지사항 목록 화면에서만 사용하는 임시 공통 UI입니다. 큰 카드 대신 한 줄씩
 * 읽을 수 있도록 중요 고정 여부·분류·제목·등록일·조회수를 보여주며, 행을 누르면
 * 기존과 같은 공지 상세 화면으로 이동합니다.
 */
export const MockupNoticeRow = ({ notice }) => (
  <Link
    aria-label={`${notice.pinned ? '상단 고정, ' : ''}${notice.typeName} 공지: ${notice.title}`}
    className={`mockup-notice-row${notice.pinned ? ' is-important' : ''}`}
    to={`/customersupport/notice/${notice.id}`}
  >
    <span className="mockup-notice-row__number">
      {notice.pinned ? <><Pin aria-hidden="true" />중요</> : notice.id}
    </span>
    <span className="mockup-notice-row__type">{notice.typeName}</span>
    <strong className="mockup-notice-row__title">{notice.title}</strong>
    <span className="mockup-notice-row__date">{formatDate(notice.publishedAt)}</span>
    <span className="mockup-notice-row__views"><Eye aria-hidden="true" />{Number(notice.viewCount || 0).toLocaleString('ko-KR')}</span>
  </Link>
);

export const MockupNoticeList = ({ notices = [] }) => (
  <div className="notice-list" aria-label="공지사항 목록">
    <div aria-hidden="true" className="mockup-notice-row mockup-notice-row--head">
      <span>번호</span><span>분류</span><span>제목</span><span>등록일</span><span>조회</span>
    </div>
    {notices.map((notice) => <MockupNoticeRow key={notice.id} notice={notice} />)}
  </div>
);

export const MockupNoticeListSummary = ({ total }) => (
  <p className="notice-total">총 <strong>{Number(total || 0).toLocaleString('ko-KR')}</strong>건</p>
);

export const MockupContentPagination = ({ page, totalPages, onChange }) => (
  <nav className="content-pagination" aria-label="공지사항 페이지 이동">
    <button disabled={page <= 1} onClick={() => onChange(page - 1)} type="button">이전</button>
    <span>{page} / {totalPages}</span>
    <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} type="button">다음</button>
  </nav>
);

export const MockupNoticeDetail = ({ notice }) => (
  <article className="content-page notice-detail">
    <Link className="notice-detail__back" to="/customersupport/notice">
      <ArrowLeft aria-hidden="true" />공지 목록
    </Link>
    <header className="notice-detail__header">
      <h1>{notice.title}</h1>
      <div className="notice-detail__meta">
        <span>{formatDate(notice.publishedAt)}</span>
        <span>노출 기간 {formatPeriod(notice.publishedAt, notice.postingEndAt)}</span>
        <span><Eye aria-hidden="true" />{Number(notice.viewCount || 0).toLocaleString('ko-KR')}</span>
      </div>
    </header>
    <div className="notice-detail__content">{notice.content}</div>
  </article>
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

export const MockupGuideFlowGrid = ({ guides = [], onOpen }) => (
  <section className="guide-flow-grid" aria-label="에누리컷 이용 흐름">
    {guides.map((guide) => (
      <MockupGuideFlowCard guide={guide} key={guide.id} onOpen={onOpen} />
    ))}
  </section>
);

export const MockupGuideFlowStrip = ({ steps = [] }) => (
  <section className="content-flow-strip" aria-label="전체 이용 순서">
    <strong>전체 흐름</strong>
    <div>
      {steps.map((step, index) => (
        <span className="content-flow-strip__step" key={step}>
          {step}
          {index < steps.length - 1 && <i aria-hidden="true" />}
        </span>
      ))}
    </div>
  </section>
);

export const MockupGuideModal = ({ guide, imageAlt, imageSrc, closeButtonRef, onClose }) => (
  <div className="content-modal" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section
      aria-labelledby="guide-modal-title"
      aria-describedby="guide-modal-description"
      aria-modal="true"
      className="content-modal__panel"
      role="dialog"
    >
      <div className="content-modal__heading">
        <div>
          <span>{guide.order}단계</span>
          <h2 id="guide-modal-title">{guide.flowTitle}</h2>
        </div>
        <button aria-label="이용가이드 닫기" onClick={onClose} ref={closeButtonRef} type="button">
          <X aria-hidden="true" />
        </button>
      </div>
      <img alt={imageAlt} src={imageSrc} />
      <p id="guide-modal-description">{guide.flowCopy}</p>
    </section>
  </div>
);
