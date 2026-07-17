import React from "react";

/** 신규경매/마감임박경매 섹션에서 사용하는 개별 경매 상품 카드 */
export default function AuctionCard({ item }) {
  return (
    <div className="absolute contents top-[1462px]" style={{ left: item.left }}>
      <div
        className="absolute bg-white border border-[#ebebeb] border-solid h-[323px] rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.15)] top-[1487px] w-[295px]"
        style={{ left: item.left }}
      />
      <div className="absolute h-[195px] rounded-tl-[20px] rounded-tr-[20px] top-[1487px] w-[293px]" style={{ left: item.left + 1 }}>
        <img alt={item.name} className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-tl-[20px] rounded-tr-[20px] size-full" src={item.image} />
      </div>

      <div className="absolute bg-[#e63946] rounded-[20px] size-[14px] top-[1768px]" style={{ left: item.left + 80 }} />
      <p className="absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[normal] text-[10px] text-white top-[1769px] tracking-[-0.8px] whitespace-nowrap" style={{ left: item.left + 83 }}>
        {item.badge}
      </p>

      <div className="absolute contents top-[1462px]" style={{ left: item.left + 22 }}>
        <div className="absolute bg-[#e63946] rounded-[25px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.15)] size-[50px] top-[1462px]" style={{ left: item.left + 22 }} />
        <div className="absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[0] text-[12px] text-white top-[1473px] tracking-[-0.96px] whitespace-nowrap" style={{ left: item.left + 36 }}>
          <p className="leading-[normal] mb-0">종료</p>
          <p className="leading-[normal]">임박</p>
        </div>
      </div>

      {item.dday && (
        <div className="absolute contents top-[1462px]" style={{ left: item.left + 22 }}>
          <div className="absolute bg-[#4e4e4e] rounded-[25px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.15)] size-[50px] top-[1462px]" style={{ left: item.left + 22 }} />
          <p
            className="-translate-x-1/2 absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[18px] text-[16px] text-center text-white top-[1478px] tracking-[-1.6px] whitespace-nowrap"
            style={{ left: item.left + 47 }}
          >
            {item.dday}
          </p>
        </div>
      )}

      <p className="absolute font-['Noto_Sans_KR:Medium'] font-medium leading-[normal] text-[#969696] text-[15px] top-[1765px] tracking-[-1.2px] whitespace-nowrap" style={{ left: item.left + 22 }}>
        {item.bids}
      </p>
      <p className="absolute font-['Noto_Sans_KR:Medium'] font-medium leading-[normal] text-[18px] text-black top-[1697px] tracking-[-0.9px] whitespace-nowrap" style={{ left: item.left + 22 }}>
        {item.name}
      </p>
      <p className="absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[normal] text-[25px] text-black top-[1727px] tracking-[-2px] whitespace-nowrap" style={{ left: item.left + 22 }}>
        {item.price}
      </p>
      <p
        className="[text-decoration-skip-ink:none] [text-underline-position:from-font] absolute decoration-from-font decoration-solid font-['Noto_Sans_KR:Regular'] font-normal leading-[normal] line-through text-[#969696] text-[15px] top-[1738px] tracking-[-1.2px] whitespace-nowrap"
        style={{ left: item.left + 133 }}
      >
        {item.original}
      </p>
    </div>
  );
}
