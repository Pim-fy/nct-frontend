// src/layouts/user/headers/LandingHeader.jsx
import { Link } from 'react-router-dom';
import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import BrandLogo from '@components/common/BrandLogo';
import '@assets/css/header.css';

const authBtnClass = [
  'group inline-flex items-center justify-center gap-1',
  'h-9 px-3.5 rounded-lg text-base font-semibold',
  'text-white bg-black border-0',
  'transition-colors duration-200 ease-out',
  'hover:bg-gray-100 hover:text-black',
  'active:scale-[0.97] cursor-pointer',
  'md:gap-2 md:h-12 md:px-5 md:text-xl',
].join(' ');

const LandingHeader = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header" style={{ position: 'static' }}>
      <div className="container header-inner">
        {/* 로고 */}
        <Link aria-label="에누리컷 홈" className="site-brand-link" to="/">
          <BrandLogo />
        </Link>

        {/* 중앙 네비게이션 */}
        <nav style={{ display: 'flex', gap: '22px', alignItems: 'center' }}>
          <Link to="/auction">경매</Link>
          <Link to="/services">서비스</Link>
          <Link to="/customersupport/notice">공지사항</Link>
        </nav>

        {/* 우측 인증 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {user ? (
            <button className={authBtnClass} onClick={logout}>
              <span>Logout</span>
              <LogOut size={18} />
            </button>
          ) : (
            <Link to="/login" className={authBtnClass}>
              <span>Login</span>
              <LogIn size={18} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
