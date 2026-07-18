import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "./assets";
import ArrowIcon from "./ArrowIcon";
import MoreButton from "./MoreButton";
import AuctionCard from "./AuctionCard";

// TODO: 경매(F-AUC) 목록 API가 준비되면 탭별로 실제 조회 결과로 교체한다.
// 지금은 정적 목업이라 "신규 경매"/"마감임박 경매" 탭에 같은 상품군을 다른 순서로 채워
// 캐러셀(슬라이드) 동작을 확인할 수 있게 8건씩 구성했다.
const BASE_ITEMS = [
  { id: 1, image: assets.image2, badge: "N", dday: "D - 6", bids: "입찰 3회", name: "미니 보온 텀블러 세트", price: "28,000원", original: "157,000원" },
  { id: 2, image: assets.image4, badge: "N", dday: null, bids: "입찰 38회", name: "소니 미러리스 바디", price: "43,000원", original: "157,000원" },
  { id: 3, image: assets.image3, badge: "N", dday: "D - 1", bids: "입찰 62회", name: "맥북 에어 M2", price: "810,000원", original: "157,000원" },
  { id: 4, image: assets.image5, badge: "N", dday: null, urgent: true, bids: "입찰 128회", name: "메타 퀘스트 3S VR 헤드셋", price: "420,000원", original: "157,000원" },
  { id: 5, image: assets.image6, badge: "N", dday: null, urgent: true, bids: "입찰 12회", name: "LG 워시타워 미니워셔", price: "659,000원", original: "157,000원" },
  { id: 6, image: assets.image2, badge: "N", dday: "D - 3", bids: "입찰 45회", name: "GIANT 카본 로드바이크", price: "1,250,000원", original: "1,890,000원" },
  { id: 7, image: assets.image4, badge: "N", dday: null, urgent: true, bids: "입찰 8회", name: "인바디 체성분 분석기", price: "980,000원", original: "1,200,000원" },
  { id: 8, image: assets.image3, badge: "N", dday: "D - 4", bids: "입찰 19회", name: "LG DIOS 전자레인지", price: "189,000원", original: "260,000원" },
];

export const NEW_AUCTION_ITEMS = BASE_ITEMS;
// "마감임박 경매" 탭 - urgent/D-day 상품이 먼저 보이도록 정렬만 다르게 한 목업 데이터.
export const CLOSING_AUCTION_ITEMS = [...BASE_ITEMS].sort((a, b) => {
  const score = (it) => (it.urgent ? 0 : it.dday ? 1 : 2);
  return score(a) - score(b);
});

const VIEWPORT_LEFT = 168;
const VIEWPORT_WIDTH = 1584;
const CARD_STEP = 295 + 24; // 카드 너비 + gap-[24px]
const VISIBLE_COUNT = Math.floor(VIEWPORT_WIDTH / CARD_STEP);

export default function AuctionSection() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("new");
  const [slideIndex, setSlideIndex] = useState(0);

  const items = activeTab === "new" ? NEW_AUCTION_ITEMS : CLOSING_AUCTION_ITEMS;
  const maxIndex = Math.max(0, items.length - VISIBLE_COUNT);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSlideIndex(0);
  };

  const goPrev = () => setSlideIndex((i) => Math.max(0, i - 1));
  const goNext = () => setSlideIndex((i) => Math.min(maxIndex, i + 1));

  return (
    <section className="absolute contents left-0 top-[1329px]" data-name="SECTION_3(신규경매/마감임박경매)">
      {/* 탭 메뉴 */}
      <div className="absolute contents left-0 top-[1329px]" data-name="tabmen">
        <div className="absolute h-0 left-0 top-[1361px] w-[1955px]">
          <div className="absolute inset-[-1px_0_0_0]">
            <img alt="" className="block max-w-none size-full" src={assets.divider1} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleTabChange("new")}
          className={`absolute h-[60px] left-[711px] rounded-[40px] top-[1329px] w-[242px] cursor-pointer transition-colors ${
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
          className={`absolute h-[60px] left-[969px] rounded-[40px] top-[1329px] w-[242px] cursor-pointer transition-colors ${
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

      {/* 경매 카드 캐러셀
          overflow-hidden(양방향 클리핑)을 쓰면 카드 그림자(box-shadow blur 20px)가
          아래쪽에서 잘려 보였다. 슬라이드에 필요한 건 가로 방향 클리핑뿐이라
          overflow-x만 숨기고 overflow-y는 visible로 둬서 그림자가 안 잘리게 한다. */}
      <div className="absolute top-[1462px] overflow-x-hidden overflow-y-visible" style={{ left: VIEWPORT_LEFT, width: VIEWPORT_WIDTH }}>
        <div
          className="flex gap-[24px] transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${-slideIndex * CARD_STEP}px)` }}
        >
          {items.map((item, i) => (
            <AuctionCard key={`${activeTab}-${i}`} item={item} onClick={() => navigate(`/auction/${item.id}`)} />
          ))}
        </div>
      </div>

      <ArrowIcon direction="left" className="left-[111px] top-[1616px]" barClassName="bg-[#434343]" onClick={goPrev} disabled={slideIndex === 0} />
      <ArrowIcon direction="right" className="left-[1800px] top-[1616px]" barClassName="bg-[#434343]" onClick={goNext} disabled={slideIndex >= maxIndex} />

      {/* 더보기 → 경매 리스트 페이지 (F-AUC 담당자가 라우트를 만들기 전까지는 404) */}
      <MoreButton left={895} top={1849} variant="light" onClick={() => navigate("/auction")} />
    </section>
  );
}
