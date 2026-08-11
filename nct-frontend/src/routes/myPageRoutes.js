// 담당자 7 경로 통합: 마이페이지 화면은 query가 아니라 상위→하위 계층 URL을 사용합니다.
export const MYPAGE_SECTION_PATHS = Object.freeze({
  home: '/user/mypage',
  profile: '/user/mypage/profile',
  'provider-profile': '/user/mypage/provider/profile',
  'auction-bids': '/user/mypage/auctions/purchases',
  'auction-sales': '/user/mypage/auctions/sales',
  wishlist: '/user/mypage/auctions/favorites',
  'service-requests': '/user/mypage/services/requests',
  'service-trade': '/user/mypage/services/trades',
  quote: '/user/mypage/services/quotes',
  'received-review': '/user/mypage/services/reviews/received',
  chat: '/user/mypage/chat',
  wallet: '/user/mypage/wallet',
  review: '/user/mypage/reviews',
  'report-list': '/user/mypage/reports',
  'report-form': '/user/mypage/reports/new',
  'inquiry-list': '/user/mypage/inquiries',
});

export const MYPAGE_INQUIRY_PATHS = Object.freeze({
  general: '/user/mypage/inquiries',
  provider: '/user/mypage/provider/inquiries',
});

export const getMyPageInquiryPath = (isProvider = false) => (
  isProvider ? MYPAGE_INQUIRY_PATHS.provider : MYPAGE_INQUIRY_PATHS.general
);

export const getMyPageInquiryCreatePath = (isProvider = false) => (
  `${getMyPageInquiryPath(isProvider)}/new`
);

export const getMyPagePath = (section = 'home') => (
  MYPAGE_SECTION_PATHS[section] ?? MYPAGE_SECTION_PATHS.home
);

export const getMyPageSection = (pathname) => {
  if (pathname === MYPAGE_INQUIRY_PATHS.provider
    || pathname.startsWith(`${MYPAGE_INQUIRY_PATHS.provider}/`)) {
    return 'inquiry-list';
  }

  if (pathname === MYPAGE_INQUIRY_PATHS.general
    || pathname.startsWith(`${MYPAGE_INQUIRY_PATHS.general}/`)) {
    return 'inquiry-list';
  }

  return Object.entries(MYPAGE_SECTION_PATHS)
    .find(([, path]) => path === pathname)?.[0] ?? null;
};
