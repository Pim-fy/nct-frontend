import React from "react";
import { ChevronRight } from "lucide-react";

/**
 * "더보기 >" 버튼 (light: 회색 배경 / dark: 투명 배경 + 흰 테두리)
 *
 * 버그 수정 메모: 이전에는 바깥 래퍼가 `display:contents`였는데, 이 값은 요소 자체를
 * 렌더링하지 않고 자식만 부모 자리에 그대로 꽂아버려서 inline style로 준 left/top이
 * 통째로 무시되었다. 그래서 안쪽 배경 박스(위치 지정이 아예 없던 요소)와 자식들의
 * 작은 상대좌표(left-62 등)가 캔버스 좌상단 근처에 뭉쳐 렌더링되어 버튼이 화면에는
 * 있지만(코드상 존재) 다른 요소에 가려 육안으로는 안 보이는 상태였다.
 * 지금은 래퍼를 실제 `absolute` 박스로 만들어 left/top이 실제로 적용되고,
 * 화살표도 만료되는 Figma 임시 URL(assets.union) 대신 lucide 아이콘을 쓴다.
 */
export default function MoreButton({ left, top, variant = "light", onClick }) {
  const isDark = variant === "dark";
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute h-[45px] w-[100px] cursor-pointer border-none bg-transparent p-0"
      style={{ left, top }}
    >
      <span
        className={`absolute inset-0 h-[45px] rounded-[40px] w-[100px] border border-solid transition-colors ${
          isDark ? "bg-transparent border-transparent hover:bg-white/10" : "bg-[#f3f5fa] border-[#ebebeb] hover:bg-[#e9edf5]"
        }`}
      />
      <span
        className={`absolute left-[30px] top-1/2 -translate-y-1/2 flex items-center gap-1 font-['Noto_Sans_KR:Regular'] font-normal text-[14px] tracking-[-1.12px] whitespace-nowrap ${
          isDark ? "text-white" : "text-[#4e4e4e]"
        }`}
      >
        더보기
        <ChevronRight size={14} />
      </span>
    </button>
  );
}
