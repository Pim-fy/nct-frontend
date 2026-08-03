import {
  BadgeCheck,
  BriefcaseBusiness,
  Clock3,
  Flag,
  MapPin,
  MessageSquareText,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toImageUrl } from '@api/fileApi';
import './mockupServicePages.css';

export const MockupServiceSearchBar = ({ keyword, onKeywordChange, onSubmit }) => (
  <form className="hero-search-bar" onSubmit={onSubmit} role="search">
    <label className="sr-only" htmlFor="service-keyword">서비스 검색어</label>
    <input
      id="service-keyword"
      onChange={(event) => onKeywordChange(event.target.value)}
      placeholder="서비스 요청이나 제공자를 검색하세요"
      type="search"
      value={keyword}
    />
    <button aria-label="서비스 검색" type="submit"><Search aria-hidden="true" /></button>
  </form>
);

export const MockupDiscoveryTabs = ({ activeView, onChange, requestCount, providerCount }) => (
  <div className="service-discovery-tabs" role="tablist" aria-label="검색 결과 유형">
    <button
      aria-selected={activeView === 'requests'}
      className={activeView === 'requests' ? 'is-active' : ''}
      onClick={() => onChange('requests')}
      role="tab"
      type="button"
    >
      서비스 요청 {requestCount != null && <span>{requestCount}</span>}
    </button>
    <button
      aria-selected={activeView === 'providers'}
      className={activeView === 'providers' ? 'is-active' : ''}
      onClick={() => onChange('providers')}
      role="tab"
      type="button"
    >
      제공자 {providerCount != null && <span>{providerCount}</span>}
    </button>
  </div>
);

export const MockupServiceFilterPanel = ({
  categories,
  filters,
  isOpen,
  onChange,
  onReset,
  regions,
  view,
}) => (
  <aside className={`service-filter-panel${isOpen ? ' is-open' : ''}`} aria-label="서비스 검색 필터">
    <div className="service-filter-panel__title">
      <SlidersHorizontal aria-hidden="true" />
      <h2>필터</h2>
    </div>

    <label>
      <span>카테고리</span>
      <select onChange={(event) => onChange('category', event.target.value)} value={filters.category}>
        <option value="">전체 카테고리</option>
        {categories.map((category) => <option key={category}>{category}</option>)}
      </select>
    </label>

    <label>
      <span>지역</span>
      <select onChange={(event) => onChange('region', event.target.value)} value={filters.region}>
        <option value="">전체 지역</option>
        {regions.map((region) => <option key={region}>{region}</option>)}
      </select>
    </label>

    {view === 'requests' && (
      <fieldset>
        <legend>예산 범위</legend>
        <div className="service-budget-inputs">
          <input
            aria-label="최소 예산"
            min="0"
            onChange={(event) => onChange('minBudget', event.target.value)}
            placeholder="최소"
            type="number"
            value={filters.minBudget || ''}
          />
          <span>~</span>
          <input
            aria-label="최대 예산"
            min="0"
            onChange={(event) => onChange('maxBudget', event.target.value)}
            placeholder="최대"
            type="number"
            value={filters.maxBudget || ''}
          />
        </div>
      </fieldset>
    )}

    <label>
      <span>정렬</span>
      <select onChange={(event) => onChange('sort', event.target.value)} value={filters.sort}>
        {view === 'requests' ? (
          <>
            <option value="deadline">마감임박순</option>
            <option value="budget-high">예산 높은순</option>
            <option value="quotes-low">견적 적은순</option>
            <option value="latest">최신순</option>
          </>
        ) : (
          <>
            <option value="rating">평점 높은순</option>
            <option value="reviews">리뷰 많은순</option>
          </>
        )}
      </select>
    </label>

    <button className="service-filter-reset" onClick={onReset} type="button">필터 초기화</button>
  </aside>
);

const ServiceRequestCard = ({ request }) => (
  <article className="service-request-card">
    <div className="service-request-card__top">
      <span>{request.category}</span>
      <strong className={request.status === '마감임박' ? 'is-urgent' : ''}>{request.status}</strong>
    </div>
    <h3>{request.title}</h3>
    <p>{request.summary}</p>
    <dl>
      <div><dt><MapPin aria-hidden="true" />지역</dt><dd>{request.region}</dd></div>
      <div><dt><MessageSquareText aria-hidden="true" />견적</dt><dd>{request.quoteCount}건</dd></div>
      <div><dt><Clock3 aria-hidden="true" />진행</dt><dd>{request.remote ? '비대면 가능' : '현장 서비스'}</dd></div>
    </dl>
    <div className="service-request-card__footer">
      <strong>{request.budgetLabel}</strong>
      <span>상세 화면 계약 대기</span>
    </div>
  </article>
);

export const MockupServiceRequestGrid = ({ requests }) => (
  <section className="service-result-grid" aria-label="서비스 요청 검색 결과">
    {requests.map((request) => <ServiceRequestCard key={request.id} request={request} />)}
  </section>
);

const ProviderCard = ({ provider }) => (
  <Link className="service-provider-card" to={`/providers/${provider.id}`}>
    <div className="service-provider-card__avatar" aria-hidden="true">{provider.name.slice(0, 1)}</div>
    <div className="service-provider-card__body">
      <div className="service-provider-card__name">
        <h3>{provider.name}</h3>
        {provider.verified && <BadgeCheck aria-label="승인된 제공자" />}
      </div>
      <div className="service-provider-card__rating"><Star aria-hidden="true" />{provider.rating} · 리뷰 {provider.reviewCount}개</div>
      <p>{provider.intro}</p>
      <div className="service-provider-card__tags">
        {provider.categories.map((category) => <span key={category}>{category}</span>)}
      </div>
      <small>
        {[
          provider.regions.join(', '),
          provider.completedCount != null ? `완료 ${provider.completedCount}건` : '',
          provider.responseRate != null ? `응답률 ${provider.responseRate}%` : '',
        ].filter(Boolean).join(' · ') || '활동 지역 미등록'}
      </small>
    </div>
  </Link>
);

export const MockupProviderGrid = ({ providers }) => (
  <section className="service-provider-grid" aria-label="제공자 검색 결과">
    {providers.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}
  </section>
);

export const MockupServiceEmptyState = ({ view }) => (
  <div className="service-empty-state" role="status">
    <Search aria-hidden="true" />
    <strong>조건에 맞는 {view === 'providers' ? '제공자가' : '서비스 요청이'} 없습니다.</strong>
    <span>검색어나 필터를 줄여서 다시 확인해 주세요.</span>
  </div>
);

export const MockupProviderProfile = ({
  activeTab,
  onOpenPortfolio,
  onReport,
  onTabChange,
  provider,
}) => (
  <div className="provider-public-layout">
    <aside className="provider-public-card">
      {/* 담당자 7 · F-COM-015: 공개 제공자 프로필에서 공통 신고 접수 모달을 엽니다. */}
      <button
        aria-label={`${provider.name} 제공자 신고하기`}
        className="provider-public-report-button"
        onClick={onReport}
        type="button"
      >
        <Flag aria-hidden="true" />
        신고
      </button>
      <div className="provider-public-avatar" aria-hidden="true">
        {provider.profileImageUrl
          ? <img src={toImageUrl(provider.profileImageUrl)} alt="" />
          : provider.name.slice(0, 1)}
      </div>
      <div className="provider-public-name">
        <h1>{provider.name}</h1>
        {provider.verified && <span><BadgeCheck aria-hidden="true" />승인</span>}
      </div>
      <p className="provider-public-rating"><Star aria-hidden="true" />{provider.rating} <span>리뷰 {provider.reviewCount}개</span></p>
      <div className="provider-public-tags">
        {provider.categories.map((category) => <span key={category}>{category}</span>)}
      </div>
      <p className="provider-public-stats">
        {provider.regions.join(', ')}
        {provider.completedCount != null && ` · 완료 ${provider.completedCount}건`}
        {provider.responseRate != null && ` · 응답률 ${provider.responseRate}%`}
      </p>
      <section>
        <h2>소개</h2>
        <p>{provider.intro}</p>
      </section>
    </aside>

    <section className="provider-public-content">
      <div className="provider-public-tabs" role="tablist" aria-label="제공자 상세 정보">
        <button aria-selected={activeTab === 'reviews'} className={activeTab === 'reviews' ? 'is-active' : ''} onClick={() => onTabChange('reviews')} role="tab" type="button">리뷰</button>
        <button aria-selected={activeTab === 'portfolio'} className={activeTab === 'portfolio' ? 'is-active' : ''} onClick={() => onTabChange('portfolio')} role="tab" type="button">포트폴리오</button>
      </div>

      {activeTab === 'reviews' && (
        <div className="provider-review-list" role="tabpanel">
          {provider.reviews.length > 0 ? provider.reviews.map((review) => (
            <article key={review.id}>
              <strong>{'★'.repeat(review.score)}</strong>
              <p>{review.content}</p>
              <small>{review.author} · {review.date}</small>
            </article>
          )) : <p className="provider-panel-empty">표시할 리뷰가 없습니다.</p>}
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div className="provider-portfolio-grid" role="tabpanel">
          {provider.portfolios.length > 0 ? provider.portfolios.map((portfolio) => (
            <button key={portfolio.id} onClick={() => onOpenPortfolio(portfolio)} type="button">
              {portfolio.imageUrl
                ? <img src={toImageUrl(portfolio.imageUrl)} alt="" className="provider-portfolio-thumbnail" />
                : <span><BriefcaseBusiness aria-hidden="true" /></span>}
              <strong>{portfolio.title}</strong>
              {portfolio.category && <small>{portfolio.category}</small>}
              <p>{portfolio.description}</p>
            </button>
          )) : <p className="provider-panel-empty">등록된 포트폴리오가 없습니다.</p>}
        </div>
      )}
    </section>
  </div>
);

export const MockupPortfolioModal = ({ closeButtonRef, onClose, portfolio }) => (
  <div className="service-modal" onMouseDown={(event) => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section aria-labelledby="portfolio-title" aria-modal="true" className="service-modal__panel service-modal__panel--portfolio" role="dialog">
      <div className="service-modal__heading">
        <div>{portfolio.category && <span>{portfolio.category}</span>}<h2 id="portfolio-title">{portfolio.title}</h2></div>
        <button aria-label="포트폴리오 창 닫기" onClick={onClose} ref={closeButtonRef} type="button"><X aria-hidden="true" /></button>
      </div>
      {portfolio.imageUrl
        ? <img src={toImageUrl(portfolio.imageUrl)} alt="" className="provider-portfolio-modal-image" />
        : <div className="provider-portfolio-placeholder"><BriefcaseBusiness aria-hidden="true" /></div>}
      <p>{portfolio.description}</p>
    </section>
  </div>
);
