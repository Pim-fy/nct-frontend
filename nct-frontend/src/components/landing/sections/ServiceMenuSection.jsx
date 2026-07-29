import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import MoreButton from "./MoreButton";
import { SERVICE_MENU_ITEMS } from './serviceMenuData';

const ITEM_HEIGHT = 50;
const PAGE_SIZE   = 5;

const STAGGER   = 120;  // 행 간 딜레이 (ms)
const HALF_FLIP = 350;  // 반바퀴 플립 시간 (ms)
const INTERVAL  = 4500; // 자동 전환 주기 (ms)

const idleStyle = { transform: 'perspective(600px) rotateX(0deg)', transition: 'none' };

export default function ServiceMenuSection({ hotItems, isError, isLoading }) {
  const navigate = useNavigate();
  const [rowPages,     setRowPages]     = useState(Array(PAGE_SIZE).fill(0));
  const [rowStyles,    setRowStyles]    = useState(Array(PAGE_SIZE).fill(idleStyle));
  const [hoveredRow,   setHoveredRow]   = useState(null);
  const [currentPage,  setCurrentPage]  = useState(0);
  const busyRef = useRef(false);
  const pageCount = Math.max(1, Math.ceil(hotItems.length / PAGE_SIZE));
  const visiblePage = Math.min(currentPage, pageCount - 1);

  const goToPage = useCallback((targetPage) => {
    if (busyRef.current || targetPage < 0 || targetPage >= pageCount) return;
    busyRef.current = true;
    setCurrentPage(targetPage);

    Array.from({ length: PAGE_SIZE }).forEach((_, row) => {
      const t = row * STAGGER;

      setTimeout(() => {
        setRowStyles(prev => {
          const next = [...prev];
          next[row] = { transform: 'perspective(600px) rotateX(-90deg)', transition: `transform ${HALF_FLIP}ms ease-in` };
          return next;
        });
      }, t);

      setTimeout(() => {
        setRowPages(prev => { const n = [...prev]; n[row] = targetPage; return n; });
        setRowStyles(prev => {
          const next = [...prev];
          next[row] = { transform: 'perspective(600px) rotateX(90deg)', transition: 'none' };
          return next;
        });
        requestAnimationFrame(() => requestAnimationFrame(() => {
          setRowStyles(prev => {
            const next = [...prev];
            next[row] = { transform: 'perspective(600px) rotateX(0deg)', transition: `transform ${HALF_FLIP}ms ease-out` };
            return next;
          });
        }));
      }, t + HALF_FLIP);
    });

    const total = (PAGE_SIZE - 1) * STAGGER + HALF_FLIP * 2;
    setTimeout(() => { busyRef.current = false; }, total + 50);
  }, [pageCount]);

  useEffect(() => {
    if (pageCount <= 1) return undefined;
    const id = setInterval(() => {
      goToPage((visiblePage + 1) % pageCount);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [goToPage, pageCount, visiblePage]);

  return (
    <section className="absolute contents left-[167px] top-[867px]" data-name="SECTION_2(서비스메뉴/HOTITEM)">
      {/* 서비스 아이콘 메뉴 */}
      <div className="absolute contents left-[167px] top-[1015px]" data-name="서비스_icon">
        <div className="absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[0] left-[167px] text-[22px] text-black top-[1060px] whitespace-nowrap">
          <p className="leading-[normal] mb-0">SERVICE</p>
          <p className="leading-[normal]">MENU</p>
        </div>

        {SERVICE_MENU_ITEMS.map((item) => (
          <div key={item.label} className="absolute contents" style={{ left: item.left, top: 1090 }}>
            <button
              type="button"
              onClick={() => navigate(`/service?category=${encodeURIComponent(item.category)}`)}
              className="absolute cursor-pointer bg-white border border-[rgba(0,0,0,0.1)] border-solid rounded-[20px] size-[150px] hover:shadow-md transition-shadow"
              style={{ left: item.left, top: 1015 }}
            />
            <div className="absolute pointer-events-none" style={{ left: item.imgLeft, top: item.imgTop, width: item.imgW, height: item.imgH }}>
              <img alt={item.label} className="absolute inset-0 max-w-none object-cover size-full" src={item.image} />
            </div>
            <p
              className="-translate-x-1/2 absolute font-['Noto_Sans_KR:Medium'] font-medium leading-[normal] text-[16px] text-black text-center top-[1116px] tracking-[-1.28px] whitespace-nowrap pointer-events-none"
              style={{ left: item.left + 75 }}
            >
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* HOT ITEM 랭킹 카드 */}
      <div className="absolute contents left-[1340px] top-[867px]" data-name="HOT ITEM">
        <div className="absolute bg-white h-[367px] left-[1340px] rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.15)] top-[867px] w-[426px]" />
        <div className="absolute bg-[#0064ff] h-[73px] left-[1340px] rounded-tl-[20px] rounded-tr-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.15)] top-[867px] w-[426px]" />
        <p className="absolute font-['Noto_Sans_KR:Black'] font-black leading-[normal] left-[1363px] text-[25px] text-white top-[889px] tracking-[5px] whitespace-nowrap">
          HOT ITEM
        </p>
        <MoreButton left={1651} top={881} variant="dark" />

        {/* 행별 개별 플립 리스트 */}
        <div
          className="absolute"
          style={{ left: 1340, top: 940, width: 426, height: PAGE_SIZE * ITEM_HEIGHT }}
        >
          {Array.from({ length: PAGE_SIZE }).map((_, rowIdx) => {
            const itemPage  = Math.min(rowPages[rowIdx], pageCount - 1);
            const item      = hotItems[itemPage * PAGE_SIZE + rowIdx];
            const isHovered = hoveredRow === rowIdx;
            if (!item) {
              return <div className="border-b border-[#ebebeb]" key={rowIdx} style={{ height: ITEM_HEIGHT }} />;
            }
            return (
              <Link
                key={rowIdx}
                to={`/auction/${item.id}`}
                className="flex items-center border-b border-[#ebebeb] px-5 no-underline"
                style={{ height: ITEM_HEIGHT, ...rowStyles[rowIdx], transformOrigin: 'center center', display: 'flex' }}
                onMouseEnter={() => setHoveredRow(rowIdx)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* 순위 원형 배지 — 기본 #E6F0FF, 호버 시 #0064ff */}
                <div
                  className="flex shrink-0 size-[29px] items-center justify-center rounded-full transition-colors duration-200"
                  style={{ backgroundColor: isHovered ? "#0064ff" : "#E6F0FF" }}
                >
                  <span
                    className="font-['Noto_Sans_KR:Bold'] font-bold text-[13px] tracking-[-0.65px] transition-colors duration-200"
                    style={{ color: isHovered ? "#fff" : "#0064ff" }}
                  >
                    {item.rank}
                  </span>
                </div>

                {/* 상품명 */}
                <span className="flex-1 min-w-0 truncate font-['Noto_Sans_KR:Regular'] font-normal text-[16px] text-black tracking-[-0.8px] ml-[10px]">
                  {item.name}
                </span>

                {/* 가격 */}
                <span className="shrink-0 font-['Noto_Sans_KR:Bold'] font-bold text-[16px] text-black tracking-[-0.8px]">
                  {item.price}
                </span>
              </Link>
            );
          })}
          {(isLoading || isError || hotItems.length === 0) && (
            <p className="absolute inset-0 grid place-items-center bg-white/90 px-6 text-center text-[16px] text-[#666]">
              {isLoading
                ? '인기 경매를 불러오는 중입니다.'
                : isError
                  ? '인기 경매를 불러오지 못했습니다.'
                  : '표시할 인기 경매가 없습니다.'}
            </p>
          )}
        </div>

        {/* 페이지 인디케이터 */}
        <div
          className="absolute flex gap-[6px] items-center"
          style={{ left: 1340 + 426 / 2 - 11, top: 867 + 367 - 18 }}
        >
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToPage(i)}
              className="cursor-pointer rounded-full transition-all duration-300"
              style={{
                width:  i === visiblePage ? 16 : 8,
                height: 8,
                backgroundColor: i === visiblePage ? "#0064ff" : "#c9d3e0",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
