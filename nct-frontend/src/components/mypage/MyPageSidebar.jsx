// src/components/mypage/MyPageSidebar.jsx
// Figma: mypage_01일반(18:2)/mypage_01일반_프로필수정(28:12) LEFTMENU
//        mypage_02제공자모드(57:495) LEFTMENU
// - 절대좌표 → 반응형 전환.
//   데스크톱(lg+): 좌측 세로 목록 / 모바일: 상단 가로 스크롤 탭.
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { toast } from "@utils/common";

const GENERAL_MENU_ITEMS = [
  { key: "home", label: "MY 홈", type: "section" },
  { key: "profile", label: "프로필수정", type: "section" },
  { key: "auction-history", label: "경매 거래내역", type: "section" },
  { key: "service-history", label: "서비스 거래내역", type: "todo" },
  { key: "wishlist", label: "관심 상품", type: "todo" },
  { key: "chat", label: "채팅", type: "todo" },
  { key: "wallet", label: "포인트 지갑", type: "route", to: "/user/point" },
];

const PROVIDER_MENU_ITEMS = [
  { key: "home", label: "MY 홈", type: "section" },
  { key: "profile", label: "프로필", type: "section" },
  { key: "quote", label: "견적", type: "todo" },
  { key: "service-trade", label: "서비스 거래", type: "todo" },
  { key: "settlement", label: "정산 관리", type: "route", to: "/user/settlement" },
  { key: "service-chat", label: "서비스 채팅", type: "todo" },
  { key: "wallet", label: "포인트 지갑", type: "route", to: "/user/point" },
  { key: "approval-category", label: "승인 카테고리", type: "todo" },
];

export default function MyPageSidebar({ mode = "general", activeSection, onSelect, onRequestProviderSwitch }) {
  const navigate = useNavigate();
  const menuItems = mode === "provider" ? PROVIDER_MENU_ITEMS : GENERAL_MENU_ITEMS;

  const handleClick = (item) => {
    if (item.type === "section") { onSelect(item.key); return; }
    if (item.type === "route") { navigate(item.to); return; }
    if (item.type === "provider-switch") { onRequestProviderSwitch(); return; }
    toast({ icon: "info", title: "준비 중인 메뉴입니다." });
  };

  return (
    <nav className="lg:w-[210px] lg:shrink-0">
      {/* 타이틀 (데스크톱) */}
      <h2 className="hidden lg:block font-bold text-[25px] text-black mb-5 px-2">
        마이페이지
        {mode === "provider" && (
          <span className="text-[14px] text-[#0064ff] ml-1">(제공자)</span>
        )}
      </h2>

      {/* 모바일: 가로 스크롤 탭 */}
      <div className="flex lg:hidden overflow-x-auto gap-2 pb-1 scrollbar-none">
        {menuItems.map((item) => {
          const isActive = item.type === "section" && item.key === activeSection;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleClick(item)}
              className={`shrink-0 h-[34px] px-4 rounded-full text-[13px] font-medium whitespace-nowrap border transition-colors ${
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
          const isActive = item.type === "section" && item.key === activeSection;
          return (
            <React.Fragment key={item.key}>
              <button
                type="button"
                onClick={() => handleClick(item)}
                className={`w-full flex items-center justify-between h-[50px] px-[18px] rounded-[10px] text-left transition-colors ${
                  isActive ? "bg-[#0064ff]" : "bg-transparent hover:bg-[#f3f5fa]"
                }`}
              >
                <span
                  className={`text-[16px] ${
                    isActive ? "font-bold text-white" : "font-medium text-[#333]"
                  }`}
                >
                  {item.label}
                </span>
                {isActive && <ChevronRight size={14} className="text-white" />}
              </button>
              <div className="h-px bg-[#e5e5e5] mx-[18px]" />
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
