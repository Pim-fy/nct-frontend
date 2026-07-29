import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "./assets";
import ArrowIcon from "./ArrowIcon";
import arrowWhite from "@assets/img/arrowWhite.png";
import MoreButton from "./MoreButton";
import ServiceRequestCard from "./ServiceRequestCard";

const PAGE_SIZE = 6; // 3열 x 2행
const VIEWPORT_LEFT = 168;
const VIEWPORT_WIDTH = 1599; // 501*3 + 48*2 (카드 3열 + 열 간격 2개)

export default function NewServiceSection({ isError, isLoading, items }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

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
        {isLoading && <p className="grid h-[358px] place-items-center text-[18px] text-white">서비스 요청을 불러오는 중입니다.</p>}
        {!isLoading && isError && <p className="grid h-[358px] place-items-center text-[18px] text-white">서비스 요청 조회 API 연결을 기다리고 있습니다.</p>}
        {!isLoading && !isError && items.length === 0 && <p className="grid h-[358px] place-items-center text-[18px] text-white">표시할 서비스 요청이 없습니다.</p>}
        {!isLoading && !isError && items.length > 0 && (
          <div
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(${-page * VIEWPORT_WIDTH}px)` }}
          >
            {Array.from({ length: totalPages }, (_, pageIndex) => (
              <div
                key={pageIndex}
                className="grid shrink-0 grid-cols-3 gap-x-[48px] gap-y-[20px]"
                style={{ width: VIEWPORT_WIDTH }}
              >
                {items.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE).map((item) => (
                  <ServiceRequestCard key={item.id} item={item} onClick={() => navigate(`/service-requests/${item.id}`)} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <ArrowIcon direction="left" className="left-[111px] top-[2196px]" imgSrc={arrowWhite} onClick={goPrev} disabled={page === 0} />
      <ArrowIcon direction="right" className="left-[1800px] top-[2196px]" imgSrc={arrowWhite} onClick={goNext} disabled={page >= totalPages - 1} />

      <MoreButton left={895} top={2439} variant="dark" onClick={() => navigate("/service")} />
    </section>
  );
}
