import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { fetchAuctions } from '@api/auctionApi';
import { getCategories } from '@api/categoryApi';
import { fetchReferenceCodes } from '@api/referenceApi';
import { SORT_OPTIONS } from '@/constants/auctionOptions';
import AuctionCard from './components/AuctionCard';
import '@assets/css/auction.css';

const getSelectedValues = (searchParams, key) => searchParams.getAll(key);
const DEFAULT_PAGE_SIZE = 12;
const PRODUCT_CATEGORY_DOMAIN_CODE = 'CATC0001';
const AUCTION_STATUS_GROUP_CODE = 'AUCG01';
const TRADE_METHOD_GROUP_CODE = 'TRDG03';
const COLLAPSED_CATEGORY_COUNT = 5;
const AUCTION_STATUS_FILTERS = [
  { code: 'AUCC0001', label: '진행 예정' },
  { code: 'AUCC0002', label: '진행 중' },
];
const TRADE_METHOD_FILTERS = [
  { code: 'TRDC0009', label: '배송' },
  { code: 'TRDC0010', label: '직거래' },
  { code: 'TRDC0020', label: '배송·직거래 모두 가능' },
];

const toggleValue = (values, value) => (
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
);

const AuctionListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [keywordDraft, setKeywordDraft] = useState(searchParams.get('keyword') || '');
  const [categoryDraft, setCategoryDraft] = useState(() => getSelectedValues(searchParams, 'category'));
  const [statusDraft, setStatusDraft] = useState(() => getSelectedValues(searchParams, 'status'));
  const [tradeMethodDraft, setTradeMethodDraft] = useState(searchParams.get('tradeMethod') || 'all');
  const [sortDraft, setSortDraft] = useState(searchParams.get('sort') || 'deadline');
  const [minPriceDraft, setMinPriceDraft] = useState(searchParams.get('minPrice') || '');
  const [maxPriceDraft, setMaxPriceDraft] = useState(searchParams.get('maxPrice') || '');
  const [instantBuyOnlyDraft, setInstantBuyOnlyDraft] = useState(
    searchParams.get('instantBuyOnly') === 'true',
  );
  const [endingSoonOnlyDraft, setEndingSoonOnlyDraft] = useState(
    searchParams.get('endingSoonOnly') === 'true',
  );
  const [previewQueryParams, setPreviewQueryParams] = useState(null);

  const selectedCategories = getSelectedValues(searchParams, 'category');
  const selectedStatuses = getSelectedValues(searchParams, 'status');
  const tradeMethod = searchParams.get('tradeMethod') || 'all';
  const sort = searchParams.get('sort') || 'deadline';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const instantBuyOnly = searchParams.get('instantBuyOnly') === 'true';
  const endingSoonOnly = searchParams.get('endingSoonOnly') === 'true';
  const page = Number(searchParams.get('page') || 1);

  const categoriesQuery = useQuery({
    queryKey: ['auction-filter-categories', PRODUCT_CATEGORY_DOMAIN_CODE],
    queryFn: () => getCategories(PRODUCT_CATEGORY_DOMAIN_CODE)
      .then((response) => response.data.filter((category) => category.catParentSn !== null)),
    staleTime: 5 * 60 * 1000,
  });
  const auctionStatusesQuery = useQuery({
    queryKey: ['reference-codes', AUCTION_STATUS_GROUP_CODE],
    queryFn: () => fetchReferenceCodes(AUCTION_STATUS_GROUP_CODE),
    staleTime: 5 * 60 * 1000,
  });
  const tradeMethodsQuery = useQuery({
    queryKey: ['reference-codes', TRADE_METHOD_GROUP_CODE],
    queryFn: () => fetchReferenceCodes(TRADE_METHOD_GROUP_CODE),
    staleTime: 5 * 60 * 1000,
  });

  const categoryOptions = categoriesQuery.data || [];
  const visibleCategoryOptions = showAllCategories
    ? categoryOptions
    : categoryOptions.slice(0, COLLAPSED_CATEGORY_COUNT);
  const availableAuctionStatusCodes = new Set(
    auctionStatusesQuery.data?.map((status) => status.code) || [],
  );
  const auctionStatusOptions = AUCTION_STATUS_FILTERS
    .filter((status) => availableAuctionStatusCodes.has(status.code));
  const availableTradeMethodCodes = new Set(
    tradeMethodsQuery.data?.map((method) => method.code) || [],
  );
  const tradeMethodOptions = TRADE_METHOD_FILTERS
    .filter((method) => availableTradeMethodCodes.has(method.code));

  const queryParams = {
    keyword: searchParams.get('keyword') || '',
    category: selectedCategories,
    status: selectedStatuses,
    tradeMethod,
    sort,
    minPrice,
    maxPrice,
    instantBuyOnly: instantBuyOnly || undefined,
    endingSoonOnly: endingSoonOnly || undefined,
    page,
    size: DEFAULT_PAGE_SIZE,
  };

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setPreviewQueryParams({
        keyword: keywordDraft.trim(),
        category: categoryDraft,
        status: statusDraft,
        tradeMethod: tradeMethodDraft,
        sort: sortDraft,
        minPrice: minPriceDraft,
        maxPrice: maxPriceDraft,
        instantBuyOnly: instantBuyOnlyDraft || undefined,
        endingSoonOnly: endingSoonOnlyDraft || undefined,
        page: 1,
        size: 1,
      });
    }, 250);

    return () => window.clearTimeout(timerId);
  }, [
    categoryDraft,
    endingSoonOnlyDraft,
    instantBuyOnlyDraft,
    keywordDraft,
    maxPriceDraft,
    minPriceDraft,
    sortDraft,
    statusDraft,
    tradeMethodDraft,
  ]);

  const filterPreviewQuery = useQuery({
    queryKey: ['auction-filter-preview', previewQueryParams],
    queryFn: () => fetchAuctions(previewQueryParams),
    enabled: Boolean(previewQueryParams),
    staleTime: 10 * 1000,
  });

  const {
    data: auctionPage,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['auctions', queryParams],
    queryFn: () => fetchAuctions(queryParams),
    keepPreviousData: true,
  });

  const auctionItems = auctionPage?.items || [];
  const totalElements = auctionPage?.totalElements || 0;
  const totalPages = auctionPage?.totalPages || 0;

  const handleSearch = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    const keyword = keywordDraft.trim();
    if (keyword) next.set('keyword', keyword);
    else next.delete('keyword');
    next.delete('page');
    setSearchParams(next);
  };

  const handleFilterSearch = () => {
    const next = new URLSearchParams();
    const keyword = keywordDraft.trim();

    if (keyword) next.set('keyword', keyword);
    categoryDraft.forEach((category) => next.append('category', category));
    statusDraft.forEach((status) => next.append('status', status));
    if (minPriceDraft) next.set('minPrice', minPriceDraft);
    if (maxPriceDraft) next.set('maxPrice', maxPriceDraft);
    if (instantBuyOnlyDraft) next.set('instantBuyOnly', 'true');
    if (endingSoonOnlyDraft) next.set('endingSoonOnly', 'true');
    if (tradeMethodDraft && tradeMethodDraft !== 'all') next.set('tradeMethod', tradeMethodDraft);
    if (sortDraft && sortDraft !== 'deadline') next.set('sort', sortDraft);

    setSearchParams(next);
  };

  const handlePriceDraftChange = (setter, value) => {
    setter(value.replace(/[^\d]/g, ''));
  };

  const clearFilters = () => {
    setKeywordDraft('');
    setCategoryDraft([]);
    setStatusDraft([]);
    setTradeMethodDraft('all');
    setSortDraft('deadline');
    setMinPriceDraft('');
    setMaxPriceDraft('');
    setInstantBuyOnlyDraft(false);
    setEndingSoonOnlyDraft(false);
    setShowAllCategories(false);
    setSearchParams(new URLSearchParams());
  };

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div className="auction-layout">
          <aside className={`auction-filter-panel ${filterOpen ? 'open' : ''}`}>
            <div className="auction-filter-head">
              <h2>필터</h2>
              <button type="button" onClick={clearFilters} title="필터 초기화" aria-label="필터 초기화">
                <RotateCcw size={16} />
              </button>
            </div>

            <fieldset
              className="auction-filter-group"
              disabled={categoriesQuery.isLoading || categoriesQuery.isError}
            >
              <legend>카테고리</legend>
              {categoriesQuery.isLoading ? (
                <p className="auction-filter-message">불러오는 중</p>
              ) : categoriesQuery.isError ? (
                <p className="auction-filter-message error">불러오지 못했습니다.</p>
              ) : categoryOptions.length === 0 ? (
                <p className="auction-filter-message">선택 가능한 항목이 없습니다.</p>
              ) : (
                <>
                  {visibleCategoryOptions.map((category) => (
                    <label key={category.catSn}>
                      <input
                        type="checkbox"
                        checked={categoryDraft.includes(category.catNm)}
                        onChange={() => setCategoryDraft((prev) => toggleValue(prev, category.catNm))}
                      />
                      {category.catNm}
                    </label>
                  ))}
                  {categoryOptions.length > COLLAPSED_CATEGORY_COUNT && (
                    <button
                      className="auction-category-more"
                      type="button"
                      onClick={() => setShowAllCategories((prev) => !prev)}
                    >
                      {showAllCategories ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      {showAllCategories ? '접기' : '더보기'}
                    </button>
                  )}
                </>
              )}
            </fieldset>

            <fieldset className="auction-filter-group">
              <legend>가격 범위</legend>
              <div className="auction-price-range">
                <input
                  value={minPriceDraft}
                  onChange={(event) => handlePriceDraftChange(setMinPriceDraft, event.target.value)}
                  inputMode="numeric"
                  placeholder="최소 금액"
                  aria-label="최소 금액"
                />
                <span>~</span>
                <input
                  value={maxPriceDraft}
                  onChange={(event) => handlePriceDraftChange(setMaxPriceDraft, event.target.value)}
                  inputMode="numeric"
                  placeholder="최대 금액"
                  aria-label="최대 금액"
                />
              </div>
            </fieldset>

            <fieldset
              className="auction-filter-group"
              disabled={auctionStatusesQuery.isLoading || auctionStatusesQuery.isError}
            >
              <legend>진행 상태</legend>
              {auctionStatusesQuery.isLoading ? (
                <p className="auction-filter-message">불러오는 중</p>
              ) : auctionStatusesQuery.isError ? (
                <p className="auction-filter-message error">불러오지 못했습니다.</p>
              ) : auctionStatusOptions.length === 0 ? (
                <p className="auction-filter-message">선택 가능한 항목이 없습니다.</p>
              ) : auctionStatusOptions.map((status) => (
                <label key={status.code}>
                  <input
                    type="checkbox"
                    checked={statusDraft.includes(status.code)}
                    onChange={() => setStatusDraft((prev) => toggleValue(prev, status.code))}
                  />
                  {status.label}
                </label>
              ))}
            </fieldset>

            <fieldset
              className="auction-filter-group"
              disabled={tradeMethodsQuery.isLoading || tradeMethodsQuery.isError}
            >
              <legend>거래 방식</legend>
              {tradeMethodsQuery.isLoading ? (
                <p className="auction-filter-message">불러오는 중</p>
              ) : tradeMethodsQuery.isError ? (
                <p className="auction-filter-message error">불러오지 못했습니다.</p>
              ) : tradeMethodOptions.length === 0 ? (
                <p className="auction-filter-message">선택 가능한 항목이 없습니다.</p>
              ) : (
                <>
                  <label>
                    <input
                      name="tradeMethod"
                      type="radio"
                      checked={tradeMethodDraft === 'all'}
                      onChange={() => setTradeMethodDraft('all')}
                    />
                    전체
                  </label>
                  {tradeMethodOptions.map((method) => (
                    <label key={method.code}>
                      <input
                        name="tradeMethod"
                      type="radio"
                      checked={tradeMethodDraft === method.code}
                      onChange={() => setTradeMethodDraft(method.code)}
                    />
                      {method.label}
                    </label>
                  ))}
                </>
              )}
            </fieldset>

            <fieldset className="auction-filter-group">
              <legend>추가 조건</legend>
              <label>
                <input
                  type="checkbox"
                  checked={endingSoonOnlyDraft}
                  onChange={(event) => setEndingSoonOnlyDraft(event.target.checked)}
                />
                마감 임박 상품만
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={instantBuyOnlyDraft}
                  onChange={(event) => setInstantBuyOnlyDraft(event.target.checked)}
                />
                즉시구매 가능한 상품만
              </label>
            </fieldset>

            <label className="auction-sort-field">
              <span>정렬</span>
              <select value={sortDraft} onChange={(event) => setSortDraft(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button className="auction-filter-submit" type="button" onClick={handleFilterSearch}>
              상품 {(filterPreviewQuery.data?.totalElements ?? totalElements).toLocaleString('ko-KR')}개 보기
            </button>
          </aside>

          <section className="auction-content">
            <button className="auction-filter-toggle" type="button" onClick={() => setFilterOpen((prev) => !prev)}>
              <SlidersHorizontal size={18} />
              필터 열기/닫기
            </button>
            <div className="auction-list-count">
              {totalElements.toLocaleString('ko-KR')}개 상품
            </div>

            {isLoading ? (
              <div className="auction-empty">
                <strong>경매 상품을 불러오는 중입니다.</strong>
              </div>
            ) : isError ? (
              <div className="auction-empty">
                <strong>경매 상품을 불러오지 못했습니다.</strong>
                <p>잠시 후 다시 시도해 주세요.</p>
              </div>
            ) : auctionItems.length > 0 ? (
              <div className="auction-grid">
                {auctionItems.map((item) => (
                  <AuctionCard key={item.auctionId} item={item} />
                ))}
              </div>
            ) : (
              <div className="auction-empty">
                <strong>등록된 경매 상품이 없습니다.</strong>
                <p>새 경매가 올라오면 이곳에 표시됩니다.</p>
                <button type="button" onClick={clearFilters}>필터 초기화</button>
              </div>
            )}

            {totalPages > 1 && (
              <div className="auction-pagination" aria-label="경매 목록 페이지">
                <button type="button" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === page ? 'active' : ''}
                    onClick={() => goToPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button type="button" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                  다음
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

    </div>
  );
};

export default AuctionListPage;
