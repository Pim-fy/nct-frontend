import React from "react";
import StarRatingDisplay from "@components/review/StarRatingDisplay";

const DEAL_TYPE_STYLE = {
  goods:   { label: "물건거래", color: "#0064ff" },
  service: { label: "서비스",   color: "#00ccd0" },
};

export default function WrittenReviewItemCard({
  thumbnail,
  title,
  dealType = "goods",
  rating,
  content,
  onEdit,
  onDelete,
  onViewTarget,
}) {
  const typeStyle = DEAL_TYPE_STYLE[dealType] ?? DEAL_TYPE_STYLE.goods;

  return (
    <div className="flex items-center gap-4 bg-white border border-[#e5e5e5] rounded-[15px] p-4 md:p-5">
      {/* 썸네일 */}
      <button
        type="button"
        onClick={onViewTarget}
        aria-label={`${title} 상세보기`}
        className="shrink-0 size-[90px] md:size-[110px] rounded-[10px] border border-[#d9d9d9] overflow-hidden bg-[#e5e4df] cursor-pointer p-0"
      >
        {thumbnail && (
          <img alt={title} className="size-full object-cover pointer-events-none" src={thumbnail} />
        )}
      </button>

      {/* 내용 */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="shrink-0 inline-flex items-center h-[26px] px-2 rounded-[5px] text-[13px] font-medium border"
            style={{ color: typeStyle.color, borderColor: typeStyle.color }}
          >
            {typeStyle.label}
          </span>
          <button
            type="button"
            onClick={onViewTarget}
            className="truncate text-[15px] md:text-[16px] font-bold text-black hover:underline bg-transparent border-none p-0 cursor-pointer text-left min-w-0"
          >
            {title}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <StarRatingDisplay rating={rating} size={17} />
          <p className="text-[13px] md:text-[14px] text-[#434343] m-0 truncate">{content}</p>
        </div>
      </div>

      {/* 수정/삭제 버튼 */}
      <div className="shrink-0 flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="btn btn-outline"
          style={{ height: 36, minWidth: 52, fontSize: 14 }}
        >
          수정
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="btn btn-danger"
          style={{ height: 36, minWidth: 52, fontSize: 14 }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
