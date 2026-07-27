// src/components/common/Pagination.jsx
// Figma: 21_review_list_작성한 리뷰(node 56:415, "paging") 디자인 기준 페이지네이션.
// 페이지 번호 박스(35x35, 활성=파랑 채움/비활성=흰 배경+회색 테두리) + 이전/다음 화살표.
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 my-6">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        aria-label="이전 페이지"
        className="flex items-center justify-center size-[35px] rounded border border-[#d9d9d9] bg-white text-[#4e4e4e] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft size={18} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={
            p === page
              ? 'flex items-center justify-center size-[35px] rounded bg-primary text-white text-[16px] font-bold'
              : 'flex items-center justify-center size-[35px] rounded border border-[#d9d9d9] bg-white text-[#4e4e4e] text-[16px]'
          }
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        aria-label="다음 페이지"
        className="flex items-center justify-center size-[35px] rounded border border-[#d9d9d9] bg-white text-[#4e4e4e] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};
export default Pagination;
