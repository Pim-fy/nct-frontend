// @ai_generated: 인증 입력 화면의 공통 헤더·본문·푸터 조립을 담당한다.
import { Outlet } from 'react-router-dom';
import SiteHeader from '@layouts/user/headers/SiteHeader';
import MainFooter from '@layouts/user/footers/MainFooter';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <MainFooter />
    </div>
  );
};

export default AuthLayout;
