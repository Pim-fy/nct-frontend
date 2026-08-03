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
  ServiceEmptyState,
  ServiceFilterPanel,
  ServicePagination,
  ServiceRequestGrid,
  ServiceSearchBar,
} from '@components/service/ServiceUi';
import CardGridSkeleton from '@components/skeleton/CardGridSkeleton';
import HeaderSearchPortal from '@components/common/HeaderSearchPortal';
import {
  SERVICE_CATEGORY_DOMAIN_CODE,
  SERVICE_DISCOVERY_PAGE_SIZE,
} from '@/constants/serviceDiscovery';
import { useServiceDiscovery } from '@hooks/useServiceDiscovery';
import './serviceListPage.css';
import useBodyScrollLock from '@hooks/useBodyScrollLock';

const toBudget = (value) => {
  const parsed = Number(value || 0);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
};

const toPage = (value) => {
  const parsed = Number(value || 1);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
};

const toRequestSort = (value) => (value === 'budget' ? 'budget' : 'latest');

/** F-COM-002: 공개 중인 서비스 요청을 검색하는 목록 화면입니다. */
const ServiceListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const resultHeadingRef = useRef(null);

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
    keyword: searchParams.get('keyword') || '',
    categorySn: searchParams.get('categorySn') || String(resolvedLegacyCategorySn || ''),
    minBudget: toBudget(searchParams.get('minBudget')),
    maxBudget: toBudget(searchParams.get('maxBudget')),
    sort: toRequestSort(searchParams.get('sort')),
    page: toPage(searchParams.get('page')),
    size: SERVICE_DISCOVERY_PAGE_SIZE,
  }), [resolvedLegacyCategorySn, searchParams]);

  const budgetInvalid = filters.maxBudget > 0
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
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [filtersOpen]);

  useBodyScrollLock(filtersOpen);

  useEffect(() => {
    const sort = searchParams.get('sort');
    const hasProviderParams = searchParams.has('view') || searchParams.has('region');
    const hasUnsupportedSort = Boolean(sort) && sort !== 'latest' && sort !== 'budget';
    if (!hasProviderParams && !hasUnsupportedSort) return;

    const next = new URLSearchParams(searchParams);
    next.delete('view');
    next.delete('region');
    if (hasUnsupportedSort) next.delete('sort');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

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

  const handleFilterChange = (name, value) => {
    const changes = { [name]: value, page: null };
    if (name === 'categorySn') changes.category = null;
    updateParams(changes, { replace: true });
  };

  const resetFilters = () => {
    const next = new URLSearchParams();
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
    <ContentPageShell className="service-discovery-page service-list-page">
      <Helmet><title>서비스 찾기 | 에누리컷</title></Helmet>

      <HeaderSearchPortal>
        <ServiceSearchBar
          initialKeyword={filters.keyword}
          key={filters.keyword}
          onSubmit={handleSearch}
        />
      </HeaderSearchPortal>

      <section className="service-list-page__hero">
        <ContentPageHeader
          action={(
            <div className="service-list-page__summary" aria-live="polite">
              <span>현재 공개 요청</span>
              <strong>{discoveryQuery.isLoading ? '조회 중' : `${Number(result?.total || 0).toLocaleString('ko-KR')}건`}</strong>
            </div>
          )}
          title="서비스 요청 찾기"
        />
        <p>필요한 분야와 예산을 비교하고, 내 경험에 맞는 서비스 요청을 찾아보세요.</p>
      </section>

      <div className="service-list-page__layout flex items-start gap-6 max-md:block">
        <ServiceFilterPanel
          categories={categories}
          categoriesError={categoriesQuery.isError}
          categoriesLoading={categoriesQuery.isLoading}
          filters={filters}
          isOpen={filtersOpen}
          onChange={handleFilterChange}
          onClose={() => setFiltersOpen(false)}
          onReset={resetFilters}
          resultCount={result?.total}
          resultLoading={discoveryQuery.isLoading}
        />

        <section className="min-w-0 flex-1 scroll-mt-24" ref={resultHeadingRef}>
          <button className="mb-3 hidden min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary bg-white font-bold text-primary max-md:inline-flex" onClick={() => setFiltersOpen(true)} type="button">
            <SlidersHorizontal aria-hidden="true" size={18} />필터
          </button>

          {discoveryQuery.isLoading && <CardGridSkeleton cardHeight={300} columns={3} count={6} />}

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
            && result?.items?.length === 0 && <ServiceEmptyState />}

          {result?.items?.length > 0 && <ServiceRequestGrid requests={result.items} />}

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
