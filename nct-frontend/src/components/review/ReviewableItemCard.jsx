import React from "react";

// 거래유형별 배지 색상 (물건거래=파랑, 서비스=민트) - Figma 원본 색상값 그대로 사용
const DEAL_TYPE_STYLE = {
  goods:   { label: "물건거래", color: "#0064ff", width: "w-[71px]" },
  service: { label: "서비스",   color: "#00ccd0", width: "w-[58px]" },
};

/**
 * 리뷰작성 목록의 항목 1행 카드.
 * @param {number} top             ScaledStage 좌표계 기준 절대 top 위치(px)
 * @param {string} thumbnail       썸네일 이미지 src
 * @param {string} title           상품/서비스명
 * @param {'goods'|'service'} dealType
 * @param {string} partyLabel      "판매자" | "제공자"
 * @param {string} partyName       예: "이**"
 * @param {string} completedDate   완료일 (YYYY-MM-DD)
 * @param {string} actionLabel     버튼 텍스트 (예: "리뷰 등록", "리뷰 보기")
 * @param {() => void} onAction
 */
export default function ReviewableItemCard({
  top,
  thumbnail,
  title,
  dealType = "goods",
  partyLabel = "판매자",
  partyName,
  completedDate,
  actionLabel = "리뷰 등록",
  onAction,
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

      {/* 거래자 / 완료일 */}
      <p
        className="[word-break:break-word] absolute font-['Noto_Sans_KR:Regular'] font-normal left-[364px] text-[#4e4e4e] text-[15px] tracking-[-0.75px] whitespace-pre"
        style={{ top: top + 120 }}
      >
        <span className="font-['Noto_Sans_KR:Bold'] font-bold leading-[30px]">{partyLabel}</span>
        <span className="leading-[30px]">{`  ${partyName}            `}</span>
        <span className="font-['Noto_Sans_KR:Bold'] font-bold leading-[30px]">완료일</span>
        <span className="leading-[30px]">{`  ${completedDate} `}</span>
      </p>

      {/* 액션 버튼 */}
      <div className="absolute contents left-[1596px]" style={{ top: top + 79 }} data-name="btn">
        <button
          type="button"
          onClick={onAction}
          className="absolute bg-[#0064ff] h-[45px] left-[1596px] rounded-[5px] w-[130px] cursor-pointer border-none hover:bg-[#0048bf] transition-colors"
          style={{ top: top + 82 }}
        >
          <span className="font-['Inter:Bold'] font-bold text-[16px] text-white tracking-[-0.8px]">
            {actionLabel}
          </span>
        </button>
      </div>
    </div>
  );
}
