// src/routes/AppRoutes.jsx
// ─────────────────────────────────────────────────────────────────────────────
// 전체 라우트 정의 — 랜딩 / 공개 독립 페이지 / 일반 회원 / 관리자 영역으로 구분
// 로그인이 필요한 경로는 ProtectedRoute 로 감싸 인증 여부를 검사합니다.
//
// ※ 파일 소유: 황희준(담당자1)
//    라우트 추가·수정은 황희준에게 전달 후 반영. 임시로 추가된 상품 라우트
//    (/product/register, /product/:prdSn/seller) 도 최종 통합 시
//    황희준에게 전달해 ProtectedRoute 구조에 맞게 정리 필요.
//    판매 목록은 계층 경로 /user/mypage/auctions/sales 한 곳에서 제공합니다.
// ─────────────────────────────────────────────────────────────────────────────
import { Outlet, Routes, Route, useLocation, useParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { MYPAGE_SECTION_PATHS } from './myPageRoutes';

// Layouts
import LandingLayout from '@layouts/LandingLayout';
import UserLayout    from '@layouts/UserLayout';
import AdminLayout   from '@layouts/AdminLayout';
import AuthLayout    from '@layouts/AuthLayout';
import CustomerSupportLayout from '@layouts/CustomerSupportLayout';

// ──────────────────────────────────────────
// 공개 페이지
// ──────────────────────────────────────────
import LandingPage        from '@pages/landing/LandingPage';
import AuctionListPage    from '@pages/auction/AuctionListPage';
import AuctionDetailPage  from '@pages/auction/AuctionDetailPage';
import LoginPage          from '@pages/auth/LoginPage';
import AdminLoginPage     from '@pages/auth/AdminLoginPage';
import SignupPage         from '@pages/auth/SignupPage';
import FindEmailPage      from '@pages/auth/FindEmailPage';
import ResetPasswordPage  from '@pages/auth/ResetPasswordPage';
import WithdrawalRequestPage from '@pages/auth/WithdrawalRequestPage';
import OAuthRedirectHandler from '@pages/auth/OAuthRedirectHandler';
import OAuthOnboardingPage from '@pages/auth/OAuthOnboardingPage';

// 에러 페이지
import NotFoundPage   from '@pages/error/NotFoundPage';
import ServerErrorPage from '@pages/error/ServerErrorPage';
import Unauthorized   from '@pages/error/Unauthorized';

// ──────────────────────────────────────────
// UserLayout (공개 조회 가능)
// ──────────────────────────────────────────
//import MainPage        from '@pages/main/MainPage';

// ──────────────────────────────────────────
// UserLayout (로그인 필요)
// ──────────────────────────────────────────
import MyPage from '@pages/user/MyPage';
import TradeDetailBuyer from '@pages/trade/TradeDetailBuyer';
import TradeDetailSeller from '@pages/trade/TradeDetailSeller';
import TradeChat from '@pages/trade/TradeChat';
// 담당자 7 공개 콘텐츠 route. 공통 route 소유자(담당자 1)에게 동일 manifest로 전달합니다.
import GuidePage from '@pages/content/GuidePage';
import FaqPage from '@pages/content/FaqPage';
import NoticeListPage from '@pages/content/NoticeListPage';
import NoticeDetailPage from '@pages/content/NoticeDetailPage';
import CustomerInquiryFormPage from '@pages/content/CustomerInquiryFormPage';
import ServiceListPage from '@pages/service/ServiceListPage';
import PublicProviderProfilePage from '@pages/provider/PublicProviderProfilePage';
import ProviderApplyPage from '@pages/provider/ProviderApplyPage';
import ProviderApplicationStatusPage from '@pages/provider/ProviderApplicationStatusPage';
import NotificationPage from '@pages/user/notification/NotificationPage';
import QuoteFormPage from '@pages/provider/QuoteFormPage';
import ReviewListPage from '@pages/user/ReviewListPage';
import ReviewWritePage from '@pages/user/ReviewWritePage';
import ReviewEditPage from '@pages/user/ReviewEditPage';
import MyPageReviewLayout from '@layouts/MyPageReviewLayout';

// 담당자 7 병합 검증: develop의 상품 route가 참조하는 페이지 import가 누락되어 런타임 빈 화면이 발생해 복구했습니다.
// 임시 코드는 아니며 상품 기능의 구현·소유권은 기존 상품 담당자에게 그대로 있습니다.
import ProductRegisterPage from '@pages/product/ProductRegisterPage';
import ProductDetailSellerPage from '@pages/product/ProductDetailSellerPage';

// F-SVC-001~004: 서비스 요청서 작성/임시저장 폼
import ServiceRequestFormPage from '@pages/service/ServiceRequestFormPage';
// F-SVC-003~004: 서비스 요청서 상세 조회/관리
import ServiceRequestDetailPage from '@pages/service/ServiceRequestDetailPage';
import QuoteDetailPage from '@pages/service/QuoteDetailPage';
import ServiceTradeDetailRoutePage from '@pages/service/ServiceTradeDetailRoutePage';
import ServiceTradeDetailPreviewPage from '@pages/service/ServiceTradeDetailPreviewPage';

/** 담당자 7 경로 정리: 죽은 목록 주소가 동적 상세 ID로 오인되지 않게 숫자 요청 번호만 허용합니다. */
const ServiceRequestNumberRoute = () => {
  const { svcReqSn } = useParams();
  return /^\d+$/.test(svcReqSn ?? '') ? <Outlet /> : <NotFoundPage />;
};

// ──────────────────────────────────────────
// Admin 페이지
// ──────────────────────────────────────────
import Dashboard        from '@pages/admin/Dashboard';
import AdminMemberList from '@pages/admin/AdminMemberList';
import AdminNoticeListPage from '@pages/admin/notice/AdminNoticeListPage';
import AdminNoticeFormPage from '@pages/admin/notice/AdminNoticeFormPage';
import AdminCategoryPage from '@pages/admin/category/AdminCategoryPage';
import AdminServiceRequestFormPage from '@pages/admin/category/AdminServiceRequestFormPage';
import AdminServiceRequestPage from '@pages/admin/service/AdminServiceRequestPage';
import AdminProviderApprovalPage from '@pages/admin/provider/AdminProviderApprovalPage';
import AdminOperationsRecordPage from '@pages/admin/operation/AdminOperationsRecordPage';
import AdminSystemSettingPage from '@pages/admin/setting/AdminSystemSettingPage';
import AdminAuctionManagementPage from '@pages/admin/auction/AdminAuctionManagementPage';
import AdminNotificationPage from '@pages/admin/notification/AdminNotificationPage';
import AdminReportManagementPage from '@pages/admin/operation/AdminReportManagementPage';
import AdminCustomerInquiryManagementPage from '@pages/admin/operation/AdminCustomerInquiryManagementPage';
import AdminDisputeManagementPage from '@pages/admin/operation/AdminDisputeManagementPage';
import AdminPointExchangePage from '@pages/admin/operation/AdminPointExchangePage';

// 개발 환경에서는 별도 env 설정 없이 로그인 없는 거래 화면을 검토할 수 있다.
// 운영 빌드에서는 false가 되어 개발용 더미 경로가 노출되지 않는다.
const isTradePreviewEnabled = import.meta.env.DEV
  || import.meta.env.VITE_USE_TRADE_PREVIEW === 'true';

const AppRoutes = () => {
  const location = useLocation();
  return (
    <Routes>
      {/* ────────────────────────────────
          랜딩 페이지 (LandingLayout)
      ──────────────────────────────── */}
      <Route element={<LandingLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
      </Route>

      {/* 담당자 7 · F-OPS-001: 관리자 로그인은 사용자 헤더·푸터가 없는 독립 인증 화면입니다. */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* @ai_generated: 일반 사용자 인증 화면은 공통 헤더·푸터를 AuthLayout에서 한 번만 조립한다. */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/signup" element={<SignupPage />} />
        <Route path="/find-email" element={<FindEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/withdrawal" element={<WithdrawalRequestPage />} />
        <Route path="/oauth/onboarding" element={<OAuthOnboardingPage />} />
      </Route>

      {/* OAuth 콜백은 결과 처리 후 즉시 이동하는 경로이므로 레이아웃을 적용하지 않는다. */}
      <Route path="/oauth/redirect"  element={<OAuthRedirectHandler />} />
      <Route path="/unauthorized"    element={<Unauthorized />} />
      <Route path="/403"             element={<Unauthorized />} />
      <Route path="/404"             element={<NotFoundPage />} />
      <Route path="/500"             element={<ServerErrorPage />} />
      {/* ────────────────────────────────
          공개 조회 영역 (UserLayout)
      ──────────────────────────────── */}
      <Route element={<UserLayout />}>
        {/* 경매 */}
        <Route path="/auction" element={<AuctionListPage />} />
        <Route path="/auction/:auctionId" element={<AuctionDetailPage />} />

        {/* 담당자 7의 F-COM-015 공개 제공자 프로필 화면 */}
        <Route path="/providers/:providerId" element={<PublicProviderProfilePage />} />
        <Route element={<CustomerSupportLayout />}>
          <Route path="/customersupport/guide" element={<GuidePage />} />
          <Route path="/customersupport/notice" element={<NoticeListPage />} />
          <Route path="/customersupport/notice/:noticeId" element={<NoticeDetailPage />} />
          <Route path="/customersupport/faq" element={<FaqPage />} />
          {/* 담당자 7 · 관리자 대상 1:1 문의: 고객센터 메뉴는 유지하고 작성 화면만 로그인으로 보호합니다. */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_SERVICE']} />}>
            <Route path="/customersupport/inquiry" element={<CustomerInquiryFormPage />} />
          </Route>
        </Route>
      </Route>

      {/* 담당자 7 경로 정리: 서비스 요청 상세는 숫자 요청 번호 아래에서만 인증·권한 검사를 시작합니다. */}
      <Route path="/service-requests/:svcReqSn" element={<ServiceRequestNumberRoute />}>
        <Route element={<ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_SERVICE']} />}>
          <Route element={<UserLayout />}>
            <Route index element={<ServiceRequestDetailPage />} />
            <Route path="quotes/:quoteId" element={<QuoteDetailPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={['ROLE_SERVICE']} />}>
          <Route element={<UserLayout />}>
            <Route path="quotes/new" element={<QuoteFormPage />} />
            <Route path="quotes/:quoteId/edit" element={<QuoteFormPage />} />
          </Route>
        </Route>
      </Route>

      {/* 실제 거래 경로의 인증 정책과 분리된 개발용 화면 확인 경로 */}
      {isTradePreviewEnabled && (
        <>
          <Route
            path="/service-trades/preview/:tradeId"
            element={<ServiceTradeDetailPreviewPage />}
          />
          <Route path="/trades/preview/:tradeId/chat" element={<TradeChat />} />
          <Route
            path="/trades/preview/:tradeId"
            element={<TradeDetailBuyer />}
          />
          <Route
            path="/trades/preview/:tradeId/seller"
            element={<TradeDetailSeller />}
          />
          {/* 개발 중에는 로그인 없이 마이페이지 내부 거래 목록 배치를 검토한다. */}
          <Route element={<UserLayout />}>
            <Route
              path="/user/mypage/preview/trades"
              element={<MyPage initialSection="auction-bids" previewTrades />}
            />
          </Route>
        </>
      )}

      {/* @ai_generated: 두 현재 역할이 함께 쓰는 마이페이지 셸 경로. */}
      <Route
        element={(
          <ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_SERVICE']} />
        )}
      >
        <Route element={<UserLayout />}>
          <Route path="/user/mypage" element={<MyPage />} />
          {Object.entries(MYPAGE_SECTION_PATHS)
            .filter(([section]) => section !== 'home')
            .map(([section, path]) => (
              <Route key={section} path={path} element={<MyPage initialSection={section} />} />
            ))}
          <Route path="/user/notification" element={<NotificationPage />} />
          {/* 담당자 7 · F-PROV-006/012~014: 제공자 모드에서도 추가 분야 심사 신청·상태 조회를 허용합니다. */}
          <Route path="/provider/apply" element={<ProviderApplyPage />} />
          <Route path="/provider/applications/status" element={<ProviderApplicationStatusPage />} />
          <Route path="/service-trades/:tradeId" element={<ServiceTradeDetailRoutePage />} />
          <Route path="/service-trades/:tradeId/chat" element={<TradeChat />} />
        </Route>
      </Route>

      {/* @ai_generated CHG-032: 아래는 일반회원 전용 기능이므로 ROLE_USER 현재 모드만 접근한다. */}
      <Route
        element={(
          <ProtectedRoute allowedRoles={['ROLE_USER']} />
        )}
      >
        <Route element={<UserLayout />}>
          <Route element={<MyPageReviewLayout />}>
            <Route path="/user/mypage/reviews/write/:id" element={<ReviewWritePage />} />
            <Route path="/user/mypage/reviews/edit/:id" element={<ReviewEditPage />} />
          </Route>

          <Route path="/trades/:tradeId/chat" element={<TradeChat />} />
          <Route path="/trades/:tradeId" element={<TradeDetailBuyer />} />
          <Route
            path="/trades/:tradeId/seller"
            element={<TradeDetailSeller />}
          />

          {/* 상품 — 로그인 필요 */}
          <Route path="/product/register"        element={<ProductRegisterPage key={location.key} />} />
          <Route path="/product/:prdSn/seller"   element={<ProductDetailSellerPage />} />

          {/* 신고 접수 (담당자3 황성경 · F-COM-018) */}
          {/* 서비스 - 로그인 필요 */}
          {/* 담당자 2 · F-SVC-001~004: 서비스 요청서 작성/임시저장 폼. 라우트 소유자에게 전달 필요. */}
          <Route path="/service-requests/new" element={<ServiceRequestFormPage />} />
        </Route>
      </Route>

      {/* 임시 화면도 관리자 정보 구조를 보여 주므로 ROLE_ADMIN만 접근할 수 있습니다. */}
      <Route
        element={(
          <ProtectedRoute
            allowedRoles={['ROLE_ADMIN']}
            unauthenticatedTo="/admin/login"
          />
        )}
      >
        <Route path="/admin" element={<AdminLayout />}>
          {/* 대시보드 */}
          <Route index element={<Dashboard />} />
          <Route path="members" element={<AdminMemberList />} />
          <Route path="notices" element={<AdminNoticeListPage />} />
          <Route path="notices/new" element={<AdminNoticeFormPage />} />
          <Route path="notices/:noticeId" element={<AdminNoticeFormPage />} />
          <Route path="categories" element={<AdminCategoryPage />} />
          <Route path="categories/:categorySn/form" element={<AdminServiceRequestFormPage />} />
          <Route path="services" element={<AdminServiceRequestPage />} />
          <Route path="provider-applications" element={<AdminProviderApprovalPage />} />
          <Route path="auctions" element={<AdminAuctionManagementPage />} />
          <Route path="reports" element={<AdminReportManagementPage />} />
          <Route path="inquiries" element={<AdminCustomerInquiryManagementPage />} />
          <Route path="disputes" element={<AdminDisputeManagementPage />} />
          <Route path="exchanges" element={<AdminPointExchangePage />} />
          {/* 담당자 7 · F-OPS-011: 담당자 6의 F-OPS-016 화면을 소비해 운영 기록 탐색만 통합합니다. */}
          <Route path="operations-records" element={<AdminOperationsRecordPage />} />
          <Route path="system-settings" element={<AdminSystemSettingPage />} />
          {/* 관리자 알림 (담당자6, F-COM-004/005) */}
          <Route path="notifications" element={<AdminNotificationPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ROLE_SERVICE']} />}>
        <Route element={<UserLayout />}>
          {/* 담당자 5 · F-COM-002: 공개 요청 검색·목록은 제공자 모드 전용입니다. */}
          <Route path="/service" element={<ServiceListPage />} />
        </Route>
      </Route>
      
      {/* 404 폴백 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
