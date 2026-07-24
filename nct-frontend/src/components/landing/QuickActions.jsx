// src/components/landing/QuickActions.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import cursorIcon from '@assets/img/cursorIcon.png';
import commentIcon from '@assets/img/commentIcon.png';
import quickIcon from '@assets/img/icon_quick.png';
import thumImg01 from '@assets/img/thum_img01.png';
import thumImg02 from '@assets/img/thum_img02.png';
import thumImg03 from '@assets/img/thum_img03.png';
import '@assets/css/landing.css';

// 외부에서 최근 본 상품을 추가할 때 호출하는 유틸 함수
// 사용 예: addRecentItem({ id: 1, image: '/img/product.jpg', url: '/auction/1' })
export const addRecentItem = (item) => {
  const stored = JSON.parse(localStorage.getItem('recentItems') || '[]');
  const filtered = stored.filter((i) => i.id !== item.id);
  const updated = [item, ...filtered].slice(0, 10);
  localStorage.setItem('recentItems', JSON.stringify(updated));
  window.dispatchEvent(new Event('recentItemsUpdated'));
};

const QuickActions = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState([]);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    // TODO: 샘플 확인용 — 실 서비스 전 제거
    if (!localStorage.getItem('recentItems')) {
      localStorage.setItem('recentItems', JSON.stringify([
        { id: 's1', image: thumImg01, title: '샘플 상품 1', url: '/auction/1' },
        { id: 's2', image: thumImg02, title: '샘플 상품 2', url: '/auction/2' },
        { id: 's3', image: thumImg03, title: '샘플 상품 3', url: '/auction/3' },
      ]));
    }

    const load = () => {
      const stored = JSON.parse(localStorage.getItem('recentItems') || '[]');
      setRecentItems(stored.slice(0, 3));
    };
    load();
    window.addEventListener('recentItemsUpdated', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('recentItemsUpdated', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 200);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuctionCreate = () => {
    if (isAuthenticated) {
      navigate('/product/register');
    } else {
      navigate('/login');
    }
  };

  const handleServiceCreate = () => {
    if (isAuthenticated) {
      navigate('/service/create');
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

        {/* 최근 본 상품 — 항목이 있을 때만 표시 */}
        {recentItems.length > 0 && (
          <div className="flex flex-col items-center gap-[5px] w-[65px] self-center bg-white/80 rounded-[10px] shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-sm px-[5px] pt-[10px] pb-[12px]">
            <div className="flex flex-col items-center gap-[4px]">
              <img src={quickIcon} alt="" width="22" height="22" />
              <span className="qi-label text-[#5f5e5a]">최근 본</span>
            </div>
            {recentItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.url)}
                title={item.title || '최근 본 상품'}
                className="text-[13px] w-[50px] h-[50px] rounded-[5px] overflow-hidden border border-[#e9e9e9] bg-[#ffffff] cursor-pointer p-0 shrink-0"
              >
                <img
                  src={item.image}
                  alt={item.title || ''}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

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

      {/* PC TOP 버튼 — 스크롤 200px 이상일 때만 표시, 하단 50px 고정 */}
      {showTop && (
        <button
          type="button"
          onClick={scrollToTop}
          title="TOP"
          className="hidden md:flex fixed right-[48px] bottom-[50px] z-[151] items-center justify-center size-[36px] rounded-full bg-[rgba(0,0,0,0.65)] cursor-pointer hover:bg-[rgba(0,0,0,0.8)] transition-colors"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </svg>
        </button>
      )}

      {/* 모바일 TOP 버튼 — 스크롤 200px 이상일 때만 표시, 디바이스 하단 70px 위 고정 */}
      {showTop && (
        <button
          type="button"
          onClick={scrollToTop}
          title="TOP"
          className="md:hidden fixed right-4 bottom-[70px] z-[151] flex items-center justify-center size-[36px] rounded-full bg-[rgba(0,0,0,0.65)] cursor-pointer hover:bg-[rgba(0,0,0,0.8)] transition-colors"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
          </svg>
        </button>
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
