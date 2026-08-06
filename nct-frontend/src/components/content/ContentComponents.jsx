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
    <section className="guide-preview-panel guide-preview-panel--wide">
      <header>상품 사진·상세 설명</header>
      <div className="guide-preview-product-extra">
        <div className="guide-preview-upload-grid">
          <span className="is-primary">대표 사진</span>
          <span>상세 사진</span>
          <span>상세 사진</span>
        </div>
        <div className="guide-preview-form-grid">
          <GuidePreviewField label="상품 상태" value="사용감 적음" />
          <GuidePreviewField label="거래 지역" value="서울 성동구" />
          <GuidePreviewField label="상세 설명" value="정상 작동하며 구성품을 모두 포함합니다." />
        </div>
      </div>
    </section>
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
    <div className="guide-preview-auction-checks">
      <GuidePreviewField label="사용 가능 포인트" value="82,000 P" />
      <GuidePreviewField label="다음 입찰 가능 금액" value="63,000원 이상" />
      <GuidePreviewField label="거래 방식" value="배송 · 직거래" />
    </div>
    <div className="guide-preview-ledger">
      <strong>최근 입찰 현황</strong>
      <div><span>시간</span><span>입찰자</span><span>입찰가</span><span>상태</span></div>
      <div><span>14:32</span><b>참여자 3</b><em>62,000원</em><strong>최고가</strong></div>
      <div><span>14:28</span><b>참여자 2</b><em>61,000원</em><strong>갱신됨</strong></div>
    </div>
  </GuidePreviewWindow>
);

const TradeDetailPreview = () => (
  <GuidePreviewWindow label="거래 상세">
    <div className="guide-preview-page-title guide-preview-page-title--trade-detail">
      <div>
        <strong>거래 상세</strong>
        <small>거래번호 TR-20260729-0182</small>
      </div>
      <span className="guide-preview-status">거래 완료</span>
    </div>
    <section className="guide-preview-trade-summary">
      <div className="guide-preview-trade-image">상품 이미지</div>
      <div>
        <small>구매 상품</small>
        <h4>빈티지 오디오 앰프</h4>
        <p>판매자 예시 · 배송 거래</p>
      </div>
      <strong>62,000원</strong>
    </section>
    <ol className="guide-preview-trade-progress">
      <li className="is-complete">결제</li>
      <li className="is-complete">배송</li>
      <li className="is-complete">구매 확정</li>
      <li className="is-current">거래 완료</li>
    </ol>
    <section className="guide-preview-trade-details">
      <div><span>거래 방식</span><strong>택배 배송</strong></div>
      <div><span>결제 금액</span><strong>62,000원</strong></div>
      <div><span>배송 완료</span><strong>2026.07.29</strong></div>
      <div><span>완료 상태</span><strong>구매 확정 완료</strong></div>
      <div><span>배송지</span><strong>서울 성동구 ****</strong></div>
      <div><span>송장번호</span><strong>1234-****-5678</strong></div>
    </section>
    <div className="guide-preview-actions guide-preview-actions--wide">
      <span>거래 내역 확인</span><strong>리뷰 작성</strong>
    </div>
  </GuidePreviewWindow>
);

const PointWalletPreview = () => (
  <GuidePreviewWindow label="포인트 지갑">
    <div className="guide-preview-page-title guide-preview-page-title--wallet">
      <strong>포인트 지갑</strong>
      <div className="guide-preview-wallet-actions">
        <span className="is-active">포인트 충전</span>
        <span>포인트 전환</span>
        <span>환전 신청</span>
      </div>
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
      <div><span>07.25</span><b>충전</b><em>+50,000P</em><strong>144,000P</strong></div>
      <div><span>07.20</span><b>반환</b><em>+20,000P</em><strong>94,000P</strong></div>
      <div><span>07.18</span><b>사용</b><em>-35,000P</em><strong>74,000P</strong></div>
    </div>
    <div className="guide-preview-wallet-exchange">
      <div><span>환전 신청 가능</span><strong>20,000 P</strong></div>
      <div><span>등록 계좌</span><strong>신한은행 ***1234</strong></div>
    </div>
    <div className="guide-preview-wallet-status">
      <strong>포인트 상태 안내</strong>
      <div>
        <span>사용 가능 · 즉시 사용</span>
        <span>홀딩 · 거래 완료까지 보관</span>
        <span>환전 가능 · 신청 가능</span>
      </div>
    </div>
  </GuidePreviewWindow>
);

const ServiceRequestPreview = () => (
  <GuidePreviewWindow label="서비스 요청서 작성">
    <div className="guide-preview-page-title"><strong>서비스 요청서 작성</strong></div>
    <section className="guide-preview-panel guide-preview-panel--wide">
      <header>요청 정보</header>
      <div>
        <GuidePreviewField label="요청 제목" value="성수동 원룸 이사 운반" />
        <span className="guide-preview-label">카테고리</span>
        <div className="guide-preview-category-cards">
          <b className="is-active">이사</b><b>청소</b><b>설치·수리</b><b>인테리어</b>
        </div>
      </div>
    </section>
    <section className="guide-preview-question">
      <span>1</span>
      <div><strong>이사 방식</strong><div className="guide-preview-chips"><b className="is-active">포장이사</b><b>반포장이사</b><b>일반이사</b></div></div>
    </section>
    <section className="guide-preview-question">
      <span>2</span>
      <div><strong>평수·거주 인원</strong><div className="guide-preview-chips"><b className="is-active">8평</b><b>1명</b></div></div>
    </section>
    <section className="guide-preview-question">
      <span>3</span>
      <div><strong>출발지·도착지</strong><div className="guide-preview-chips"><b className="is-active">서울 성동구</b><b>서울 마포구</b></div></div>
    </section>
    <div className="guide-preview-actions"><span>임시저장</span><strong>요청서 공개</strong></div>
  </GuidePreviewWindow>
);

const QuoteSelectionPreview = () => (
  <GuidePreviewWindow label="견적 비교·선택">
    <div className="guide-preview-page-title guide-preview-page-title--compact">
      <strong>받은 견적 비교</strong>
    </div>
    <article className="guide-preview-trade-item">
      <div className="guide-preview-trade-image">이사</div>
      <div>
        <span className="guide-preview-status">제출됨</span>
        <h4>정성 이사 견적</h4>
        <p>포장이사 · 오전 방문 가능</p>
        <small>견적 금액 180,000원</small>
      </div>
      <strong>선택하기</strong>
    </article>
    <article className="guide-preview-trade-item">
      <div className="guide-preview-trade-image">이사</div>
      <div>
        <span className="guide-preview-status">제출됨</span>
        <h4>안심 이사팀</h4>
        <p>포장이사 · 추가 작업 포함</p>
        <small>견적 금액 195,000원</small>
      </div>
      <strong>선택하기</strong>
    </article>
    <article className="guide-preview-trade-item">
      <div className="guide-preview-trade-image">이사</div>
      <div>
        <span className="guide-preview-status">제출됨</span>
        <h4>빠른 운반 파트너</h4>
        <p>일반이사 · 포장재 별도 제공</p>
        <small>견적 금액 165,000원</small>
      </div>
      <strong>선택하기</strong>
    </article>
    <p className="guide-preview-selection-note">금액뿐 아니라 작업 범위와 방문 가능 시간까지 확인한 뒤 견적을 선택합니다.</p>
    <div className="guide-preview-actions guide-preview-actions--wide"><strong>선택 후 거래 시작</strong></div>
  </GuidePreviewWindow>
);

const GuideScreenPreview = ({ type }) => {
  if (type === 'product-register') return <ProductRegisterPreview />;
  if (type === 'auction-detail') return <AuctionDetailPreview />;
  if (type === 'trade-detail') return <TradeDetailPreview />;
  if (type === 'point-wallet') return <PointWalletPreview />;
  if (type === 'service-request') return <ServiceRequestPreview />;
  if (type === 'quote-selection') return <QuoteSelectionPreview />;
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
  const [activeGuideId, setActiveGuideId] = useState(
    highlightedFlowId || requestedJourney?.flowIds?.[0] || journeys[0]?.flowIds?.[0],
  );
  const activeGuide = activeGuides.find((guide) => guide.id === activeGuideId)
    || activeGuides[0];

  if (!activeJourney) return null;

  return (
    <section className="guide-experience" aria-label="서비스 이용 흐름">
      <div className="guide-mode-tabs" role="tablist" aria-label="가이드 종류 선택">
        {journeys.map((journey) => (
          <button
            aria-selected={activeJourney.id === journey.id}
            className={activeJourney.id === journey.id ? 'is-active' : undefined}
            key={journey.id}
            onClick={() => {
              setActiveJourneyId(journey.id);
              setActiveGuideId(journey.flowIds[0]);
            }}
            role="tab"
            type="button"
          >
            <span aria-hidden="true">{journey.id === 'auction' ? '01' : '02'}</span>
            <div>
              <strong>{journey.id === 'auction' ? '경매 거래' : '서비스 요청'}</strong>
              <small>{journey.id === 'auction' ? '등록부터 거래 완료까지' : '작성부터 거래 완료까지'}</small>
            </div>
          </button>
        ))}
      </div>

      <article
        className={`guide-feature guide-feature--${activeJourney.id}`}
        role="tabpanel"
      >
        <div className="guide-feature__copy">
          <header className="guide-feature__heading">
            <span>{activeJourney.id === 'auction' ? '01' : '02'}</span>
            <div>
              <h2>{activeJourney.title}</h2>
              <p>{activeJourney.description}</p>
            </div>
          </header>

          <ol className="guide-feature__steps">
            {activeGuides.map((guide, index) => (
              <li
                className={[
                  guide.id === highlightedFlowId ? 'is-highlighted' : '',
                  guide.id === activeGuide?.id ? 'is-active' : '',
                ].filter(Boolean).join(' ') || undefined}
                id={`guide-flow-${guide.id}`}
                key={`${activeJourney.id}-${guide.id}`}
              >
                <button
                  onClick={() => setActiveGuideId(guide.id)}
                  onFocus={() => setActiveGuideId(guide.id)}
                  onMouseEnter={() => setActiveGuideId(guide.id)}
                  type="button"
                >
                  <span>{index + 1}</span>
                  <div>
                    <strong>{guide.title}</strong>
                    <p>{guide.summary}</p>
                  </div>
                  <Check aria-hidden="true" className="guide-feature__step-check" />
                </button>
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
            <GuideScreenPreview type={activeGuide?.preview?.type} />
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
