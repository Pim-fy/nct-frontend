import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SERVICE_REQUEST_SORT_OPTIONS } from '@/constants/serviceDiscovery';

const formatAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? `${amount.toLocaleString('ko-KR')}원`
    : '예산 협의';
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const getPageNumbers = (page, totalPages) => {
  const visibleCount = Math.min(5, totalPages);
  const start = Math.min(
    Math.max(1, page - Math.floor(visibleCount / 2)),
    Math.max(1, totalPages - visibleCount + 1),
  );
  return Array.from({ length: visibleCount }, (_, index) => start + index);
};

export const ServiceSearchBar = ({ initialKeyword, onSubmit }) => {
  const [keyword, setKeyword] = useState(initialKeyword);

  return (
    <form className="mx-auto flex w-full max-w-[760px] overflow-hidden rounded-[6px] border-2 border-primary bg-white focus-within:ring-2 focus-within:ring-primary/20" onSubmit={(event) => onSubmit(event, keyword)} role="search">
      <label className="sr-only" htmlFor="service-keyword">서비스 검색어</label>
      <input
        className="h-14 min-w-0 flex-1 border-0 px-5 text-base text-[#1a1a18] outline-none placeholder:text-[#8b8b88]"
        id="service-keyword"
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="필요한 서비스 요청을 검색하세요"
        type="search"
        value={keyword}
      />
      <button className="grid h-14 w-14 shrink-0 place-items-center bg-primary text-white transition-colors hover:bg-[#0056dc]" title="검색" type="submit">
        <Search aria-hidden="true" size={23} />
        <span className="sr-only">검색</span>
      </button>
    </form>
  );
};

const FilterFields = ({
  categories,
  categoriesError,
  categoriesLoading,
  filters,
  onChange,
}) => {
  return (
    <div className="space-y-7">
      <label className="block">
        <span className="mb-2 block text-base font-bold text-[#272725]">카테고리</span>
        <select
          className="h-12 w-full rounded-[5px] border border-[#cfcfcd] bg-white px-3 text-base outline-none focus:border-primary"
          disabled={categoriesLoading || categoriesError}
          onChange={(event) => onChange('categorySn', event.target.value)}
          value={filters.categorySn}
        >
          <option value="">전체 카테고리</option>
          {categories.map((category) => (
            <option key={category.catSn} value={category.catSn}>{category.catNm}</option>
          ))}
        </select>
        {categoriesLoading && <span className="mt-2 block text-base text-[#6f6f6c]">불러오는 중입니다.</span>}
        {categoriesError && <span className="mt-2 block text-base text-[#b42318]">카테고리를 불러오지 못했습니다.</span>}
      </label>

      <fieldset>
        <legend className="mb-2 text-base font-bold text-[#272725]">예산 범위</legend>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <input
            aria-label="최소 예산"
            className="h-12 min-w-0 rounded-[5px] border border-[#cfcfcd] px-3 text-base outline-none placeholder:text-[#999996] focus:border-primary"
            min="0"
            onChange={(event) => onChange('minBudget', event.target.value)}
            placeholder="최소"
            type="number"
            value={filters.minBudget || ''}
          />
          <span className="text-base text-[#777774]">~</span>
          <input
            aria-label="최대 예산"
            className="h-12 min-w-0 rounded-[5px] border border-[#cfcfcd] px-3 text-base outline-none placeholder:text-[#999996] focus:border-primary"
            min="0"
            onChange={(event) => onChange('maxBudget', event.target.value)}
            placeholder="최대"
            type="number"
            value={filters.maxBudget || ''}
          />
        </div>
      </fieldset>

      <label className="block">
        <span className="mb-2 block text-base font-bold text-[#272725]">정렬</span>
        <select
          className="h-12 w-full rounded-[5px] border border-[#cfcfcd] bg-white px-3 text-base outline-none focus:border-primary"
          onChange={(event) => onChange('sort', event.target.value)}
          value={filters.sort}
        >
          {SERVICE_REQUEST_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
};

export const ServiceFilterPanel = ({
  categories,
  categoriesError,
  categoriesLoading,
  filters,
  isOpen,
  onChange,
  onClose,
  onReset,
}) => {
  const fields = (
    <FilterFields
      categories={categories}
      categoriesError={categoriesError}
      categoriesLoading={categoriesLoading}
      filters={filters}
      onChange={onChange}
    />
  );

  return (
    <>
      <aside className="hidden w-[280px] shrink-0 self-start border-r border-[#e1e1df] pr-7 lg:block" aria-label="서비스 검색 필터">
        <div className="mb-7 flex h-11 items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal aria-hidden="true" className="text-primary" size={20} />
            <h2 className="text-xl font-bold text-[#1a1a18]">필터</h2>
          </div>
          <button className="grid h-10 w-10 place-items-center rounded-[5px] border border-[#d7d7d5] text-[#555552] hover:bg-[#f5f5f3]" onClick={onReset} title="필터 초기화" type="button">
            <RotateCcw aria-hidden="true" size={18} />
            <span className="sr-only">필터 초기화</span>
          </button>
        </div>
        {fields}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button aria-label="필터 닫기" className="absolute inset-0 bg-black/45" onClick={onClose} type="button" />
          <aside className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-[8px] bg-white px-5 pb-8 pt-5" aria-label="서비스 검색 필터">
            <div className="mb-6 flex items-center justify-between border-b border-[#e1e1df] pb-4">
              <h2 className="text-xl font-bold text-[#1a1a18]">필터</h2>
              <div className="flex gap-2">
                <button className="grid h-11 w-11 place-items-center rounded-[5px] border border-[#d7d7d5]" onClick={onReset} title="필터 초기화" type="button">
                  <RotateCcw aria-hidden="true" size={19} />
                  <span className="sr-only">필터 초기화</span>
                </button>
                <button className="grid h-11 w-11 place-items-center rounded-[5px] border border-[#d7d7d5]" onClick={onClose} title="필터 닫기" type="button">
                  <X aria-hidden="true" size={21} />
                  <span className="sr-only">필터 닫기</span>
                </button>
              </div>
            </div>
            {fields}
            <button className="mt-8 h-12 w-full rounded-[5px] bg-primary text-base font-bold text-white" onClick={onClose} type="button">결과 보기</button>
          </aside>
        </div>
      )}
    </>
  );
};

const ServiceRequestCard = ({ request }) => (
  <Link className="group flex min-h-[250px] flex-col border border-[#dededc] bg-white p-5 transition-colors hover:border-primary" to={`/service-requests/${request.id}`}>
    <div className="flex items-start justify-between gap-3">
      <span className="text-base font-semibold text-primary">{request.categoryName || '서비스'}</span>
      {request.statusName && <span className="text-base font-semibold text-[#555552]">{request.statusName}</span>}
    </div>
    <h3 className="mt-4 line-clamp-2 text-xl font-bold leading-7 text-[#1a1a18] group-hover:text-primary">{request.title}</h3>
    {request.description && <p className="mt-3 line-clamp-2 text-base leading-7 text-[#62625f]">{request.description}</p>}
    {request.registeredAt && <p className="mt-auto flex items-center gap-2 pt-5 text-base text-[#555552]"><Clock3 aria-hidden="true" size={18} />{formatDate(request.registeredAt)}</p>}
    <div className="mt-5 flex items-end justify-between border-t border-[#ececea] pt-4">
      <strong className="text-lg text-[#1a1a18]">{request.budgetLabel || formatAmount(request.budgetAmount)}</strong>
    </div>
  </Link>
);

export const ServiceRequestGrid = ({ requests }) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="서비스 요청 검색 결과">
    {requests.map((request) => <ServiceRequestCard key={request.id} request={request} />)}
  </div>
);

export const ServiceEmptyState = () => (
  <div className="flex min-h-[360px] flex-col items-center justify-center border-y border-[#e2e2df] text-center" role="status">
    <Search aria-hidden="true" className="text-[#9b9b98]" size={42} />
    <strong className="mt-5 text-xl text-[#282826]">조건에 맞는 서비스 요청이 없습니다.</strong>
    <span className="mt-2 text-base text-[#666663]">검색어나 필터 조건을 변경해 주세요.</span>
  </div>
);

export const ServicePagination = ({ onChange, page, totalPages }) => {
  if (totalPages <= 1) return null;
  const pages = getPageNumbers(page, totalPages);
  const iconButton = 'grid h-11 w-11 place-items-center border border-[#d7d7d5] text-[#4f4f4c] disabled:cursor-not-allowed disabled:opacity-35 hover:not-disabled:border-primary hover:not-disabled:text-primary';

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="서비스 검색 결과 페이지">
      <button className={iconButton} disabled={page === 1} onClick={() => onChange(1)} title="첫 페이지" type="button"><ChevronsLeft aria-hidden="true" size={20} /><span className="sr-only">첫 페이지</span></button>
      <button className={iconButton} disabled={page === 1} onClick={() => onChange(page - 1)} title="이전 페이지" type="button"><ChevronLeft aria-hidden="true" size={20} /><span className="sr-only">이전 페이지</span></button>
      {pages.map((number) => (
        <button
          aria-current={number === page ? 'page' : undefined}
          className={`h-11 min-w-11 border px-3 text-base font-bold ${number === page ? 'border-primary bg-primary text-white' : 'border-[#d7d7d5] text-[#4f4f4c] hover:border-primary hover:text-primary'}`}
          key={number}
          onClick={() => onChange(number)}
          type="button"
        >
          {number}
        </button>
      ))}
      <button className={iconButton} disabled={page === totalPages} onClick={() => onChange(page + 1)} title="다음 페이지" type="button"><ChevronRight aria-hidden="true" size={20} /><span className="sr-only">다음 페이지</span></button>
      <button className={iconButton} disabled={page === totalPages} onClick={() => onChange(totalPages)} title="마지막 페이지" type="button"><ChevronsRight aria-hidden="true" size={20} /><span className="sr-only">마지막 페이지</span></button>
    </nav>
  );
};
