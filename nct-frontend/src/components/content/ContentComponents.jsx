import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Pin, ShieldCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Pagination from '@components/common/Pagination';
import { Skeleton } from '@components/skeleton/BaseSkeleton';
import { formatDate as sharedFormatDate } from '@utils/common';
import './ContentComponents.css';
import './ContentPages.css';

const formatDate = (value) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return '게시일 미정';
  return sharedFormatDate(value);
};

// 고객센터와 공개 콘텐츠 화면에서 재사용하는 공통 부품입니다.
// 페이지는 ContentUi facade만 사용하므로 피그마 확정 컴포넌트가 오면 이 구현만 교체합니다.
// 주의: className으로 Tailwind py-*/pt-*/pb-*를 넘기지 말 것 — .content-page(언레이어 CSS,
// padding: 56px 0 72px shorthand)가 같은 요소의 py-* 유틸리티를 레이어 충돌로 무력화시킨다.
export const ContentPageShell = ({ children, className = '' }) => (
  <div className={`content-page${className ? ` ${className}` : ''}`}>
    {children}
  </div>
);

export const ContentPageHeader = ({ title, action }) => (
  <header className="content-page-header">
    <div>
      <h1>{title}</h1>
    </div>
    {action && <div className="content-page-header__action">{action}</div>}
  </header>
);

export const ContentState = ({
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

export const NoticeFilterBar = ({
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
 * 읽을 수 있도록 중요 고정 여부·분류·제목·등록일을 보여주며, 행을 누르면
 * 기존과 같은 공지 상세 화면으로 이동합니다.
 */
export const NoticeRow = ({ notice }) => {
  // 전역 브레드크럼 (BJN, 260805): 목록의 현재 경로(필터·페이지 포함)를 상세에 전달
  const location = useLocation();
  return (
  <Link
    aria-label={`${notice.pinned ? '상단 고정, ' : ''}${notice.typeName} 공지: ${notice.title}`}
    className={`content-notice-row${notice.pinned ? ' is-important' : ''}`}
    state={{ from: `${location.pathname}${location.search}${location.hash}` }}
    to={`/customersupport/notice/${notice.id}`}
  >
    <span className="content-notice-row__number">
      {notice.pinned ? <><Pin aria-hidden="true" />중요</> : notice.id}
    </span>
    <span className="content-notice-row__type">{notice.typeName}</span>
    <strong className="content-notice-row__title">{notice.title}</strong>
    <span className="content-notice-row__date">{formatDate(notice.publishedAt)}</span>
  </Link>
  );
};

const NoticeRowSkeleton = () => (
  <div aria-hidden="true" className="content-notice-row">
    <span className="content-notice-row__number"><Skeleton height={14} /></span>
    <span className="content-notice-row__type"><Skeleton height={14} /></span>
    <strong className="content-notice-row__title"><Skeleton height={14} /></strong>
    <span className="content-notice-row__date"><Skeleton height={14} /></span>
  </div>
);

export const NoticeList = ({ notices = [], loading = false, loadingRows = 5 }) => (
  <div className="notice-list" aria-label="공지사항 목록">
    <div aria-hidden="true" className="content-notice-row content-notice-row--head">
      <span>번호</span><span>분류</span><span>제목</span><span>등록일</span>
    </div>
    {loading
      ? Array.from({ length: loadingRows }).map((_, index) => <NoticeRowSkeleton key={index} />)
      : notices.map((notice) => <NoticeRow key={notice.id} notice={notice} />)}
  </div>
);

export const NoticeListSummary = ({ total }) => (
  <p className="notice-total">총 <strong>{Number(total || 0).toLocaleString('ko-KR')}</strong>건</p>
);

/** 담당자 7 · F-COM-013: 고객센터도 전역 공용 페이지네이션을 사용하고 간격만 화면에 맞춥니다. */
export const ContentPagination = ({ page, totalPages, onChange, ariaLabel }) => (
  <Pagination
    ariaLabel={ariaLabel || '고객센터 목록 페이지 이동'}
    className="content-pagination"
    maxVisiblePages={5}
    onPageChange={onChange}
    page={page}
    showSinglePage
    totalPages={totalPages}
  />
);

export const NoticeDetail = ({ notice }) => (
  <article className="content-page notice-detail">
    <Link className="notice-detail__back" to="/customersupport/notice">
      <ArrowLeft aria-hidden="true" />공지 목록
    </Link>
    <header className="notice-detail__header">
      <h1>{notice.title}</h1>
      <div className="notice-detail__meta">
        <span>{formatDate(notice.publishedAt)}</span>
      </div>
    </header>
    <div className="notice-detail__content">{notice.content}</div>
  </article>
);

const GuidePreviewWindow = ({ label, children }) => (
  <div
    aria-label={`${label} 가상 화면 미리보기`}
    className="guide-screen-preview"
    role="img"
  >
    <div className="guide-screen-preview__bar" aria-hidden="true">
      <span /><span /><span />
      <strong>{label}</strong>
      <div className="guide-screen-preview__window-controls">
        <span className="guide-window-control guide-window-control--minimize" />
        <span className="guide-window-control guide-window-control--maximize" />
        <span className="guide-window-control guide-window-control--close" />
      </div>
      <em>예시 화면</em>
    </div>
    <div className="guide-screen-preview__body" aria-hidden="true">
      {children}
    </div>
  </div>
);

const GuidePreviewField = ({ label, value }) => (
  <div className="guide-preview-field">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const ProductRegisterPreview = () => (
  <GuidePreviewWindow label="상품 등록">
    <div className="guide-preview-page-title">
      <strong>상품 등록</strong>
      <div className="guide-preview-progress">
        <span className="is-active">1 상품 정보</span>
        <span>2 등록 확인</span>
      </div>
    </div>
    <div className="guide-preview-columns">
      <section className="guide-preview-panel">
        <header>상품 정보</header>
        <div>
          <GuidePreviewField label="상품명" value="빈티지 오디오 앰프" />
          <span className="guide-preview-label">카테고리</span>
          <div className="guide-preview-chips"><b className="is-active">디지털</b><b>취미</b><b>생활</b></div>
          <GuidePreviewField label="거래 형태" value="배송 · 직거래" />
        </div>
      </section>
      <section className="guide-preview-panel">
        <header>경매 설정</header>
        <div className="guide-preview-form-grid">
          <GuidePreviewField label="시작가" value="30,000원" />
          <GuidePreviewField label="즉시구매가" value="90,000원" />
          <GuidePreviewField label="경매 기간" value="3일" />
          <GuidePreviewField label="입찰 단위" value="1,000원" />
        </div>
      </section>
    </div>
    <div className="guide-preview-actions"><span>임시저장</span><strong>다음</strong></div>
  </GuidePreviewWindow>
);

const AuctionDetailPreview = () => (
  <GuidePreviewWindow label="경매 상세">
    <div className="guide-preview-auction">
      <div className="guide-preview-product-image">
        <span>대표 상품 이미지</span>
        <div><i /><i /><i /></div>
      </div>
      <section className="guide-preview-bid-panel">
        <div className="guide-preview-badges"><span>진행중</span><span>배송 · 직거래</span></div>
        <h4>빈티지 오디오 앰프</h4>
        <small>현재 최고가</small>
        <strong className="guide-preview-price">62,000원</strong>
        <p>종료까지 <b>02:18:34</b></p>
        <GuidePreviewField label="입찰 금액" value="63,000원" />
        <div className="guide-preview-actions guide-preview-actions--wide"><strong>입찰하기</strong><span>즉시구매</span></div>
      </section>
    </div>
  </GuidePreviewWindow>
);

const TradeHistoryPreview = () => (
  <GuidePreviewWindow label="상품 구매 내역">
    <div className="guide-preview-page-title guide-preview-page-title--compact">
      <div><small>MY AUCTION</small><strong>상품 구매 내역</strong></div>
      <div className="guide-preview-tabs"><span className="is-active">전체 3</span><span>진행 중 1</span><span>완료 2</span></div>
    </div>
    <div className="guide-preview-search">상품명, 상대방, 거래번호 검색</div>
    <article className="guide-preview-trade-item">
      <div className="guide-preview-trade-image">상품 이미지</div>
      <div>
        <span className="guide-preview-status">배송 중</span>
        <h4>빈티지 오디오 앰프</h4>
        <p>62,000원 · 2026.07.29</p>
        <small>구매자 거래 · 판매자 예시</small>
      </div>
      <strong>거래 상세</strong>
    </article>
  </GuidePreviewWindow>
);

const PointWalletPreview = () => (
  <GuidePreviewWindow label="포인트 지갑">
    <div className="guide-preview-page-title guide-preview-page-title--compact">
      <strong>포인트 지갑</strong>
      <div className="guide-preview-actions guide-preview-actions--inline"><strong>충전</strong><span>전환</span><span>환전</span></div>
    </div>
    <div className="guide-preview-wallet-cards">
      <div><span>총 보유 포인트</span><strong>144,000 P</strong></div>
      <div><span>사용 가능</span><strong>82,000 P</strong></div>
      <div><span>홀딩 포인트</span><strong>62,000 P</strong></div>
      <div><span>환전 가능</span><strong>20,000 P</strong></div>
    </div>
    <div className="guide-preview-ledger">
      <strong>포인트 내역</strong>
      <div><span>일시</span><span>유형</span><span>변동금액</span><span>잔액</span></div>
      <div><span>07.29</span><b>홀딩</b><em>-62,000P</em><strong>82,000P</strong></div>
    </div>
  </GuidePreviewWindow>
);

const ServiceRequestPreview = () => (
  <GuidePreviewWindow label="서비스 요청서 작성">
    <div className="guide-preview-page-title"><strong>서비스 요청서 작성</strong></div>
    <section className="guide-preview-panel guide-preview-panel--wide">
      <header>요청 정보</header>
      <div>
        <GuidePreviewField label="요청 제목" value="브랜드 로고 디자인을 의뢰해요" />
        <span className="guide-preview-label">카테고리</span>
        <div className="guide-preview-category-cards">
          <b>청소</b><b className="is-active">디자인 ✓</b><b>레슨</b><b>설치</b>
        </div>
      </div>
    </section>
    <section className="guide-preview-question">
      <span>1</span>
      <div><strong>어떤 디자인이 필요한가요?</strong><div className="guide-preview-chips"><b className="is-active">로고</b><b>명함</b><b>상세페이지</b></div></div>
    </section>
    <div className="guide-preview-actions"><span>임시저장</span><strong>요청서 공개</strong></div>
  </GuidePreviewWindow>
);

const GuideScreenPreview = ({ type }) => {
  if (type === 'product-register') return <ProductRegisterPreview />;
  if (type === 'auction-detail') return <AuctionDetailPreview />;
  if (type === 'trade-history') return <TradeHistoryPreview />;
  if (type === 'point-wallet') return <PointWalletPreview />;
  if (type === 'service-request') return <ServiceRequestPreview />;
  return null;
};

export const GuideJourneyOverview = ({
  guides = [],
  highlightedFlowId,
  journeys = [],
}) => {
  const guidesById = new Map(guides.map((guide) => [guide.id, guide]));
  const requestedJourney = journeys.find((journey) => (
    highlightedFlowId && journey.flowIds.includes(highlightedFlowId)
  ));
  const [activeJourneyId, setActiveJourneyId] = useState(
    requestedJourney?.id || journeys[0]?.id,
  );

  const activeJourney = journeys.find((journey) => journey.id === activeJourneyId)
    || journeys[0];
  const activeGuides = activeJourney?.flowIds
    .map((flowId) => guidesById.get(flowId))
    .filter(Boolean) || [];

  if (!activeJourney) return null;

  return (
    <section className="guide-experience" aria-label="서비스 이용 흐름">
      <div className="guide-mode-tabs" role="tablist" aria-label="가이드 종류 선택">
        {journeys.map((journey) => (
          <button
            aria-selected={activeJourney.id === journey.id}
            className={activeJourney.id === journey.id ? 'is-active' : undefined}
            key={journey.id}
            onClick={() => setActiveJourneyId(journey.id)}
            role="tab"
            type="button"
          >
            <span>{journey.id === 'auction' ? '01' : '02'}</span>
            <strong>{journey.id === 'auction' ? '경매로 거래하기' : '서비스 요청하기'}</strong>
            <small>{journey.id === 'auction' ? '판매와 입찰부터 안전한 거래까지' : '요청서 작성부터 거래 완료까지'}</small>
          </button>
        ))}
      </div>

      <article
        className={`guide-feature guide-feature--${activeJourney.id}`}
        role="tabpanel"
      >
        <div className="guide-feature__copy">
          <span>{activeJourney.eyebrow}</span>
          <h2>{activeJourney.title}</h2>
          <p>{activeJourney.description}</p>

          <ol className="guide-feature__steps">
            {activeGuides.map((guide, index) => (
              <li
                className={guide.id === highlightedFlowId ? 'is-highlighted' : undefined}
                id={`guide-flow-${guide.id}`}
                key={`${activeJourney.id}-${guide.id}`}
              >
                <span>{index + 1}</span>
                <div>
                  <strong>{guide.title}</strong>
                  <p>{guide.summary}</p>
                </div>
                <Check aria-hidden="true" />
              </li>
            ))}
          </ol>

          <Link className="guide-feature__cta" to={activeJourney.ctaRoute}>
            {activeJourney.ctaLabel}
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>

        <div className="guide-feature__visual" aria-label={`${activeJourney.title} 대표 화면`}>
          <div className="guide-feature__visual-main">
            <GuideScreenPreview type={activeJourney.previewType} />
          </div>
          <div className="guide-feature__visual-secondary">
            <GuideScreenPreview type={activeJourney.secondaryPreviewType} />
          </div>
        </div>
      </article>

      <aside className="guide-trust">
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>거래가 끝날 때까지 포인트를 안전하게 보호해요</strong>
          <p>입찰·낙찰·서비스 거래 상태와 포인트 보관 내역을 한곳에서 확인할 수 있습니다.</p>
        </div>
        <Link to="/customersupport/faq">자주 묻는 질문 <ArrowRight aria-hidden="true" /></Link>
      </aside>
    </section>
  );
};
