import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { assets } from "./assets";
import ServiceRequestCard from "./ServiceRequestCard";

const PAGE_SIZE = 6;

export default function NewServiceSection({ isError, isLoading, items }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const totalPages  = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const visiblePage = Math.min(page, totalPages - 1);

  const goPrev = () => setPage(Math.max(0, visiblePage - 1));
  const goNext = () => setPage(Math.min(totalPages - 1, visiblePage + 1));

  const visibleItems = items.slice(visiblePage * PAGE_SIZE, visiblePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="relative overflow-hidden py-16">
      {/* 배경 */}
      <div className="absolute inset-0">
        <img
          src={assets.glennCarstensPeters}
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[25px] font-bold text-white tracking-[-2px]">신규 서비스 요청</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={visiblePage === 0}
              aria-label="이전"
              className="flex items-center justify-center size-[40px] rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={visiblePage >= totalPages - 1}
              aria-label="다음"
              className="flex items-center justify-center size-[40px] rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* 카드 그리드 */}
        {isLoading && <p className="grid h-[358px] place-items-center text-[18px] text-white">서비스 요청을 불러오는 중입니다.</p>}
        {!isLoading && isError && <p className="grid h-[358px] place-items-center text-[18px] text-white">서비스 요청을 불러오지 못했습니다.</p>}
        {!isLoading && !isError && items.length === 0 && <p className="grid h-[358px] place-items-center text-[18px] text-white">표시할 서비스 요청이 없습니다.</p>}
        {!isLoading && !isError && items.length > 0 && (
          <div className="grid grid-cols-3 gap-x-12 gap-y-5">
            {visibleItems.map((item) => (
              <ServiceRequestCard key={item.id} item={item} onClick={() => navigate(`/service-requests/${item.id}`)} />
            ))}
          </div>
        )}

        {/* 더보기 */}
        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={() => navigate("/service")}
            className="h-[45px] w-[100px] rounded-[40px] bg-transparent border border-white/60 text-[14px] text-white hover:bg-white/10 transition-colors"
          >
            더보기
          </button>
        </div>
      </div>
    </section>
  );
}
