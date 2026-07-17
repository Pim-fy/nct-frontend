import React from "react";

/** 신규 서비스 요청 섹션에서 사용하는 개별 서비스 요청 카드 */
export default function ServiceRequestCard({ item }) {
  return (
    <div className="absolute contents" style={{ left: item.left, top: item.top }}>
      <div
        className="absolute bg-transparent border border-[rgba(255,255,255,0.7)] border-solid h-[169px] rounded-[20px] w-[501px]"
        style={{ left: item.left, top: item.top }}
      />
      <p
        className="-translate-x-full absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[0] text-[0px] text-right text-white tracking-[-2px] whitespace-nowrap"
        style={{ left: item.left + 468, top: item.top + 72 }}
      >
        <span className="leading-[normal] text-[16px]">{`최대 `}</span>
        <span className="leading-[normal] text-[25px]">{item.price}</span>
      </p>

      <div className="absolute bg-[#e63946] rounded-[20px] size-[14px]" style={{ left: item.left + 221, top: item.top + 60 }} />
      <p className="absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[normal] text-[10px] text-white tracking-[-0.8px] whitespace-nowrap" style={{ left: item.left + 224, top: item.top + 61 }}>
        N
      </p>

      <p className="absolute font-['Noto_Sans_KR:Medium'] font-medium leading-[normal] text-[18px] text-white tracking-[-0.9px] whitespace-nowrap" style={{ left: item.left + 29, top: item.top + 56 }}>
        {item.title}
      </p>
      <p className="absolute font-['Noto_Sans_KR:Medium'] font-medium leading-[normal] text-[15px] text-white tracking-[-0.75px] whitespace-nowrap" style={{ left: item.left + 29, top: item.top + 83 }}>
        {item.meta}
      </p>

      <div className="absolute contents" style={{ left: item.left + 30, top: item.top + 30 }}>
        <div className="absolute bg-[#0064ff] border border-[#0064ff] border-solid h-[20px] rounded-[15px] w-[42px]" style={{ left: item.left + 30, top: item.top + 30 }} />
        <p
          className="absolute font-['Noto_Sans_KR:Medium'] font-medium leading-[normal] text-[12px] text-white tracking-[-0.96px] whitespace-nowrap"
          style={{ left: item.left + 40, top: item.top + 33 }}
        >
          {item.bidLabel}
        </p>
      </div>

      <div className="absolute bg-white h-[20px] rounded-[15px] w-[60px]" style={{ left: item.left + 30, top: item.top + 123 }} />
      <div className="absolute bg-white h-[20px] rounded-[15px] w-[60px]" style={{ left: item.left + 95, top: item.top + 123 }} />
      <p
        className="absolute font-['Noto_Sans_KR:Medium'] font-medium leading-[0] text-[#4e4e4e] text-[14px] tracking-[-1.12px] whitespace-nowrap"
        style={{ left: item.left + 36, top: item.top + 124 }}
      >
        <span className="leading-[normal]">견적</span>
        <span className="leading-[normal] text-[#0064ff]">{` ${item.quotes}`}</span>
        <span className="leading-[normal]">{`건 `}</span>
      </p>
      <p
        className="absolute font-['Noto_Sans_KR:Medium'] font-medium leading-[normal] text-[#4e4e4e] text-[14px] tracking-[-1.12px] whitespace-nowrap"
        style={{ left: item.left + 100, top: item.top + 124 }}
      >{` ${item.ddayLabel}`}</p>
    </div>
  );
}
