import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
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
import { useServiceDiscovery } from '@hooks/useServiceDiscovery';
import { SERVICE_CATEGORIES, SERVICE_REGIONS } from './servicePreviewData';

const toBudget = (value) => {
  const parsed = Number(value || 0);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
};

/** F-COM-002: 물건 검색과 분리된 서비스 요청·제공자 검색 화면입니다. */
const ServiceListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const view = searchParams.get('view') === 'providers' ? 'providers' : 'requests';

  const filters = useMemo(() => ({
    view,
    keyword: searchParams.get('keyword') || '',
    category: searchParams.get('category') || '',
    region: searchParams.get('region') || '',
    minBudget: toBudget(searchParams.get('minBudget')),
    maxBudget: toBudget(searchParams.get('maxBudget')),
    sort: searchParams.get('sort') || (view === 'providers' ? 'rating' : 'deadline'),
  }), [searchParams, view]);

  const discoveryQuery = useServiceDiscovery(filters);
  const result = discoveryQuery.data;

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
    updateParams({ keyword: filters.keyword.trim() }, { replace: true });
  };

  const handleViewChange = (nextView) => {
    updateParams({
      view: nextView === 'providers' ? 'providers' : '',
      sort: nextView === 'providers' ? 'rating' : 'deadline',
    });
  };

  const handleFilterChange = (name, value) => {
    if (name === 'minBudget' || name === 'maxBudget') {
      updateParams({ [name]: toBudget(value) });
      return;
    }
    updateParams({ [name]: value });
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
          categories={SERVICE_CATEGORIES}
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

          {discoveryQuery.isLoading && <ListSkeleton />}

          {discoveryQuery.isError && (
            <ContentState
              actionLabel="다시 불러오기"
              description="잠시 후 다시 시도해 주세요."
              onAction={() => discoveryQuery.refetch()}
              title="서비스 검색 결과를 불러오지 못했습니다."
              tone="error"
            />
          )}

          {!discoveryQuery.isLoading && !discoveryQuery.isError && result?.items?.length === 0 && (
            <ServiceEmptyState view={view} />
          )}

          {result?.items?.length > 0 && (
            view === 'providers'
              ? <ProviderGrid providers={result.items} />
              : <ServiceRequestGrid requests={result.items} />
          )}
        </section>
      </div>
    </ContentPageShell>
  );
};

export default ServiceListPage;
