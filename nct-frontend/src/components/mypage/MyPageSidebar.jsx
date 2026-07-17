// src/components/mypage/MyPageSidebar.jsx
// Figma: mypage_01일반(18:2)/mypage_01일반_프로필수정(28:12) 공통 LEFTMENU(node 22:13 / 28:188).
import React from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "@utils/common";

// 담당자3(나)가 구현한 항목만 실제 탭 전환, 나머지는 다른 담당자 영역(F-AUC/F-COM 등)이라
// 아직 화면이 없다 - 클릭 시 "준비 중" 안내만 띄운다.
const MENU_ITEMS = [
  { key: "home", label: "MY 홈", ready: true },
  { key: "profile", label: "프로필수정", ready: true },
  { key: "auction-history", label: "경매 거래내역", ready: false },
  { key: "service-history", label: "서비스 거래내역", ready: false },
  { key: "wishlist", label: "관심 상품", ready: false },
  { key: "chat", label: "채팅", ready: false },
  { key: "wallet", label: "포인트 지갑", ready: false },
  { key: "provider", label: "제공자 전환", ready: false },
];

const ITEM_HEIGHT = 50;
const FIRST_ITEM_TOP = 181;

export default function MyPageSidebar({ activeSection, onSelect }) {
  const handleClick = (item) => {
    if (!item.ready) {
      // TODO: 다른 담당자가 해당 도메인 화면을 구현하면 라우트를 연결한다.
      toast({ icon: "info", title: "준비 중인 메뉴입니다." });
      return;
    }
    onSelect(item.key);
  };

  return (
    <div className="absolute contents left-[167px] top-[137px]" data-name="LEFTMENU">
      <p className="absolute font-['Noto_Sans_KR:Bold'] font-bold left-[167px] text-[25px] text-black top-[137px] whitespace-nowrap">
        마이페이지
      </p>

      {MENU_ITEMS.map((item, index) => {
        const top = FIRST_ITEM_TOP + index * ITEM_HEIGHT;
        const isActive = item.key === activeSection;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => handleClick(item)}
            className={`absolute left-[167px] w-[200px] h-[50px] flex items-center justify-between px-[25px] rounded-[10px] cursor-pointer border-none text-left transition-colors ${
              isActive ? "bg-[#0064ff]" : "bg-transparent hover:bg-[#f3f5fa]"
            }`}
            style={{ top }}
          >
            <span
              className={`font-['Noto_Sans_KR:Medium'] text-[16px] ${
                isActive ? "font-bold text-white" : "text-[#333]"
              }`}
            >
              {item.label}
            </span>
            {isActive && <ChevronRight size={14} className="text-white" />}
          </button>
        );
      })}
    </div>
  );
}
