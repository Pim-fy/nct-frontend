import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AuctionCard from "./AuctionCard";

const VISIBLE_COUNT = 5;
const CARD_WIDTH    = 295;
const CARD_GAP      = 24;
const CARD_STEP     = CARD_WIDTH + CARD_GAP;

export default function AuctionSection({
  closingError, closingItems, closingLoading,
  newError, newItems, newLoading,
}) {
  const navigate = useNavigate();
  const [activeTab,   setActiveTab]   = useState("new");
  const [slideIndex,  setSlideIndex]  = useState(0);

  const items     = activeTab === "new" ? newItems     : closingItems;
  const isError   = activeTab === "new" ? newError     : closingError;
  const isLoading = activeTab === "new" ? newLoading   : closingLoading;
  const maxIndex  = Math.max(0, items.length - VISIBLE_COUNT);

  const handleTabChange = (tab) => { setActiveTab(tab); setSlideIndex(0); };
  const goPrev = () => setSlideIndex((i) => Math.max(0, i - 1));
  const goNext = () => setSlideIndex((i) => Math.min(maxIndex, i + 1));

  return (
    <section className="py-12 border-t border-[#e0e0e0]">
      <div className="max-w-[1600px] mx-auto px-8">

        {/* 탭 */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => handleTabChange("new")}
            className={`h-[60px] w-[242px] rounded-[40px] font-bold text-[25px] tracking-[-2px] transition-colors cursor-pointer border-none ${
              activeTab === "new" ? "bg-[#0064ff] text-white" : "bg-[#ebebeb] text-[#969696]"
            }`}
          >
            신규 경매
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("closing")}
            className={`h-[60px] w-[242px] rounded-[40px] font-bold text-[25px] tracking-[-2px] transition-colors cursor-pointer border-none ${
              activeTab === "closing" ? "bg-[#0064ff] text-white" : "bg-[#ebebeb] text-[#969696]"
            }`}
          >
            마감임박 경매
          </button>
        </div>

        {/* 캐러셀: 화살표는 카드 영역 밖 */}
        <div className="relative">
          {/* 좌 화살표 */}
          <button
            type="button"
            onClick={goPrev}
            disabled={slideIndex === 0}
            aria-label="이전"
            className="absolute left-[-52px] top-1/2 -translate-y-1/2 flex items-center justify-center size-[44px] rounded-full border border-[#e0e0e0] bg-white hover:bg-[#f3f5fa] disabled:opacity-30 disabled:cursor-not-allowed transition-colors z-10"
          >
            <ChevronLeft size={22} />
          </button>

          {/* 카드 영역 */}
          <div className="overflow-hidden">
            {isLoading && (
              <p className="grid h-[373px] place-items-center text-[18px] text-[#666]">경매를 불러오는 중입니다.</p>
            )}
            {!isLoading && isError && (
              <p className="grid h-[373px] place-items-center text-[18px] text-[#9b2c2c]">경매를 불러오지 못했습니다.</p>
            )}
            {!isLoading && !isError && items.length === 0 && (
              <p className="grid h-[373px] place-items-center text-[18px] text-[#666]">표시할 경매가 없습니다.</p>
            )}
            {!isLoading && !isError && items.length > 0 && (
              <div
                className="flex gap-[24px] transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${-slideIndex * CARD_STEP}px)` }}
              >
                {items.map((item) => (
                  <AuctionCard
                    key={`${activeTab}-${item.id}`}
                    item={item}
                    onClick={() => navigate(`/auction/${item.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 우 화살표 */}
          <button
            type="button"
            onClick={goNext}
            disabled={slideIndex >= maxIndex}
            aria-label="다음"
            className="absolute right-[-52px] top-1/2 -translate-y-1/2 flex items-center justify-center size-[44px] rounded-full border border-[#e0e0e0] bg-white hover:bg-[#f3f5fa] disabled:opacity-30 disabled:cursor-not-allowed transition-colors z-10"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* 더보기 */}
        <div className="flex justify-center mt-8">
          <button
            type="button"
            onClick={() => navigate(activeTab === "new" ? "/auction?sort=latest" : "/auction?sort=deadline&endingSoonOnly=true")}
            className="h-[45px] w-[100px] rounded-[40px] bg-[#f3f5fa] border border-[#ebebeb] text-[14px] text-[#4e4e4e] hover:bg-[#e9edf5] transition-colors"
          >
            더보기
          </button>
        </div>

      </div>
    </section>
  );
}
