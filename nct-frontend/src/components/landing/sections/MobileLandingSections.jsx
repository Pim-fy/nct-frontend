// src/components/landing/sections/MobileLandingSections.jsx
//
// 태블릿/모바일(md 미만) 전용 랜딩 레이아웃.
// - 기존 데스크톱 버전(ScaledStage)은 1920px 디자인을 통째로 축소하는 방식이라, 화면이 깨지진
//   않지만 글자·터치 타겟까지 같이 줄어들어 실제 모바일 UX로는 부적합했다.
// - 여기서는 같은 데이터(카드 컴포넌트도 재사용)를 절대좌표 없이 진짜 반응형(세로 스택 +
//   가로 스크롤 캐러셀)으로 다시 배치한다. 모바일 전용 디자인 시안은 따로 없어서
//   "요즘 반응형 스타일"에 맞춰 통상적인 패턴(세로 스택, 스와이프 카드, 아이콘 가로 스크롤)으로 구성했다.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { assets } from "./assets";
import AuctionCard from "./AuctionCard";
import ServiceRequestCard from "./ServiceRequestCard";
import { NEW_AUCTION_ITEMS, CLOSING_AUCTION_ITEMS } from "./AuctionSection";
import { SERVICE_REQUEST_ITEMS } from "./NewServiceSection";
import { SERVICE_MENU_ITEMS, HOT_ITEMS } from "./ServiceMenuSection";

const SEARCH_TAGS = ["#마감임박경매", "#청소견적", "#전자기기", "#이사도움", "#직거래"];

export default function MobileLandingSections() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("new");

  const runSearch = (value) => {
    const trimmed = value.trim();
    if (trimmed) navigate(`/search/${encodeURIComponent(trimmed)}`);
  };

  const auctionItems = activeTab === "new" ? NEW_AUCTION_ITEMS : CLOSING_AUCTION_ITEMS;

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

          {/* 검색 태그 */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-start">
            {SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => { setKeyword(tag.replace(/^#/, "")); runSearch(tag.replace(/^#/, "")); }}
                className="shrink-0 rounded-full bg-white/20 border border-white/40 px-3 py-1.5 text-[13px] text-white backdrop-blur-sm"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* 검색 입력 */}
          <div className="mt-3 flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-md">
            <span className="shrink-0 text-[14px] font-bold text-black">통합검색</span>
            <span className="text-[#b1b1b1] text-[12px]">▼</span>
            <div className="mx-1 h-4 w-px bg-[#d9d9d9]" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(keyword); }}
              placeholder="검색어를 입력하세요."
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#b1b1b1]"
            />
            <button type="button" onClick={() => runSearch(keyword)} aria-label="검색">
              <img src={assets.searchIcon} alt="검색" className="size-[20px] object-contain" />
            </button>
          </div>

          {/* 슬라이드 배너 */}
          <div className="mt-4 relative">
            <div className="relative overflow-hidden rounded-[20px] bg-white shadow-[0px_4px_10px_0px_rgba(0,0,0,0.2)]">
              {/* 배경 패턴(슬라이드 이미지) */}
              <img src={assets.slide} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none" />
              {/* 배너 콘텐츠 */}
              <div className="relative z-10 flex items-center gap-2 px-5 py-5">
                <div className="flex-1 text-left">
                  <p className="font-bold text-[20px] text-black leading-snug tracking-tight">
                    서비스 요청만 해도<br />쿠폰 100% 당첨
                  </p>
                  <div className="h-[7px] bg-[#ffd900] w-[110px] mt-1 mb-2" />
                  <p className="text-[12px] text-black">회원가입시에 최대 쿠폰 10,000원 증정</p>
                  <button
                    type="button"
                    className="mt-3 bg-[#0064ff] text-white font-bold text-[14px] px-5 py-[9px] rounded-[10px] cursor-pointer border-none"
                  >
                    응모하기
                  </button>
                </div>
                <img src={assets.giftVoucher} alt="기프트 쿠폰" className="w-[110px] object-contain shrink-0" />
              </div>
            </div>
            {/* 좌우 화살표 */}
            <button
              type="button"
              className="absolute -left-1 top-1/2 -translate-y-1/2 flex size-[32px] items-center justify-center text-[28px] text-[#7b8290] font-light leading-none bg-transparent border-none cursor-pointer"
              aria-label="이전"
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute -right-1 top-1/2 -translate-y-1/2 flex size-[32px] items-center justify-center text-[28px] text-[#7b8290] font-light leading-none bg-transparent border-none cursor-pointer"
              aria-label="다음"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* 서비스 메뉴 아이콘 (가로 스크롤) */}
      <section className="px-4">
        <h2 className="mb-3 text-[18px] font-bold">SERVICE MENU</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SERVICE_MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate("/service")}
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
            <button type="button" onClick={() => navigate("/auction")} className="text-[12px] text-white/90">더보기 ›</button>
          </div>
          <ul className="divide-y divide-[#f0f0f0] bg-white">
            {HOT_ITEMS.map((item, i) => (
              <li key={item.rank} className="flex items-center gap-3 px-4 py-3">
                <span className={`flex size-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${i === 0 ? "bg-[#0064ff]" : "bg-[#c9d3e0]"}`}>
                  {item.rank}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px]">{item.name}</span>
                <span className="shrink-0 text-[14px] font-bold">{item.price}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 경매 (탭 + 가로 스와이프 카드) */}
      <section>
        <div className="mb-3 flex gap-2 px-4">
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
            마감임박 경매
          </button>
        </div>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {auctionItems.map((item) => (
            <div key={item.id} className="snap-start">
              <AuctionCard item={item} onClick={() => navigate(`/auction/${item.id}`)} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={() => navigate("/auction")} className="rounded-full border border-[#ebebeb] bg-[#f3f5fa] px-5 py-2 text-[13px] text-[#4e4e4e]">
            더보기 ›
          </button>
        </div>
      </section>

      {/* 신규 서비스 요청 (가로 스와이프 카드) */}
      <section
        className="relative overflow-hidden py-8"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)), url(${assets.glennCarstensPeters})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <h2 className="mb-3 px-4 text-[18px] font-bold text-white">신규 서비스 요청</h2>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SERVICE_REQUEST_ITEMS.map((item) => (
            <div key={item.id} className="snap-start">
              <ServiceRequestCard item={item} onClick={() => navigate(`/service/${item.id}`)} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={() => navigate("/service")} className="rounded-full border border-white/40 px-5 py-2 text-[13px] text-white">
            더보기 ›
          </button>
        </div>
      </section>
    </div>
  );
}
