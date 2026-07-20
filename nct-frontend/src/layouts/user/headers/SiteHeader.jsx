// src/layouts/user/headers/SiteHeader.jsx
// Figma: 에누리컷_디자인시안 main.png HEADER (node 1:1362)
// - 로그인 여부와 무관하게 모든 페이지에서 동일한 헤더 구조를 쓰는 것이 디자인 시안 기준이라,
//   기존 LandingHeader/MainHeader(페이지별로 다르게 구현되어 있던 것)를 이 컴포넌트 하나로 통합했다.
// - 아이콘(알림/지갑/마이페이지)은 디자인 시안 원본 라인 아이콘 PNG를 그대로 쓴다
//   (@assets/img/bellIcon.png, walletIcon.png, userIcon.png — main.png의 free-icon-font-* 에셋).
// - 드롭다운(경매/서비스 카테고리 · POINT · 마이페이지)은 열림·닫힘 상태가 있는 UI라 절대좌표 포팅 대신
//   시맨틱 Tailwind + 실제 상태관리 방식을 따른다. 바깥 클릭 시 자동으로 닫힌다.
// - 모바일(md 미만)에서는 경매/서비스/공지사항 메뉴를 숨기고 햄버거 토글로 전체 화면 메뉴를 연다.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { useNotifications } from '@hooks/useNotification';
import { usePointBalance } from '@hooks/usePoint';
import relativeTime from '@utils/relativeTime';
import { isProviderAccount, requestMypageMode } from '@utils/providerMode';
import QuickActions from '@components/landing/QuickActions';
import logoImg from '@assets/img/logo.png';
import bellIcon from '@assets/img/bellIcon.png';
import walletIcon from '@assets/img/walletIcon.png';
import userIcon from '@assets/img/userIcon.png';
import micIcon from '@assets/img/micIcon.png';

// 스크롤해서 상단 공지 띠(NoticeStrip)가 화면 밖으로 나가면, 헤더 중앙에 같은 문구를
// 연한 그레이 색상으로 자동 롤링(교체)해서 계속 보여준다.
// TODO: 실제 공지 API가 붙으면 이 배열을 공지 목록 조회 결과로 교체한다.
const SITE_NOTICES = [
  '[점검] 서비스 점검 안내 · 6월 22일 02:00~04:00 포인트 충전 및 환전 메뉴 점검',
  '경매/서비스 요청 시 실시간 알림을 받아보세요.',
  '지금 회원가입하면 쿠폰을 드립니다.',
];
const NOTICE_ROTATE_MS = 3500;
const NOTICE_SCROLL_THRESHOLD = 48; // NoticeStrip 높이 정도 스크롤하면 전환

const AUCTION_CATEGORIES = [
  '전자기기', '생활·가구', '패션·의류', '도서·음반', '취미',
  '스포츠·레저', '유아·아동', '뷰티·미용', '식품', '기타',
];

// 담당자 7 · CATEGORY(CATC0002)와 같은 서비스 5개를 표시한다.
// 설치와 수리는 하나의 카테고리(설치·수리)이므로 헤더에서도 분리하지 않는다.
const SERVICE_CATEGORIES = ['이사', '청소', '레슨', '설치·수리', '인테리어'];

// 헤더 메뉴 기본 텍스트 색상(#333333) - 마우스오버 시에만 primary 파랑으로 바뀐다.
const NAV_LINK_CLASS = "text-[20px] font-bold text-[#333333] tracking-[-0.02em] hover:text-primary transition-colors";

// POINT/알림 수치 실연동 (담당자6 BJN, 2026-07-18) — 종전 더미 상수(DUMMY_POINT/NOTI_ITEMS) 제거.
// 이 헤더는 비로그인 공개 페이지에서도 렌더링되므로, 두 훅 모두 { enabled: 로그인여부 }로
// 로그인 상태일 때만 API를 호출한다 (무조건 호출하면 401→로그인 강제이동이 발생하기 때문).
// 헤더 드롭다운에 보여줄 최근 안읽은 알림 최대 개수
const NOTI_PREVIEW_MAX = 5;

const SiteHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 알림·포인트 실데이터 — 로그인 상태일 때만 호출 (비로그인 401 방지)
  const notiQuery = useNotifications({ enabled: !!user });
  const balanceQuery = usePointBalance({ enabled: !!user });
  // 안읽은 알림: 배지 숫자와 드롭다운 목록의 공통 원천
  const unreadNotis = (notiQuery.data ?? []).filter((n) => !n.read);
  const notiCount = user ? unreadNotis.length : 0;
  // 잔액은 조회 전(로딩·비로그인)에는 0으로 표시 — 임의 기본값이 아니라 "아직 모름"의 화면 표기
  const pointBalance = balanceQuery.data ?? { total: 0, available: 0 };
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [pointOpen, setPointOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAuctionOpen, setMobileAuctionOpen] = useState(false);
  const [mobileServiceOpen, setMobileServiceOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [noticeIndex, setNoticeIndex] = useState(0);

  const utilRef = useRef(null);

  // 스크롤이 임계값을 넘으면(= 상단 NoticeStrip이 화면 밖으로 나가면) 헤더 중앙에 롤링 티커를 보여준다.
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > NOTICE_SCROLL_THRESHOLD);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 롤링 티커 자동 전환 (스크롤로 보이는 동안에만 굳이 돌릴 필요 없지만, 인덱스는 계속 유지해도 무해하다)
  useEffect(() => {
    const timer = setInterval(() => {
      setNoticeIndex((i) => (i + 1) % SITE_NOTICES.length);
    }, NOTICE_ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

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

  // 모바일 전체화면 메뉴가 열려있는 동안 배경 스크롤을 막는다.
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // 한 팝업을 열면 나머지는 닫는다.
  const openOnly = (which) => {
    setNotiOpen(which === 'noti' ? (v) => !v : false);
    setPointOpen(which === 'point' ? (v) => !v : false);
    setProfileOpen(which === 'profile' ? (v) => !v : false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileAuctionOpen(false);
    setMobileServiceOpen(false);
  };

  const nickname = user?.nickname || '홍길동';
  // TODO: 실제 회원 역할 API가 붙으면 user.role 등으로 대체 (지금은 @utils/providerMode 의 로컬 플래그).
  const isProvider = isProviderAccount();
  const memberLabel = isProvider ? '제공자' : (user?.roleLabel || '일반회원');

  return (
    <>
    <header className="sticky top-0 z-[100] h-[82px] bg-white shadow-[0px_5px_10px_0px_rgba(0,0,0,0.2)]">
      <div className="container relative flex h-full items-center justify-between gap-8">
        {/* 로고 + 메뉴 - 디자인 시안처럼 로고 바로 우측에 붙여 왼쪽에 묶어둔다 */}
        <div className="flex items-center gap-10">
          <Link to="/" className="flex shrink-0 items-center">
            <img src={logoImg} alt="에누리컷" className="h-[58px] w-auto" />
          </Link>

          {/* 메뉴 (데스크톱) */}
          <nav className="hidden md:flex items-center gap-8">
            <div
              className="relative"
              onMouseEnter={() => setCategoryOpen(true)}
              onMouseLeave={() => setCategoryOpen(false)}
            >
              <Link to="/auction" className={NAV_LINK_CLASS}>
                경매
              </Link>
              {categoryOpen && (
                // top-full(간격 0) + pt-[14px]로 "보이는 간격"만 안쪽 패딩으로 만든다.
                // 예전처럼 바깥에 실제 14px 여백을 두면 그 사이를 지나갈 때 마우스가
                // 래퍼 밖으로 나가버려(hover 대상이 없는 빈 공간) 드롭다운이 닫혀버렸다.
                <div className="absolute left-0 top-full w-[161px] pt-[14px] z-50">
                  <div className="rounded-[5px] border border-[#4e4e4e] bg-white py-1 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)]">
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
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => setServiceMenuOpen(true)}
              onMouseLeave={() => setServiceMenuOpen(false)}
            >
              <Link to="/services" className={NAV_LINK_CLASS}>
                서비스
              </Link>
              {serviceMenuOpen && (
                <div className="absolute left-0 top-full w-[161px] pt-[14px] z-50">
                  <div className="rounded-[5px] border border-[#4e4e4e] bg-white py-1 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)]">
                    {SERVICE_CATEGORIES.map((label, i) => (
                      <Link
                        key={label}
                        to={`/services?category=${encodeURIComponent(label)}`}
                        className={`flex items-center justify-between px-4 py-[7px] text-[16px] font-medium hover:bg-[#f9fafb] ${
                          i === 0 ? 'bg-[#f9fafb] font-bold text-primary' : 'text-black'
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/customersupport/notice" className={NAV_LINK_CLASS}>공지사항</Link>
          </nav>
        </div>

        {/* 스크롤 시 헤더 중앙에 뜨는 연한 그레이 공지 롤링 티커 (NoticeStrip이 화면 밖으로 나간 뒤 대신 보여줌) */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-[#f3f5fa] px-4 py-2 text-[13px] text-[#4e4e4e] transition-opacity duration-300 md:flex"
          style={{ opacity: scrolled ? 1 : 0 }}
        >
          <img src={micIcon} alt="" width={14} height={14} className="shrink-0 opacity-70" />
          <span className="max-w-[420px] truncate">{SITE_NOTICES[noticeIndex]}</span>
        </div>

        {/* 우측 유틸 영역 */}
        <div ref={utilRef} className="flex items-center gap-3">
          {!user && (
            <Link
              to="/login/signup"
              className="hidden md:flex h-[33px] items-center justify-center rounded-[30px] border border-primary bg-primary px-4 text-[14px] font-medium text-white hover:bg-[#0048bf] transition-colors"
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
              {notiCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-[17px] items-center justify-center rounded-full bg-[#e63946] text-[10px] font-medium text-white">
                  {notiCount}
                </span>
              )}
            </button>
            {notiOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-[280px] rounded-[10px] border border-[#434343] bg-white p-4 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)] z-50">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[15px] font-bold text-black tracking-[-0.5px]">알림</span>
                    <span className="text-[12px] text-[#0064ff]">{notiCount}</span>
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
                {/* 알림 목록 — 안읽은 알림 최근 N건, 없으면 안내 문구 */}
                {unreadNotis.length === 0 ? (
                  <p className="py-2 text-center text-[13px] text-[#969696]">새 알림이 없습니다.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {unreadNotis.slice(0, NOTI_PREVIEW_MAX).map((item) => (
                      <li key={item.id} className="flex items-start gap-2">
                        <span className="mt-[6px] size-[6px] shrink-0 rounded-full bg-primary" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] text-[#333]">{item.title}</p>
                          <p className="text-[11px] text-[#969696]">{relativeTime(item.regDt)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
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
          <div className="relative hidden sm:block">
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
                  <span className="text-[14px] font-bold text-black">{(pointBalance.total ?? 0).toLocaleString()}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#4e4e4e]">사용 가능 포인트</span>
                  <span className="text-[14px] font-bold text-black">{(pointBalance.available ?? 0).toLocaleString()}</span>
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
          <div className="relative hidden sm:block">
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

          {/* 모바일 전용 햄버거 토글 */}
          <button
            type="button"
            aria-label="전체 메뉴 열기"
            className="flex md:hidden size-[39px] items-center justify-center rounded-full bg-[#f3f5fa]"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* 모바일 전체화면 메뉴 */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-white md:hidden">
          <div className="flex h-[82px] shrink-0 items-center justify-between border-b border-[#f0f0f0] px-4">
            <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
              <img src={logoImg} alt="에누리컷" className="h-[48px] w-auto" />
            </Link>
            <button
              type="button"
              aria-label="메뉴 닫기"
              className="flex size-[39px] items-center justify-center rounded-full bg-[#f3f5fa]"
              onClick={closeMobileMenu}
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-2">
            {/* 경매 (아코디언) */}
            <div className="border-b border-[#f0f0f0]">
              <button
                type="button"
                className="flex w-full items-center justify-between py-4 text-[20px] font-bold text-[#333333]"
                onClick={() => setMobileAuctionOpen((v) => !v)}
              >
                경매
                <ChevronRight size={20} className={`transition-transform ${mobileAuctionOpen ? 'rotate-90' : ''}`} />
              </button>
              {mobileAuctionOpen && (
                <div className="flex flex-col gap-1 pb-3 pl-2">
                  <Link to="/auction" className="py-2 text-[16px] font-bold text-primary" onClick={closeMobileMenu}>
                    전체보기
                  </Link>
                  {AUCTION_CATEGORIES.map((label) => (
                    <Link
                      key={label}
                      to={`/auction?category=${encodeURIComponent(label)}`}
                      className="py-2 text-[15px] text-[#4e4e4e]"
                      onClick={closeMobileMenu}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* 서비스 (아코디언) */}
            <div className="border-b border-[#f0f0f0]">
              <button
                type="button"
                className="flex w-full items-center justify-between py-4 text-[20px] font-bold text-[#333333]"
                onClick={() => setMobileServiceOpen((v) => !v)}
              >
                서비스
                <ChevronRight size={20} className={`transition-transform ${mobileServiceOpen ? 'rotate-90' : ''}`} />
              </button>
              {mobileServiceOpen && (
                <div className="flex flex-col gap-1 pb-3 pl-2">
                  <Link to="/services" className="py-2 text-[16px] font-bold text-primary" onClick={closeMobileMenu}>
                    전체보기
                  </Link>
                  {SERVICE_CATEGORIES.map((label) => (
                    <Link
                      key={label}
                      to={`/services?category=${encodeURIComponent(label)}`}
                      className="py-2 text-[15px] text-[#4e4e4e]"
                      onClick={closeMobileMenu}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/customersupport/notice"
              className="block border-b border-[#f0f0f0] py-4 text-[20px] font-bold text-[#333333]"
              onClick={closeMobileMenu}
            >
              공지사항
            </Link>

            {!user && (
              <Link
                to="/login/signup"
                className="mt-6 flex h-[44px] items-center justify-center rounded-[30px] bg-primary text-[15px] font-medium text-white"
                onClick={closeMobileMenu}
              >
                회원가입
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
    {/* 퀵메뉴(경매등록/서비스요청 등)를 헤더 컴포넌트에 포함시켜 모든 페이지에서 우측에 고정 노출한다. */}
    <QuickActions />
    </>
  );
};

export default SiteHeader;
