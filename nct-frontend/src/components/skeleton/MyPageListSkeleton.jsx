import { Skeleton } from './BaseSkeleton';

export default function MyPageListSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-3" aria-busy="true" aria-label="목록 불러오는 중">
      {Array.from({ length: count }).map((_, index) => (
        <article
          className="flex flex-col gap-5 rounded-xl border border-[#dce2ed] bg-white p-5 sm:h-[160px] sm:flex-row sm:items-center"
          key={index}
        >
          <div className="h-[104px] w-[104px] shrink-0 overflow-hidden rounded-[10px]">
            <Skeleton width={104} height={104} borderRadius={10} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2">
              <Skeleton width={64} height={20} borderRadius={6} />
            </div>
            <Skeleton width="58%" height={22} borderRadius={5} />
            <div className="mt-2">
              <Skeleton width="78%" height={16} borderRadius={4} />
            </div>
            <div className="mt-1">
              <Skeleton width="46%" height={16} borderRadius={4} />
            </div>
          </div>

          <div className="shrink-0">
            <Skeleton width={84} height={36} borderRadius={8} />
          </div>
        </article>
      ))}
    </div>
  );
}
