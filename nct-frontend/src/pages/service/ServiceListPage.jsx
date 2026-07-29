import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
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
  ServiceRequestGrid,
  ServiceSearchBar,
} from '@components/service/ServiceUi';
import ListSkeleton from '@components/skeleton/ListSkeleton';
import Pagination from '@components/common/Pagination';
import { useServiceDiscovery } from '@hooks/useServiceDiscovery';
import { SERVICE_CATEGORIES, SERVICE_REGIONS } from './servicePreviewData';

const SERVICE_DOMAIN_CD = 'CATC0002';

const toBudget = (value) => {
  const parsed = Number(value || 0);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
};

const toPageIndex = (value) => {
  const parsed = Number(value || 1);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed - 1 : 0;
};

/** F-COM-002: 물건 검색과 분리된 서비스 요청·제공자 검색 화면입니다. */
const ServiceListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const view = searchParams.get('view') === 'providers' ? 'providers' : 'requests';
  const categoriesQuery = useQuery({
    queryKey: ['service-discovery', 'categories', SERVICE_DOMAIN_CD],
    queryFn: () => getCategories(SERVICE_DOMAIN_CD)
      .then((response) => response.data.filter((category) => category.catParentSn !== null)),
  });
  const serviceCategories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );
  const categorySnByName = useMemo(
    () => new Map(serviceCategories.map((category) => [category.catNm, category.catSn])),
    [serviceCategories],
  );
  const categoryNames = view === 'providers'
    ? serviceCategories.map((category) => category.catNm)
    : (serviceCategories.length > 0
      ? serviceCategories.map((category) => category.catNm)
      : SERVICE_CATEGORIES);

  const filters = useMemo(() => ({
    view,
    keyword: searchParams.get('keyword') || '',
    category: searchParams.get('category') || '',
    categorySn: categorySnByName.get(searchParams.get('category') || '') ?? null,
    region: searchParams.get('region') || '',
    minBudget: toBudget(searchParams.get('minBudget')),
    maxBudget: toBudget(searchParams.get('maxBudget')),
    sort: searchParams.get('sort') || (view === 'providers' ? 'rating' : 'deadline'),
    page: toPageIndex(searchParams.get('page')),
  }), [categorySnByName, searchParams, view]);

  const providerSearchEnabled = view !== 'providers' || categoriesQuery.isSuccess;
  const discoveryQuery = useServiceDiscovery(filters, { enabled: providerSearchEnabled });
  const result = discoveryQuery.data;
  const isLoading = discoveryQuery.isLoading
    || (view === 'providers' && categoriesQuery.isLoading);
  const isError = discoveryQuery.isError
    || (view === 'providers' && categoriesQuery.isError);

  const updateParams = (changes, options) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === '' || value === 0 || value == null) next.delete(key);
      else next.set(key, String(value));
    });
    setSearchParams(next, options);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    updateParams({ keyword: filters.keyword.trim(), page: '' }, { replace: true });
  };

  const handleViewChange = (nextView) => {
    const nextIsProviderView = nextView === 'providers';
    updateParams({
      view: nextIsProviderView ? 'providers' : '',
      sort: nextIsProviderView ? 'rating' : 'deadline',
      minBudget: nextIsProviderView ? '' : filters.minBudget,
      maxBudget: nextIsProviderView ? '' : filters.maxBudget,
      page: '',
    });
  };

  const handleFilterChange = (name, value) => {
    if (name === 'minBudget' || name === 'maxBudget') {
      updateParams({ [name]: toBudget(value), page: '' });
      return;
    }
    updateParams({ [name]: value, page: '' });
  };

  const resetFilters = () => {
    const next = {};
    if (view === 'providers') next.view = 'providers';
    setSearchParams(next);
  };

  return (
    <ContentPageShell className="service-discovery-page">
      <Helmet><title>서비스 찾기 | 에누리컷</title></Helmet>
      <ContentPageHeader title="서비스 찾기" />

      <ServiceSearchBar
        keyword={filters.keyword}
        onKeywordChange={(value) => updateParams({ keyword: value }, { replace: true })}
        onSubmit={handleSearch}
      />

      <DiscoveryTabs
        activeView={view}
        onChange={handleViewChange}
        providerCount={result?.counts?.providers ?? 0}
        requestCount={result?.counts?.requests ?? 0}
      />

      <button className="service-filter-toggle" onClick={() => setFiltersOpen((open) => !open)} type="button">
        필터 {filtersOpen ? '닫기' : '열기'}
      </button>

      <div className="service-discovery-layout">
        <ServiceFilterPanel
          categories={categoryNames}
          filters={filters}
          isOpen={filtersOpen}
          onChange={handleFilterChange}
          onReset={resetFilters}
          regions={SERVICE_REGIONS}
          view={view}
        />

        <section>
          <div className="service-result-heading">
            <h2>{view === 'providers' ? '제공자 검색 결과' : '서비스 요청 검색 결과'}</h2>
            <span>총 {Number(result?.total || 0).toLocaleString('ko-KR')}건</span>
          </div>

          {isLoading && <ListSkeleton />}

          {isError && (
            <ContentState
              actionLabel="다시 불러오기"
              description="잠시 후 다시 시도해 주세요."
              onAction={() => {
                if (categoriesQuery.isError) categoriesQuery.refetch();
                else discoveryQuery.refetch();
              }}
              title="서비스 검색 결과를 불러오지 못했습니다."
              tone="error"
            />
          )}

          {!isLoading && !isError && result?.items?.length === 0 && (
            <ServiceEmptyState view={view} />
          )}

          {result?.items?.length > 0 && (
            view === 'providers'
              ? <ProviderGrid providers={result.items} />
              : <ServiceRequestGrid requests={result.items} />
          )}

          {view === 'providers' && !isLoading && !isError && result?.totalPages > 1 && (
            <Pagination
              onPageChange={(nextPage) => updateParams({
                page: nextPage === 1 ? '' : nextPage,
              })}
              page={(result.page ?? 0) + 1}
              totalPages={result.totalPages}
            />
          )}
        </section>
      </div>
    </ContentPageShell>
  );
};

export default ServiceListPage;
