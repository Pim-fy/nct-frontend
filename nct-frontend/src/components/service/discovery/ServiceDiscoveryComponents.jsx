import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock3,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SERVICE_REQUEST_SORT_OPTIONS } from '@/constants/serviceDiscovery';

const FILTER_GROUP_CLASS = 'm-0 grid gap-2 border-0 p-0 disabled:opacity-60';
const FILTER_INPUT_CLASS = 'min-h-10 w-full rounded-lg border border-[#e2e1dc] bg-white px-3 text-body-sm text-[#1a1a18] outline-none transition-colors focus:border-primary md:text-body-md';

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

const FilterFields = ({
  categories,
  categoriesError,
  categoriesLoading,
  filters,
  onChange,
}) => {
  return (
    <div className="grid gap-[18px]">
      <label className="grid gap-2">
        <span className="mb-0.5 block text-body-lg font-extrabold text-[#1a1a18]">카테고리</span>
        <select
          className={FILTER_INPUT_CLASS}
          disabled={categoriesLoading || categoriesError}
          onChange={(event) => onChange('categorySn', event.target.value)}
          value={filters.categorySn}
        >
          <option value="">전체 카테고리</option>
          {categories.map((category) => (
            <option key={category.catSn} value={category.catSn}>{category.catNm}</option>
          ))}
        </select>
        {categoriesLoading && <span className="text-caption text-[#5f5e5a]">불러오는 중입니다.</span>}
        {categoriesError && <span className="text-caption text-[#b42318]">카테고리를 불러오지 못했습니다.</span>}
      </label>

      <fieldset className={FILTER_GROUP_CLASS}>
        <legend className="mb-0.5 block text-body-lg font-extrabold text-[#1a1a18]">예산 범위</legend>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <input
            aria-label="최소 예산"
            className={`${FILTER_INPUT_CLASS} min-w-0`}
            min="0"
            onChange={(event) => onChange('minBudget', event.target.value)}
            placeholder="최소"
            type="number"
            value={filters.minBudget || ''}
          />
          <span className="text-base text-[#777774]">~</span>
          <input
            aria-label="최대 예산"
            className={`${FILTER_INPUT_CLASS} min-w-0`}
            min="0"
            onChange={(event) => onChange('maxBudget', event.target.value)}
            placeholder="최대"
            type="number"
            value={filters.maxBudget || ''}
          />
        </div>
      </fieldset>

      <label className="grid gap-2">
        <span className="mb-0.5 block text-body-lg font-extrabold text-[#1a1a18]">정렬</span>
        <select
          className={FILTER_INPUT_CLASS}
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
  resultCount,
  resultLoading,
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
      <button
        aria-label="필터 닫기"
        className={`fixed inset-0 z-[210] cursor-default border-0 bg-black/25 transition-opacity duration-200 ease-linear motion-reduce:transition-none md:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        type="button"
      />
      <aside
        className={`fixed inset-x-0 bottom-0 z-[220] grid max-h-[88dvh] w-full transform-gpu gap-[18px] overflow-y-auto overscroll-contain rounded-t-2xl border border-[#f0efec] bg-white p-5 shadow-[0_-8px_28px_rgba(0,0,0,0.18)] transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform [backface-visibility:hidden] [scrollbar-color:#c8ced8_transparent] [scrollbar-width:thin] motion-reduce:transition-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#c8ced8] [&::-webkit-scrollbar-track]:bg-transparent ${isOpen ? 'pointer-events-auto translate-y-0' : 'pointer-events-none translate-y-[101%]'} md:sticky md:top-[82px] md:inset-x-auto md:bottom-auto md:z-auto md:h-fit md:max-h-[calc(100dvh-122px)] md:w-[280px] md:flex-[0_0_280px] md:self-start md:translate-y-0 md:overflow-y-auto md:rounded-lg md:pointer-events-auto md:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)]`}
        aria-label="서비스 검색 필터"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="m-0 text-h3 font-bold">필터</h2>
          <div className="flex items-center gap-2">
            <button className="inline-flex size-[34px] cursor-pointer items-center justify-center rounded-lg border border-[#e2e1dc] bg-white text-[#5f5e5a] transition-colors hover:border-primary hover:bg-primary-light hover:text-primary" onClick={onReset} title="필터 초기화" type="button">
              <RotateCcw aria-hidden="true" size={16} />
              <span className="sr-only">필터 초기화</span>
            </button>
            <button className="inline-flex size-[34px] cursor-pointer items-center justify-center rounded-lg border border-[#e2e1dc] bg-white text-[#5f5e5a] transition-colors hover:border-primary hover:bg-primary-light hover:text-primary md:hidden" onClick={onClose} title="필터 닫기" type="button">
              <X aria-hidden="true" size={18} />
              <span className="sr-only">필터 닫기</span>
            </button>
          </div>
        </div>
        {fields}
        <div className="sticky -bottom-5 z-10 -mx-5 -mb-5 border-t border-[#f0efec] bg-white p-5 pt-3">
          <button className="inline-flex min-h-[46px] w-full cursor-pointer items-center justify-center rounded-lg border border-primary bg-primary px-3 text-body-md font-bold text-white transition-colors hover:border-primary-dark hover:bg-primary-dark" onClick={onClose} type="button">
            {resultLoading ? '서비스 조회 중...' : `서비스 ${(resultCount ?? 0).toLocaleString('ko-KR')}개 보기`}
          </button>
        </div>
      </aside>
    </>
  );
};

const ServiceRequestCard = ({ request }) => (
  <Link
    className="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-[#dededc] bg-white transition-[border-color,box-shadow] hover:border-primary hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
    to={`/service-requests/${request.id}`}
  >
    <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#f1f3f6]">
      <span className="absolute inset-0 grid place-items-center text-body-sm font-semibold text-[#858783]">
        등록된 이미지가 없습니다.
      </span>
      {request.imageUrl && (
        <img
          alt=""
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          src={request.imageUrl}
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      )}
    </div>
    <div className="flex min-h-[230px] flex-1 flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-body-sm font-semibold text-primary">{request.categoryName || '서비스'}</span>
        {request.statusName && <span className="text-body-sm font-semibold text-[#555552]">{request.statusName}</span>}
      </div>
      <h3 className="mt-3 line-clamp-2 text-h3 font-bold leading-[1.45] text-[#1a1a18] group-hover:text-primary">{request.title}</h3>
      {request.description && <p className="mt-2 line-clamp-2 text-body-md leading-[1.65] text-[#62625f]">{request.description}</p>}
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#ececea] pt-4">
        <strong className="text-body-lg text-[#1a1a18]">{request.budgetLabel || formatAmount(request.budgetAmount)}</strong>
        {request.registeredAt && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-caption text-[#666663]">
            <Clock3 aria-hidden="true" size={15} />
            {formatDate(request.registeredAt)}
          </span>
        )}
      </div>
    </div>
  </Link>
);

export const ServiceRequestGrid = ({ requests }) => (
  <div className="grid grid-cols-3 gap-[45px] max-xl:grid-cols-2 max-xl:gap-6 max-md:grid-cols-1 max-md:gap-[18px]" aria-label="서비스 요청 검색 결과">
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
