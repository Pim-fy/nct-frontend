import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { SERVICE_MENU_ITEMS } from './serviceMenuData';

const ITEM_HEIGHT    = 50;
const PAGE_SIZE      = 5;
const STAGGER        = 120;
const HALF_FLIP      = 350;
const INTERVAL       = 4500;
const HOT_W          = 426;
const HOT_HEADER_H   = 73;
const HOT_LIST_H     = PAGE_SIZE * ITEM_HEIGHT; // 250
const HOT_INDICATOR_H = 40;
const idleStyle      = { transform: "perspective(600px) rotateX(0deg)", transition: "none" };

export default function ServiceMenuSection({ hotItems = [], isError, isLoading }) {
  const navigate = useNavigate();

  const [rowPages,    setRowPages]    = useState(Array(PAGE_SIZE).fill(0));
  const [rowStyles,   setRowStyles]   = useState(Array(PAGE_SIZE).fill(idleStyle));
  const [hoveredRow,  setHoveredRow]  = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const busyRef    = useRef(false);
  const pageCount  = Math.max(1, Math.ceil(hotItems.length / PAGE_SIZE));
  const visiblePage = Math.min(currentPage, pageCount - 1);

  const goToPage = useCallback((targetPage) => {
    if (busyRef.current || targetPage < 0 || targetPage >= pageCount) return;
    busyRef.current = true;
    setCurrentPage(targetPage);
    Array.from({ length: PAGE_SIZE }).forEach((_, row) => {
      const t = row * STAGGER;
      setTimeout(() => {
        setRowStyles(prev => { const n = [...prev]; n[row] = { transform: "perspective(600px) rotateX(-90deg)", transition: `transform ${HALF_FLIP}ms ease-in` }; return n; });
      }, t);
      setTimeout(() => {
        setRowPages(prev => { const n = [...prev]; n[row] = targetPage; return n; });
        setRowStyles(prev => { const n = [...prev]; n[row] = { transform: "perspective(600px) rotateX(90deg)", transition: "none" }; return n; });
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setRowStyles(prev => { const n = [...prev]; n[row] = { transform: "perspective(600px) rotateX(0deg)", transition: `transform ${HALF_FLIP}ms ease-out` }; return n; });
        }));
      }, t + HALF_FLIP);
    });
    setTimeout(() => { busyRef.current = false; }, (PAGE_SIZE - 1) * STAGGER + HALF_FLIP * 2 + 50);
  }, [pageCount]);

  useEffect(() => {
    if (pageCount <= 1) return undefined;
    const id = setInterval(() => goToPage((visiblePage + 1) % pageCount), INTERVAL);
    return () => clearInterval(id);
  }, [goToPage, pageCount, visiblePage]);

  return (
    <section className="bg-white py-10">
      <div className="max-w-[1600px] mx-auto px-8 flex items-start gap-8">

        {/* 담당자 7 통합: 서비스 카테고리는 검색이 아니라 견적 요청서 작성 진입점입니다. */}
        <div className="flex items-center gap-8 flex-1 min-w-0 pt-4">
          <h2 className="text-[22px] font-bold text-black leading-tight shrink-0">
            SERVICE<br />MENU
          </h2>
          <div className="flex gap-4">
            {SERVICE_MENU_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate('/service-requests/new')}
                className="flex flex-col items-center justify-center bg-white border border-[rgba(0,0,0,0.1)] rounded-[20px] size-[150px] hover:shadow-md transition-shadow shrink-0"
              >
                <img src={item.image} alt={item.label} className="w-[53px] h-[47px] object-contain mb-2" />
                <span className="text-[16px] font-medium text-black tracking-[-1.28px]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* HOT ITEM 카드: -mt-[73px]로 헤더를 다크 영역 안으로 올림 */}
        <div className="shrink-0 relative z-10 rounded-[20px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)]" style={{ width: HOT_W, marginTop: -(HOT_HEADER_H + 40) }}>

          {/* 헤더 */}
          <div
            className="bg-[#0064ff] rounded-tl-[20px] rounded-tr-[20px] flex items-center justify-between px-6"
            style={{ height: HOT_HEADER_H }}
          >
            <span className="text-[25px] font-black text-white tracking-[5px]">HOT ITEM</span>
            <button
              type="button"
              onClick={() => navigate("/auction?sort=popular")}
              className="flex items-center gap-1 text-[14px] text-white/90 hover:text-white cursor-pointer"
            >
              더보기 <ChevronRight size={14} />
            </button>
          </div>

          {/* 리스트 */}
          <div className="bg-white" style={{ height: HOT_LIST_H }}>
            {(isLoading || isError || hotItems.length === 0) ? (
              <p className="grid place-items-center text-[16px] text-[#666] h-full">
                {isLoading ? "인기 경매를 불러오는 중입니다." : isError ? "인기 경매를 불러오지 못했습니다." : "표시할 인기 경매가 없습니다."}
              </p>
            ) : (
              Array.from({ length: PAGE_SIZE }).map((_, rowIdx) => {
                const itemPage  = Math.min(rowPages[rowIdx], pageCount - 1);
                const item      = hotItems[itemPage * PAGE_SIZE + rowIdx];
                const isHovered = hoveredRow === rowIdx;
                if (!item) return <div key={rowIdx} className="border-b border-[#ebebeb]" style={{ height: ITEM_HEIGHT }} />;
                return (
                  <Link
                    key={rowIdx}
                    to={`/auction/${item.id}`}
                    className="flex items-center border-b border-[#ebebeb] px-5 no-underline"
                    style={{ height: ITEM_HEIGHT, ...rowStyles[rowIdx], transformOrigin: "center center", display: "flex" }}
                    onMouseEnter={() => setHoveredRow(rowIdx)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <div
                      className="flex shrink-0 size-[29px] items-center justify-center rounded-full transition-colors duration-200"
                      style={{ backgroundColor: isHovered ? "#0064ff" : "#E6F0FF" }}
                    >
                      <span className="font-bold text-[13px] tracking-[-0.65px] transition-colors duration-200" style={{ color: isHovered ? "#fff" : "#0064ff" }}>
                        {item.rank}
                      </span>
                    </div>
                    <span className="flex-1 min-w-0 truncate text-[16px] text-black tracking-[-0.8px] ml-[10px]">{item.name}</span>
                    <span className="shrink-0 font-bold text-[16px] text-black tracking-[-0.8px]">{item.price}</span>
                  </Link>
                );
              })
            )}
          </div>

          {/* 인디케이터 */}
          {pageCount > 1 ? (
            <div
              className="flex justify-center gap-[6px] items-center bg-white rounded-bl-[20px] rounded-br-[20px]"
              style={{ height: HOT_INDICATOR_H }}
            >
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToPage(i)}
                  className="cursor-pointer rounded-full transition-all duration-300"
                  style={{ width: i === visiblePage ? 16 : 8, height: 8, backgroundColor: i === visiblePage ? "#0064ff" : "#c9d3e0" }}
                />
              ))}
            </div>
          ) : (
            <div
              className="bg-white rounded-bl-[20px] rounded-br-[20px]"
              style={{ height: HOT_INDICATOR_H }}
            />
          )}
        </div>

      </div>
    </section>
  );
}
