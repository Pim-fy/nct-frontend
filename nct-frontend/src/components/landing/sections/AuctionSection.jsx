import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ArrowIcon from "./ArrowIcon";
import arrowDark from "@assets/img/arrowDark.png";
import MoreButton from "./MoreButton";
import AuctionCard from "./AuctionCard";

const VIEWPORT_LEFT = 168;
const VIEWPORT_WIDTH = 1584;
const CARD_STEP = 295 + 24; // 카드 너비 + gap-[24px]
const VISIBLE_COUNT = Math.floor(VIEWPORT_WIDTH / CARD_STEP);

export default function AuctionSection({ closingItems, isError, isLoading, newItems }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("new");
  const [slideIndex, setSlideIndex] = useState(0);

  const items = activeTab === "new" ? newItems : closingItems;
  const maxIndex = Math.max(0, items.length - VISIBLE_COUNT);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSlideIndex(0);
  };

  const goPrev = () => setSlideIndex((i) => Math.max(0, i - 1));
  const goNext = () => setSlideIndex((i) => Math.min(maxIndex, i + 1));

  return (
    <section className="absolute contents left-0 top-[1254px]" data-name="SECTION_3(신규경매/마감임박경매)">
      {/* 탭 메뉴 */}
      <div className="absolute contents left-0 top-[1254px]" data-name="tabmen">
        <div className="absolute h-0 left-0 top-[1286px] w-[1955px]">
          <div className="absolute inset-[-1px_0_0_0] border-t border-[#e0e0e0]" />
        </div>
        <button
          type="button"
          onClick={() => handleTabChange("new")}
          className={`absolute h-[60px] left-[711px] rounded-[40px] top-[1254px] w-[242px] cursor-pointer transition-colors ${
            activeTab === "new" ? "bg-[#0064ff]" : "bg-[#ebebeb]"
          }`}
        >
          <span
            className={`absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[normal] left-[80px] text-[25px] top-[15px] tracking-[-2px] whitespace-nowrap ${
              activeTab === "new" ? "text-white" : "text-[#969696]"
            }`}
          >
            신규 경매
          </span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("closing")}
          className={`absolute h-[60px] left-[969px] rounded-[40px] top-[1254px] w-[242px] cursor-pointer transition-colors ${
            activeTab === "closing" ? "bg-[#0064ff]" : "bg-[#ebebeb]"
          }`}
        >
          <span
            className={`absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[normal] left-[55px] text-[25px] top-[15px] tracking-[-2px] whitespace-nowrap ${
              activeTab === "closing" ? "text-white" : "text-[#969696]"
            }`}
          >
            마감임박 경매
          </span>
        </button>
      </div>

      <div className="absolute top-[1387px] overflow-x-hidden overflow-y-visible" style={{ left: VIEWPORT_LEFT, width: VIEWPORT_WIDTH }}>
        {isLoading && <p className="grid h-[373px] place-items-center text-[18px] text-[#666]">경매를 불러오는 중입니다.</p>}
        {!isLoading && isError && <p className="grid h-[373px] place-items-center text-[18px] text-[#9b2c2c]">경매를 불러오지 못했습니다.</p>}
        {!isLoading && !isError && items.length === 0 && <p className="grid h-[373px] place-items-center text-[18px] text-[#666]">표시할 경매가 없습니다.</p>}
        {!isLoading && !isError && items.length > 0 && (
          <div
            className="flex gap-[24px] transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${-slideIndex * CARD_STEP}px)` }}
          >
            {items.map((item) => (
              <AuctionCard key={`${activeTab}-${item.id}`} item={item} onClick={() => navigate(`/auction/${item.id}`)} />
            ))}
          </div>
        )}
      </div>

      <ArrowIcon direction="left" className="left-[111px] top-[1541px]" imgSrc={arrowDark} onClick={goPrev} disabled={slideIndex === 0} />
      <ArrowIcon direction="right" className="left-[1800px] top-[1541px]" imgSrc={arrowDark} onClick={goNext} disabled={slideIndex >= maxIndex} />

      <MoreButton left={895} top={1774} variant="light" onClick={() => navigate("/auction")} />
    </section>
  );
}
