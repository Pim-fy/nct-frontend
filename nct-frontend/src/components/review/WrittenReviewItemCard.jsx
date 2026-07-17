import React from "react";
import StarRatingDisplay from "@components/review/StarRatingDisplay";

// ReviewableItemCard.jsx 와 동일한 배지 색상 규칙을 공유한다.
const DEAL_TYPE_STYLE = {
  goods:   { label: "물건거래", color: "#0064ff", width: "w-[71px]" },
  service: { label: "서비스",   color: "#00ccd0", width: "w-[58px]" },
};

/**
 * "작성한 리뷰" 탭의 항목 1행 카드 (Figma node 56:138).
 * ReviewableItemCard와 달리 판매자/완료일 대신 내가 남긴 별점+리뷰 내용을 보여주고,
 * 액션 버튼도 "리뷰 등록" 하나 대신 "수정"(회색 아웃라인) + "삭제"(빨강) 두 개다.
 */
export default function WrittenReviewItemCard({
  top,
  thumbnail,
  title,
  dealType = "goods",
  rating,
  content,
  onEdit,
  onDelete,
}) {
  const typeStyle = DEAL_TYPE_STYLE[dealType];

  return (
    <div className="absolute contents left-[173px]" style={{ top }} data-name="item">
      <div
        className="absolute bg-white border border-[#e5e5e5] border-solid h-[209px] left-[173px] rounded-[20px] w-[1600px]"
        style={{ top }}
      />

      {/* 썸네일 */}
      <div
        className="absolute border border-[#d9d9d9] border-solid left-[210px] rounded-[10px] size-[129px]"
        style={{ top: top + 42 }}
      >
        <img
          alt={title}
          className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[10px] size-full"
          src={thumbnail}
        />
      </div>

      {/* 거래유형 배지 */}
      <div
        className={`absolute bg-white border border-solid h-[33px] left-[364px] rounded-[5px] ${typeStyle.width}`}
        style={{ top: top + 42, borderColor: typeStyle.color }}
      />
      <p
        className="absolute font-['Noto_Sans_KR:Regular'] font-normal leading-[30px] left-[373px] text-[15px] tracking-[-0.75px] whitespace-nowrap"
        style={{ top: top + 44, color: typeStyle.color }}
      >
        {typeStyle.label}
      </p>

      {/* 제목 */}
      <p
        className="[word-break:break-word] absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[30px] left-[364px] text-[20px] text-black tracking-[-1px] whitespace-nowrap max-w-[1180px] truncate"
        style={{ top: top + 81 }}
      >
        {title}
      </p>

      {/* 내 별점 + 리뷰 내용 */}
      <div className="absolute left-[364px] flex items-center gap-4" style={{ top: top + 117 }}>
        <StarRatingDisplay rating={rating} size={20} />
        <p className="font-['Noto_Sans_KR:Regular'] font-normal text-[16px] text-[#434343] tracking-[-0.8px] whitespace-nowrap max-w-[900px] truncate">
          {content}
        </p>
      </div>

      {/* 수정 / 삭제 버튼 */}
      <button
        type="button"
        onClick={onEdit}
        className="absolute bg-white border border-[#d9d9d9] h-[45px] left-[1437px] rounded-[5px] w-[54px] cursor-pointer text-[#4e4e4e] text-[16px] font-bold hover:bg-[#f5f5f5] transition-colors"
        style={{ top: top + 82 }}
      >
        수정
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="absolute bg-[#e63946] h-[45px] left-[1501px] rounded-[5px] w-[54px] cursor-pointer border-none text-white text-[16px] font-bold hover:bg-[#c22f3b] transition-colors"
        style={{ top: top + 82 }}
      >
        삭제
      </button>
    </div>
  );
}
