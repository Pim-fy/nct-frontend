import React from "react";

/**
 * 신규 서비스 요청 섹션에서 사용하는 개별 서비스 요청 카드.
 * 캐러셀 그리드 안에 놓을 수 있도록 카드 자신을 기준으로 한 상대좌표로 그린다.
 * 마우스 오버 시 테두리가 파란색으로 바뀌도록 group-hover를 쓴다.
 */
export default function ServiceRequestCard({ item, onClick }) {
  return (
    <article className="group relative h-[169px] w-[501px] shrink-0">
      <button
        aria-label={`${item.title} 서비스 요청 상세보기`}
        className="absolute inset-0 z-10 cursor-pointer rounded-[20px] border-0 bg-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0064ff]"
        onClick={onClick}
        type="button"
      />
      <div className="absolute inset-0 rounded-[20px] border border-solid border-[rgba(255,255,255,0.7)] bg-transparent transition-colors group-hover:border-[#0064ff]" />

      <p className="absolute right-[33px] top-[72px] max-w-[230px] truncate text-right font-['Noto_Sans_KR:Bold'] font-bold text-white tracking-normal">
        {item.price !== '협의' && <span className="text-[16px]">최대 </span>}
        <span className="text-[25px]">{item.price}</span>
      </p>

      <div className="absolute bg-[#e63946] rounded-[20px] size-[14px]" style={{ left: 221, top: 60 }} />
      <p className="absolute font-['Noto_Sans_KR:Bold'] font-bold text-[10px] text-white tracking-[-0.8px] whitespace-nowrap" style={{ left: 224, top: 61 }}>
        N
      </p>

      <p className="absolute max-w-[350px] truncate font-['Noto_Sans_KR:Medium'] text-[18px] font-medium text-white tracking-normal" style={{ left: 29, top: 56 }}>
        {item.title}
      </p>
      <p className="absolute max-w-[190px] truncate font-['Noto_Sans_KR:Medium'] text-[15px] font-medium text-white tracking-normal" style={{ left: 29, top: 83 }}>
        {item.meta}
      </p>

      <span className="absolute left-[30px] top-[30px] flex h-[22px] max-w-[160px] items-center rounded-[15px] bg-[#0064ff] px-3 font-['Noto_Sans_KR:Medium'] text-[12px] font-medium text-white tracking-normal">
        <span className="truncate">{item.bidLabel}</span>
      </span>

      {item.quotes != null && (
        <>
          <div className="absolute bg-white h-[20px] rounded-[15px] w-[60px]" style={{ left: 30, top: 123 }} />
          <p className="absolute font-['Noto_Sans_KR:Medium'] font-medium text-[#4e4e4e] text-[14px] tracking-[-1.12px] whitespace-nowrap" style={{ left: 36, top: 124 }}>
            <span>견적</span>
            <span className="text-[#0064ff]">{` ${item.quotes}`}</span>
            <span>{`건 `}</span>
          </p>
        </>
      )}
      {item.ddayLabel && (
        <>
          <div className="absolute bg-white h-[20px] rounded-[15px] w-[60px]" style={{ left: item.quotes != null ? 95 : 30, top: 123 }} />
          <p className="absolute font-['Noto_Sans_KR:Medium'] font-medium text-[#4e4e4e] text-[14px] tracking-[-1.12px] whitespace-nowrap" style={{ left: item.quotes != null ? 100 : 35, top: 124 }}>
            {item.ddayLabel}
          </p>
        </>
      )}
    </article>
  );
}
