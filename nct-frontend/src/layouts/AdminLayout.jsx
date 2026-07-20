// src/layouts/AdminLayout.jsx
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import MockupAdminSidebar from '@components/admin/mockup/MockupAdminSidebar';
import './AdminLayout.css';

// 관리자 목업과 같은 저장 키를 사용해 화면을 다시 열어도 접힘 상태를 유지합니다.
const ADMIN_SIDEBAR_STORAGE_KEY = 'ksteam-admin-sidebar-collapsed';

const getInitialSidebarState = () => {
  if (typeof window === 'undefined') return false;

  const savedState = window.localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY);
  if (savedState !== null) return savedState === '1';

  // 작은 화면에서는 본문을 먼저 볼 수 있도록 메뉴를 닫은 상태로 시작합니다.
  return window.matchMedia('(max-width: 768px)').matches;
};

const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getInitialSidebarState);

  const setSidebarCollapsed = (collapsed) => {
    setIsSidebarCollapsed(collapsed);
    window.localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, collapsed ? '1' : '0');
  };

  const toggleSidebar = () => setSidebarCollapsed(!isSidebarCollapsed);

  const closeSidebarAfterMobileNavigation = () => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      setSidebarCollapsed(true);
    }
  };

  return (
    <div className={`admin-layout${isSidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
      <header className="admin-layout__header">
        <button
          aria-controls="admin-navigation"
          aria-expanded={!isSidebarCollapsed}
          aria-label={isSidebarCollapsed ? '관리자 메뉴 열기' : '관리자 메뉴 닫기'}
          className="admin-layout__menu-button"
          onClick={toggleSidebar}
          type="button"
        >
          <Menu aria-hidden="true" />
        </button>
        <span className="admin-layout__header-label">관리자 화면</span>
      </header>

      {/*
        develop의 공통 AdminSidebar가 완성되면 아래 임시 컴포넌트만 교체합니다.
        접기/펼치기 상태는 AdminLayout이 관리하므로 공통 컴포넌트에도 그대로 전달할 수 있습니다.
      */}
      <MockupAdminSidebar
        collapsed={isSidebarCollapsed}
        id="admin-navigation"
        onNavigate={closeSidebarAfterMobileNavigation}
      />

      <button
        aria-label="관리자 메뉴 닫기"
        className="admin-layout__backdrop"
        onClick={() => setSidebarCollapsed(true)}
        type="button"
      />

      {/* 각 담당자의 관리자 상세 화면은 이 Outlet 자리에 표시됩니다. */}
      <main className="admin-layout__content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
