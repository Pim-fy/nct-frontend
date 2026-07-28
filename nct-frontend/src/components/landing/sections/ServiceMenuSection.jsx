import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { assets } from "./assets";
import MoreButton from "./MoreButton";

export const SERVICE_MENU_ITEMS = [
  { label: "청소",     left: 322, image: assets.image10, imgLeft: 373, imgTop: 1053, imgW: 53, imgH: 47, category: "청소" },
  { label: "이사",     left: 482, image: assets.image11, imgLeft: 535, imgTop: 1055, imgW: 52, imgH: 42, category: "이사" },
  { label: "설치/수리", left: 642, image: assets.image8,  imgLeft: 696, imgTop: 1054, imgW: 48, imgH: 45, category: "설치/수리" },
  { label: "인테리어", left: 802, image: assets.image9,  imgLeft: 853, imgTop: 1051, imgW: 45, imgH: 50, category: "인테리어" },
  { label: "레슨",     left: 962, image: assets.image7,  imgLeft: 1007, imgTop: 1052, imgW: 57, imgH: 49, category: "레슨" },
];

export const HOT_ITEMS = [
  { rank: 1,  name: "메타 퀘스트 3S VR",        price: "420,000원" },
  { rank: 2,  name: "인바디 체성분 분석기",       price: "980,000원" },
  { rank: 3,  name: "GIANT 카본 로드바이크",      price: "1,250,000원" },
  { rank: 4,  name: "LG 워시타워 미니워셔",       price: "650,000원" },
  { rank: 5,  name: "LG DIOS 전자레인지",         price: "189,000원" },
  { rank: 6,  name: "다이슨 에어랩 멀티스타일러", price: "550,000원" },
  { rank: 7,  name: "애플 아이패드 에어 M2",      price: "720,000원" },
  { rank: 8,  name: "삼성 갤럭시 버즈3 프로",     price: "180,000원" },
  { rank: 9,  name: "닌텐도 스위치 OLED",         price: "290,000원" },
  { rank: 10, name: "로지텍 MX 마스터 3S",        price: "98,000원" },
];

const ITEM_HEIGHT = 50;
const PAGE_SIZE   = 5;
const PAGE_COUNT  = HOT_ITEMS.length / PAGE_SIZE;

const STAGGER   = 120;  // 행 간 딜레이 (ms)
const HALF_FLIP = 350;  // 반바퀴 플립 시간 (ms)
const INTERVAL  = 4500; // 자동 전환 주기 (ms)

const idleStyle = { transform: 'perspective(600px) rotateX(0deg)', transition: 'none' };

export default function ServiceMenuSection() {
  const navigate = useNavigate();
  const [rowPages,     setRowPages]     = useState(Array(PAGE_SIZE).fill(0));
  const [rowStyles,    setRowStyles]    = useState(Array(PAGE_SIZE).fill(idleStyle));
  const [hoveredRow,   setHoveredRow]   = useState(null);
  const [currentPage,  setCurrentPage]  = useState(0);
  const busyRef = useRef(false);

  const goToPage = useCallback((targetPage) => {
    if (busyRef.current) return;
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
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      goToPage((currentPage + 1) % PAGE_COUNT);
    }, INTERVAL);
    return () => clearInterval(id);
  }, [currentPage, goToPage]);

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
            const item      = HOT_ITEMS[rowPages[rowIdx] * PAGE_SIZE + rowIdx];
            const isHovered = hoveredRow === rowIdx;
            return (
              <Link
                key={rowIdx}
                to="/auction"
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
        </div>

        {/* 페이지 인디케이터 */}
        <div
          className="absolute flex gap-[6px] items-center"
          style={{ left: 1340 + 426 / 2 - 11, top: 867 + 367 - 18 }}
        >
          {Array.from({ length: PAGE_COUNT }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToPage(i)}
              className="cursor-pointer rounded-full transition-all duration-300"
              style={{
                width:  i === currentPage ? 16 : 8,
                height: 8,
                backgroundColor: i === currentPage ? "#0064ff" : "#c9d3e0",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
