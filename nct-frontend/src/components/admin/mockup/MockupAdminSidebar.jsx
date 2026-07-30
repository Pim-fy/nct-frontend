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
    { label: '대시보드', icon: LayoutDashboard, to: '/admin' },
    { label: '알림', icon: Bell, to: '/admin/notifications' },
  ],
  [
    { label: '회원 관리', icon: Users },
    { label: '제공자 심사', icon: ClipboardCheck, to: '/admin/provider-applications' },
  ],
  [{ label: '경매 관리', icon: Gavel, to: '/admin/auctions' }],
  [
    { label: '서비스 요청 관리', icon: BriefcaseBusiness, to: '/admin/services' },
    { label: '카테고리 관리', icon: Grid2X2, to: '/admin/categories' },
  ],
  [{ label: '환전 관리', icon: WalletCards, to: '/admin/exchanges' }],
  [
    { label: '공지 관리', icon: Megaphone, to: '/admin/notices' },
    { label: '이용가이드 관리', icon: BookOpenCheck, to: '/admin/guides' },
  ],
  [{ label: '신고 처리', icon: Siren, to: '/admin/reports' }],
  [
    { label: '감사 로그', icon: ScrollText, to: '/admin/audit-logs' },
    { label: '시스템 설정', icon: Settings, to: '/admin/system-settings' },
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
          {section.map(({ label, icon: Icon, to }) => (
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
                <span><strong>{label}</strong></span>
              </NavLink>
            ) : (
              <div
                aria-disabled="true"
                className="mockup-admin-nav__item is-pending"
                key={label}
                title={collapsed ? label : undefined}
              >
                {createElement(Icon, { 'aria-hidden': true })}
                <span><strong>{label}</strong></span>
              </div>
            )
          ))}
        </div>
      ))}

      <div className="mockup-admin-nav__section is-preview">
        <NavLink
          className={({ isActive }) => `mockup-admin-nav__item${isActive ? ' is-active' : ''}`}
          onClick={onNavigate}
          title={collapsed ? '위험 이벤트' : undefined}
          to="/admin/risk-events"
        >
          <Siren aria-hidden="true" />
          <span><strong>위험 이벤트</strong></span>
        </NavLink>
      </div>
    </nav>
  </aside>
);

export default MockupAdminSidebar;
