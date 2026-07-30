import { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { getCategories } from '@api/categoryApi';
import {
  ContentPageHeader,
  ContentPageShell,
  ContentState,
} from '@components/content/ContentUi';
import {
  DiscoveryTabs,
  ProviderGrid,
  ServiceEmptyState,
  ServiceFilterPanel,
  ServicePagination,
  ServiceRequestGrid,
  ServiceSearchBar,
} from '@components/service/ServiceUi';
import CardGridSkeleton from '@components/skeleton/CardGridSkeleton';
import {
  SERVICE_CATEGORY_DOMAIN_CODE,
  SERVICE_DISCOVERY_PAGE_SIZE,
} from '@/constants/serviceDiscovery';
import { useServiceDiscovery } from '@hooks/useServiceDiscovery';

const toBudget = (value) => {
  const parsed = Number(value || 0);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
};

const toPage = (value) => {
  const parsed = Number(value || 1);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
};

const defaultSort = (view) => (view === 'providers' ? 'rating' : 'latest');

/** F-COM-002: 물건 검색과 분리된 서비스 요청·제공자 검색 화면입니다. */
const ServiceListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultHeadingRef = useRef(null);
  const view = searchParams.get('view') === 'providers' ? 'providers' : 'requests';

  const categoriesQuery = useQuery({
    queryKey: ['service-discovery-categories', SERVICE_CATEGORY_DOMAIN_CODE],
    queryFn: () => getCategories(SERVICE_CATEGORY_DOMAIN_CODE)
      .then((response) => response.data.filter((category) => category.catParentSn !== null)),
    staleTime: 5 * 60 * 1000,
  });
  const categories = categoriesQuery.data ?? [];
  const legacyCategory = searchParams.get('category') || '';
  const resolvedLegacyCategorySn = legacyCategory
    ? categories.find((category) => category.catNm === legacyCategory)?.catSn
    : '';

  const filters = useMemo(() => ({
    view,
    keyword: searchParams.get('keyword') || '',
    categorySn: searchParams.get('categorySn') || String(resolvedLegacyCategorySn || ''),
    region: view === 'providers' ? searchParams.get('region') || '' : '',
    minBudget: view === 'requests' ? toBudget(searchParams.get('minBudget')) : 0,
    maxBudget: view === 'requests' ? toBudget(searchParams.get('maxBudget')) : 0,
    sort: searchParams.get('sort') || defaultSort(view),
    page: toPage(searchParams.get('page')),
    size: SERVICE_DISCOVERY_PAGE_SIZE,
  }), [resolvedLegacyCategorySn, searchParams, view]);

  const budgetInvalid = view === 'requests'
    && filters.maxBudget > 0
    && filters.minBudget > filters.maxBudget;
  const legacyCategoryPending = Boolean(legacyCategory) && categoriesQuery.isLoading;
  const legacyCategoryMissing = Boolean(legacyCategory)
    && categoriesQuery.isSuccess
    && !resolvedLegacyCategorySn;
  const discoveryQuery = useServiceDiscovery(filters, {
    enabled: !budgetInvalid && !legacyCategoryPending && !legacyCategoryMissing,
  });
  const result = discoveryQuery.data;

  const updateParams = (changes, options = {}) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === 0 || value == null || (key === 'page' && value === 1)) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });
    setSearchParams(next, options);
  };

  useEffect(() => {
    if (!filtersOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filtersOpen]);

  useEffect(() => {
    if (!legacyCategory || !resolvedLegacyCategorySn || searchParams.get('categorySn')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('category');
    next.set('categorySn', String(resolvedLegacyCategorySn));
    setSearchParams(next, { replace: true });
  }, [legacyCategory, resolvedLegacyCategorySn, searchParams, setSearchParams]);

  const handleSearch = (event, keyword) => {
    event.preventDefault();
    updateParams({ keyword: keyword.trim(), page: null });
  };

  const handleViewChange = (nextView) => {
    updateParams({
      view: nextView === 'providers' ? 'providers' : null,
      region: null,
      minBudget: null,
      maxBudget: null,
      sort: defaultSort(nextView),
      page: null,
    });
  };

  const handleFilterChange = (name, value) => {
    const changes = { [name]: value, page: null };
    if (name === 'categorySn') changes.category = null;
    updateParams(changes, { replace: true });
  };

  const resetFilters = () => {
    const next = new URLSearchParams();
    if (view === 'providers') next.set('view', 'providers');
    if (filters.keyword) next.set('keyword', filters.keyword);
    setSearchParams(next, { replace: true });
  };

  const handlePageChange = (page) => {
    updateParams({ page });
    window.requestAnimationFrame(() => {
      resultHeadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const resultErrorTitle = budgetInvalid
    ? '예산 범위를 다시 확인해 주세요.'
    : legacyCategoryMissing
      ? '선택한 서비스 카테고리를 찾을 수 없습니다.'
      : '서비스 검색 결과를 불러오지 못했습니다.';

  return (
    <ContentPageShell className="service-discovery-page">
      <Helmet><title>서비스 찾기 | 에누리컷</title></Helmet>
      <ContentPageHeader title="서비스 찾기" />

      <ServiceSearchBar
        initialKeyword={filters.keyword}
        key={filters.keyword}
        onSubmit={handleSearch}
      />

      <DiscoveryTabs
        activeView={view}
        onChange={handleViewChange}
        providerCount={result?.counts?.providers}
        requestCount={result?.counts?.requests}
      />

      <div className="mt-6 flex justify-end lg:hidden">
        <button className="flex h-12 items-center gap-2 rounded-[5px] border border-primary px-4 text-body-md font-bold text-primary" onClick={() => setFiltersOpen(true)} type="button">
          <SlidersHorizontal aria-hidden="true" size={19} />필터
        </button>
      </div>

      <div className="mt-8 flex items-start gap-8">
        <ServiceFilterPanel
          categories={categories}
          categoriesError={categoriesQuery.isError}
          categoriesLoading={categoriesQuery.isLoading}
          filters={filters}
          isOpen={filtersOpen}
          onChange={handleFilterChange}
          onClose={() => setFiltersOpen(false)}
          onReset={resetFilters}
          view={view}
        />

        <section className="min-w-0 flex-1 scroll-mt-24" ref={resultHeadingRef}>
          <div className="mb-5 flex min-h-11 items-center justify-between border-b border-[#e1e1df] pb-4">
            <h2 className="text-h3 font-bold text-[#1a1a18]">{view === 'providers' ? '제공자 검색 결과' : '서비스 요청 검색 결과'}</h2>
            <span className="text-body-md font-semibold text-[#555552]">총 {Number(result?.total || 0).toLocaleString('ko-KR')}건</span>
          </div>

          {discoveryQuery.isLoading && (
            view === 'providers'
              ? <CardGridSkeleton cardHeight={140} columns={1} />
              : <CardGridSkeleton cardHeight={300} columns={2} />
          )}

          {(budgetInvalid || legacyCategoryMissing || discoveryQuery.isError) && (
            <ContentState
              actionLabel={!budgetInvalid && !legacyCategoryMissing ? '다시 불러오기' : undefined}
              description={budgetInvalid ? '최대 예산은 최소 예산보다 크거나 같아야 합니다.' : '검색 조건을 확인한 뒤 다시 시도해 주세요.'}
              onAction={!budgetInvalid && !legacyCategoryMissing ? () => discoveryQuery.refetch() : undefined}
              title={resultErrorTitle}
              tone="error"
            />
          )}

          {!discoveryQuery.isLoading
            && !discoveryQuery.isError
            && !budgetInvalid
            && !legacyCategoryMissing
            && result?.items?.length === 0 && <ServiceEmptyState view={view} />}

          {result?.items?.length > 0 && (
            view === 'providers'
              ? <ProviderGrid providers={result.items} />
              : <ServiceRequestGrid requests={result.items} />
          )}

          <ServicePagination
            onChange={handlePageChange}
            page={filters.page}
            totalPages={result?.totalPages || 0}
          />
        </section>
      </div>
    </ContentPageShell>
  );
};

export default ServiceListPage;
