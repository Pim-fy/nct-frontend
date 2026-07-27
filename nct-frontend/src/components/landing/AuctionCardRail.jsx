// src/components/landing/AuctionCardRail.jsx
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import '@assets/css/landing.css';

/**
 * 수평 스크롤 경매 카드 레일 (재사용 가능)
 *
 * @param {string}   railId      - 고유 ID (여러 레일 구분)
 * @param {string}   title       - 섹션 제목
 * @param {string}   subtitle    - 섹션 부제목 (선택)
 * @param {string}   moreHref    - 더보기 링크
 * @param {Array}    items       - 카드 데이터 배열
 * @param {boolean}  isRequest   - 서비스 요청 카드 여부
 */
const AuctionCardRail = ({
  railId,
  title,
  subtitle,
  moreHref = '/auction',
  items = [],
  isRequest = false,
}) => {
  const railRef = useRef(null);

  const scrollRail = (direction) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector('.auction-card');
    const gap = parseFloat(getComputedStyle(rail).gap) || 20;
    const step = card ? card.getBoundingClientRect().width + gap : 320;
    rail.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <section style={{ marginTop: '34px' }}>
      {/* 섹션 헤더 */}
      <div className="home-section-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <Link className="btn btn-ghost" to={moreHref}>더보기 →</Link>
      </div>

      {/* 레일 */}
      <div className="auction-rail-wrap">
        <button
          className="rail-arrow prev"
          type="button"
          onClick={() => scrollRail(-1)}
          aria-label="이전"
        >‹</button>

        <div id={railId} className="home-card-rail" ref={railRef}>
          {items.map((item) => (
            isRequest
              ? <ServiceRequestCard key={item.id} item={item} />
              : <AuctionCard key={item.id} item={item} />
          ))}
        </div>

        <button
          className="rail-arrow next"
          type="button"
          onClick={() => scrollRail(1)}
          aria-label="다음"
        >›</button>
      </div>
    </section>
  );
};

// ──────────────────────────────────────────
// 경매 카드
// ──────────────────────────────────────────
const AuctionCard = ({ item }) => (
  <Link
    className="card auction-card"
    to={`/auction/${item.id}`}
    style={{ textDecoration: 'none', color: 'inherit' }}
  >
    <div className="img-placeholder" style={{ height: '220px', background: '#f7f7f7' }}>
      {item.image
        ? <img src={item.image} alt={item.title} />
        : <span style={{ fontSize: '2rem', color: '#ccc' }}>🖼️</span>
      }
    </div>
    <div className="auction-card-body">
      <h3 className="auction-card-title">{item.title}</h3>
      <div className="auction-card-price">{item.price}</div>
      <div className="auction-card-meta">
        <span>입찰 {item.bidCount ?? 0}회</span>
        <span className={`badge ${item.badgeClass ?? 'badge-success'}`}>{item.badge}</span>
      </div>
    </div>
  </Link>
);

// ──────────────────────────────────────────
// 서비스 요청 카드
// ──────────────────────────────────────────
const ServiceRequestCard = ({ item }) => (
  <Link
    className="card auction-card request-card"
    to={`/service/${item.id}`}
    style={{ textDecoration: 'none', color: 'inherit' }}
  >
    <div className="auction-card-body">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="badge badge-blue">{item.category}</span>
        <span className="badge badge-success">{item.badge}</span>
      </div>
      <h3 className="auction-card-title">{item.title}</h3>
      <p className="muted">{item.location} · {item.date}</p>
      <div className="auction-card-price">최대 {item.maxPrice}</div>
      <div className="auction-card-meta">
        <span>견적 {item.quoteCount ?? 0}건</span>
        <span>마감 {item.deadline}</span>
      </div>
    </div>
  </Link>
);

export default AuctionCardRail;
