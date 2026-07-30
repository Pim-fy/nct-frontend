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

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
        
        {/* 푸터 */}
        <MainFooter />
      </div>
    </ThemeProvider>
  );
};

export default LandingLayout;
