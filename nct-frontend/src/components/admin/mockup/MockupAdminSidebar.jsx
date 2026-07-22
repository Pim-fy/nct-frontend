import { createElement } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Bell,
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  Gavel,
  Grid2X2,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Settings,
  Siren,
  Users,
  WalletCards,
} from 'lucide-react';
import './MockupAdminSidebar.css';

// 관리자 목업 v2와 업무분장 v11을 화면으로 확인하기 위한 임시 메뉴입니다.
// route가 없는 다른 담당자 화면은 클릭을 막아 미완성 경로에서 404가 나지 않게 합니다.
const MENU_SECTIONS = [
  [
    { label: '대시보드', icon: LayoutDashboard, to: '/admin', owner: '담당자 7' },
    { label: '알림', icon: Bell, to: '/admin/notifications', owner: '담당자 6' },
  ],
  [
    { label: '회원 관리', icon: Users, owner: '담당자 1' },
    { label: '제공자 심사', icon: ClipboardCheck, to: '/admin/provider-applications', owner: '담당자 7', note: '임시 목록' },
  ],
  [{ label: '경매 관리', icon: Gavel, to: '/admin/auctions', owner: '담당자 7', note: '임시 조회 목록' }],
  [
    { label: '서비스 요청 관리', icon: BriefcaseBusiness, to: '/admin/services', owner: '담당자 7', note: '임시 목록' },
    { label: '카테고리 관리', icon: Grid2X2, to: '/admin/categories', owner: '담당자 7' },
  ],
  [{ label: '환전 관리', icon: WalletCards, owner: '담당자 5' }],
  [
    { label: '공지 관리', icon: Megaphone, to: '/admin/notices', owner: '담당자 7' },
    { label: '이용가이드 관리', icon: BookOpenCheck, to: '/admin/guides', owner: '담당자 7', note: '정적 콘텐츠' },
  ],
  [{ label: '신고·거래 문제 처리', icon: Siren, owner: '담당자 4' }],
  [
    { label: '감사 로그', icon: ScrollText, to: '/admin/audit-logs', owner: '담당자 6' },
    { label: '시스템 설정', icon: Settings, to: '/admin/system-settings', owner: '담당자 7·6', note: '1단계 최소 설정 / 3단계 인수' },
  ],
];

const MockupAdminSidebar = ({ collapsed = false, id, onNavigate }) => (
  <aside
    aria-label="관리자 메뉴 미리보기"
    className={`mockup-admin-sidebar${collapsed ? ' is-collapsed' : ''}`}
    id={id}
  >
    <nav className="mockup-admin-nav" aria-label="관리자 화면 목록">
      {MENU_SECTIONS.map((section, sectionIndex) => (
        <div className="mockup-admin-nav__section" key={`admin-menu-${sectionIndex}`}>
          {section.map(({ label, icon: Icon, to, owner, note }) => (
            to ? (
              <NavLink
                className={({ isActive }) => `mockup-admin-nav__item${isActive ? ' is-active' : ''}`}
                end={to === '/admin'}
                key={label}
                onClick={onNavigate}
                title={collapsed ? label : undefined}
                to={to}
              >
                {createElement(Icon, { 'aria-hidden': true })}
                <span><strong>{label}</strong><small>{owner}</small></span>
              </NavLink>
            ) : (
              <div
                aria-disabled="true"
                className="mockup-admin-nav__item is-pending"
                key={label}
                title={collapsed ? label : undefined}
              >
                {createElement(Icon, { 'aria-hidden': true })}
                <span><strong>{label}</strong><small>{note ?? `${owner} 연결 대기`}</small></span>
              </div>
            )
          ))}
        </div>
      ))}

      <div className="mockup-admin-nav__section is-preview">
        <NavLink
          className={({ isActive }) => `mockup-admin-nav__item${isActive ? ' is-active' : ''}`}
          onClick={onNavigate}
          title={collapsed ? '민감정보 탐지 이벤트' : undefined}
          to="/admin/operations-preview"
        >
          <Siren aria-hidden="true" />
          <span><strong>민감정보 탐지 이벤트</strong><small>담당자 7 · F-OPS-013</small></span>
        </NavLink>
      </div>
    </nav>
  </aside>
);

export default MockupAdminSidebar;
