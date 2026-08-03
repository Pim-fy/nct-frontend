import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { assets } from "./assets";

const AUCTION_SEARCH = {
  label: "경매 상품",
  path: "/auction",
  placeholder: "원하는 경매 상품을 검색하세요.",
};

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
  const hotTags = hotItems.slice(0, 5);

  const runSearch = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    navigate(`${AUCTION_SEARCH.path}?keyword=${encodeURIComponent(trimmed)}`);
  };

  return (
    <>
      {/* 담당자 7 통합: 비회원·일반회원 홈 검색은 공개 경매만 제공합니다. */}
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
            <span className="inline-flex h-[36px] w-[72px] shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-r from-[#0064ff] to-[#0048d9] text-[15px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16),0_2px_5px_rgba(17,24,39,0.14)]">
              경매
            </span>

            <div className="w-px h-[32px] bg-[#d9d9d9] mx-4 shrink-0" />
            <input
              aria-label={`${AUCTION_SEARCH.label} 검색어`}
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") runSearch(keyword);
              }}
              placeholder={AUCTION_SEARCH.placeholder}
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
