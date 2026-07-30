import InlineSkeleton from '@components/skeleton/InlineSkeleton';

export default function MyPageSummary({ items, isLoading = false }) {
  return (
    <div className="mb-5 grid grid-cols-1 border-y border-[#e9edf4] sm:grid-cols-3">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`flex min-h-[76px] items-center justify-between gap-3 px-5 py-4 ${
            index > 0 ? "border-t border-[#e9edf4] sm:border-l sm:border-t-0" : ""
          }`}
        >
          <span className="text-base leading-7 font-bold text-[#667085]">{item.label}</span>
          <strong className="inline-flex min-w-8 items-center justify-end text-2xl leading-7 font-extrabold text-[#155eef]">
            {isLoading ? <InlineSkeleton width={32} height={24} /> : item.value}
          </strong>
        </div>
      ))}
    </div>
  );
}
