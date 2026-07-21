import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * 캐러셀 이전/다음 화살표 버튼.
 *
 * 참고: 이 파일은 원래 프로젝트에 없었고(HeroSection/AuctionSection/NewServiceSection이
 * import만 하고 실체가 누락되어 있어 앱 전체가 빌드조차 되지 않는 상태였다), 최소 동작 복구를
 * 위해 lucide-react 아이콘(이미 프로젝트에서 쓰는 라이브러리)으로 새로 채운 것이다.
 * 원본 Figma 디자인의 정확한 화살표 모양과는 다를 수 있으니, 디자이너 확인 후 교체가 필요하다.
 *
 * @param {'left'|'right'} direction
 * @param {string} className     위치 지정용 (예: "left-[111px] top-[1616px]")
 * @param {string} [barClassName] 아이콘 색상 지정용 (예: "bg-[#434343]" -> 텍스트 색으로 매핑해 사용)
 * @param {() => void} [onClick]
 * @param {boolean} [disabled]
 */
export default function ArrowIcon({ direction = "left", className = "", barClassName = "", onClick, disabled = false }) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;
  // 기존 barClassName 이 배경색 유틸(bg-*)로 전달되던 관례를 그대로 살리되,
  // 아이콘 색상에는 text-* 로 바꿔 적용할 수 있도록 매핑한다.
  const colorClass = barClassName.replace(/\bbg-/g, "text-");

  return (
    <button
      type="button"
      aria-label={direction === "left" ? "이전" : "다음"}
      onClick={onClick}
      disabled={disabled}
      className={`absolute flex items-center justify-center size-[45px] rounded-full border border-solid border-[#ebebeb] bg-white/80 cursor-pointer hover:bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <Icon size={22} className={colorClass || "text-[#434343]"} />
    </button>
  );
}
