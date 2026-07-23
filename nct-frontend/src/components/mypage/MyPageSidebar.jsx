// 마이페이지 좌측 메뉴: 데스크톱 아코디언과 모바일 탭을 함께 제공합니다.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from '@utils/common';

const GENERAL_MENU_ITEMS = [
  { key: 'home', label: 'MY 홈', type: 'section' },
  { key: 'profile', label: '프로필수정', type: 'section' },
  {
    key: 'auction-history',
    label: '경매',
    type: 'accordion',
    children: [
      { key: 'active-auctions', label: '진행중인 경매', type: 'section' },
      { key: 'auction-bids', label: '상품 입찰 내역', type: 'section' },
      { key: 'auction-sales', label: '상품 판매 내역', type: 'section' },
    ],
  },
  { key: 'service-history', label: '서비스 거래내역', type: 'todo' },
  { key: 'wishlist', label: '관심 상품', type: 'todo' },
  { key: 'chat', label: '채팅', type: 'section' },
  { key: 'wallet', label: '포인트 지갑', type: 'route', to: '/user/point' },
];

const PROVIDER_MENU_ITEMS = [
  { key: 'home', label: 'MY 홈', type: 'section' },
  { key: 'profile', label: '프로필', type: 'section' },
  { key: 'quote', label: '견적', type: 'todo' },
  { key: 'service-trade', label: '서비스 거래', type: 'todo' },
  { key: 'settlement', label: '정산 관리', type: 'route', to: '/user/settlement' },
  { key: 'service-chat', label: '서비스 채팅', type: 'todo' },
  { key: 'wallet', label: '포인트 지갑', type: 'route', to: '/user/point' },
  { key: 'approval-category', label: '승인 카테고리', type: 'todo' },
];

const ACCORDION_CHILDREN = {
  'auction-history': ['active-auctions', 'auction-bids', 'auction-sales'],
};

function getParentAccordion(sectionKey) {
  return Object.entries(ACCORDION_CHILDREN)
    .find(([, children]) => children.includes(sectionKey))?.[0] ?? null;
}

export default function MyPageSidebar({
  mode = 'general',
  activeSection,
  onSelect,
  onRequestProviderSwitch,
}) {
  const navigate = useNavigate();
  const menuItems = mode === 'provider' ? PROVIDER_MENU_ITEMS : GENERAL_MENU_ITEMS;
  const [accordionOverride, setAccordionOverride] = useState(null);
  const openAccordion = accordionOverride?.section === activeSection
    ? accordionOverride.openKey
    : getParentAccordion(activeSection);

  const handleClick = (item) => {
    if (item.type === 'accordion') {
      setAccordionOverride({
        section: activeSection,
        openKey: openAccordion === item.key ? null : item.key,
      });
      return;
    }
    if (item.type === 'section') {
      onSelect(item.key);
      return;
    }
    if (item.type === 'route') {
      navigate(item.to);
      return;
    }
    if (item.type === 'provider-switch') {
      onRequestProviderSwitch();
      return;
    }
    toast({ icon: 'info', title: '준비 중인 메뉴입니다.' });
  };

  const mobileTabs = menuItems.flatMap((item) => (
    item.type === 'accordion' ? (item.children ?? []) : [item]
  ));

  return (
    <nav className="lg:sticky lg:top-24 lg:w-[210px] lg:shrink-0">
      <h2 className="hidden lg:block font-bold text-[25px] text-black mb-5 px-2">
        마이페이지
        {mode === 'provider' && (
          <span className="text-[14px] text-[#0064ff] ml-1">(제공자)</span>
        )}
      </h2>

      <div className="flex lg:hidden overflow-x-auto gap-2 pb-1 scrollbar-none">
        {mobileTabs.map((item) => {
          const isActive = item.type === 'section' && item.key === activeSection;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleClick(item)}
              className={`shrink-0 h-[34px] px-4 rounded-full text-[13px] font-medium whitespace-nowrap border transition-colors ${
                isActive
                  ? 'bg-[#0064ff] text-white border-[#0064ff]'
                  : 'bg-white text-[#333] border-[#d9d9d9] hover:bg-[#f3f5fa]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="hidden lg:block">
        {menuItems.map((item) => {
          const isAccordion = item.type === 'accordion';
          const isOpen = isAccordion && openAccordion === item.key;
          const isActive = item.type === 'section' && item.key === activeSection;
          const hasActiveChild = isAccordion
            && (item.children ?? []).some((child) => child.key === activeSection);
          const isHighlighted = isActive || hasActiveChild;

          return (
            <React.Fragment key={item.key}>
              <button
                type="button"
                onClick={() => handleClick(item)}
                className={`w-full flex items-center justify-between h-[50px] px-[18px] rounded-[10px] text-left transition-colors ${
                  isHighlighted ? 'bg-[#0064ff]' : 'bg-transparent hover:bg-[#f3f5fa]'
                }`}
              >
                <span className={`text-[16px] ${
                  isHighlighted ? 'font-bold text-white' : 'font-medium text-[#333]'
                }`}>
                  {item.label}
                </span>
                {isAccordion ? (
                  isOpen
                    ? <ChevronDown size={14} className={hasActiveChild ? 'text-white' : 'text-[#888]'} />
                    : <ChevronRight size={14} className={hasActiveChild ? 'text-white' : 'text-[#888]'} />
                ) : (
                  isActive && <ChevronRight size={14} className="text-white" />
                )}
              </button>
              <div className="h-px bg-[#e5e5e5] mx-[18px]" />
              {isAccordion && isOpen && (
                <div className="pl-4">
                  {(item.children ?? []).map((child) => {
                    const isChildActive = child.key === activeSection;
                    return (
                      <React.Fragment key={child.key}>
                        <button
                          type="button"
                          onClick={() => handleClick(child)}
                          className={`w-full flex items-center justify-between h-[44px] px-[18px] rounded-[8px] text-left transition-colors ${
                            isChildActive
                              ? 'bg-[#e5efff]'
                              : 'bg-transparent hover:bg-[#f3f5fa]'
                          }`}
                        >
                          <span className={`text-[14px] ${
                            isChildActive
                              ? 'font-bold text-[#0064ff]'
                              : 'font-medium text-[#555]'
                          }`}>
                            {child.label}
                          </span>
                          {isChildActive && <ChevronRight size={12} className="text-[#0064ff]" />}
                        </button>
                        <div className="h-px bg-[#f0f0f0] mx-[18px]" />
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
