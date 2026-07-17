import React from "react";
import { assets } from "./assets";
import ArrowIcon from "./ArrowIcon";
import MoreButton from "./MoreButton";
import AuctionCard from "./AuctionCard";

const AUCTION_ITEMS = [
  { left: 168, image: assets.image2, badge: "N", dday: "D - 6", bids: "입찰 3회", name: "미니 보온 텀블러 세트", price: "28,000원", original: "157,000원" },
  { left: 502, image: assets.image4, badge: "N", dday: null, bids: "입찰 38회", name: "소니 미러리스 바디", price: "43,000원", original: "157,000원" },
  { left: 817, image: assets.image3, badge: "N", dday: "D - 1", bids: "입찰 62회", name: "맥북 에어 M2", price: "810,000원", original: "157,000원" },
  { left: 1132, image: assets.image5, badge: "N", dday: null, bids: "입찰 128회", name: "메타 퀘스트 3S VR 헤드셋", price: "420,000원", original: "157,000원" },
  { left: 1473, image: assets.image6, badge: "N", dday: null, bids: "입찰 12회", name: "LG 워시타워 미니워셔", price: "659,000원", original: "157,000원" },
];

export default function AuctionSection() {
  return (
    <section className="absolute contents left-0 top-[1329px]" data-name="SECTION_3(신규경매/마감임박경매)">
      {/* 탭 메뉴 */}
      <div className="absolute contents left-0 top-[1329px]" data-name="tabmen">
        <div className="absolute h-0 left-0 top-[1361px] w-[1955px]">
          <div className="absolute inset-[-1px_0_0_0]">
            <img alt="" className="block max-w-none size-full" src={assets.divider1} />
          </div>
        </div>
        <button type="button" className="absolute bg-[#0064ff] h-[60px] left-[711px] rounded-[40px] top-[1329px] w-[242px]">
          <span className="absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[normal] left-[80px] text-[25px] text-white top-[15px] tracking-[-2px] whitespace-nowrap">
            신규 경매
          </span>
        </button>
        <button type="button" className="absolute bg-[#ebebeb] h-[60px] left-[969px] rounded-[40px] top-[1329px] w-[242px]">
          <span className="absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[normal] left-[55px] text-[#969696] text-[25px] top-[15px] tracking-[-2px] whitespace-nowrap">
            마감임박 경매
          </span>
        </button>
      </div>

      {/* 경매 카드 리스트 */}
      {AUCTION_ITEMS.map((item) => (
        <AuctionCard key={item.left} item={item} />
      ))}

      <ArrowIcon direction="left" className="left-[111px] top-[1616px]" barClassName="bg-[#434343]" />
      <ArrowIcon direction="right" className="left-[1800px] top-[1616px]" barClassName="bg-[#434343]" />

      <MoreButton left={895} top={1849} variant="light" />
    </section>
  );
}
