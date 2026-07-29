import { ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Pagination from '@components/common/Pagination';

const SUMMARY_GRID_CLASS = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
};

const BADGE_TONE_CLASS = {
  blue: 'bg-[#e8f0fe] text-[#155eef]',
  orange: 'bg-[#fff0d9] text-[#b54708]',
  green: 'bg-[#e9f8f1] text-[#137c4b]',
  red: 'bg-[#fff0ee] text-[#b42318]',
  gray: 'bg-[#f2f4f7] text-[#667085]',
};

const ACTION_VARIANT_CLASS = {
  primary: 'border-primary bg-primary text-white hover:bg-primary-dark',
  outline: 'border-primary bg-white text-primary-dark hover:bg-primary-light',
  danger: 'border-[#d92d20] bg-white text-[#b42318] hover:bg-[#fff3f2]',
  neutral: 'border-[#d0d5dd] bg-white text-[#475467] hover:bg-[#f8f9fb]',
};

export const MyAuctionSection = ({ children, className = '', ...props }) => (
  <section
    className={`w-full max-w-full min-w-0 text-body-sm text-[#1f2937] md:text-body-md ${className}`}
    {...props}
  >
    {children}
  </section>
);

export const MyAuctionHeader = ({ title, description }) => (
  <header className="mb-6 w-full max-w-full border-b border-[#e5e9f0] pb-5">
    <p className="m-0 text-caption font-extrabold text-primary-dark">MY AUCTION</p>
    <h1 className="mt-1.5 mb-0 text-h2 font-extrabold text-[#171b26] md:text-h1">
      {title}
    </h1>
    {description && (
      <p className="mt-2 mb-0 text-body-sm text-[#667085] md:text-body-md">{description}</p>
    )}
  </header>
);

export const MyAuctionSummary = ({ items = [] }) => {
  if (items.length === 0) return null;

  const gridClass = SUMMARY_GRID_CLASS[Math.min(items.length, 3)] || 'sm:grid-cols-3';

  return (
    <div
      className={`mb-5 grid w-full max-w-full grid-cols-1 overflow-hidden border-y border-[#e9edf4] ${gridClass}`}
      aria-label="경매 내역 요약"
    >
      {items.map((item, index) => (
        <div
          className={`flex min-h-[76px] items-baseline justify-between gap-3 px-5 py-4 max-sm:min-h-14 max-sm:justify-start max-sm:px-1 max-sm:py-3 ${
            index > 0 ? 'border-t border-[#e9edf4] sm:border-t-0 sm:border-l' : ''
          }`}
          key={item.key || item.label}
        >
          <span className="text-caption font-bold text-[#667085]">{item.label}</span>
          <strong className="shrink-0 text-h2 font-extrabold text-primary-dark">
            {item.value}
          </strong>
        </div>
      ))}
    </div>
  );
};

export const MyAuctionFilterTabs = ({ items = [], value, onChange, ariaLabel = '경매 상태' }) => (
  <div className="mb-[18px] flex w-full max-w-full gap-2 overflow-x-auto" role="tablist" aria-label={ariaLabel}>
    {items.map((item) => {
      const active = value === item.value;

      return (
        <button
          key={String(item.value)}
          type="button"
          role="tab"
          aria-selected={active}
          className={`inline-flex min-h-[38px] shrink-0 cursor-pointer items-center justify-center rounded-lg border px-3.5 text-body-sm font-bold whitespace-nowrap transition-colors ${
            active
              ? 'border-primary bg-primary text-white'
              : 'border-[#dce2ed] bg-white text-[#526079] hover:border-[#a7bdec]'
          }`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {item.count !== undefined && (
            <span className="ml-1.5 text-[13px] leading-[1.5]">{item.count}</span>
          )}
        </button>
      );
    })}
  </div>
);

export const MyAuctionList = ({ children }) => (
  <div className="grid w-full max-w-full gap-3">{children}</div>
);

export const MyAuctionBadge = ({ children, tone = 'gray' }) => (
  <span className={`inline-flex min-h-[25px] items-center rounded-full px-2.5 py-1 text-[13px] leading-[1.35] font-extrabold ${BADGE_TONE_CLASS[tone] || BADGE_TONE_CLASS.gray}`}>
    {children}
  </span>
);

export const MyAuctionDetail = ({ label, value }) => (
  <div className="flex items-baseline gap-1.5">
    <dt className="text-caption text-[#7b8595]">{label}</dt>
    <dd className="m-0 text-body-md font-extrabold text-[#344054]">{value}</dd>
  </div>
);

export const MyAuctionCard = ({
  imageUrl,
  imageAlt,
  imageFallback,
  badges,
  title,
  description,
  details,
  actions,
}) => (
  <article className="grid min-h-[132px] w-full max-w-full grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-[18px] rounded-lg border border-[#e9edf4] bg-white p-4 transition-[border-color,box-shadow] hover:border-[#c9d9ff] hover:shadow-[0_8px_20px_rgba(20,38,79,0.07)] max-sm:grid-cols-[72px_minmax(0,1fr)] max-sm:items-start max-sm:gap-[13px]">
    <div className="flex size-[88px] items-center justify-center overflow-hidden rounded-lg border border-[#edf0f5] bg-[#f4f6f9] text-[#98a2b3] max-sm:size-[72px]">
      {imageUrl ? (
        <img className="block size-full object-cover" src={imageUrl} alt={imageAlt || title} />
      ) : imageFallback ? (
        <span className="px-2 text-center text-[13px] leading-[1.4] font-bold">{imageFallback}</span>
      ) : (
        <ImageIcon size={24} aria-hidden="true" />
      )}
    </div>

    <div className="min-w-0">
      {badges && <div className="mb-[7px] flex flex-wrap items-center gap-2">{badges}</div>}
      <h2 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-body-md font-bold text-[#252b3a] md:text-body-lg">
        {title}
      </h2>
      {description && (
        <p className="mt-1.5 mb-2.5 text-caption text-[#7b8595]">{description}</p>
      )}
      {details && (
        <dl className="m-0 flex flex-wrap gap-x-5 gap-y-1 max-sm:grid max-sm:grid-cols-1">
          {details}
        </dl>
      )}
    </div>

    {actions && (
      <div className="flex shrink-0 flex-wrap justify-end gap-2 max-sm:col-span-2 max-sm:w-full max-sm:justify-stretch [&>*]:max-sm:flex-1">
        {actions}
      </div>
    )}
  </article>
);

export const MyAuctionAction = ({
  children,
  variant = 'outline',
  to,
  state,
  onClick,
  disabled = false,
  title,
  ariaLabel,
}) => {
  const className = `inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-1 rounded-lg border px-3.5 text-body-sm font-extrabold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${ACTION_VARIANT_CLASS[variant] || ACTION_VARIANT_CLASS.outline}`;

  if (to) {
    return (
      <Link className={className} to={to} state={state} title={title} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={className}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export const MyAuctionState = ({ icon, title, description, action, tone = 'default' }) => (
  <div className={`flex min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-lg border border-[#e9edf4] bg-white px-6 py-10 text-center ${tone === 'error' ? 'text-[#b42318]' : 'text-[#667085]'}`}>
    {icon}
    <strong className={tone === 'error' ? 'text-[#b42318]' : 'text-[#344054]'}>{title}</strong>
    {description && <p className="m-0 text-body-sm">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const MyAuctionPagination = ({ page, totalPages, onPageChange }) => (
  <Pagination
    page={page}
    totalPages={Math.max(1, totalPages || 0)}
    onPageChange={onPageChange}
    showSinglePage
  />
);

export const MyAuctionListSkeleton = ({ count = 3 }) => (
  <div className="grid gap-3" aria-hidden="true">
    {Array.from({ length: count }, (_, index) => (
      <div
        className="grid min-h-[132px] animate-pulse grid-cols-[88px_minmax(0,1fr)_96px] items-center gap-[18px] rounded-lg border border-[#e9edf4] bg-white p-4 max-sm:grid-cols-[72px_minmax(0,1fr)]"
        key={index}
      >
        <div className="size-[88px] rounded-lg bg-[#eef1f5] max-sm:size-[72px]" />
        <div className="grid gap-2.5">
          <div className="h-6 w-24 rounded-full bg-[#eef1f5]" />
          <div className="h-5 w-2/3 rounded bg-[#eef1f5]" />
          <div className="h-4 w-1/2 rounded bg-[#f3f5f7]" />
        </div>
        <div className="h-10 rounded-lg bg-[#eef1f5] max-sm:hidden" />
      </div>
    ))}
  </div>
);
