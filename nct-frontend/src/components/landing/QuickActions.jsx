// src/components/landing/QuickActions.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import { toImageUrl } from '@api/fileApi';
import { useAuth } from '@hooks/useAuth';
import {
  getRecentAuctions,
  subscribeToRecentAuctions,
} from '@utils/recentAuctions';
import cursorIcon from '@assets/img/cursorIcon.png';
import commentIcon from '@assets/img/commentIcon.png';
import '@assets/css/landing.css';

const RECENT_AUCTION_SLOT_COUNT = 3;

const QuickActions = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState(() => getRecentAuctions().slice(0, 3));
  const [failedImageIds, setFailedImageIds] = useState(() => new Set());
  const [showTop, setShowTop] = useState(false);
  const recentItemSlots = Array.from(
    { length: RECENT_AUCTION_SLOT_COUNT },
    (_, index) => recentItems[index] ?? null,
  );

  useEffect(() => {
    return subscribeToRecentAuctions((items) => setRecentItems(items.slice(0, 3)));
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

        {/* 최근 본 경매 — 항목이 있을 때만 표시 */}
        {recentItems.length > 0 && <div className="mb-5 flex flex-col items-center gap-[5px] self-center overflow-hidden rounded-[5px] bg-white/80 shadow-[0_5px_10px_rgba(0,0,0,0.12)] backdrop-blur-sm">
          <span className="qi-label w-full bg-[#444444] py-[5px] text-center text-sm text-white">최근 본</span>
          <div className="flex flex-col items-center gap-[5px] px-[5px] pb-[8px]">
            {recentItemSlots.map((item, index) => (
              item ? (
                <button
                  key={item.auctionId}
                  type="button"
                  onClick={() => navigate(`/auction/${item.auctionId}`)}
                  title={item.title || '최근 본 경매'}
                  aria-label={`${item.title || '최근 본 경매'} 상세 보기`}
                  className="grid size-[50px] shrink-0 cursor-pointer place-items-center overflow-hidden rounded-[5px] border border-[#e5e5e5] bg-[#f7f7f7] p-0 text-[#999]"
                >
                  {item.imagePath && !failedImageIds.has(item.auctionId) ? (
                    <img
                      src={toImageUrl(item.imagePath)}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={() => setFailedImageIds((currentIds) => {
                        const nextIds = new Set(currentIds);
                        nextIds.add(item.auctionId);
                        return nextIds;
                      })}
                    />
                  ) : (
                    <ImageOff size={18} aria-hidden="true" />
                  )}
                </button>
              ) : (
                <span
                  key={`empty-recent-auction-${index}`}
                  className="size-[50px] shrink-0"
                  aria-hidden="true"
                />
              )
            ))}
          </div>
        </div>}

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
