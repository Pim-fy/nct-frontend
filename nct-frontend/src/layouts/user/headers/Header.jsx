// src/layouts/user/headers/Header.jsx
// Figma: 에누리컷_디자인시안 main.png HEADER (node 1:1362)
// - 로그인 여부와 무관하게 모든 페이지에서 동일한 헤더 구조를 쓰는 것이 디자인 시안 기준이라,
//   기존 LandingHeader/MainHeader(페이지별로 다르게 구현되어 있던 것)를 이 컴포넌트 하나로 통합했다
//   (LandingHeader/MainHeader는 이후 완전히 제거되어, 이 컴포넌트도 SiteHeader에서 Header로 개명했다).
// - 아이콘(알림/지갑/마이페이지)은 디자인 시안 원본 라인 아이콘 PNG를 그대로 쓴다
//   (@assets/img/bellIcon.png, walletIcon.png, userIcon.png — main.png의 free-icon-font-* 에셋).
// - 드롭다운(경매/서비스 카테고리 · POINT · 마이페이지)은 열림·닫힘 상태가 있는 UI라 절대좌표 포팅 대신
//   시맨틱 Tailwind + 실제 상태관리 방식을 따른다. 바깥 클릭 시 자동으로 닫힌다.
// - 모바일(md 미만)에서는 경매/서비스/고객센터 메뉴를 숨기고 햄버거 토글로 전체 화면 메뉴를 연다.
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, X, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '@hooks/useAuth';
import { useMyProviderApplications } from '@hooks/useProviderApplications';
import { useMarkRead, useNotifications } from '@hooks/useNotification';
import { useNotificationStream } from '@hooks/useNotificationStream';
import { usePointBalance } from '@hooks/usePoint';
import { usePublicNoticeList } from '@hooks/usePublicNotices';
import relativeTime from '@utils/relativeTime';
import { requestPointExchange, convertPoint } from '@api/pointApi';
import { SITE_HEADER_VISIBILITY_EVENT } from '@/constants/layoutEvents';
import { SITE_HEADER_SEARCH_SLOT_ID } from '@components/common/HeaderSearchPortal';
import HeaderCreateAction from '@components/common/HeaderCreateAction';
import ScrollToTopButton from '@components/common/ScrollToTopButton';
import NotificationDetailModal from '@pages/user/notification/components/NotificationDetailModal';
import PointChargeWidgetModal from '@pages/user/point/components/PointChargeWidgetModal';
import PointAmountModal from '@pages/user/point/components/PointAmountModal';
import logoImg from '@assets/img/logo.png';
import bellIcon from '@assets/img/bellIcon.png';
import walletIcon from '@assets/img/walletIcon.png';
import userIcon from '@assets/img/userIcon.png';
import micIcon from '@assets/img/micIcon.png';

const NOTICE_ROTATE_MS = 3500;
const NOTICE_SCROLL_THRESHOLD = 48; // NoticeStrip 높이 정도 스크롤하면 전환

const AUCTION_CATEGORIES = [
  '전자기기', '생활·가구', '패션·의류', '도서·음반', '취미',
  '스포츠·레저', '유아·아동', '뷰티·미용', '식품', '기타',
];

// 담당자 7 · CATEGORY(CATC0002)와 같은 서비스 5개를 표시한다.
// 설치와 수리는 하나의 카테고리(설치·수리)이므로 헤더에서도 분리하지 않는다.
const SERVICE_CATEGORIES = ['이사', '청소', '레슨', '설치·수리', '인테리어'];

// POINT/알림 수치 실연동 (담당자6 BJN, 2026-07-18) — 종전 더미 상수(DUMMY_POINT/NOTI_ITEMS) 제거.
// 이 헤더는 비로그인 공개 페이지에서도 렌더링되므로, 두 훅 모두 { enabled: 로그인여부 }로
// 로그인 상태일 때만 API를 호출한다 (무조건 호출하면 401→로그인 강제이동이 발생하기 때문).
// 헤더 드롭다운에 보여줄 알림 최대 개수 (안읽은 알림 미리보기 · 과거 알림 목록 공통)
const NOTI_PREVIEW_MAX = 5;

const Header = () => {
  // isProvider·switchMode: 제공자 모드전환 실연동 (F-PROV-008, 담당자6 BJN, 2026-07-24)
  // — 종전 localStorage 가짜 플래그(@utils/providerMode) 대신 서버가 내려준 실제 역할 기준.
  const {
    user,
    loading: authLoading,
    logout,
    isProvider,
    switchMode,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const queryClient = useQueryClient();

  // 제공자 승인 여부 — 일반모드 로그인 상태일 때만 호출 (비로그인·이미 제공자 모드면 불필요)
  const { data: myProviderApps = [] } = useMyProviderApplications({
    enabled: !!user && !isProvider,
  });
  const isProviderApproved = myProviderApps.some((app) => app.statusCode === 'PRVC0003');

  // 공지사항 롤링 티커 — 비로그인 포함 모든 화면에서 표시
  const { data: noticeData } = usePublicNoticeList({ page: 1, size: 5 });
  const siteNotices = (noticeData?.items ?? []).map(
    (n) => `[${n.typeName ?? '공지'}] ${n.title}`,
  );

  // 알림·포인트 실데이터 — 로그인 상태일 때만 호출 (비로그인 401 방지)
  const notiQuery = useNotifications({ enabled: !!user });
  useNotificationStream(!!user); // 실시간 push 구독 — 새 알림 오면 notiQuery를 자동 invalidate
  const markReadMutation = useMarkRead();
  const [selectedNoti, setSelectedNoti] = useState(null); // 클릭한 알림 상세 팝업
  const balanceQuery = usePointBalance({ enabled: !!user });
  // 헤더 POINT 드롭다운의 충전/환전 버튼 → 마이페이지로 이동하지 않고 이 자리에서 바로 모달을 띄운다
  // (종전엔 /user/mypage?section=wallet&action=... 로 이동시켜 페이지 도착 후 모달을 열었으나,
  // 사용자 요청으로 페이지 이동 없이 헤더에서 바로 처리하도록 변경, 2026-07-24)
  const [pointModal, setPointModal] = useState(null); // null | 'charge' | 'exchange' | 'convert'
  // 안읽은 알림: 배지 숫자와 드롭다운 목록의 공통 원천
  const unreadNotis = (notiQuery.data ?? []).filter((n) => !n.read);
  const notiCount = user ? unreadNotis.length : 0;
  // 안읽은 우선 + 읽은 알림을 합쳐 드롭다운에 최대 NOTI_PREVIEW_MAX(5)개만 미리보기
  const readNotis = (notiQuery.data ?? []).filter((n) => n.read);
  const previewNotis = [...unreadNotis, ...readNotis].slice(0, NOTI_PREVIEW_MAX);
  // 잔액은 조회 전(로딩·비로그인)에는 0으로 표시 — 임의 기본값이 아니라 "아직 모름"의 화면 표기
  const pointBalance = balanceQuery.data ?? { total: 0, available: 0 };
  const [categoryHovered, setCategoryHovered] = useState(false);
  const categoryOpen = categoryHovered;

  const [serviceHovered, setServiceHovered] = useState(false);
  const serviceMenuOpen = isProvider && serviceHovered;
  const serviceMenuPath = isProvider ? '/service' : '/service-requests/new';

  const [customerHovered, setCustomerHovered] = useState(false);
  const customerOpen = customerHovered;

  const [notiOpen, setNotiOpen] = useState(false);
  const [pointOpen, setPointOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAuctionOpen, setMobileAuctionOpen] = useState(false);
  const [mobileServiceOpen, setMobileServiceOpen] = useState(false);
  const [mobileCustomerOpen, setMobileCustomerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const [isPageHidden, setIsPageHidden] = useState(false);
  const isAuctionSearchRoute = pathname === '/auction'
    || /^\/auction\/[^/]+$/.test(pathname);
  const isServiceSearchRoute = isProvider && (
    pathname === '/service' || /^\/service-requests\/\d+$/.test(pathname)
  );
  const hasHeaderSearch = isAuctionSearchRoute || isServiceSearchRoute;
  // 현재 보고 있는 화면이 헤더의 어느 메뉴에 속하는지 — 호버와 무관하게 항상 활성 색상을 보여준다.
  const isAuctionMenuActive = pathname.startsWith('/auction');
  const isServiceMenuActive = pathname.startsWith('/service') || pathname.startsWith('/provider/quotes');
  const isCustomerMenuActive = pathname.startsWith('/customersupport') || pathname.startsWith('/guide');
  let headerCreateActionType = null;
  const canShowCreateAction = !authLoading && (!user || user.role === 'ROLE_USER');
  if (canShowCreateAction) {
    if (isAuctionSearchRoute) {
      headerCreateActionType = 'auction';
    } else if (isServiceSearchRoute) {
      headerCreateActionType = 'service';
    }
  }

  const utilRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    const handleVisibilityChange = (event) => {
      const hidden = Boolean(event.detail?.hidden);
      setIsPageHidden(hidden);
      if (!hidden) return;

      setNotiOpen(false);
      setPointOpen(false);
      setProfileOpen(false);
      setCategoryHovered(false);
      setServiceHovered(false);
      setCustomerHovered(false);
    };

    window.addEventListener(SITE_HEADER_VISIBILITY_EVENT, handleVisibilityChange);
    return () => window.removeEventListener(
      SITE_HEADER_VISIBILITY_EVENT,
      handleVisibilityChange,
    );
  }, []);

  // 스크롤이 임계값을 넘으면(= 상단 NoticeStrip이 화면 밖으로 나가면) 헤더 중앙에 롤링 티커를 보여준다.
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > NOTICE_SCROLL_THRESHOLD);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 롤링 티커 자동 전환 — siteNotices 길이 기준
  useEffect(() => {
    if (siteNotices.length <= 1) return;
    const timer = setInterval(() => {
      setNoticeIndex((i) => (i + 1) % siteNotices.length);
    }, NOTICE_ROTATE_MS);
    return () => clearInterval(timer);
  }, [siteNotices.length]);

  // 바깥을 클릭하면 열려 있던 팝업과 nav 드롭다운을 닫는다.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (utilRef.current && !utilRef.current.contains(e.target)) {
        setNotiOpen(false);
        setPointOpen(false);
        setProfileOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target)) {
        setCategoryHovered(false);
        setServiceHovered(false);
        setCustomerHovered(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 모바일 전체화면 메뉴가 열려있는 동안 배경 스크롤을 막는다.
  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const currentPaddingRight = Number.parseFloat(
      window.getComputedStyle(document.body).paddingRight,
    ) || 0;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [mobileMenuOpen]);

  // 한 팝업을 열면 나머지는 닫는다.
  const openOnly = (which) => {
    // 담당자 7: 비회원은 알림·포인트 팝업을 열지 않고 로그인 후 현재 화면으로 돌아오게 한다.
    if (which === 'noti' || which === 'point') {
      if (authLoading) return;
      if (!user) {
        setNotiOpen(false);
        setPointOpen(false);
        setProfileOpen(false);
        if (pathname === '/login') return;

        const loginRedirectFrom = `${location.pathname}${location.search}${location.hash}`;
        sessionStorage.setItem('loginRedirectFrom', loginRedirectFrom);
        navigate('/login', { state: { from: location } });
        return;
      }
    }

    closeMobileMenu(); // 모바일 전체메뉴가 열려 있으면 알림·지갑·프로필을 열 때 같이 닫는다 (겹침 방지)

    setNotiOpen(which === 'noti' ? (v) => !v : false);
    setPointOpen(which === 'point' ? (v) => !v : false);
    setProfileOpen(which === 'profile' ? (v) => !v : false);
  };

  // 헤더 POINT 드롭다운의 전환 모달 제출 — PointWalletPage의 submitAmount('convert')와 같은 로직
  const submitHeaderConvert = (amount) => {
    if (!Number.isInteger(amount) || amount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: '금액을 확인해 주세요',
        text: '전환 금액은 1P 이상의 정수만 가능합니다.',
        confirmButtonColor: '#0064ff',
      });
      return;
    }
    setPointModal(null);
    convertPoint(amount)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['point'] });
        Swal.fire({
          icon: 'success',
          title: '전환 완료',
          text: '정산 가능 포인트가 사용 가능 포인트로 전환되었습니다.',
          confirmButtonColor: '#0064ff',
        });
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: '전환 실패',
          text: err?.response?.data?.message ?? '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          confirmButtonColor: '#0064ff',
        });
      });
  };

  // 헤더 POINT 드롭다운의 환전 모달 제출 — PointWalletPage의 submitAmount('exchange')와 같은 로직
  // (검증 → API 호출 → 포인트 캐시 갱신 → 결과 안내). 충전은 결제위젯이 자체 API를 처리하므로 별도 핸들러가 없다.
  const submitHeaderExchange = (amount) => {
    if (!Number.isInteger(amount) || amount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: '금액을 확인해 주세요',
        text: '환전 금액은 1P 이상의 정수만 가능합니다.',
        confirmButtonColor: '#0064ff',
      });
      return;
    }
    setPointModal(null);
    requestPointExchange(amount)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['point'] });
        Swal.fire({
          icon: 'success',
          title: '환전 신청 완료',
          text: '신청 금액이 차감되었고, 등록하신 계좌로 며칠 내 지급될 예정입니다.',
          confirmButtonColor: '#0064ff',
        });
      })
      .catch((err) => {
        Swal.fire({
          icon: 'error',
          title: '환전 신청 실패',
          text: err?.response?.data?.message ?? '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
          confirmButtonColor: '#0064ff',
        });
      });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileAuctionOpen(false);
    setMobileServiceOpen(false);
    setMobileCustomerOpen(false);
  };

  const nickname = user?.nickname || '홍길동';
  const memberLabel = isProvider ? '제공자' : (user?.roleLabel || '일반회원');

  return (
    <>
    <header
      aria-hidden={isPageHidden || undefined}
      className={`sticky top-0 z-[100] bg-white shadow-[0px_5px_10px_0px_rgba(0,0,0,0.2)] max-md:fixed max-md:inset-x-0 ${
      hasHeaderSearch ? 'h-[154px] md:h-[82px]' : 'h-[82px]'
    } ${
      isPageHidden ? 'invisible pointer-events-none' : ''
    }`}
    >
      <div className={`container relative flex items-center justify-between gap-8 ${
        hasHeaderSearch ? 'h-[82px] md:h-full' : 'h-full'
      }`}>
        {/* 로고 + 메뉴 - 디자인 시안처럼 로고 바로 우측에 붙여 왼쪽에 묶어둔다 */}
        <div className="flex items-center gap-10">
          <Link to="/" className="flex shrink-0 items-center">
            <img src={logoImg} alt="에누리컷" className="h-[58px] w-auto" />
          </Link>

          {/* 메뉴 (데스크톱) */}
          <nav ref={navRef} className="hidden md:flex items-center gap-8">
            {/* 경매 메뉴 — 제공자모드에서는 숨김 */}
            {!isProvider && (
              <div
                className="relative"
                onMouseEnter={() => {
                  setCategoryHovered(true);
                  setServiceHovered(false);
                  setCustomerHovered(false);
                }}
                onMouseLeave={() => setCategoryHovered(false)}
              >
                <Link
                  to="/auction"
                  className={`cursor-pointer text-[20px] font-bold tracking-[-0.02em] transition-colors hover:text-primary ${categoryOpen || isAuctionMenuActive ? 'text-primary' : 'text-[#333333]'}`}
                  onClick={() => setCategoryHovered(false)}
                >
                  경매
                </Link>
                {categoryOpen && (
                  <div className="absolute left-0 top-full w-[161px] pt-[14px] z-50">
                    <div className="rounded-[5px] border border-[#4e4e4e] bg-white py-1 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)]">
                      <Link
                        to="/auction"
                        className="flex items-center justify-between px-4 py-[7px] text-[16px] font-medium text-black hover:bg-[#f9fafb] hover:text-primary"
                        onClick={() => setCategoryHovered(false)}
                      >
                        전체보기
                      </Link>
                      {AUCTION_CATEGORIES.map((label) => (
                        <Link
                          key={label}
                          to={`/auction?category=${encodeURIComponent(label)}`}
                          className="flex items-center justify-between px-4 py-[7px] text-[16px] font-medium text-black hover:bg-[#f9fafb] hover:text-primary"
                          onClick={() => setCategoryHovered(false)}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div
              className="relative"
              onMouseEnter={() => {
                setCategoryHovered(false);
                setServiceHovered(isProvider);
                setCustomerHovered(false);
              }}
              onMouseLeave={() => setServiceHovered(false)}
            >
              <Link
                to={serviceMenuPath}
                className={`cursor-pointer text-[20px] font-bold tracking-[-0.02em] transition-colors hover:text-primary ${serviceMenuOpen || isServiceMenuActive ? 'text-primary' : 'text-[#333333]'}`}
                onClick={() => setServiceHovered(false)}
              >
                {isProvider ? '견적 목록' : '견적 요청'}
              </Link>
              {serviceMenuOpen && (
                <div className="absolute left-0 top-full w-[161px] pt-[14px] z-50">
                  <div className="rounded-[5px] border border-[#4e4e4e] bg-white py-1 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)]">
                    <Link
                      to="/service"
                      className="flex items-center justify-between px-4 py-[7px] text-[16px] font-medium text-black hover:bg-[#f9fafb] hover:text-primary"
                      onClick={() => setServiceHovered(false)}
                    >
                      전체보기
                    </Link>
                    {SERVICE_CATEGORIES.map((label) => (
                      <Link
                        key={label}
                        to={`/service?category=${encodeURIComponent(label)}`}
                        className="flex items-center justify-between px-4 py-[7px] text-[16px] font-medium text-black hover:bg-[#f9fafb] hover:text-primary"
                        onClick={() => setServiceHovered(false)}
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
              onMouseEnter={() => {
                setCategoryHovered(false);
                setServiceHovered(false);
                setCustomerHovered(true);
              }}
              onMouseLeave={() => setCustomerHovered(false)}
            >
              <Link
                to="/customersupport/notice"
                className={`cursor-pointer text-[20px] font-bold tracking-[-0.02em] transition-colors hover:text-primary ${customerOpen || isCustomerMenuActive ? 'text-primary' : 'text-[#333333]'}`}
                onClick={() => setCustomerHovered(false)}
              >
                고객센터
              </Link>
              {customerOpen && (
                <div className="absolute left-0 top-full w-[161px] pt-[14px] z-50">
                  <div className="rounded-[5px] border border-[#4e4e4e] bg-white py-1 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)]">
                    <Link
                      to="/customersupport/notice"
                      className="flex items-center justify-between px-4 py-[7px] text-[16px] font-medium text-black hover:bg-[#f9fafb] hover:text-primary"
                      onClick={() => setCustomerHovered(false)}
                    >
                      공지사항
                    </Link>
                    <Link
                      to="/guide"
                      className="flex items-center justify-between px-4 py-[7px] text-[16px] font-medium text-black hover:bg-[#f9fafb] hover:text-primary"
                      onClick={() => setCustomerHovered(false)}
                    >
                      이용가이드
                    </Link>
                    <Link
                      to="/customersupport/faq"
                      className="flex items-center justify-between px-4 py-[7px] text-[16px] font-medium text-black hover:bg-[#f9fafb] hover:text-primary"
                      onClick={() => setCustomerHovered(false)}
                    >
                      FAQ
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* 스크롤 시 헤더 중앙에 뜨는 연한 그레이 공지 롤링 티커 (NoticeStrip이 화면 밖으로 나간 뒤 대신 보여줌)
            검색창과 같은 자리(정중앙)를 쓰므로, 검색창이 있는 페이지에서는 아예 그리지 않는다
            (기존엔 검색창의 z-[1]에 우연히 가려지는 것에 기대고 있었다). */}
        {!hasHeaderSearch && (
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-[#f3f5fa] px-4 py-2 text-[13px] text-[#4e4e4e] transition-opacity duration-300 md:flex"
            style={{ opacity: scrolled ? 1 : 0 }}
          >
            <img src={micIcon} alt="" width={14} height={14} className="shrink-0 opacity-70" />
            <span className="max-w-[420px] truncate">
              {siteNotices.length > 0
                ? siteNotices[noticeIndex % siteNotices.length]
                : '서비스 점검 안내'}
            </span>
          </div>
        )}

        {/* 우측 유틸 영역 */}
        <div ref={utilRef} className="flex items-center gap-2 md:gap-3">
          {/* 알림 */}
          <div className="relative">
            <button
              type="button"
              title="알림"
              className="relative flex size-[40px] items-center justify-center rounded-full bg-[#f3f5fa] hover:bg-[#e9edf5] transition-colors"
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
              <div
                className={`z-50 rounded-[10px] border border-[#434343] bg-white p-4 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)] fixed left-1/2 w-[calc(100vw-32px)] max-w-[320px] -translate-x-1/2 ${hasHeaderSearch ? 'top-[166px]' : 'top-[94px]'} sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-[280px] sm:max-w-none sm:translate-x-0`}
              >
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <span className="flex items-baseline gap-1.5">
                    <span className="text-[15px] font-bold text-black tracking-[-0.5px]">알림</span>
                    <span className="text-[12px] text-[#0064ff]">{notiCount}</span>
                  </span>
                </div>
                <div className="my-3 h-px bg-[#e5e5e5]" />
                {/* 안읽은 우선 + 읽은 알림 통합, 최대 5개 미리보기 */}
                {previewNotis.length === 0 ? (
                  <p className="py-2 text-center text-[13px] text-[#969696]">새 알림이 없습니다.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {previewNotis.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="flex w-full items-start gap-2 text-left"
                          onClick={() => {
                            if (!item.read) markReadMutation.mutate(item.id);
                            setSelectedNoti({ ...item, time: relativeTime(item.regDt) });
                            setNotiOpen(false);
                          }}
                        >
                          <span
                            className={`mt-[6px] size-[6px] shrink-0 rounded-full ${item.read ? 'bg-[#d9d9d9]' : 'bg-primary'}`}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] text-[#333]">
                              {item.title}
                              {item.content && <span className="text-[#969696]"> · {item.content}</span>}
                            </p>
                            <p className="text-[11px] text-[#969696]">{relativeTime(item.regDt)}</p>
                          </div>
                        </button>
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
          <div className="relative">
            <button
              type="button"
              title="포인트 지갑"
              className="flex size-[40px] items-center justify-center rounded-full bg-[#f3f5fa] hover:bg-[#e9edf5] transition-colors"
              onClick={() => openOnly('point')}
            >
              <img src={walletIcon} alt="" className="size-[18px]" />
            </button>
            {pointOpen && (
              <div
                className={`z-50 rounded-[10px] border border-[#434343] bg-white p-4 shadow-[0px_4px_10px_2px_rgba(0,0,0,0.15)] fixed left-1/2 w-[calc(100vw-32px)] max-w-[320px] -translate-x-1/2 ${hasHeaderSearch ? 'top-[166px]' : 'top-[94px]'} sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-[230px] sm:max-w-none sm:translate-x-0`}
              >
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-black tracking-[-0.5px]">POINT</span>
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
                    onClick={() => { setPointOpen(false); setPointModal('charge'); }}
                  >
                    충전
                  </button>
                  <button
                    type="button"
                    className="h-[34px] flex-1 rounded-[6px] bg-[#d9d9d9] text-[14px] font-bold text-[#4e4e4e] hover:bg-[#cfcfcf] transition-colors"
                    onClick={() => { setPointOpen(false); setPointModal('convert'); }}
                  >
                    전환
                  </button>
                  <button
                    type="button"
                    className="h-[34px] flex-1 rounded-[6px] bg-[#d9d9d9] text-[14px] font-bold text-[#4e4e4e] hover:bg-[#cfcfcf] transition-colors"
                    onClick={() => { setPointOpen(false); setPointModal('exchange'); }}
                  >
                    환전
                  </button>
                </div>
                <button
                  type="button"
                  className="mt-2 h-[34px] w-full rounded-[6px] border border-primary text-[14px] font-bold text-primary hover:bg-[#f0f6ff] transition-colors"                 
                  onClick={() => { setPointOpen(false); window.scrollTo(0, 0); navigate('/user/mypage?section=wallet'); }}
                >
                  포인트지갑 상세보기
                </button>
              </div>
            )}
          </div>

          {/* 마이페이지 → 프로필 박스 */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              title={user ? '마이페이지' : '로그인'}
              className={`flex h-[40px] w-[126px] items-center justify-between rounded-full py-1 pl-1 pr-1 text-[14px] font-medium text-white transition-colors ${
                user
                  ? 'bg-primary hover:bg-[#0048bf]'
                  : 'bg-[#555555] hover:bg-[#444444]'
              }`}
              onClick={() => (user ? openOnly('profile') : navigate('/login'))}
            >
              <span className="flex-1 text-center">
                {user ? (isProvider ? '제공자회원' : '일반회원') : '로그인'}
              </span>
              <span className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white">
                <img src={userIcon} alt="" className="size-[18px]" />
              </span>
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
                </div>
                <div className="my-3 h-px bg-[#e5e5e5]" />
                {/* 액션 */}
                <div className="flex flex-col gap-2">
                  {user && (
                    <button
                      type="button"
                      className="h-[36px] rounded-[6px] border bg-[#f3f5fa] text-[14px] font-medium text-[#333333] hover:bg-[#e9edf5] transition-colors"
                      onClick={() => { setProfileOpen(false); navigate('/user/mypage'); }}
                    >
                      마이페이지 상세보기
                    </button>
                  )}
                  <button
                    type="button"
                    className="h-[36px] rounded-[6px] bg-primary text-[14px] font-medium text-white hover:bg-[#0048bf] transition-colors"
                    onClick={async () => {
                      setProfileOpen(false);
                      if (isProvider) {
                        // 제공자 상태면 서버에 실제 역할 전환을 요청한 뒤 마이페이지로 이동한다 (F-PROV-008).
                        await switchMode('USER');
                        navigate('/user/mypage');
                      } else {
                        try {
                          await switchMode('SERVICE');
                          navigate('/user/mypage');
                        } catch {
                          navigate('/provider/apply');
                        }
                      }
                    }}
                  >
                    {isProvider ? '일반모드 변경' : isProviderApproved ? '제공자 전환' : '제공자 신청'}
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
            aria-label={mobileMenuOpen ? '전체 메뉴 닫기' : '전체 메뉴 열기'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-site-menu"
            className="flex md:hidden size-[39px] items-center justify-center rounded-full bg-[#f3f5fa]"
            onClick={() => {
              setNotiOpen(false);
              setPointOpen(false);
              setProfileOpen(false);
              if (mobileMenuOpen) {
                closeMobileMenu();
              } else {
                setMobileMenuOpen(true);
              }
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div
          className={hasHeaderSearch
            ? 'absolute left-1/2 top-[92px] z-[1] flex w-[calc(100%-32px)] max-w-[548px] -translate-x-1/2 items-center gap-2 md:top-1/2 md:w-[min(38vw,548px)] md:-translate-y-1/2'
            : 'hidden'}
        >
          <div className="min-w-0 flex-1" id={SITE_HEADER_SEARCH_SLOT_ID} />
          <HeaderCreateAction type={headerCreateActionType} />
        </div>
      </div>

      {/* 모바일 전체화면 메뉴 */}
      {mobileMenuOpen && (
        <div
          id="mobile-site-menu"
          className="fixed left-0 top-[82px] z-[200] flex h-[calc(100dvh-82px)] w-screen flex-col border-t border-[#f0f0f0] bg-white md:hidden"
        >
          <nav className="flex-1 overflow-y-auto px-4 py-2">
            {/* 로그인 상태: 유저 정보 패널 */}
            {user && (
              <div className="border-b border-[#f0f0f0] py-4">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={user?.profileImage || userIcon}
                    alt="프로필"
                    className="size-[48px] rounded-full object-cover bg-[#f3f5fa]"
                  />
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold text-[#333333] truncate">{nickname}</p>
                    <p className="text-[13px] text-[#969696] truncate">{user?.email || ''}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 h-[40px] rounded-[8px] border border-primary text-[14px] font-medium text-primary"
                    onClick={async () => {
                      closeMobileMenu();
                      if (isProvider) {
                        // 서버에 실제 역할 전환 요청 (F-PROV-008) — 데스크톱 드롭다운과 동일 동작.
                        await switchMode('USER');
                        navigate('/user/mypage');
                      } else {
                        try {
                          await switchMode('SERVICE');
                          navigate('/user/mypage');
                        } catch {
                          navigate('/provider/apply');
                        }
                      }
                    }}
                  >
                    {isProvider ? '일반모드 변경' : isProviderApproved ? '제공자 전환' : '제공자 신청'}
                  </button>
                  <button
                    type="button"
                    className="flex-1 h-[40px] rounded-[8px] bg-primary text-[14px] font-medium text-white"
                    onClick={() => { closeMobileMenu(); logout(); }}
                  >
                    로그아웃
                  </button>
                </div>
                <button
                  type="button"
                  className="mt-2 w-full h-[40px] rounded-[8px] bg-[#f3f5fa] text-[14px] font-medium text-[#333333] hover:bg-[#e9edf5] transition-colors"
                  onClick={() => { closeMobileMenu(); navigate('/user/mypage'); }}
                >
                  마이페이지 바로가기
                </button>
              </div>
            )}

            {/* 경매 (아코디언) — 제공자모드에서는 숨김 */}
            {!isProvider && (
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
            )}

            {/* 담당자 7 통합: 일반회원은 작성으로, 제공자는 요청 목록으로 이동합니다. */}
            {isProvider ? (
              <div className="border-b border-[#f0f0f0]">
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-4 text-[20px] font-bold text-[#333333]"
                  onClick={() => setMobileServiceOpen((v) => !v)}
                >
                  견적 목록
                  <ChevronRight size={20} className={`transition-transform ${mobileServiceOpen ? 'rotate-90' : ''}`} />
                </button>
                {mobileServiceOpen && (
                  <div className="flex flex-col gap-1 pb-3 pl-2">
                    <Link to="/service" className="py-2 text-[16px] font-bold text-primary" onClick={closeMobileMenu}>
                      전체보기
                    </Link>
                    {SERVICE_CATEGORIES.map((label) => (
                      <Link
                        key={label}
                        to={`/service?category=${encodeURIComponent(label)}`}
                        className="py-2 text-[15px] text-[#4e4e4e]"
                        onClick={closeMobileMenu}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="border-b border-[#f0f0f0]">
                <Link
                  to="/service-requests/new"
                  className="flex w-full items-center justify-between py-4 text-[20px] font-bold text-[#333333]"
                  onClick={closeMobileMenu}
                >
                  견적 요청
                  <ChevronRight size={20} />
                </Link>
              </div>
            )}

            <div className="border-b border-[#f0f0f0]">
              <button
                type="button"
                className="flex w-full items-center justify-between py-4 text-[20px] font-bold text-[#333333]"
                onClick={() => setMobileCustomerOpen((v) => !v)}
              >
                고객센터
                <ChevronRight size={20} className={`transition-transform ${mobileCustomerOpen ? 'rotate-90' : ''}`} />
              </button>
              {mobileCustomerOpen && (
                <div className="flex flex-col gap-1 pb-3 pl-2">
                  <Link to="/customersupport/notice" className="py-2 text-[15px] text-[#4e4e4e]" onClick={closeMobileMenu}>공지사항</Link>
                  <Link to="/guide" className="py-2 text-[15px] text-[#4e4e4e]" onClick={closeMobileMenu}>이용가이드</Link>
                  <Link to="/customersupport/faq" className="py-2 text-[15px] text-[#4e4e4e]" onClick={closeMobileMenu}>FAQ</Link>
                </div>
              )}
            </div>

            {!user && (
              <div className="mt-6 flex gap-2">
                <Link
                  to="/login"
                  className="flex flex-1 h-[44px] items-center justify-center rounded-[30px] border border-primary text-[15px] font-medium text-primary"
                  onClick={closeMobileMenu}
                >
                  로그인
                </Link>
                <Link
                  to="/login/signup"
                  className="flex flex-1 h-[44px] items-center justify-center rounded-[30px] bg-primary text-[15px] font-medium text-white"
                  onClick={closeMobileMenu}
                >
                  회원가입
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
    <div
      aria-hidden="true"
      className={hasHeaderSearch ? 'h-[154px] md:hidden' : 'h-[82px] md:hidden'}
    />
    <ScrollToTopButton />
    <NotificationDetailModal item={selectedNoti} onClose={() => setSelectedNoti(null)} />
    {pointModal === 'charge' && (
      <PointChargeWidgetModal
        infoRow={{ label: '사용가능 포인트', value: `${(pointBalance.available ?? 0).toLocaleString()} P` }}
        onClose={() => setPointModal(null)}
      />
    )}
    {pointModal === 'convert' && (
      <PointAmountModal
        title="포인트 전환"
        submitLabel="전환"
        infoRow={{ label: '전환 가능 포인트', value: `${(pointBalance.settleable ?? 0).toLocaleString()} P` }}
        onSubmit={submitHeaderConvert}
        onClose={() => setPointModal(null)}
      />
    )}
    {pointModal === 'exchange' && (
      <PointAmountModal
        title="환전 신청"
        submitLabel="환전"
        infoRow={{ label: '환전 가능 포인트', value: `${(pointBalance.exchangeable ?? 0).toLocaleString()} P` }}
        onSubmit={submitHeaderExchange}
        onClose={() => setPointModal(null)}
      />
    )}
    </>
  );
};

export default Header;
