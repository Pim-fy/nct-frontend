// src/components/landing/HeroSearchBand.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '@assets/css/landing.css';

const SEARCH_TAGS = [
  { label: '#마감임박경매', href: '/auction?keyword=마감임박경매' },
  { label: '#청소견적',     href: '/service?keyword=청소견적', active: true },
  { label: '#전자기기',     href: '/auction?category=전자기기' },
  { label: '#이사도움',     href: '/service?category=이사·운반' },
  { label: '#직거래',       href: '/auction?keyword=직거래' },
  { label: '#포인트충전',   href: '/point' },
  { label: '#수리설치',     href: '/service?category=수리·설치' },
  { label: '#무료나눔',     href: '/auction?keyword=무료나눔' },
  { label: '#안전거래안내', href: '/customersupport/notice' },
];

/**
 * 메인 검색창 + 추천 태그 섹션
 */
const HeroSearchBand = () => {
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      navigate(`/search/${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <section className="home-search-band" aria-label="통합 검색">
      <div className="container">
        <h1>실시간 경매와 생활 서비스를<br />한 화면에서</h1>

        {/* 검색창 */}
        <form className="home-search-box" onSubmit={handleSearch}>
          <input
            type="search"
            name="keyword"
            placeholder="검색어를 입력하세요"
            aria-label="검색어"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button className="home-search-button" type="submit" aria-label="검색">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </form>

        {/* 추천 검색 태그 */}
        <nav className="home-search-tags" aria-label="추천 검색어">
          {SEARCH_TAGS.map((tag) => (
            <Link
              key={tag.label}
              to={tag.href}
              className={tag.active ? 'active' : ''}
            >
              {tag.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
};

export default HeroSearchBand;
