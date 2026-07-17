// src/layouts/user/headers/SiteHeader.jsx
// Figma: 에누리컷_디자인시안 HEADER (main:1:1362, mypage_01일반:18:318, 프로필수정:28:...)
// - 로그인 여부와 무관하게 모든 페이지에서 동일한 헤더 구조를 쓰는 것이 디자인 시안 기준이라,
//   기존 LandingHeader/MainHeader(로그인 페이지별로 서로 다르게 구현되어 있던 것)를 이 컴포넌트 하나로 통합했다.
// - 드롭다운(메가메뉴/포인트/마이페이지)은 실제 열림·닫힘 상태가 있는 UI라 ScaledStage 절대좌표 포팅 대신
//   시맨틱 Tailwind + 실제 상태관리 방식을 따른다(ReviewWritePage.jsx와 동일한 컨벤션 선택 이유).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import logoImg from '@assets/img/logo.png';
import walletIcon from '@assets/img/walletIcon.png';

const AUCTION_CATEGORIES = [
  '전자기기', '생활·가구', '패션·의류', '도서·음반', '취미',
  '스포츠·레저', '유아·아동', '뷰티·미용', '식품', '기타',
];

// ⚠️ 포인트/알림 수치는 연동 API가 없어 더미 데이터입니다.
const DUMMY_POINT = { total: 1420700, available: 300500 };
const NOTI_COUNT = 3;

const SiteHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [pointOpen, setPointOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);

  const closeOthers = () => {
    setPointOpen(false);
    setProfileOpen(false);
    setNotiOpen(false);
  };

  return (
    <header className="sticky top-0 z-[100] h-[82px] bg-white shadow-[0px_5px_10px_0px_rgba(0,0,0,0.2)]">
      <div className="container flex h-full items-center justify-between gap-8">
        {/* 로고 */}
        <Link to="/" className="flex shrink-0 items-center">
          <img src={logoImg} alt="에누리컷" className="h-[56px] w-auto" />
        </Link>

        {/* 메뉴 */}
        <nav className="flex items-center gap-8">
          <div
            className="relative"
            onMouseEnter={() => setCategoryOpen(true)}
            onMouseLeave={() => setCategoryOpen(false)}
          >
            <Link to="/auction" className="text-[20px] font-bold text-primary tracking-[-0.02em]">
              경매
            </Link>
            {categoryOpen && (
              <div className="absolute left-0 top-[calc(100%+14px)] w-[161px] rounded-[5px] border border-[#4e4e4e] bg-white py-1 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)] z-50">
                {AUCTION_CATEGORIES.map((label, i) => (
                  <Link
                    key={label}
                    to={`/auction?category=${encodeURIComponent(label)}`}
                    className={`flex items-center justify-between px-4 py-[7px] text-[16px] font-medium hover:bg-[#f9fafb] ${
                      i === 0 ? 'bg-[#f9fafb] font-bold text-primary' : 'text-black'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/services" className="text-[20px] font-bold text-black tracking-[-0.02em]">서비스</Link>
          <Link to="/customersupport/notice" className="text-[20px] font-bold text-black tracking-[-0.02em]">공지사항</Link>
        </nav>

        {/* 우측 유틸 영역 */}
        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Link
                to="/guide"
                className="flex h-[33px] items-center justify-center rounded-[30px] border border-[#d9d9d9] px-4 text-[14px] font-medium text-black"
              >
                이용가이드
              </Link>
              <Link
                to="/login/signup"
                className="flex h-[33px] items-center justify-center rounded-[30px] border border-primary bg-primary px-4 text-[14px] font-medium text-white"
              >
                회원가입
              </Link>
            </>
          )}

          {user && (
            <>
              {/* 알림 */}
              <div className="relative">
                <button
                  type="button"
                  title="알림"
                  className="relative flex size-[39px] items-center justify-center rounded-full bg-[#f3f5fa]"
                  onClick={() => { const next = !notiOpen; closeOthers(); setNotiOpen(next); }}
                >
                  <Bell size={18} className="text-black" />
                  {NOTI_COUNT > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex size-[17px] items-center justify-center rounded-full bg-[#e63946] text-[10px] font-medium text-white">
                      {NOTI_COUNT}
                    </span>
                  )}
                </button>
                {notiOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-[280px] rounded-2xl border border-[#f0efec] bg-white p-4 text-[13px] text-[#5f5e5a] shadow-[0px_16px_40px_0px_rgba(0,0,0,0.14)] z-50">
                    새 알림이 없습니다.
                  </div>
                )}
              </div>

              {/* 지갑 / 포인트 */}
              <div className="relative">
                <button
                  type="button"
                  title="지갑"
                  className="flex size-[39px] items-center justify-center rounded-full bg-[#f3f5fa]"
                  onClick={() => { const next = !pointOpen; closeOthers(); setPointOpen(next); }}
                >
                  <img src={walletIcon} alt="" className="size-[18px]" />
                </button>
                {pointOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-[161px] rounded-[5px] border border-[#434343] bg-white p-3 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)] z-50">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black">POINT</span>
                      <button
                        type="button"
                        className="flex size-5 items-center justify-center rounded-full bg-[#f3f5fa] text-[11px]"
                        onClick={() => navigate('/user/mypage?tab=charge')}
                      >
                        +
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[#5f5e5a]">
                      <span>총 보유포인트</span>
                      <span className="text-[12px] font-bold text-black">{DUMMY_POINT.total.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between border-b border-[#e5e5e5] pb-2 text-[11px] text-[#5f5e5a]">
                      <span>사용 가능 포인트</span>
                      <span className="text-[12px] font-bold text-black">{DUMMY_POINT.available.toLocaleString()}</span>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <button
                        type="button"
                        className="h-6 flex-1 rounded-[5px] bg-primary text-[12px] font-bold text-white"
                        onClick={() => navigate('/user/mypage?tab=charge')}
                      >
                        충전
                      </button>
                      <button
                        type="button"
                        className="h-6 flex-1 rounded-[5px] bg-[#d9d9d9] text-[12px] font-bold text-black"
                        onClick={() => navigate('/user/mypage?tab=exchange')}
                      >
                        환전
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 마이페이지 */}
              <div className="relative">
                <button
                  type="button"
                  title="마이페이지"
                  className="flex size-[39px] items-center justify-center rounded-full bg-[#f3f5fa]"
                  onClick={() => { const next = !profileOpen; closeOthers(); setProfileOpen(next); }}
                >
                  <User size={18} className="text-black" />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+10px)] w-[161px] rounded-[5px] border border-[#434343] bg-white p-3 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)] z-50">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-black">{user.nickname || '고객'}</span>
                      <span className="rounded-[20px] bg-[#f3f5fa] px-2 py-[3px] text-[11px] text-[#4e4e4e]">일반회원</span>
                    </div>
                    <div className="mt-2 flex flex-col gap-1.5 border-t border-[#e5e5e5] pt-2">
                      <button
                        type="button"
                        className="h-[28px] rounded-[5px] bg-primary text-[12px] font-medium text-white"
                        onClick={() => navigate('/provider/apply')}
                      >
                        제공자 신청
                      </button>
                      <button
                        type="button"
                        className="h-[28px] rounded-[5px] border border-primary text-[12px] font-medium text-primary"
                        onClick={() => { closeOthers(); logout(); }}
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
