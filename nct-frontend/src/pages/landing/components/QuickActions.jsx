// src/pages/landing/components/QuickActions.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import '@assets/css/landing.css';

/**
 * 우측 플로팅 퀵 액션 버튼
 * - 최근 본 상품 팝업
 * - 경매 등록 / 서비스 요청 (비로그인 시 게이트 모달)
 * - TOP 버튼
 */
const QuickActions = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [recentOpen, setRecentOpen] = useState(false);

  const handleAuctionCreate = () => {
    if (isAuthenticated) {
      navigate('/product/register');
    } else {
      navigate('/login');
    }
  };

  const handleServiceCreate = () => {
    if (isAuthenticated) {
      navigate('/services/create');
    } else {
      navigate('/login');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 퀵 레일 */}
      <div className="quick-rail">
        {/* 최근 본 상품 */}
        <button
          className="quick-item"
          type="button"
          onClick={() => setRecentOpen(prev => !prev)}
          title="최근 본"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
          </svg>
          <span className="qi-label">최근 본</span>
        </button>

        {/* 경매 등록 */}
        <button className="quick-item quick-blue" type="button" onClick={handleAuctionCreate} title="경매 등록">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          <span className="qi-label">경매 등록</span>
        </button>

        {/* 서비스 요청 */}
        <button className="quick-item quick-cyan" type="button" onClick={handleServiceCreate} title="서비스 요청">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
          </svg>
          <span className="qi-label">서비스요청</span>
        </button>
      </div>

      {/* TOP 버튼 */}
      <button className="quick-item quick-top" type="button" onClick={scrollToTop} title="TOP">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 3h14" />
          <path d="m18 13-6-6-6 6" />
          <path d="M12 7v14" />
        </svg>
        <span className="qi-label">TOP</span>
      </button>

      {/* 최근 본 상품 팝업 */}
      {recentOpen && (
        <div
          className="card"
          style={{
            position: 'fixed',
            right: '96px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '280px',
            zIndex: 151,
          }}
        >
          <h3 style={{ margin: '0 0 12px' }}>최근 본 상품</h3>
          <p style={{ color: '#888', fontSize: '13px' }}>최근 본 상품이 없습니다.</p>
        </div>
      )}
    </>
  );
};

export default QuickActions;
