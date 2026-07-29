import { useMemo, useState } from 'react';
import { History } from 'lucide-react';
import Pagination from '@components/common/Pagination';

const UPDATES_PER_PAGE = 5;

const formatUpdatedAt = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const AuctionProductUpdateSection = ({ sectionId, updates: updateItems }) => {
  const [page, setPage] = useState(1);
  const updates = useMemo(
    () => (Array.isArray(updateItems) ? updateItems : []),
    [updateItems],
  );
  const totalPages = Math.ceil(updates.length / UPDATES_PER_PAGE);
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  const pagedUpdates = useMemo(() => {
    const startIndex = (currentPage - 1) * UPDATES_PER_PAGE;
    return updates.slice(startIndex, startIndex + UPDATES_PER_PAGE);
  }, [currentPage, updates]);

  return (
    <section
      className="scroll-mt-[136px] border-b border-[#e2e5ea] py-10 md:scroll-mt-[82px] md:py-14"
      id={sectionId}
      aria-labelledby={`${sectionId}-title`}
    >
      <header className="mb-7 flex items-center justify-between gap-4">
        <h2
          className="m-0 text-2xl leading-[1.3] font-bold text-[#1d1d1f] md:text-[28px]"
          id={`${sectionId}-title`}
        >
          변경 내역
        </h2>
        <strong className="text-base leading-[1.4] whitespace-nowrap text-primary-dark">{updates.length}건</strong>
      </header>

      {updates.length === 0 && (
        <p className="m-0 grid min-h-28 place-items-center border-y border-[#e2e5ea] px-4 py-8 text-center text-[15px] leading-[1.6] text-[#777]">
          등록된 변경 내역이 없습니다.
        </p>
      )}

      {updates.length > 0 && (
        <ol className="m-0 grid list-none gap-3 border-y border-[#e2e5ea] py-4">
          {pagedUpdates.map((update) => (
            <li
              className="grid grid-cols-[40px_minmax(0,1fr)] gap-4 border-b border-[#eceef1] px-1 py-4 last:border-b-0 max-sm:grid-cols-[34px_minmax(0,1fr)] max-sm:gap-3"
              key={update.updateId}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary-light text-primary-dark max-sm:size-[34px]">
                <History size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex items-start justify-between gap-4 max-sm:flex-col max-sm:gap-1">
                  <strong className="text-base leading-[1.5] text-[#1d1d1f]">{update.title}</strong>
                  <time
                    className="text-[13px] leading-[1.5] whitespace-nowrap text-[#777]"
                    dateTime={update.registeredAt}
                  >
                    {formatUpdatedAt(update.registeredAt)}
                  </time>
                </div>
                {update.content && (
                  <p className="mt-2 mb-0 whitespace-pre-wrap text-base leading-[1.65] text-[#555] [overflow-wrap:anywhere]">
                    {update.content}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="[&_button]:transition-colors [&_button:not(:disabled)]:cursor-pointer [&_button:not(:disabled):hover]:border-primary [&_button:not(:disabled):hover]:bg-[#f2f7ff] [&_button:not(:disabled):hover]:text-primary-dark">
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </section>
  );
};

export default AuctionProductUpdateSection;
