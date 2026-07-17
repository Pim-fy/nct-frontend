// src/layouts/user/headers/SiteHeader.jsx
// Figma: 에누리컷_디자인시안 main.png HEADER (node 1:1362)
// - 로그인 여부와 무관하게 모든 페이지에서 동일한 헤더 구조를 쓰는 것이 디자인 시안 기준이라,
//   기존 LandingHeader/MainHeader(페이지별로 다르게 구현되어 있던 것)를 이 컴포넌트 하나로 통합했다.
// - 아이콘(알림/지갑/마이페이지)은 디자인 시안 원본 라인 아이콘 PNG를 그대로 쓴다
//   (@assets/img/bellIcon.png, walletIcon.png, userIcon.png — main.png의 free-icon-font-* 에셋).
// - 드롭다운(경매 카테고리 / POINT / 마이페이지)은 열림·닫힘 상태가 있는 UI라 절대좌표 포팅 대신
//   시맨틱 Tailwind + 실제 상태관리 방식을 따른다. 바깥 클릭 시 자동으로 닫힌다.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { isProviderAccount, requestMypageMode } from '@utils/providerMode';
import logoImg from '@assets/img/logo.png';
import bellIcon from '@assets/img/bellIcon.png';
import walletIcon from '@assets/img/walletIcon.png';
import userIcon from '@assets/img/userIcon.png';

const AUCTION_CATEGORIES = [
  '전자기기', '생활·가구', '패션·의류', '도서·음반', '취미',
  '스포츠·레저', '유아·아동', '뷰티·미용', '식품', '기타',
];

// ⚠️ POINT/알림 수치는 연동 API가 없어 더미 데이터입니다.
// TODO: 담당자BJN의 포인트(usePointBalance)/알림(useNotifications) API로 교체.
//       단, 이 헤더는 비로그인 공개 페이지에서도 렌더링되므로, 인증 필요 API를
//       무조건 호출하면 401→로그인 강제이동이 발생한다. 로그인 상태일 때만 호출하도록 처리 필요.
const DUMMY_POINT = { total: 1420700, available: 300500 };

// ⚠️ 알림 목록도 연동 전 더미 데이터입니다 (mypage 디자인 시안의 "안읽은 알림" 문구 기준).
// TODO: 담당자BJN의 useNotifications() 로 교체 (로그인 상태에서만 호출).
const NOTI_ITEMS = [
  { text: '입찰가가 갱신되었습니다.', time: '방금 전' },
  { text: '관심 상품 마감 10분 전입니다', time: '10분 전' },
  { text: '새 견적이 도착했습니다', time: '1시간 전' },
];
const NOTI_COUNT = NOTI_ITEMS.length;

const SiteHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [pointOpen, setPointOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const utilRef = useRef(null);

  // 바깥을 클릭하면 열려 있던 팝업(알림/포인트/마이페이지)을 모두 닫는다.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (utilRef.current && !utilRef.current.contains(e.target)) {
        setNotiOpen(false);
        setPointOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 한 팝업을 열면 나머지는 닫는다.
  const openOnly = (which) => {
    setNotiOpen(which === 'noti' ? (v) => !v : false);
    setPointOpen(which === 'point' ? (v) => !v : false);
    setProfileOpen(which === 'profile' ? (v) => !v : false);
  };

  const nickname = user?.nickname || '홍길동';
  // TODO: 실제 회원 역할 API가 붙으면 user.role 등으로 대체 (지금은 @utils/providerMode 의 로컬 플래그).
  const isProvider = isProviderAccount();
  const memberLabel = isProvider ? '제공자' : (user?.roleLabel || '일반회원');

  return (
    <header className="sticky top-0 z-[100] h-[82px] bg-white shadow-[0px_5px_10px_0px_rgba(0,0,0,0.2)]">
      <div className="container flex h-full items-center justify-between gap-8">
        {/* 로고 */}
        <Link to="/" className="flex shrink-0 items-center">
          <img src={logoImg} alt="에누리컷" className="h-[68px] w-auto" />
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
        <div ref={utilRef} className="flex items-center gap-3">
          {!user && (
            <Link
              to="/login/signup"
              className="flex h-[33px] items-center justify-center rounded-[30px] border border-primary bg-primary px-4 text-[14px] font-medium text-white hover:bg-[#0048bf] transition-colors"
            >
              회원가입
            </Link>
          )}

          {/* 알림 */}
          <div className="relative">
            <button
              type="button"
              title="알림"
              className="relative flex size-[39px] items-center justify-center rounded-full bg-[#f3f5fa] hover:bg-[#e9edf5] transition-colors"
              onClick={() => openOnly('noti')}
            >
              <img src={bellIcon} alt="" className="size-[18px]" />
              {NOTI_COUNT > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-[17px] items-center justify-center rounded-full bg-[#e63946] text-[10px] font-medium text-white">
                  {NOTI_COUNT}
                </span>
              )}
            </button>
            {notiOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-[280px] rounded-[10px] border border-[#434343] bg-white p-4 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)] z-50">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[15px] font-bold text-black tracking-[-0.5px]">알림</span>
                    <span className="text-[12px] text-[#0064ff]">{NOTI_COUNT}</span>
                  </span>
                  <button
                    type="button"
                    className="flex size-[22px] items-center justify-center rounded-full bg-[#f3f5fa] text-[13px] text-[#4e4e4e] hover:bg-[#e9edf5]"
                    onClick={() => { setNotiOpen(false); navigate('/user/notification'); }}
                    aria-label="알림함으로 이동"
                  >
                    +
                  </button>
                </div>
                <div className="my-3 h-px bg-[#e5e5e5]" />
                {/* 알림 목록 */}
                <ul className="flex flex-col gap-3">
                  {NOTI_ITEMS.map((item) => (
                    <li key={item.text} className="flex items-start gap-2">
                      <span className="mt-[6px] size-[6px] shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] text-[#333]">{item.text}</p>
                        <p className="text-[11px] text-[#969696]">{item.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                {/* 전체보기 */}
                <button
                  type="button"
                  className="mt-4 h-[34px] w-full rounded-[6px] bg-primary text-[14px] font-bold text-white hover:bg-[#0048bf] transition-colors"
                  onClick={() => { setNotiOpen(false); navigate('/user/notification'); }}
                >
                  알림 전체보기
                </button>
              </div>
            )}
          </div>

          {/* 지갑 → POINT 박스 */}
          <div className="relative">
            <button
              type="button"
              title="포인트 지갑"
              className="flex size-[39px] items-center justify-center rounded-full bg-[#f3f5fa] hover:bg-[#e9edf5] transition-colors"
              onClick={() => openOnly('point')}
            >
              <img src={walletIcon} alt="" className="size-[18px]" />
            </button>
            {pointOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-[230px] rounded-[10px] border border-[#434343] bg-white p-4 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)] z-50">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-black tracking-[-0.5px]">POINT</span>
                  <button
                    type="button"
                    className="flex size-[22px] items-center justify-center rounded-full bg-[#f3f5fa] text-[13px] text-[#4e4e4e] hover:bg-[#e9edf5]"
                    onClick={() => { setPointOpen(false); navigate('/user/point'); }}
                    aria-label="포인트 지갑으로 이동"
                  >
                    +
                  </button>
                </div>
                <div className="my-3 h-px bg-[#e5e5e5]" />
                {/* 잔액 */}
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[#4e4e4e]">총 보유포인트</span>
                  <span className="text-[14px] font-bold text-black">{DUMMY_POINT.total.toLocaleString()}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#4e4e4e]">사용 가능 포인트</span>
                  <span className="text-[14px] font-bold text-black">{DUMMY_POINT.available.toLocaleString()}</span>
                </div>
                {/* 액션 */}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="h-[34px] flex-1 rounded-[6px] bg-primary text-[14px] font-bold text-white hover:bg-[#0048bf] transition-colors"
                    onClick={() => { setPointOpen(false); navigate('/user/point?tab=charge'); }}
                  >
                    충전
                  </button>
                  <button
                    type="button"
                    className="h-[34px] flex-1 rounded-[6px] bg-[#d9d9d9] text-[14px] font-bold text-[#4e4e4e] hover:bg-[#cfcfcf] transition-colors"
                    onClick={() => { setPointOpen(false); navigate('/user/point?tab=exchange'); }}
                  >
                    환전
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 마이페이지 → 프로필 박스 */}
          <div className="relative">
            <button
              type="button"
              title="마이페이지"
              className="flex size-[39px] items-center justify-center rounded-full bg-[#f3f5fa] hover:bg-[#e9edf5] transition-colors"
              onClick={() => (user ? openOnly('profile') : navigate('/login'))}
            >
              <img src={userIcon} alt="" className="size-[18px]" />
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-[230px] rounded-[10px] border border-[#434343] bg-white p-4 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)] z-50">
                {/* 헤더 - 로그인 상태일 때만 닉네임/등급을 노출하고, 비로그인 시에는 안내 문구를 보여준다 */}
                <div className="flex items-center justify-between">
                  {user ? (
                    <span className="flex items-baseline gap-1.5">
                      <span className="text-[15px] font-bold text-black tracking-[-0.5px]">{nickname}</span>
                      <span className="text-[12px] text-[#969696]">{memberLabel}</span>
                    </span>
                  ) : (
                    <span className="text-[14px] text-[#969696]">로그인이 필요합니다</span>
                  )}
                  <button
                    type="button"
                    className="flex size-[22px] items-center justify-center rounded-full bg-[#f3f5fa] text-[13px] text-[#4e4e4e] hover:bg-[#e9edf5]"
                    onClick={() => { setProfileOpen(false); navigate(user ? '/user/mypage' : '/login'); }}
                    aria-label={user ? '마이페이지로 이동' : '로그인으로 이동'}
                  >
                    +
                  </button>
                </div>
                <div className="my-3 h-px bg-[#e5e5e5]" />
                {/* 액션 */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="h-[36px] rounded-[6px] bg-primary text-[14px] font-medium text-white hover:bg-[#0048bf] transition-colors"
                    onClick={() => {
                      setProfileOpen(false);
                      if (isProvider) {
                        // 이미 제공자 권한이 있으면 일반모드 마이페이지로 전환한다.
                        requestMypageMode('general');
                        navigate('/user/mypage');
                      } else {
                        navigate('/provider/apply');
                      }
                    }}
                  >
                    {isProvider ? '일반모드 변경' : '제공자 신청'}
                  </button>
                  {user ? (
                    <button
                      type="button"
                      className="h-[36px] rounded-[6px] border border-primary text-[14px] font-medium text-primary hover:bg-[#f0f6ff] transition-colors"
                      onClick={() => { setProfileOpen(false); logout(); }}
                    >
                      로그아웃
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="h-[36px] rounded-[6px] border border-primary text-[14px] font-medium text-primary hover:bg-[#f0f6ff] transition-colors"
                      onClick={() => { setProfileOpen(false); navigate('/login'); }}
                    >
                      로그인
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
