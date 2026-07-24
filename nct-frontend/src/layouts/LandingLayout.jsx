// src/layouts/LandingLayout.jsx
import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '@context/ThemeContext';
import SiteHeader from '@layouts/user/headers/SiteHeader';
import MainFooter from '@layouts/user/footers/MainFooter';
import QuickActions from '@components/landing/QuickActions';
const LandingLayout = () => {
  return (
    <ThemeProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fff' }}>
        {/* 헤더 */}
        <SiteHeader />

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
        
        <aside>
          {/* 퀵메뉴(경매등록/서비스요청 등)를  우측에 고정 노출한다. */}
          <QuickActions />
        </aside>

        {/* 푸터 */}
        <MainFooter />
      </div>
    </ThemeProvider>
  );
};

export default LandingLayout;
