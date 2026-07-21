// src/layouts/UserLayout.jsx
import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '@context/ThemeContext';
import SiteHeader from '@layouts/user/headers/SiteHeader';
import MainFooter from '@layouts/user/footers/MainFooter';

const UserLayout = () => {
  return (
    <ThemeProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* 헤더 */}
        <SiteHeader />

        {/* 콘텐츠 */}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>

        {/* 푸터 */}
        <MainFooter />
      </div>
    </ThemeProvider>
  );
};

export default UserLayout;
