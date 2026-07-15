import React from "react";

/** 좌/우로 벌어진 화살표 두 개로 만든 "슬라이드 이전/다음" 화살표 아이콘 */
export default function ArrowIcon({ direction = "left", className = "", barClassName = "bg-white" }) {
  const isLeft = direction === "left";
  return (
    <div className={`absolute contents ${className}`}>
      <div className="absolute flex items-center justify-center size-[20.506px]" style={{ top: 0, left: isLeft ? 0 : 0 }}>
        <div className={`flex-none ${isLeft ? "-rotate-45" : "rotate-45"}`}>
          <div className={`${barClassName} h-px relative w-[28px]`} />
        </div>
      </div>
      <div className="absolute flex items-center justify-center size-[20.506px]" style={{ top: "19.09px", left: 0 }}>
        <div className={`flex-none ${isLeft ? "-rotate-135" : "rotate-135"}`}>
          <div className={`${barClassName} h-px relative w-[28px]`} />
        </div>
      </div>
    </div>
  );
}
