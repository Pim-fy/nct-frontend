// src/components/common/MobileBottomNav.jsx
// 모바일(md 미만) 전용 하단 고정 탭바.
// 현재 헤더에서 쓰는 PNG 아이콘을 그대로 재사용하고,
// active 상태일 때 CSS filter로 primary blue(#0064ff)를 입힌다.
import { Link, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';
import cursorIcon from '@assets/img/cursorIcon.png';
import commentIcon from '@assets/img/commentIcon.png';
import userIcon from '@assets/img/userIcon.png';

// black PNG → #0064ff
const BLUE_FILTER =
  'invert(20%) sepia(97%) saturate(5000%) hue-rotate(213deg) brightness(104%)';
// black PNG → gray (비활성)
const GRAY_FILTER = 'grayscale(100%) brightness(1.4)';

const NAV_ITEMS = [
  { key: 'home',    label: '홈',     to: '/',            type: 'lucide' },
  { key: 'auction', label: '경매',   to: '/auction',     type: 'img', src: cursorIcon },
  { key: 'service', label: '서비스', to: '/services',    type: 'img', src: commentIcon },
  { key: 'mypage',  label: 'MY',     to: '/user/mypage', type: 'img', src: userIcon },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();

  const isActive = (to) =>
    to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white border-t border-[#e5e5e5]"
      style={{ boxShadow: '0 -2px 10px rgba(0,0,0,0.08)' }}
    >
      <div className="flex h-[60px]">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? 'text-[#0064ff]' : 'text-[#969696]'
              }`}
            >
              {item.type === 'lucide' ? (
                <Home size={22} strokeWidth={active ? 2.5 : 1.8} />
              ) : (
                <img
                  src={item.src}
                  alt=""
                  className="size-[22px] object-contain"
                  style={{ filter: active ? BLUE_FILTER : GRAY_FILTER }}
                />
              )}
              <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* iOS 홈 인디케이터 safe area */}
      <div style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
}
