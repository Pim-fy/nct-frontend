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
    <div className="flex flex-col gap-8 py-6 lg:hidden">
      {/* 히어로: 타이틀 + 검색 + 태그 */}
      <section className="px-4 text-center">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
          <span className="text-[#474baa]">실시간 경매</span>와<br />
          <span className="text-[#00ccd0]">생활 서비스</span>를 한 화면에서
        </h1>

        <div className="mt-5 flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-4 py-3 shadow-sm">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(keyword); }}
            placeholder="검색어를 입력하세요."
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#b1b1b1]"
          />
          <button type="button" onClick={() => runSearch(keyword)} aria-label="검색">
            <Search size={18} className="text-[#0064ff]" />
          </button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SEARCH_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => { setKeyword(tag.replace(/^#/, "")); runSearch(tag.replace(/^#/, "")); }}
              className="shrink-0 rounded-full bg-[#f5f5f4] px-3 py-1.5 text-[13px] text-[#4e4e4e]"
            >
              {tag}
            </button>
          ))}
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
              onClick={() => navigate("/services")}
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
              <ServiceRequestCard item={item} onClick={() => navigate(`/services/${item.id}`)} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-center">
          <button type="button" onClick={() => navigate("/services")} className="rounded-full border border-white/40 px-5 py-2 text-[13px] text-white">
            더보기 ›
          </button>
        </div>
      </section>
    </div>
  );
}
