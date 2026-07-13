// src/layouts/user/headers/MainHeader.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import '@assets/css/header.css';

const MainHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [notiOpen, setNotiOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search/${encodeURIComponent(searchKeyword.trim())}`);
      setSearchKeyword('');
    }
  };

  return (
    <header className="header">
      <div className="container header-inner">
        {/* 로고 */}
        <Link to="/" style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-primary, #0064ff)', textDecoration: 'none' }}>
          Ksteam
        </Link>

        {/* 네비게이션 */}
        <nav style={{ display: 'flex', gap: '22px', alignItems: 'center' }}>
          <Link to="/auction">경매</Link>
          <Link to="/services">서비스</Link>
          <Link to="/customersupport/notice">공지사항</Link>
        </nav>

        {/* 우측 액션 */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'flex-end' }}>
          {/* 검색 */}
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="검색"
              style={{ border: '1px solid #e2e1dc', borderRadius: '8px', padding: '6px 12px', fontSize: '14px', width: '160px' }}
            />
          </form>

          {/* 알림 */}
          {user && (
            <div className="noti-wrap">
              <button
                className="noti-btn hicon"
                type="button"
                onClick={() => setNotiOpen(prev => !prev)}
                aria-label="알림"
              >
                <Bell size={22} />
              </button>
              <div className={`noti-pop ${notiOpen ? 'open' : ''}`}>
                <div className="noti-item">새 알림이 없습니다.</div>
              </div>
            </div>
          )}

          {/* 인증 버튼 */}
          {user ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Link to="/user/mypage" className="hicon" style={{ gap: '4px' }}>
                <User size={20} />
                <span style={{ fontSize: '14px' }}>{user.nickname || '마이페이지'}</span>
              </Link>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '13px', padding: '7px 12px' }}
                onClick={logout}
              >
                <LogOut size={14} />
                로그아웃
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-outline" style={{ fontSize: '13px', padding: '7px 12px' }}>
              <LogIn size={14} />
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default MainHeader;