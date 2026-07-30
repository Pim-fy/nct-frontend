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
    <ContentPageShell className="service-discovery-page">
      <Helmet><title>서비스 찾기 | 에누리컷</title></Helmet>
      <ContentPageHeader title="서비스 찾기" />

      <HeaderSearchPortal>
        <ServiceSearchBar
          initialKeyword={filters.keyword}
          key={filters.keyword}
          onSubmit={handleSearch}
        />
      </HeaderSearchPortal>

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
        />

        <section className="min-w-0 flex-1 scroll-mt-24" ref={resultHeadingRef}>
          <div className="mb-5 flex min-h-11 items-center justify-between border-b border-[#e1e1df] pb-4">
            <h2 className="text-h3 font-bold text-[#1a1a18]">서비스 요청 검색 결과</h2>
            <span className="text-body-md font-semibold text-[#555552]">
              {discoveryQuery.isLoading && !result
                ? '조회 중'
                : `총 ${Number(result?.total || 0).toLocaleString('ko-KR')}건`}
            </span>
          </div>

          {discoveryQuery.isLoading && <CardGridSkeleton cardHeight={300} columns={2} />}

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
