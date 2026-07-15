// src/layouts/user/headers/LandingHeader.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import logoImg from '@assets/img/logo.png';
import walletIcon from '@assets/img/walletIcon.png';

/**
 * 랜딩 페이지 전용 헤더 — 첨부 이미지(스크린샷) 그대로 구현
 *
 * - 로고(이미지+텍스트) / 경매(카테고리 드롭다운) / 서비스 / 공지사항
 * - 비로그인: 이용가이드 / 회원가입 버튼
 * - 로그인: 알림 / 지갑(POINT 드롭다운) / 마이페이지 아이콘 + 로그아웃
 *
 * ⚠️ POINT(총 보유/사용 가능) 수치는 연동 API가 없어 더미 데이터입니다.
 */

const AUCTION_CATEGORIES = [
  '전자기기', '생활·가구', '패션·의류', '도서·음반', '취미',
  '스포츠·레저', '유아·아동', '뷰티·미용', '식품', '기타',
];

// 더미 포인트 데이터 — 실제 포인트 API 연동 시 교체
const DUMMY_POINT = {
  total: 1420700,
  available: 300500,
};

const LandingHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [pointOpen, setPointOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[100] bg-white shadow-[0px_5px_10px_0px_rgba(0,0,0,0.08)]">
      <div className="container flex items-center justify-between gap-6 h-[82px] flex-wrap">
        {/* 로고 */}
        <Link to="/" className="flex items-center shrink-0">
          <img src={logoImg} alt="에누리컷" className="h-[72px] w-[72px]" />
        </Link>

        {/* 내비게이션 */}
        <nav className="flex items-center gap-8 flex-wrap">
          {/* 경매 (카테고리 드롭다운) */}
          <div
            className="relative"
            onMouseEnter={() => setCategoryOpen(true)}
            onMouseLeave={() => setCategoryOpen(false)}
          >
            <Link to="/auction" className="text-[20px] font-bold text-primary">
              경매
            </Link>
            {categoryOpen && (
              <div className="absolute left-0 top-[calc(100%+14px)] w-[161px] rounded-[5px] border border-[#4e4e4e] bg-white shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)] py-1 z-50">
                {AUCTION_CATEGORIES.map((label, i) => (
                  <Link
                    key={label}
                    to={`/auction?category=${encodeURIComponent(label)}`}
                    className={`flex items-center justify-between px-4 py-2 text-[15px] font-medium text-[#1a1a18] hover:bg-[#f9fafb] ${
                      i === 0 ? 'bg-[#f9fafb]' : ''
                    }`}
                  >
                    {label}
                    <span className="text-[#c4c4c4]">›</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/services" className="text-[20px] font-bold text-[#1a1a18]">서비스</Link>
          <Link to="/customersupport/notice" className="text-[20px] font-bold text-[#1a1a18]">공지사항</Link>
        </nav>

        {/* 우측 액션 영역 */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <Link to="/guide" className="btn btn-ghost" style={{ fontSize: '14px', borderRadius: '30px' }}>
            이용가이드
          </Link>
          {!user && (
            <Link to="/login/signup" className="btn btn-primary" style={{ fontSize: '14px', borderRadius: '30px' }}>
              회원가입
            </Link>
          )}

          {/* 알림 */}
          <div className="relative">
            <button
              type="button"
              title="알림"
              className="relative inline-flex items-center justify-center size-10 rounded-xl bg-[#f3f5fa] text-[#1a1a18]"
              onClick={() => { setNotiOpen((prev) => !prev); setPointOpen(false); }}
            >
              <Bell size={20} />
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-[16px] rounded-full bg-[#e63946] text-white text-[10px] font-bold">
                3
              </span>
            </button>
            {notiOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-[280px] rounded-2xl border border-[#f0efec] bg-white shadow-[0px_16px_40px_0px_rgba(0,0,0,0.14)] z-50">
                <div className="px-4 py-3 text-[13px] text-[#5f5e5a]">새 알림이 없습니다.</div>
              </div>
            )}
          </div>

          {/* 지갑 (POINT 드롭다운) */}
          <div className="relative">
            <button
              type="button"
              title="지갑"
              className="inline-flex items-center justify-center size-10 rounded-xl bg-[#f3f5fa]"
              onClick={() => { setPointOpen((prev) => !prev); setNotiOpen(false); }}
            >
              <img src={walletIcon} alt="지갑" className="size-5" />
            </button>
            {pointOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-[161px] rounded-[5px] border border-[#434343] bg-white shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)] p-3 z-50">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#1a1a18]">POINT</span>
                  <button
                    type="button"
                    className="flex items-center justify-center size-5 rounded-full bg-[#f3f5fa] text-[11px]"
                    onClick={() => navigate('/user/mypage?tab=charge')}
                  >
                    +
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[#5f5e5a]">
                  <span>총 보유포인트</span>
                  <span className="font-bold text-[#1a1a18] text-[12px]">{DUMMY_POINT.total.toLocaleString()}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#5f5e5a] pb-2 border-b border-[#e5e5e5]">
                  <span>사용 가능 포인트</span>
                  <span className="font-bold text-[#1a1a18] text-[12px]">{DUMMY_POINT.available.toLocaleString()}</span>
                </div>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    className="flex-1 h-6 rounded-[5px] bg-primary text-white text-[12px] font-bold"
                    onClick={() => navigate('/user/mypage?tab=charge')}
                  >
                    충전
                  </button>
                  <button
                    type="button"
                    className="flex-1 h-6 rounded-[5px] bg-[#d9d9d9] text-[#1a1a18] text-[12px] font-bold"
                    onClick={() => navigate('/user/mypage?tab=exchange')}
                  >
                    환전
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 마이페이지 */}
          <button
            type="button"
            title="마이페이지"
            className="inline-flex items-center justify-center size-10 rounded-xl bg-[#f3f5fa] text-[#1a1a18]"
            onClick={() => navigate(user ? '/user/mypage' : '/login')}
          >
            <User size={20} />
          </button>

          {user && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '13px', padding: '7px 12px' }}
              onClick={() => { setNotiOpen(false); setPointOpen(false); logout(); }}
            >
              <LogOut size={14} />
              로그아웃
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
