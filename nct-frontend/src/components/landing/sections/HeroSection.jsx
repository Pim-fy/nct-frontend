import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { assets } from "./assets";

const SEARCH_TARGETS = [
  {
    id: "auction",
    label: "경매 상품",
    toggleLabel: "경매",
    path: "/auction",
    placeholder: "원하는 경매 상품을 검색하세요.",
  },
  {
    id: "service",
    label: "견적 요청",
    toggleLabel: "견적",
    path: "/service",
    placeholder: "필요한 서비스 요청을 검색하세요.",
  },
];

const SLIDE = {
  eyebrow: "START GUIDE",
  title1: "처음이어도 흐름만 알면",
  title2: "어렵지 않아요",
  sub: "경매와 서비스 요청, 시작부터 완료까지 한눈에 확인하세요.",
  btnLabel: "이용가이드 보기",
  btnRoute: "/guide",
  tags: ["경매 거래", "서비스 요청", "안전 거래"],
};

export default function HeroSection({ hotItems = [] }) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [searchTarget, setSearchTarget] = useState("auction");

  const selectedSearchTarget = SEARCH_TARGETS.find((item) => item.id === searchTarget)
    ?? SEARCH_TARGETS[0];
  const hotTags = hotItems.slice(0, 5);

  const runSearch = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    navigate(`${selectedSearchTarget.path}?keyword=${encodeURIComponent(trimmed)}`);
  };

  return (
    <>
      {/* 담당자 7: develop 반응형 히어로에 경매·견적 검색 전환 계약을 통합합니다. */}
      <div className="relative z-10 pt-10">
        <div className="w-[95%] max-w-[880px] mx-auto">
          <h1 className="text-center text-[50px] font-bold leading-tight tracking-[-2.5px] mb-5">
            <span className="text-[#474baa]">실시간 경매</span>
            <span className="text-black">와</span><br />
            <span className="text-[#00ccd0]">생활 서비스</span>
            <span className="text-black">를 한 화면에서</span>
          </h1>
        </div>

        {hotTags.length > 0 && (
          <div className="max-w-[1600px] mx-auto px-8 flex justify-center gap-3 mb-5">
            {hotTags.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/auction/${item.id}`)}
                className="h-[31px] px-4 rounded-full bg-[#f5f5f4] hover:bg-[#ececec] text-[14px] font-medium text-[#4e4e4e] tracking-[-0.7px] transition-colors shrink-0"
              >
                #{item.name}
              </button>
            ))}
          </div>
        )}

        <div className="w-[95%] max-w-[880px] mx-auto">
          <div className="flex items-center bg-white rounded-full shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)] border-2 border-[#0064ff] px-6 h-[73px]">
            <button
              aria-checked={searchTarget === "service"}
              aria-label={`검색 종류 전환, 현재 ${selectedSearchTarget.label}`}
              className={`relative h-[36px] w-[92px] shrink-0 cursor-pointer overflow-hidden rounded-[18px] text-[15px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),0_2px_5px_rgba(17,24,39,0.14)] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#0064ff]/25 ${
                searchTarget === "service"
                  ? "bg-gradient-to-r from-[#00bfc9] to-[#0099a6]"
                  : "bg-gradient-to-r from-[#0064ff] to-[#0048d9]"
              }`}
              onClick={() => setSearchTarget((current) => (
                current === "auction" ? "service" : "auction"
              ))}
              role="switch"
              type="button"
            >
              <span
                aria-hidden="true"
                className={`absolute left-[4px] top-[4px] h-[28px] w-[28px] rounded-full border border-white/80 bg-white shadow-[0_1px_4px_rgba(17,24,39,0.2)] transition-transform duration-200 ease-out ${
                  searchTarget === "service" ? "translate-x-[56px]" : "translate-x-0"
                }`}
              />
              <span
                className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-center tracking-[-0.5px] ${
                  searchTarget === "service"
                    ? "left-[4px] right-[36px]"
                    : "left-[36px] right-[4px]"
                }`}
              >
                {selectedSearchTarget.toggleLabel}
              </span>
            </button>

            <div className="w-px h-[32px] bg-[#d9d9d9] mx-4 shrink-0" />
            <input
              aria-label={`${selectedSearchTarget.label} 검색어`}
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch(keyword);
              }}
              placeholder={selectedSearchTarget.placeholder}
              className="flex-1 bg-transparent text-[18px] text-black placeholder:text-[#b1b1b1] outline-none"
            />
            <button
              type="button"
              onClick={() => runSearch(keyword)}
              className="shrink-0 ml-3"
            >
              <img alt="검색" src={assets.searchIcon} className="size-[27px] object-contain" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative h-[555px] -mt-[35px] overflow-hidden">
        <div className="absolute inset-0">
          <img src={assets.bgImg} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative h-full max-w-[1600px] mx-auto px-8 pt-[35px] flex items-center justify-center">
          <div className="relative" style={{ width: 870 }}>
            <button
              aria-label="이전 안내"
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-[36px] rounded-full bg-white/70 hover:bg-white transition-colors"
            >
              <ChevronLeft size={20} className="text-[#333]" />
            </button>

            <div
              className="bg-white/90 rounded-[41px] overflow-hidden flex items-center px-12 gap-8"
              style={{ height: 303 }}
            >
              <div className="flex-1 min-w-0 text-center">
                <p className="text-[14px] font-bold text-[#0064ff] tracking-[3px] mb-3 leading-normal">
                  {SLIDE.eyebrow}
                </p>
                <p className="text-[45px] font-bold text-black leading-[1.2] tracking-[-2.25px]">
                  {SLIDE.title1}<br />{SLIDE.title2}
                </p>
                <p className="text-[16px] text-black tracking-[-0.8px] mt-2">{SLIDE.sub}</p>
                <div className="flex justify-center gap-2 mt-3">
                  {SLIDE.tags.map((tag) => (
                    <span key={tag} className="bg-[#eef3ff] text-[#0064ff] text-[13px] font-bold px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-center mt-4">
                  <button
                    type="button"
                    onClick={() => navigate(SLIDE.btnRoute)}
                    className="bg-[#0064ff] h-[43px] px-6 rounded-[10px]"
                  >
                    <span className="text-[18px] font-bold text-white tracking-[-0.9px]">{SLIDE.btnLabel}</span>
                  </button>
                </div>
              </div>
              <img
                src={assets.heroSectionImg}
                alt=""
                className="h-[220px] object-contain shrink-0 pointer-events-none"
              />
            </div>

            <button
              aria-label="다음 안내"
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-[36px] rounded-full bg-white/70 hover:bg-white transition-colors"
            >
              <ChevronRight size={20} className="text-[#333]" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
