// src/layouts/LandingLayout.jsx
import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '@context/ThemeContext';
import SiteHeader from '@layouts/user/headers/SiteHeader';
import MainFooter from '@layouts/user/footers/MainFooter';

const LandingLayout = () => {
  return (
    <ThemeProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fff' }}>
        {/* 헤더 */}
        <SiteHeader />

        {/* 콘텐츠 — 모바일에서 하단 퀵바(60px)에 가리지 않도록 pb-16 추가 */}
        <main style={{ flex: 1 }} className="pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* 푸터 */}
        <MainFooter />
      </div>
    </ThemeProvider>
  );
};

export default LandingLayout;
