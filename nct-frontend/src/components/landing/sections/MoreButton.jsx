import React from "react";
import { assets } from "./assets";

/** "더보기 >" 버튼 (light: 회색 배경 / dark: 투명 배경 + 흰 테두리) */
export default function MoreButton({ left, top, variant = "light" }) {
  const isDark = variant === "dark";
  return (
    <div className="absolute contents" style={{ left, top }}>
      <div
        className={`absolute h-[45px] rounded-[40px] w-[133px] border border-solid ${
          isDark ? "bg-transparent border-[#ebebeb]" : "bg-[#f3f5fa] border-[#ebebeb]"
        }`}
      />
      <p
        className={`-translate-x-1/2 absolute font-['Noto_Sans_KR:Regular'] font-normal leading-[normal] left-[62px] text-[14px] text-center top-[14px] tracking-[-1.12px] whitespace-pre ${
          isDark ? "text-white" : "text-[#4e4e4e]"
        }`}
      >{`더보기  `}</p>
      <div className="absolute flex items-center justify-center left-[83px] size-[8.05px] top-[19px]">
        <div className="flex-none rotate-45">
          <div className="relative size-[5.692px]">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={assets.union} />
          </div>
        </div>
      </div>
    </div>
  );
}
