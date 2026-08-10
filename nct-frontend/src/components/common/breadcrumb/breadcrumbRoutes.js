// Claude Code 작성 (BJN, 260805)
// ─────────────────────────────────────────────────────────────────────────────
// 브레드크럼 중앙 맵 — "어떤 경로에서 브레드크럼을 보여줄지"와 "라벨을 뭐라고 쓸지"를
// 이 파일 한 곳에서만 관리한다. (라우트 정의 파일 AppRoutes.jsx는 건드리지 않기 위해
// 별도 맵으로 분리 — 라우트 파일은 담당자1 소유이기도 하고, 선언형 <Routes>에는
// 라벨 메타데이터를 붙일 자리가 없다)
//
// 구조:
//  - BREADCRUMB_ROUTES  : 브레드크럼을 표시할 "대상 페이지" 목록.
//                         여기 등록된 경로만 브레드크럼이 나오고, 미등록 경로(목록/랜딩 등)는
//                         자동으로 아무것도 표시되지 않는다.
//  - BREADCRUMB_ENTRIES : "진입점"으로 인정하는 목록성 화면들.
//                         상세 페이지가 state.from(이전 페이지 경로)을 받았을 때,
//                         이 목록과 매치되는 경우에만 브레드크럼 중간 단계로 채택한다.
//                         → 상세→상세 이동처럼 진입점이 아닌 from은 자동 기각되어
//                           defaultTrail(정식 위치)로 폴백된다.
// ─────────────────────────────────────────────────────────────────────────────

import { getMyPagePath, getMyPageSection } from '@/routes/myPageRoutes';

// 항목 형태: { label: '표시명', to: '이동 경로' } — to가 없으면 링크 없이 텍스트만 표시
export const HOME_ITEM = { label: '홈', to: '/' };

// 마이페이지 계층 경로 → 사이드바에 표시되는 실제 메뉴명 (MyPageSidebar.jsx 기준)
export const MYPAGE_SECTION_LABELS = {
  'active-auctions': '진행 중인 경매',
  'bid-history': '상품 입찰 내역',
  'auction-bids': '상품 구매 내역',
  'auction-sales': '상품 판매 내역',
  'service-requests': '내 서비스 요청 목록',
  wishlist: '관심 경매',
  chat: '채팅',
  wallet: '포인트 지갑',
  profile: '프로필',
  quote: '내 견적',
  review: '내 리뷰',
  'service-trade': '서비스 거래',
  'service-chat': '서비스 채팅',
  'received-review': '받은 리뷰',
  'report-list': '내 신고 목록',
  'report-form': '신고 접수',
  'inquiry-list': '1:1 문의',
};

// 마이페이지 트레일 생성 헬퍼 — 진입점 매칭과 MyPage 오버라이드 양쪽에서 재사용한다.
// sectionKey가 있으면 "마이페이지 > 섹션명" 두 단계, 없으면 "마이페이지" 한 단계.
export const buildMyPageTrail = (sectionKey) => {
  const base = [{ label: '마이페이지', to: '/user/mypage' }];
  const sectionLabel = MYPAGE_SECTION_LABELS[sectionKey];
  return sectionLabel
    ? [...base, { label: sectionLabel, to: getMyPagePath(sectionKey) }]
    : base;
};

// ─────────────────────────────────────────────────────────────────────────────
// 진입점 목록 — trail(loc)은 { pathname, search } 형태를 받아 브레드크럼 항목 배열을 반환.
// search까지 to에 붙여주는 이유: 목록의 필터·페이지 상태를 유지한 채 되돌아가게 하기 위해.
// ─────────────────────────────────────────────────────────────────────────────
export const BREADCRUMB_ENTRIES = [
  {
    pattern: '/auction',
    trail: (loc) => [{ label: '경매', to: `/auction${loc.search}` }],
  },
  {
    // 담당자 7 경로 통합: 계층 URL에서 현재 마이페이지 섹션을 역산한다.
    pattern: '/user/mypage/*',
    trail: (loc) => buildMyPageTrail(getMyPageSection(loc.pathname)),
  },
  {
    // 제공자 모드 전용 — 공개 서비스 요청 목록
    pattern: '/service',
    trail: (loc) => [{ label: '서비스 요청 목록', to: `/service${loc.search}` }],
  },
  {
    pattern: '/customersupport/notice',
    trail: () => [{ label: '공지사항', to: '/customersupport/notice' }],
  },
  {
    pattern: '/customersupport/faq',
    trail: () => [{ label: 'FAQ', to: '/customersupport/faq' }],
  },
  {
    pattern: '/user/notification',
    trail: () => [{ label: '알림', to: '/user/notification' }],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 브레드크럼 대상 페이지 목록.
//  - pageLabel     : 마지막 항목(현재 페이지)에 표시할 고정 라벨 (실제 데이터 제목은 넣지 않음 — 사용자 확정)
//  - defaultTrail  : state.from이 없거나(직접 URL 진입·새 탭) 진입점이 아닐 때 쓰는
//                    "정보 구조상의 정식 상위 경로". 경로 파라미터가 필요하면 함수로 정의한다.
//  - hidden: true  : 파라미터 패턴과 URL이 겹치는 목록 페이지를 명시적으로 제외하기 위한 표시
//
// ※ matchPath는 배열 순서대로 첫 매치를 쓰므로, 구체 경로(/service-requests/new)를
//    파라미터 경로(/service-requests/:svcReqSn)보다 반드시 앞에 둔다.
// ─────────────────────────────────────────────────────────────────────────────
export const BREADCRUMB_ROUTES = [
  // 경매
  {
    pattern: '/auction/:auctionId',
    pageLabel: '경매 상세',
    defaultTrail: [{ label: '경매', to: '/auction' }],
  },

  // 제공자 공개 프로필 — 여러 곳(서비스 요청 상세, 리뷰 등)에서 진입하므로 정식 상위는 홈만 둔다
  {
    pattern: '/providers/:providerId',
    pageLabel: '제공자 프로필',
    defaultTrail: [],
  },

  // 서비스 요청 — /new, /me가 :svcReqSn 패턴과 겹치므로 구체 경로 먼저
  {
    // 헤더 "견적 요청" 등 홈에서 바로 들어오는 게 기본 흐름이라 정식 상위는 홈만 둔다 (사용자 확정 260805)
    // — "내 서비스 요청 목록"에서 들어온 경우에는 state.from으로 목록이 중간에 표시된다
    pattern: '/service-requests/new',
    pageLabel: '서비스 요청 작성',
    defaultTrail: [],
  },
  {
    pattern: '/service-requests/:svcReqSn/quotes/new',
    pageLabel: '견적 작성',
    defaultTrail: ({ svcReqSn }) => [
      { label: '서비스 요청 상세', to: `/service-requests/${svcReqSn}` },
    ],
  },
  {
    pattern: '/service-requests/:svcReqSn/quotes/:quoteId/edit',
    pageLabel: '견적 수정',
    defaultTrail: ({ svcReqSn }) => [
      { label: '서비스 요청 상세', to: `/service-requests/${svcReqSn}` },
    ],
  },
  {
    // 일반회원(본인 요청)과 제공자(공개 요청)가 같은 화면을 쓰므로,
    // 역할을 단정하지 않도록 정식 상위는 홈만 두고 실제 경로는 state.from으로 구분한다
    pattern: '/service-requests/:svcReqSn',
    pageLabel: '서비스 요청 상세',
    defaultTrail: [],
  },

  // 물건 거래 (구매자/판매자/채팅)
  {
    pattern: '/trades/:tradeId/chat',
    pageLabel: '거래 채팅',
    defaultTrail: buildMyPageTrail('chat'),
  },
  {
    pattern: '/trades/:tradeId/seller',
    pageLabel: '거래 상세',
    defaultTrail: buildMyPageTrail('auction-sales'),
  },
  {
    pattern: '/trades/:tradeId',
    pageLabel: '거래 상세',
    defaultTrail: buildMyPageTrail('auction-bids'),
  },
  {
    pattern: '/service-trades/:tradeId/chat',
    pageLabel: '서비스 채팅',
    defaultTrail: buildMyPageTrail('service-chat'),
  },

  // 상품
  {
    // 작성 폼은 홈 직행이 기본 흐름 (서비스 요청 작성과 동일 원칙, 사용자 확정 260805)
    // — 내 판매 내역·경매 목록에서 들어온 경우에는 state.from으로 해당 경로가 표시된다
    pattern: '/product/register',
    pageLabel: '상품 등록',
    defaultTrail: [],
  },
  {
    pattern: '/product/:prdSn/seller',
    pageLabel: '상품 상세',
    defaultTrail: buildMyPageTrail('auction-sales'),
  },

  // 고객센터
  {
    pattern: '/customersupport/notice/:noticeId',
    pageLabel: '공지사항 상세',
    defaultTrail: [{ label: '공지사항', to: '/customersupport/notice' }],
  },

  // 리뷰
  {
    pattern: '/user/mypage/reviews/write/:id',
    pageLabel: '리뷰 작성',
    defaultTrail: buildMyPageTrail('review'),
  },
  {
    pattern: '/user/mypage/reviews/edit/:id',
    pageLabel: '리뷰 수정',
    defaultTrail: buildMyPageTrail('review'),
  },

  // 신고
  {
    pattern: '/user/mypage/reports/new',
    pageLabel: '신고 접수',
    defaultTrail: buildMyPageTrail('report-list'),
  },

  // 제공자
  {
    pattern: '/provider/apply',
    pageLabel: '제공자 신청',
    defaultTrail: [{ label: '마이페이지', to: '/user/mypage' }],
  },
  {
    pattern: '/provider/applications/status',
    pageLabel: '제공자 신청 현황',
    defaultTrail: [{ label: '마이페이지', to: '/user/mypage' }],
  },
];
