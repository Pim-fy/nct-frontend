import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "./assets";
import ArrowIcon from "./ArrowIcon";
import MoreButton from "./MoreButton";
import ServiceRequestCard from "./ServiceRequestCard";

// TODO: 서비스요청(F-SVC) 목록 API가 준비되면 실제 조회 결과로 교체한다.
// 지금은 정적 목업이라, 3열×2행 그리드를 "페이지" 단위로 슬라이드시키는 걸 보여주려고
// 12건(2페이지)을 채워뒀다.
export const SERVICE_REQUEST_ITEMS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  price: "240,000원",
  title: "초등 수학 주 2회 방문 레슨",
  meta: "서울 마포구 · 6월 28일 오전 희망",
  bidLabel: "레슨",
  quotes: 3,
  ddayLabel: "마감 D-2",
  key: i,
}));

const PAGE_SIZE = 6; // 3열 x 2행
const VIEWPORT_LEFT = 168;
const VIEWPORT_WIDTH = 1599; // 501*3 + 48*2 (카드 3열 + 열 간격 2개)

export default function NewServiceSection() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(SERVICE_REQUEST_ITEMS.length / PAGE_SIZE);

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  return (
    <section className="absolute contents left-0 top-[1903px]" data-name="SECTION_4(신규서비스요청)">
      <div className="absolute bg-[#f5f9ff] h-[684px] left-0 top-[1903px] w-[1920px]" />
      <div className="absolute h-[684px] left-0 top-[1903px] w-[1920px]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[210.37%] left-[-6.02%] max-w-none top-[-44.67%] w-[112.64%]" src={assets.glennCarstensPeters} />
        </div>
      </div>
      <div className="absolute bg-[rgba(0,0,0,0.3)] h-[684px] left-0 top-[1903px] w-[1920px]" />

      <p className="absolute font-bold leading-[normal] left-[168px] text-[25px] text-white top-[1967px] tracking-[-2px] whitespace-nowrap">
        신규 서비스 요청
      </p>

      {/* 서비스요청 카드 캐러셀 (페이지 단위 슬라이드) */}
      <div className="absolute top-[2017px] overflow-hidden" style={{ left: VIEWPORT_LEFT, width: VIEWPORT_WIDTH }}>
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${-page * VIEWPORT_WIDTH}px)` }}
        >
          {Array.from({ length: totalPages }, (_, p) => (
            <div
              key={p}
              className="grid shrink-0 grid-cols-3 gap-x-[48px] gap-y-[20px]"
              style={{ width: VIEWPORT_WIDTH }}
            >
              {SERVICE_REQUEST_ITEMS.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE).map((item) => (
                <ServiceRequestCard key={item.key} item={item} onClick={() => navigate(`/service/${item.id}`)} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <ArrowIcon direction="left" className="left-[111px] top-[2196px]" barClassName="bg-white" onClick={goPrev} disabled={page === 0} />
      <ArrowIcon direction="right" className="left-[1800px] top-[2196px]" barClassName="bg-white" onClick={goNext} disabled={page >= totalPages - 1} />

      <MoreButton left={895} top={2439} variant="dark" onClick={() => navigate("/service")} />
    </section>
  );
}
