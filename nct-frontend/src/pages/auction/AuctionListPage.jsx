import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import {
  AUCTION_CATEGORIES,
  AUCTION_STATUSES,
  SORT_OPTIONS,
  TRADE_METHODS,
} from '@/constants/auctionOptions';
import '@assets/css/auction.css';

const getSelectedValues = (searchParams, key) => searchParams.getAll(key);

const AuctionListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [keywordDraft, setKeywordDraft] = useState(searchParams.get('keyword') || '');

  const selectedCategories = getSelectedValues(searchParams, 'category');
  const selectedStatuses = getSelectedValues(searchParams, 'status');
  const tradeMethod = searchParams.get('tradeMethod') || 'all';
  const sort = searchParams.get('sort') || 'deadline';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const auctionItems = [];

  const updateParams = (updater) => {
    const next = new URLSearchParams(searchParams);
    updater(next);
    next.delete('page');
    setSearchParams(next);
  };

  const toggleArrayParam = (key, value) => {
    updateParams((next) => {
      const values = next.getAll(key);
      next.delete(key);
      values
        .filter((item) => item !== value)
        .forEach((item) => next.append(key, item));
      if (!values.includes(value)) next.append(key, value);
    });
  };

  const setSingleParam = (key, value) => {
    updateParams((next) => {
      if (!value || value === 'all') next.delete(key);
      else next.set(key, value);
    });
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateParams((next) => {
      const keyword = keywordDraft.trim();
      if (keyword) next.set('keyword', keyword);
      else next.delete('keyword');
    });
  };

  const handlePriceChange = (key, value) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    updateParams((next) => {
      if (cleanValue) next.set(key, cleanValue);
      else next.delete(key);
    });
  };

  const clearFilters = () => {
    setKeywordDraft('');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="auction-page">
      <section className="auction-search-band">
        <div className="auction-container">
          <form className="auction-search-box" onSubmit={handleSearch}>
            <input
              type="search"
              value={keywordDraft}
              onChange={(event) => setKeywordDraft(event.target.value)}
              placeholder="검색어를 입력하세요"
              aria-label="경매 검색어"
            />
            <button type="submit" aria-label="검색">
              <Search size={24} strokeWidth={2.4} />
            </button>
          </form>
        </div>
      </section>

      <main className="auction-container auction-main">
        <div className="auction-page-title">
          <div>
            <h1>경매 상품 목록</h1>
            <p>관심 있는 상품을 조건별로 빠르게 찾아보세요.</p>
          </div>
          <span>{auctionItems.length.toLocaleString('ko-KR')}개 상품</span>
        </div>

        <div className="auction-layout">
          <aside className={`auction-filter-panel ${filterOpen ? 'open' : ''}`}>
            <div className="auction-filter-head">
              <h2>필터</h2>
              <button type="button" onClick={clearFilters} title="필터 초기화" aria-label="필터 초기화">
                <RotateCcw size={16} />
              </button>
            </div>

            <fieldset className="auction-filter-group">
              <legend>카테고리</legend>
              {AUCTION_CATEGORIES.map((category) => (
                <label key={category}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleArrayParam('category', category)}
                  />
                  {category}
                </label>
              ))}
            </fieldset>

            <fieldset className="auction-filter-group">
              <legend>가격 범위</legend>
              <div className="auction-price-range">
                <input
                  value={minPrice}
                  onChange={(event) => handlePriceChange('minPrice', event.target.value)}
                  inputMode="numeric"
                  placeholder="최소"
                />
                <span>~</span>
                <input
                  value={maxPrice}
                  onChange={(event) => handlePriceChange('maxPrice', event.target.value)}
                  inputMode="numeric"
                  placeholder="최대"
                />
              </div>
            </fieldset>

            <fieldset className="auction-filter-group">
              <legend>경매 상태</legend>
              {AUCTION_STATUSES.map((status) => (
                <label key={status.value}>
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status.value)}
                    onChange={() => toggleArrayParam('status', status.value)}
                  />
                  {status.label}
                </label>
              ))}
            </fieldset>

            <fieldset className="auction-filter-group">
              <legend>거래 방식</legend>
              {TRADE_METHODS.map((method) => (
                <label key={method.value}>
                  <input
                    name="tradeMethod"
                    type="radio"
                    checked={tradeMethod === method.value}
                    onChange={() => setSingleParam('tradeMethod', method.value)}
                  />
                  {method.label}
                </label>
              ))}
            </fieldset>

            <label className="auction-sort-field">
              <span>정렬</span>
              <select value={sort} onChange={(event) => setSingleParam('sort', event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </aside>

          <section className="auction-content">
            <button className="auction-filter-toggle" type="button" onClick={() => setFilterOpen((prev) => !prev)}>
              <SlidersHorizontal size={18} />
              필터 열기/닫기
            </button>

            {auctionItems.length > 0 ? (
              <div className="auction-grid">
              </div>
            ) : (
              <div className="auction-empty">
                <strong>등록된 경매 상품이 없습니다.</strong>
                <p>새 경매가 올라오면 이곳에 표시됩니다.</p>
                <button type="button" onClick={clearFilters}>필터 초기화</button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Link className="auction-register-fab" to="/auction/create" aria-label="경매 등록">
        <Plus size={20} />
        <span>경매 등록</span>
      </Link>
    </div>
  );
};

export default AuctionListPage;
