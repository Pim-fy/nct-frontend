import React from "react";
import { assets } from "./assets";
import ArrowIcon from "./ArrowIcon";
import MoreButton from "./MoreButton";
import ServiceRequestCard from "./ServiceRequestCard";

const SERVICE_REQUEST_ITEMS = [
  { left: 168, top: 2092, price: "240,000원", title: "초등 수학 주 2회 방문 레슨", meta: "서울 마포구 · 6월 28일 오전 희망", bidLabel: "레슨", quotes: 3, ddayLabel: "마감 D-2" },
  { left: 717, top: 2092, price: "240,000원", title: "초등 수학 주 2회 방문 레슨", meta: "서울 마포구 · 6월 28일 오전 희망", bidLabel: "레슨", quotes: 3, ddayLabel: "마감 D-2" },
  { left: 1266, top: 2092, price: "240,000원", title: "초등 수학 주 2회 방문 레슨", meta: "서울 마포구 · 6월 28일 오전 희망", bidLabel: "레슨", quotes: 3, ddayLabel: "마감 D-2" },
  { left: 168, top: 2281, price: "240,000원", title: "초등 수학 주 2회 방문 레슨", meta: "서울 마포구 · 6월 28일 오전 희망", bidLabel: "레슨", quotes: 3, ddayLabel: "마감 D-2" },
  { left: 717, top: 2281, price: "240,000원", title: "초등 수학 주 2회 방문 레슨", meta: "서울 마포구 · 6월 28일 오전 희망", bidLabel: "레슨", quotes: 3, ddayLabel: "마감 D-2" },
  { left: 1266, top: 2281, price: "240,000원", title: "초등 수학 주 2회 방문 레슨", meta: "서울 마포구 · 6월 28일 오전 희망", bidLabel: "레슨", quotes: 3, ddayLabel: "마감 D-2" },
];

export default function NewServiceSection() {
  return (
    <section className="absolute contents left-0 top-[1978px]" data-name="SECTION_4(신규서비스요청)">
      <div className="absolute bg-[#f5f9ff] h-[684px] left-0 top-[1978px] w-[1920px]" />
      <div className="absolute h-[684px] left-0 top-[1978px] w-[1920px]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[210.37%] left-[-6.02%] max-w-none top-[-44.67%] w-[112.64%]" src={assets.glennCarstensPeters} />
        </div>
      </div>
      <div className="absolute bg-[rgba(0,0,0,0.3)] h-[684px] left-0 top-[1978px] w-[1920px]" />

      <p className="absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[normal] left-[168px] text-[25px] text-white top-[2042px] tracking-[-2px] whitespace-nowrap">
        신규 서비스 요청
      </p>

      {SERVICE_REQUEST_ITEMS.map((item, i) => (
        <ServiceRequestCard key={`${item.left}-${item.top}-${i}`} item={item} />
      ))}

      <ArrowIcon direction="left" className="left-[111px] top-[2271px]" barClassName="bg-white" />
      <ArrowIcon direction="right" className="left-[1800px] top-[2271px]" barClassName="bg-white" />

      <MoreButton left={895} top={2514} variant="dark" />
    </section>
  );
}
