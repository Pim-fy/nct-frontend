// src/layouts/UserLayout.jsx
import { Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@context/ThemeContext';
import SiteHeader from '@layouts/user/headers/SiteHeader';
import MainFooter from '@layouts/user/footers/MainFooter';
import QuickActions from '@components/landing/QuickActions';
const UserLayout = () => {
  const { pathname } = useLocation();
  const showQuickActions =
    pathname === '/auction' ||
    pathname === '/service';
  return (
    <ThemeProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* 헤더 */}
        <SiteHeader />

        {/* 콘텐츠 — 모바일에서 하단 퀵바(60px)에 가리지 않도록 pb-16 추가 */}
        <main style={{ flex: 1 }} className={showQuickActions ? 'pb-16 md:pb-0' : ''}>
          <Outlet />
        </main>

        {/* 퀵메뉴(경매등록/서비스요청 등)를 헤더 컴포넌트에 포함시켜 우측에 고정 노출한다. */}
        {showQuickActions && (
          <aside aria-label="빠른 작업">
            <QuickActions />
          </aside>
        )}


        {/* 푸터 */}
        <MainFooter />
      </div>
    </ThemeProvider>
  );
};

export default UserLayout;
