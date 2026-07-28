import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  History,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { fetchAuctions } from '@api/auctionApi';
import { getCategories } from '@api/categoryApi';
import { fetchReferenceCodes } from '@api/referenceApi';
import { AuctionCardSkeleton, SkeletonBlock } from '@components/skeleton/AuctionSkeletons';
import { SORT_OPTIONS } from '@/constants/auctionOptions';
import {
  addAuctionSearchHistory,
  getAuctionSearchHistory,
  removeAuctionSearchHistory,
} from '@utils/auctionSearchHistory';
import AuctionCard from './components/AuctionCard';

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
const FILTER_GROUP_CLASS = 'm-0 grid gap-2 border-0 p-0 disabled:opacity-60';
const FILTER_OPTION_CLASS = 'flex cursor-pointer items-center gap-2 text-base leading-[1.6] text-[#5f5e5a]';
const FILTER_MESSAGE_CLASS = 'm-0 min-h-5 text-sm leading-[1.5] text-[#5f5e5a]';
const FILTER_INPUT_CLASS = 'min-h-10 w-full rounded-lg border border-[#e2e1dc] bg-white px-3 text-base leading-[1.5] text-[#1a1a18] outline-none transition-colors focus:border-primary';
const PAGINATION_BUTTON_CLASS = 'min-h-10 rounded-lg border border-[#e2e1dc] bg-white px-3.5 text-base leading-[1.4] font-semibold text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 max-sm:min-h-9 max-sm:min-w-9 max-sm:px-1.5 max-sm:text-sm';
const PAGINATION_WINDOW_SIZE = 5;

const getPaginationItems = (currentPage, totalPages) => {
  const halfWindow = Math.floor(PAGINATION_WINDOW_SIZE / 2);
  const windowSize = Math.min(PAGINATION_WINDOW_SIZE, totalPages);
  const maxWindowStart = totalPages - windowSize + 1;
  const windowStart = Math.min(
    Math.max(currentPage - halfWindow, 1),
    maxWindowStart,
  );
  return Array.from({ length: windowSize }, (_, index) => windowStart + index);
};

const toggleValue = (values, value) => (
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
);

const createDraftFromSearchParams = (searchParams) => ({
  keyword: searchParams.get('keyword') || '',
  categories: getSelectedValues(searchParams, 'category'),
  statuses: getSelectedValues(searchParams, 'status'),
  tradeMethod: searchParams.get('tradeMethod') || 'all',
  sort: searchParams.get('sort') || 'deadline',
  minPrice: searchParams.get('minPrice') || '',
  maxPrice: searchParams.get('maxPrice') || '',
  instantBuyOnly: searchParams.get('instantBuyOnly') === 'true',
  endingSoonOnly: searchParams.get('endingSoonOnly') === 'true',
});

const AuctionListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldScrollAfterPageChangeRef = useRef(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isSearchDocked, setIsSearchDocked] = useState(false);
  const [searchHistoryOpen, setSearchHistoryOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => getAuctionSearchHistory());
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
  const searchParamsKey = searchParams.toString();
  const searchContainerRef = useRef(null);
  const showSearchHistory = searchHistoryOpen && searchHistory.length > 0;

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(() => {
      const nextDraft = createDraftFromSearchParams(new URLSearchParams(searchParamsKey));
      setKeywordDraft(nextDraft.keyword);
      setCategoryDraft(nextDraft.categories);
      setStatusDraft(nextDraft.statuses);
      setTradeMethodDraft(nextDraft.tradeMethod);
      setSortDraft(nextDraft.sort);
      setMinPriceDraft(nextDraft.minPrice);
      setMaxPriceDraft(nextDraft.maxPrice);
      setInstantBuyOnlyDraft(nextDraft.instantBuyOnly);
      setEndingSoonOnlyDraft(nextDraft.endingSoonOnly);
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [searchParamsKey]);

  useEffect(() => {
    const handleScroll = () => setIsSearchDocked(window.scrollY > 48);

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (searchContainerRef.current?.contains(event.target)) return;
      setSearchHistoryOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (!filterOpen || !window.matchMedia('(max-width: 767px)').matches) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setFilterOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filterOpen]);

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
    placeholderData: keepPreviousData,
  });

  const auctionItems = auctionPage?.items || [];
  const totalElements = auctionPage?.totalElements || 0;
  const totalPages = auctionPage?.totalPages || 0;
  const paginationItems = getPaginationItems(page, totalPages);

  useEffect(() => {
    if (!shouldScrollAfterPageChangeRef.current) return undefined;

    shouldScrollAfterPageChangeRef.current = false;
    const animationFrameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [page]);

  const createSearchParamsFromDraft = (keywordValue = keywordDraft) => {
    const next = new URLSearchParams();
    const keyword = keywordValue.trim();

    if (keyword) next.set('keyword', keyword);
    categoryDraft.forEach((category) => next.append('category', category));
    statusDraft.forEach((status) => next.append('status', status));
    if (minPriceDraft) next.set('minPrice', minPriceDraft);
    if (maxPriceDraft) next.set('maxPrice', maxPriceDraft);
    if (instantBuyOnlyDraft) next.set('instantBuyOnly', 'true');
    if (endingSoonOnlyDraft) next.set('endingSoonOnly', 'true');
    if (tradeMethodDraft && tradeMethodDraft !== 'all') next.set('tradeMethod', tradeMethodDraft);
    if (sortDraft && sortDraft !== 'deadline') next.set('sort', sortDraft);

    return next;
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const keyword = keywordDraft.trim();
    if (keyword) setSearchHistory(addAuctionSearchHistory(keyword));
    setSearchHistoryOpen(false);
    setSearchParams(createSearchParamsFromDraft(keyword), { replace: false });
  };

  const handleRecentSearch = (term) => {
    setKeywordDraft(term);
    setSearchHistory(addAuctionSearchHistory(term));
    setSearchHistoryOpen(false);
    setSearchParams(createSearchParamsFromDraft(term), { replace: false });
  };

  const handleRemoveRecentSearch = (term) => {
    setSearchHistory(removeAuctionSearchHistory(term));
  };

  const handleFilterSearch = () => {
    const next = createSearchParamsFromDraft();

    setSearchParams(next, { replace: false });
    setFilterOpen(false);
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
    if (nextPage === page) return;

    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    shouldScrollAfterPageChangeRef.current = true;
    setSearchParams(next);
  };

  return (
    <div className="min-h-full bg-white text-base leading-[1.6] text-[#1a1a18]">
      <section className="h-[92px] bg-white" aria-label="경매 검색">
        <div
          className={isSearchDocked
            ? 'fixed inset-x-0 top-0 z-[120] flex h-[82px] items-center bg-white px-4 shadow-[0_5px_12px_rgba(0,0,0,0.14)] md:pointer-events-none md:bg-transparent md:px-0 md:shadow-none'
            : 'mx-auto flex h-full w-full max-w-[1600px] items-center px-4 lg:px-6'}
        >
          <div
            ref={searchContainerRef}
            className={`relative mx-auto w-full ${
              isSearchDocked
                ? 'max-w-[560px] md:pointer-events-auto md:w-[min(38vw,560px)]'
                : 'max-w-[560px]'
            }`}
          >
            <form
              className={`grid w-full grid-cols-[minmax(0,1fr)_56px] overflow-hidden border-[3px] border-primary bg-white ${
                showSearchHistory
                  ? 'rounded-t-lg rounded-b-none border-b-transparent'
                  : 'rounded-lg'
              }`}
              onSubmit={handleSearch}
            >
              <input
                className="min-h-12 min-w-0 border-0 px-[18px] text-base leading-[1.5] text-[#1a1a18] outline-none"
                type="search"
                value={keywordDraft}
                onChange={(event) => setKeywordDraft(event.target.value)}
                onFocus={() => setSearchHistoryOpen(true)}
                onClick={() => setSearchHistoryOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setSearchHistoryOpen(false);
                }}
                placeholder="검색어를 입력하세요"
                aria-label="경매 검색어"
                aria-controls="auction-search-history"
                aria-expanded={showSearchHistory}
                autoComplete="off"
              />
              <button
                className="inline-flex cursor-pointer items-center justify-center border-0 bg-primary text-white transition-colors hover:bg-primary-dark"
                type="submit"
                aria-label="검색"
              >
                <Search size={24} strokeWidth={2.4} />
              </button>
            </form>

            {showSearchHistory && (
              <div
                id="auction-search-history"
                className="absolute inset-x-0 top-[calc(100%-3px)] z-[140] overflow-hidden rounded-b-lg border-[3px] border-t-0 border-primary bg-white shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
              >
                <div className="mx-4 border-t border-[#e2e1dc]" />
                <ul className="m-0 list-none p-0">
                  {searchHistory.map((term) => (
                    <li className="flex min-h-11 items-center hover:bg-[#f7f8fa]" key={term}>
                      <button
                        className="flex min-w-0 flex-1 cursor-pointer items-center self-stretch overflow-hidden border-0 bg-transparent text-left text-base leading-[1.5] text-[#333]"
                        type="button"
                        onClick={() => handleRecentSearch(term)}
                      >
                        <History className="ml-3 shrink-0 text-[#777]" size={17} aria-hidden="true" />
                        <span className="min-w-0 overflow-hidden px-3 text-ellipsis whitespace-nowrap">
                          {term}
                        </span>
                      </button>
                      <button
                        className="mr-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[#999] hover:bg-white hover:text-[#333]"
                        type="button"
                        onClick={() => handleRemoveRecentSearch(term)}
                        aria-label={`${term} 검색 기록 삭제`}
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1600px] px-4 py-7 pb-[52px] lg:px-6">
        <div className="flex items-start gap-6 max-md:block">
          <button
            className={`fixed inset-0 z-[210] cursor-default border-0 bg-black/40 transition-opacity duration-300 md:hidden ${
              filterOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            type="button"
            aria-label="필터 닫기"
            tabIndex={filterOpen ? 0 : -1}
            onClick={() => setFilterOpen(false)}
          />
          <aside
            className={`fixed inset-x-0 bottom-0 z-[220] grid max-h-[88dvh] w-full gap-[18px] overflow-y-auto rounded-t-2xl border border-[#f0efec] bg-white p-5 shadow-[0_-8px_28px_rgba(0,0,0,0.18)] transition-[transform,visibility] duration-300 ease-out [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              filterOpen
                ? 'visible translate-y-0'
                : 'invisible translate-y-full'
            } md:visible md:static md:inset-auto md:z-auto md:mb-0 md:max-h-none md:w-[280px] md:flex-[0_0_280px] md:translate-y-0 md:overflow-visible md:rounded-lg md:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)]`}
            aria-label="경매 목록 필터"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 text-2xl leading-[1.3] font-bold">필터</h2>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex size-[34px] cursor-pointer items-center justify-center rounded-lg border border-[#e2e1dc] bg-white text-[#5f5e5a] transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
                  type="button"
                  onClick={clearFilters}
                  title="필터 초기화"
                  aria-label="필터 초기화"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  className="inline-flex size-[34px] cursor-pointer items-center justify-center rounded-lg border border-[#e2e1dc] bg-white text-[#5f5e5a] transition-colors hover:border-primary hover:bg-primary-light hover:text-primary md:hidden"
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  aria-label="필터 닫기"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <fieldset
              className={FILTER_GROUP_CLASS}
              disabled={categoriesQuery.isLoading || categoriesQuery.isError}
            >
              <legend className="mb-0.5 block text-base leading-[1.4] font-extrabold text-[#1a1a18]">카테고리</legend>
              {categoriesQuery.isLoading ? (
                <div className="grid gap-2" aria-hidden="true">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonBlock className="h-5 w-[78%]" key={index} />
                  ))}
                </div>
              ) : categoriesQuery.isError ? (
                <p className={`${FILTER_MESSAGE_CLASS} text-[#b42318]`}>불러오지 못했습니다.</p>
              ) : categoryOptions.length === 0 ? (
                <p className={FILTER_MESSAGE_CLASS}>선택 가능한 항목이 없습니다.</p>
              ) : (
                <>
                  {visibleCategoryOptions.map((category) => (
                    <label className={FILTER_OPTION_CLASS} key={category.catSn}>
                      <input
                        className="accent-primary"
                        type="checkbox"
                        checked={categoryDraft.includes(category.catNm)}
                        onChange={() => setCategoryDraft((prev) => toggleValue(prev, category.catNm))}
                      />
                      {category.catNm}
                    </label>
                  ))}
                  {categoryOptions.length > COLLAPSED_CATEGORY_COUNT && (
                    <button
                      className="inline-flex min-h-7 w-fit cursor-pointer items-center gap-1 border-0 bg-transparent text-sm leading-[1.5] font-bold text-primary transition-colors hover:text-primary-dark"
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

            <fieldset className={FILTER_GROUP_CLASS}>
              <legend className="mb-0.5 block text-base leading-[1.4] font-extrabold text-[#1a1a18]">가격 범위</legend>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <input
                  className={FILTER_INPUT_CLASS}
                  value={minPriceDraft}
                  onChange={(event) => handlePriceDraftChange(setMinPriceDraft, event.target.value)}
                  inputMode="numeric"
                  placeholder="최소 금액"
                  aria-label="최소 금액"
                />
                <span className="text-[#5f5e5a]">~</span>
                <input
                  className={FILTER_INPUT_CLASS}
                  value={maxPriceDraft}
                  onChange={(event) => handlePriceDraftChange(setMaxPriceDraft, event.target.value)}
                  inputMode="numeric"
                  placeholder="최대 금액"
                  aria-label="최대 금액"
                />
              </div>
            </fieldset>

            <fieldset
              className={FILTER_GROUP_CLASS}
              disabled={auctionStatusesQuery.isLoading || auctionStatusesQuery.isError}
            >
              <legend className="mb-0.5 block text-base leading-[1.4] font-extrabold text-[#1a1a18]">진행 상태</legend>
              {auctionStatusesQuery.isLoading ? (
                <div className="grid gap-2" aria-hidden="true">
                  <SkeletonBlock className="h-5 w-[72%]" />
                  <SkeletonBlock className="h-5 w-[64%]" />
                </div>
              ) : auctionStatusesQuery.isError ? (
                <p className={`${FILTER_MESSAGE_CLASS} text-[#b42318]`}>불러오지 못했습니다.</p>
              ) : auctionStatusOptions.length === 0 ? (
                <p className={FILTER_MESSAGE_CLASS}>선택 가능한 항목이 없습니다.</p>
              ) : auctionStatusOptions.map((status) => (
                <label className={FILTER_OPTION_CLASS} key={status.code}>
                  <input
                    className="accent-primary"
                    type="checkbox"
                    checked={statusDraft.includes(status.code)}
                    onChange={() => setStatusDraft((prev) => toggleValue(prev, status.code))}
                  />
                  {status.label}
                </label>
              ))}
            </fieldset>

            <fieldset
              className={FILTER_GROUP_CLASS}
              disabled={tradeMethodsQuery.isLoading || tradeMethodsQuery.isError}
            >
              <legend className="mb-0.5 block text-base leading-[1.4] font-extrabold text-[#1a1a18]">거래 방식</legend>
              {tradeMethodsQuery.isLoading ? (
                <div className="grid gap-2" aria-hidden="true">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SkeletonBlock className="h-5 w-[76%]" key={index} />
                  ))}
                </div>
              ) : tradeMethodsQuery.isError ? (
                <p className={`${FILTER_MESSAGE_CLASS} text-[#b42318]`}>불러오지 못했습니다.</p>
              ) : tradeMethodOptions.length === 0 ? (
                <p className={FILTER_MESSAGE_CLASS}>선택 가능한 항목이 없습니다.</p>
              ) : (
                <>
                  <label className={FILTER_OPTION_CLASS}>
                    <input
                      className="accent-primary"
                      name="tradeMethod"
                      type="radio"
                      checked={tradeMethodDraft === 'all'}
                      onChange={() => setTradeMethodDraft('all')}
                    />
                    전체
                  </label>
                  {tradeMethodOptions.map((method) => (
                    <label className={FILTER_OPTION_CLASS} key={method.code}>
                      <input
                        className="accent-primary"
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

            <fieldset className={FILTER_GROUP_CLASS}>
              <legend className="mb-0.5 block text-base leading-[1.4] font-extrabold text-[#1a1a18]">추가 조건</legend>
              <label className={FILTER_OPTION_CLASS}>
                <input
                  className="accent-primary"
                  type="checkbox"
                  checked={endingSoonOnlyDraft}
                  onChange={(event) => setEndingSoonOnlyDraft(event.target.checked)}
                />
                마감 1시간 이내 상품만
              </label>
              <label className={FILTER_OPTION_CLASS}>
                <input
                  className="accent-primary"
                  type="checkbox"
                  checked={instantBuyOnlyDraft}
                  onChange={(event) => setInstantBuyOnlyDraft(event.target.checked)}
                />
                즉시구매 가능한 상품만
              </label>
            </fieldset>

            <label className="grid gap-2">
              <span className="mb-0.5 block text-base leading-[1.4] font-extrabold text-[#1a1a18]">정렬</span>
              <select
                className={FILTER_INPUT_CLASS}
                value={sortDraft}
                onChange={(event) => setSortDraft(event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="sticky -bottom-5 -mx-5 -mb-5 border-t border-[#f0efec] bg-white p-5 pt-3 md:static md:m-0 md:border-0 md:p-0">
              <button
                className="inline-flex min-h-[46px] w-full cursor-pointer items-center justify-center rounded-lg border border-primary bg-primary px-3 text-base leading-[1.4] font-bold text-white transition-colors hover:border-primary-dark hover:bg-primary-dark"
                type="button"
                onClick={handleFilterSearch}
              >
                상품 {(filterPreviewQuery.data?.totalElements ?? totalElements).toLocaleString('ko-KR')}개 보기
              </button>
            </div>
          </aside>

          <section className="min-w-0 flex-1">
            <button
              className="mb-3 hidden min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary bg-white font-bold text-primary max-md:inline-flex"
              type="button"
              aria-haspopup="dialog"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen(true)}
            >
              <SlidersHorizontal size={18} />
              필터
            </button>
            <div className="mb-[18px] text-left text-base leading-[1.4] font-extrabold text-primary-dark max-md:mt-0.5 max-md:mb-3.5">
              {totalElements.toLocaleString('ko-KR')}개 상품
            </div>

            {isLoading ? (
              <div
                className="grid grid-cols-3 gap-[45px] max-xl:grid-cols-2 max-xl:gap-6 max-md:grid-cols-1 max-md:gap-[18px]"
                aria-busy="true"
                aria-label="경매 상품을 불러오는 중"
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <AuctionCardSkeleton key={index} />
                ))}
              </div>
            ) : isError ? (
              <div className="grid min-h-[340px] place-content-center justify-items-center gap-2.5 rounded-lg border border-[#f0efec] bg-[#f8f8f6] p-7 text-center">
                <strong>경매 상품을 불러오지 못했습니다.</strong>
                <p className="m-0 text-[#5f5e5a]">잠시 후 다시 시도해 주세요.</p>
              </div>
            ) : auctionItems.length > 0 ? (
              <div className="grid grid-cols-3 gap-[45px] max-xl:grid-cols-2 max-xl:gap-6 max-md:grid-cols-1 max-md:gap-[18px]">
                {auctionItems.map((item) => (
                  <AuctionCard key={item.auctionId} item={item} />
                ))}
              </div>
            ) : (
              <div className="grid min-h-[340px] place-content-center justify-items-center gap-2.5 rounded-lg border border-[#f0efec] bg-[#f8f8f6] p-7 text-center">
                <strong className="text-xl leading-[1.4]">등록된 경매 상품이 없습니다.</strong>
                <p className="m-0 text-[#5f5e5a]">새 경매가 올라오면 이곳에 표시됩니다.</p>
                <button
                  className="min-h-10 cursor-pointer rounded-lg border border-primary bg-primary px-3.5 text-base leading-[1.4] font-semibold text-white"
                  type="button"
                  onClick={clearFilters}
                >
                  필터 초기화
                </button>
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex flex-nowrap justify-center gap-2 max-sm:gap-0.5" aria-label="경매 목록 페이지">
                <button
                  className={PAGINATION_BUTTON_CLASS}
                  type="button"
                  title="첫 페이지"
                  aria-label="첫 페이지로 이동"
                  disabled={page <= 1}
                  onClick={() => goToPage(1)}
                >
                  <ChevronsLeft size={17} aria-hidden="true" />
                </button>
                <button
                  className={PAGINATION_BUTTON_CLASS}
                  type="button"
                  title="이전 페이지"
                  aria-label="이전 페이지로 이동"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft size={17} aria-hidden="true" />
                </button>
                {paginationItems.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-current={pageNumber === page ? 'page' : undefined}
                    className={pageNumber === page
                      ? 'min-h-10 rounded-lg border border-primary bg-primary px-3.5 text-base leading-[1.4] font-semibold text-white max-sm:min-h-9 max-sm:min-w-9 max-sm:px-1.5 max-sm:text-sm'
                      : PAGINATION_BUTTON_CLASS}
                    onClick={() => goToPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  className={PAGINATION_BUTTON_CLASS}
                  type="button"
                  title="다음 페이지"
                  aria-label="다음 페이지로 이동"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
                <button
                  className={PAGINATION_BUTTON_CLASS}
                  type="button"
                  title="마지막 페이지"
                  aria-label="마지막 페이지로 이동"
                  disabled={page >= totalPages}
                  onClick={() => goToPage(totalPages)}
                >
                  <ChevronsRight size={17} aria-hidden="true" />
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
