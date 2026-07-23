// src/components/landing/QuickActions.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import cursorIcon from '@assets/img/cursorIcon.png';
import commentIcon from '@assets/img/commentIcon.png';
import '@assets/css/landing.css';

/**
 * 우측 플로팅 퀵 액션 버튼
 * - 최근 본 상품 팝업
 * - 경매 등록 / 서비스 요청 (비로그인 시 로그인 페이지로 이동)
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
      {/* 데스크톱 플로팅 퀵 레일 (md 이상) */}
      <div className="quick-rail hidden md:flex">
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
          <img src={cursorIcon} alt="" width="22" height="22" />
          <span className="qi-label">경매<br/>등록</span>
        </button>

        {/* 서비스 요청 */}
        <button className="quick-item quick-purple" type="button" onClick={handleServiceCreate} title="서비스 요청">
          <img src={commentIcon} alt="" width="22" height="22" />
          <span className="qi-label">서비스<br/>요청</span>
        </button>
      </div>

      {/* TOP 버튼 (데스크톱) */}
      <button className="quick-item quick-top hidden md:flex" type="button" onClick={scrollToTop} title="TOP">
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

      {/* 모바일 하단 고정 퀵바 (md 미만) */}
      <div className="fixed bottom-0 left-0 right-0 flex md:hidden z-[150] h-[60px]">
        <button
          type="button"
          onClick={handleAuctionCreate}
          className="flex-1 flex items-center justify-center gap-2 bg-[#0064ff] text-white font-bold text-[15px] border-none cursor-pointer"
        >
          <img src={cursorIcon} alt="" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
          경매등록
        </button>
        <button
          type="button"
          onClick={handleServiceCreate}
          className="flex-1 flex items-center justify-center gap-2 bg-[#8b5cf6] text-white font-bold text-[15px] border-none cursor-pointer"
        >
          <img src={commentIcon} alt="" width="22" height="22" style={{ filter: 'brightness(0) invert(1)' }} />
          서비스요청
        </button>
      </div>
    </>
  );
};

export default QuickActions;
