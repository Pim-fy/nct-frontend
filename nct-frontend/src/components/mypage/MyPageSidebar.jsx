// src/components/mypage/MyPageSidebar.jsx
// Figma: mypage_01일반(18:2)/mypage_01일반_프로필수정(28:12) LEFTMENU(node 22:13 / 28:188)
//        mypage_02제공자모드(57:495) LEFTMENU(node 57:671) - 제공자 모드는 메뉴 구성이 달라 별도 목록으로 관리.
import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { toast } from "@utils/common";

// 담당자3(나)가 구현한 항목(MY 홈/프로필수정) 외에, 팀원이 이미 구현해 둔 실제 라우트가 있는 항목은
// 그리로 이동시키고, 아직 화면이 없는 나머지 항목은 클릭 시 "준비 중" 안내만 띄운다.
const GENERAL_MENU_ITEMS = [
  { key: "home", label: "MY 홈", type: "section" },
  { key: "profile", label: "프로필수정", type: "section" },
  // 물건 경매 낙찰 뒤 생성되는 거래를 담당자4의 실제 거래 내역 화면에서 확인한다.
  { key: "auction-history", label: "경매 거래내역", type: "route", to: "/trades" },
  { key: "service-history", label: "서비스 거래내역", type: "todo" },
  { key: "wishlist", label: "관심 상품", type: "todo" },
  { key: "chat", label: "채팅", type: "todo" },
  { key: "wallet", label: "포인트 지갑", type: "route", to: "/user/point" },
  // { key: "provider", label: "제공자 전환", type: "provider-switch" },
];

// 제공자모드는 mypage_02제공자모드(57:495)에만 존재하고, "프로필"/"견적"/"서비스 채팅"/"승인 카테고리" 등
// 별도 디자인이 아직 없는 항목이 많다 - 화면이 있는 항목(정산 관리/포인트 지갑)만 실제 라우트로 연결한다.
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

const ITEM_HEIGHT = 50;
const FIRST_ITEM_TOP = 181;

export default function MyPageSidebar({ mode = "general", activeSection, onSelect, onRequestProviderSwitch }) {
  const navigate = useNavigate();
  const menuItems = mode === "provider" ? PROVIDER_MENU_ITEMS : GENERAL_MENU_ITEMS;

  const handleClick = (item) => {
    if (item.type === "section") {
      onSelect(item.key);
      return;
    }
    if (item.type === "route") {
      navigate(item.to);
      return;
    }
    if (item.type === "provider-switch") {
      onRequestProviderSwitch();
      return;
    }
    // TODO: 해당 담당자가 화면을 구현하면 라우트를 연결한다.
    toast({ icon: "info", title: "준비 중인 메뉴입니다." });
  };

  return (
    <div className="absolute contents left-[167px] top-[137px]" data-name="LEFTMENU">
      <p className="absolute font-['Noto_Sans_KR:Bold'] font-bold left-[167px] text-[25px] text-black top-[137px] whitespace-nowrap">
        마이페이지{mode === "provider" && <span className="text-[20px]">(제공자)</span>}
      </p>

      {menuItems.map((item, index) => {
        const top = FIRST_ITEM_TOP + index * ITEM_HEIGHT;
        const isActive = item.type === "section" && item.key === activeSection;
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
