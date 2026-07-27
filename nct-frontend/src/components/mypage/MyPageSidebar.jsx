// src/components/mypage/MyPageSidebar.jsx
// Figma: mypage_01일반(18:2)/mypage_01일반_프로필수정(28:12) LEFTMENU
//        mypage_02제공자모드(57:495) LEFTMENU
// - 절대좌표 → 반응형 전환.
//   데스크톱(lg+): 좌측 세로 목록 / 모바일: 상단 가로 스크롤 탭.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { toast } from "@utils/common";

const GENERAL_MENU_ITEMS = [
  { key: "home",    label: "MY 홈",  type: "section" },
  { key: "profile", label: "프로필", type: "section" },
  {
    key: "auction-history",
    label: "경매",
    type: "accordion",
    children: [
      { key: "active-auctions", label: "진행중인 경매",  type: "section" },
      { key: "auction-bids",    label: "상품 구매 내역", type: "section" },
      { key: "auction-sales",   label: "상품 판매 내역", type: "section" },
    ],
  },
  {
    key: "service-history",
    label: "서비스 거래내역",
    type: "accordion",
    children: [
      { key: "service-bids",  label: "서비스 입찰 내역", type: "todo" },
      { key: "service-sales", label: "서비스 판매 내역", type: "todo" },
    ],
  },
  { key: "wishlist", label: "관심 상품",   type: "todo" },
  { key: "chat",     label: "채팅",        type: "section" },
  { key: "wallet",   label: "포인트 지갑", type: "section" },
];

const PROVIDER_MENU_ITEMS = [
  { key: "home",              label: "MY 홈",        type: "section" },
  { key: "profile",           label: "프로필",        type: "section" },
  { key: "quote",             label: "견적",          type: "todo" },
  { key: "service-trade",     label: "서비스 거래",   type: "todo" },
  { key: "settlement",        label: "정산 관리",     type: "route", to: "/user/settlement" },
  { key: "service-chat",      label: "서비스 채팅",   type: "todo" },
  { key: "wallet",            label: "포인트 지갑",   type: "section" },
  { key: "approval-category", label: "승인 카테고리", type: "todo" },
];

// 아코디언 key → 포함되는 child key 목록
const ACCORDION_CHILDREN = {
  "auction-history":  ["active-auctions", "auction-bids", "auction-sales"],
  "service-history":  ["service-bids", "service-sales"],
};

function getParentAccordion(sectionKey) {
  for (const [parent, children] of Object.entries(ACCORDION_CHILDREN)) {
    if (children.includes(sectionKey)) return parent;
  }
  return null;
}

export default function MyPageSidebar({ mode = "general", activeSection, onSelect, onRequestProviderSwitch }) {
  const navigate = useNavigate();
  const menuItems = mode === "provider" ? PROVIDER_MENU_ITEMS : GENERAL_MENU_ITEMS;

  const [openAccordion, setOpenAccordion] = useState(() => getParentAccordion(activeSection));

  // activeSection이 accordion child로 변경되면 해당 accordion 자동으로 열기
  useEffect(() => {
    const parent = getParentAccordion(activeSection);
    if (parent) setOpenAccordion(parent);
  }, [activeSection]);

  const handleClick = (item) => {
    if (item.type === "accordion") {
      setOpenAccordion(prev => prev === item.key ? null : item.key);
      return;
    }
    // 아코디언 자식이 아닌 항목 클릭 시 아코디언 닫기
    if (!getParentAccordion(item.key)) setOpenAccordion(null);

    if (item.type === "section") { onSelect(item.key); return; }
    if (item.type === "route")   { navigate(item.to); return; }
    if (item.type === "provider-switch") { onRequestProviderSwitch(); return; }
    toast({ icon: "info", title: "준비 중인 메뉴입니다." });
  };

  // 모바일 탭: accordion 항목은 children으로 평탄화, 부모 항목은 건너뜀
  const mobileTabs = menuItems.flatMap(item =>
    item.type === "accordion" ? (item.children ?? []) : [item]
  );

  return (
    <nav className="lg:w-[210px] lg:shrink-0">
      {/* 타이틀 (데스크톱) */}
      <h2 className="hidden lg:block font-bold text-[25px] text-black mb-5 px-2">
        마이페이지
        {mode === "provider" && (
          <span className="text-[14px] text-[#0064ff] ml-1">(제공자)</span>
        )}
      </h2>

      {/* 모바일: 가로 스크롤 탭 — accordion children 평탄화 */}
      <div className="flex lg:hidden overflow-x-auto gap-2 pb-1 scrollbar-none">
        {mobileTabs.map((item) => {
          const isActive = item.type === "section" && item.key === activeSection;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleClick(item)}
              className={`cursor-pointer shrink-0 h-[34px] px-4 rounded-full text-[13px] font-medium whitespace-nowrap border transition-colors ${
                isActive
                  ? "bg-[#0064ff] text-white border-[#0064ff]"
                  : "bg-white text-[#333] border-[#d9d9d9] hover:bg-[#f3f5fa]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 데스크톱: 세로 목록 */}
      <div className="hidden lg:block">
        {menuItems.map((item) => {
          const isAccordion    = item.type === "accordion";
          const isOpen         = isAccordion && openAccordion === item.key;
          const isActive       = item.type === "section" && item.key === activeSection;
          const hasActiveChild = isAccordion && (item.children ?? []).some(c => c.key === activeSection);

          return (
            <React.Fragment key={item.key}>
              <button
                type="button"
                onClick={() => handleClick(item)}
                className={`cursor-pointer w-full flex items-center justify-between h-[70px] px-[18px] text-left transition-all ${
                  isActive
                    ? "bg-[#0064ff] rounded-[10px] shadow-[0_4px_14px_rgba(0,0,0,0.10)]"
                    : isOpen && hasActiveChild
                    ? "bg-[#0064ff] rounded-t-[10px] shadow-[0_4px_14px_rgba(0,0,0,0.10)]"
                    : isOpen
                    ? "bg-[#DAE1F0] rounded-t-[10px]"
                    : "bg-transparent hover:bg-[#f3f5fa]"
                }`}
              >
                <span
                  className={`text-[17px] ${
                    isActive || (isOpen && hasActiveChild)
                      ? "font-bold text-white"
                      : isOpen
                      ? "font-bold text-[#0064ff]"
                      : "font-medium text-[#333]"
                  }`}
                >
                  {item.label}
                </span>
                {isAccordion ? (
                  isOpen
                    ? <ChevronUp   size={14} className={isActive || hasActiveChild ? "text-white" : "text-[#0064ff]"} />
                    : <ChevronDown size={14} className="text-[#888]" />
                ) : item.showChevron ? (
                  <ChevronDown size={14} className="text-[#888]" />
                ) : null}
              </button>

              {/* 아코디언 하위 메뉴 — 구분선보다 위에 렌더링 */}
              {isAccordion && isOpen && (
                <div className="bg-[#F3F5FA] px-[18px] py-3 rounded-b-[10px]">
                  {(item.children ?? []).map(child => {
                    const isChildActive = child.key === activeSection;
                    return (
                      <button
                        key={child.key}
                        type="button"
                        onClick={() => handleClick(child)}
                        className="group cursor-pointer w-full flex items-center h-[36px] text-left"
                      >
                        <span
                          className={`text-[16px] transition-colors ${
                            isChildActive
                              ? "font-bold text-[#0064ff]"
                              : "font-normal text-[#333] group-hover:text-[#0064ff]"
                          }`}
                        >
                          {child.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="h-px bg-[#e5e5e5]" />
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
