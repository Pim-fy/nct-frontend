// src/components/landing/sections/MobileLandingSections.jsx
//
// 태블릿/모바일(md 미만) 전용 랜딩 레이아웃.
// - 기존 데스크톱 버전(ScaledStage)은 1920px 디자인을 통째로 축소하는 방식이라, 화면이 깨지진
//   않지만 글자·터치 타겟까지 같이 줄어들어 실제 모바일 UX로는 부적합했다.
// - 여기서는 같은 데이터(카드 컴포넌트도 재사용)를 절대좌표 없이 진짜 반응형(세로 스택 +
//   가로 스크롤 캐러셀)으로 다시 배치한다. 모바일 전용 디자인 시안은 따로 없어서
//   "요즘 반응형 스타일"에 맞춰 통상적인 패턴(세로 스택, 스와이프 카드, 아이콘 가로 스크롤)으로 구성했다.
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import arrowDark from "@assets/img/arrowDark.png";
import { assets } from "./assets";
import AuctionCard from "./AuctionCard";
import { SERVICE_MENU_ITEMS } from "./serviceMenuData";

const AUCTION_SEARCH_PLACEHOLDER = "원하는 경매 상품을 검색하세요.";

const BANNER_SLIDES = [
  {
    eyebrow: "START GUIDE",
    title1: "처음이어도 흐름만 알면",
    title2: "어렵지 않아요",
    sub: "경매와 서비스 요청, 시작부터 완료까지 한눈에",
    btnLabel: "이용가이드 보기",
    btnRoute: "/guide",
    tags: ["경매 거래", "서비스 요청", "안전 거래"],
    rightImg: "heroSectionImg",
  },
];

export default function MobileLandingSections({
  closingAuctionItems,
  closingAuctionError,
  closingAuctionLoading,
  hotItems,
  isHotAuctionError,
  isHotAuctionLoading,
  newAuctionItems,
  newAuctionError,
  newAuctionLoading,
}) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [bannerIdx, setBannerIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("new");
  const auctionScrollRef = useRef(null);

  const scrollCarousel = (ref, dir) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir * ref.current.clientWidth, behavior: "smooth" });
  };

  const runSearch = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    navigate(`/auction?keyword=${encodeURIComponent(trimmed)}`);
  };

  const auctionItems = activeTab === "new" ? newAuctionItems : closingAuctionItems;
  const isAuctionError = activeTab === "new" ? newAuctionError : closingAuctionError;
  const isAuctionLoading = activeTab === "new" ? newAuctionLoading : closingAuctionLoading;

  return (
    <div className="flex flex-col gap-8 lg:hidden">
      {/* ── 히어로: 배경 이미지 + 타이틀 + 태그 + 검색 + 슬라이드 배너 ── */}
      <section className="relative overflow-hidden">
        {/* 배경 이미지 + 오버레이 */}
        <div className="absolute inset-0">
          <img src={assets.bgImg} alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-black/45" />
        </div>

        <div className="relative z-10 px-4 pt-8 pb-6 text-center">
          {/* 타이틀 */}
          <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
            <span className="text-[#7b82e0]">실시간 경매</span>
            <span className="text-white">와</span><br />
            <span className="text-[#00ccd0]">생활 서비스</span>
            <span className="text-white">를 한 화면에서</span>
          </h1>

          {/* 검색 태그 — hot item 목록 */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-start">
            {hotItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(`/auction/${item.id}`)}
                className="shrink-0 rounded-full bg-white/20 border border-white/40 px-3 py-1.5 text-[13px] text-white backdrop-blur-sm"
              >
                #{item.name.length > 8 ? item.name.slice(0, 7) + "…" : item.name}
              </button>
            ))}
          </div>

          {/* 검색 입력 */}
          <div className="mt-3 flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-md">
            <span className="inline-flex h-[30px] shrink-0 items-center justify-center rounded-full bg-[#0064ff] px-3 text-[14px] font-bold text-white">
              경매
            </span>
            <div className="h-4 w-px bg-[#d9d9d9]" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(keyword); }}
              placeholder={AUCTION_SEARCH_PLACEHOLDER}
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#b1b1b1]"
            />
            <button type="button" onClick={() => runSearch(keyword)} aria-label="검색">
              <img src={assets.searchIcon} alt="검색" className="size-[20px] object-contain" />
            </button>
          </div>

          {/* 슬라이드 배너 */}
          <div className="mt-4 relative">
            <div className="relative overflow-hidden rounded-[20px] bg-white/90">
              {/* 슬라이드 트랙 */}
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(${-bannerIdx * 100}%)` }}
              >
                {BANNER_SLIDES.map((s, i) => (
                  <div key={i} className="relative shrink-0 w-full">
                    <div className="flex items-center gap-2 px-5 py-5">
                      <div className="flex-1 text-left min-w-0">
                        {s.eyebrow && (
                          <p className="text-[11px] font-bold text-[#0064ff] tracking-[2px] mb-1">{s.eyebrow}</p>
                        )}
                        <p className="font-bold text-[20px] text-black leading-snug tracking-tight">
                          {s.title1}<br />{s.title2}
                        </p>
                        <p className="text-[12px] text-black mt-1">{s.sub}</p>
                        {s.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {s.tags.map((tag) => (
                              <span key={tag} className="bg-[#eef3ff] text-[#0064ff] text-[11px] font-bold px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => s.btnRoute && navigate(s.btnRoute)}
                          className="mt-3 bg-[#0064ff] text-white font-bold text-[14px] px-5 py-[9px] rounded-[10px] cursor-pointer border-none"
                        >
                          {s.btnLabel}
                        </button>
                      </div>
                      {s.rightImg && (
                        <img src={assets[s.rightImg]} alt="" className="w-[100px] object-contain shrink-0 pointer-events-none mr-4" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* 좌우 화살표 */}
            <button
              type="button"
              onClick={() => setBannerIdx((i) => (i === 0 ? BANNER_SLIDES.length - 1 : i - 1))}
              className="absolute -left-1 top-1/2 -translate-y-1/2 flex size-[32px] items-center justify-center text-[28px] text-[#7b8290] font-light leading-none bg-transparent border-none cursor-pointer"
              aria-label="이전"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setBannerIdx((i) => (i === BANNER_SLIDES.length - 1 ? 0 : i + 1))}
              className="absolute -right-1 top-1/2 -translate-y-1/2 flex size-[32px] items-center justify-center text-[28px] text-[#7b8290] font-light leading-none bg-transparent border-none cursor-pointer"
              aria-label="다음"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* 담당자 7 통합: 서비스 메뉴는 견적 요청서 작성 진입점입니다. */}
      <section className="px-4">
        <h2 className="mb-3 text-[18px] font-bold">SERVICE MENU</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SERVICE_MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate("/service-requests/new")}
              className="flex shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-[rgba(0,0,0,0.1)] bg-white p-4 size-[92px]"
            >
              <img src={item.image} alt="" className="h-[36px] w-[36px] object-contain" />
              <span className="text-[13px] text-black">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* HOT ITEM */}
      <section className="px-4">
        <div className="overflow-hidden rounded-2xl border border-[#ebebeb] shadow-sm">
          <div className="flex items-center justify-between bg-[#0064ff] px-4 py-3">
            <span className="text-[16px] font-black tracking-[2px] text-white">HOT ITEM</span>
            <button type="button" onClick={() => navigate("/auction?sort=popular")} className="text-[12px] text-white/90">더보기 ›</button>
          </div>
          <ul className="divide-y divide-[#f0f0f0] bg-white">
            {hotItems.slice(0, 5).map((item, i) => (
              <li key={item.id}>
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#f7f9fc]"
                  onClick={() => navigate(`/auction/${item.id}`)}
                  type="button"
                >
                  <span className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${i === 0 ? "bg-[#0064ff]" : "bg-[#c9d3e0]"}`}>
                    {item.rank}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px]">{item.name}</span>
                  <span className="shrink-0 text-[14px] font-bold">{item.price}</span>
                </button>
              </li>
            ))}
            {!isHotAuctionLoading && !isHotAuctionError && hotItems.length === 0 && (
              <li className="px-4 py-6 text-center text-[14px] text-[#666]">표시할 인기 경매가 없습니다.</li>
            )}
            {isHotAuctionLoading && <li className="px-4 py-6 text-center text-[14px] text-[#666]">불러오는 중입니다.</li>}
            {isHotAuctionError && <li className="px-4 py-6 text-center text-[14px] text-[#9b2c2c]">인기 경매를 불러오지 못했습니다.</li>}
          </ul>
        </div>
      </section>

      {/* 경매 (탭 + 가로 스와이프 카드) */}
      <section>
        <div className="mb-3 flex items-center justify-between px-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("new")}
              className={`rounded-full px-4 py-2 text-[15px] font-bold transition-colors ${activeTab === "new" ? "bg-[#0064ff] text-white" : "bg-[#ebebeb] text-[#969696]"}`}
            >
              신규 경매
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("closing")}
              className={`rounded-full px-4 py-2 text-[15px] font-bold transition-colors ${activeTab === "closing" ? "bg-[#0064ff] text-white" : "bg-[#ebebeb] text-[#969696]"}`}
            >
              마감 임박 경매
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="이전"
              onClick={() => scrollCarousel(auctionScrollRef, -1)}
              className="flex size-[32px] items-center justify-center"
            >
              <img src={arrowDark} alt="이전" className="size-[20px] object-contain rotate-180" />
            </button>
            <button
              type="button"
              aria-label="다음"
              onClick={() => scrollCarousel(auctionScrollRef, 1)}
              className="flex size-[32px] items-center justify-center"
            >
              <img src={arrowDark} alt="다음" className="size-[20px] object-contain" />
            </button>
          </div>
        </div>
        <div
          ref={auctionScrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [scroll-padding-left:16px]"
        >
          {!isAuctionLoading && !isAuctionError && auctionItems.map((item) => (
            <div
              key={item.id}
              className="w-full shrink-0 snap-start min-[480px]:w-[calc(50%_-_8px)]"
            >
              <AuctionCard
                fluid
                item={item}
                onClick={() => navigate(`/auction/${item.id}`)}
              />
            </div>
          ))}
          {isAuctionLoading && <p className="w-full px-4 py-14 text-center text-[16px] text-[#666]">경매를 불러오는 중입니다.</p>}
          {isAuctionError && <p className="w-full px-4 py-14 text-center text-[16px] text-[#9b2c2c]">경매를 불러오지 못했습니다.</p>}
          {!isAuctionLoading && !isAuctionError && auctionItems.length === 0 && <p className="w-full px-4 py-14 text-center text-[16px] text-[#666]">표시할 경매가 없습니다.</p>}
        </div>
        <div className="mt-2 flex justify-center">
          <button
            type="button"
            onClick={() => navigate(activeTab === "new"
              ? "/auction?sort=latest"
              : "/auction?sort=deadline&endingSoonOnly=true")}
            className="rounded-full border border-[#ebebeb] bg-[#f3f5fa] px-5 py-2 text-[13px] text-[#4e4e4e]"
          >
            더보기 ›
          </button>
        </div>
      </section>

    </div>
  );
}
