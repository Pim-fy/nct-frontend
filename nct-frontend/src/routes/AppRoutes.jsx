// src/routes/AppRoutes.jsx
// ─────────────────────────────────────────────────────────────────────────────
// 전체 라우트 정의 — 랜딩 / 공개 독립 페이지 / 일반 회원 / 관리자 영역으로 구분
// 로그인이 필요한 경로는 ProtectedRoute 로 감싸 인증 여부를 검사합니다.
//
// ※ 파일 소유: 황희준(담당자1)
//    라우트 추가·수정은 황희준에게 전달 후 반영. 임시로 추가된 상품 라우트
//    (/product/register, /product/me, /product/:prdSn/seller) 도 최종 통합 시
//    황희준에게 전달해 ProtectedRoute 구조에 맞게 정리 필요.
// ─────────────────────────────────────────────────────────────────────────────
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import LandingLayout from '@layouts/LandingLayout';
import UserLayout    from '@layouts/UserLayout';
import AdminLayout   from '@layouts/AdminLayout';
import AuthLayout    from '@layouts/AuthLayout';

// ──────────────────────────────────────────
// 공개 페이지
// ──────────────────────────────────────────
import LandingPage        from '@pages/landing/LandingPage';
import AuctionListPage    from '@pages/auction/AuctionListPage';
import AuctionDetailPage  from '@pages/auction/AuctionDetailPage';
import LoginPage          from '@pages/auth/LoginPage';
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
import ServiceListPage from '@pages/service/ServiceListPage';
import PublicProviderProfilePage from '@pages/provider/PublicProviderProfilePage';
import ProviderApplyPage from '@pages/provider/ProviderApplyPage';
import ProviderApplicationStatusPage from '@pages/provider/ProviderApplicationStatusPage';
import ProviderProfilePage from '@pages/provider/ProviderProfilePage';
import NotificationPage from '@pages/user/notification/NotificationPage';
import NotificationSettingsPage from '@pages/user/notification/NotificationSettingsPage';
import SettlementListPage from '@pages/user/settlement/SettlementListPage';
import AuctionFavoritesPage from '@pages/auction/AuctionFavoritesPage';
import QuoteFormPage from '@pages/provider/QuoteFormPage';
import MyQuoteListPage from '@pages/provider/MyQuoteListPage';
import ReviewListPage from '@pages/user/ReviewListPage';
import ReviewWritePage from '@pages/user/ReviewWritePage';
import ReviewEditPage from '@pages/user/ReviewEditPage';
import MyPageReviewLayout from '@layouts/MyPageReviewLayout';
// 내 입찰 내역 (F-AUC-022)
import MyBidHistoryPage from '@pages/user/MyBidHistoryPage';
import ReportFormPage from '@pages/user/report/ReportFormPage';

// 담당자 7 병합 검증: develop의 상품 route가 참조하는 페이지 import가 누락되어 런타임 빈 화면이 발생해 복구했습니다.
// 임시 코드는 아니며 상품 기능의 구현·소유권은 기존 상품 담당자에게 그대로 있습니다.
import ProductRegisterPage from '@pages/product/ProductRegisterPage';
import MyProductListPage from '@pages/product/MyProductListPage';
import ProductDetailSellerPage from '@pages/product/ProductDetailSellerPage';

// F-SVC-001~004: 서비스 요청서 작성/임시저장 폼
import ServiceRequestFormPage from '@pages/service/ServiceRequestFormPage';
// F-SVC-003~004: 서비스 요청서 상세 조회/관리
import ServiceRequestDetailPage from '@pages/service/ServiceRequestDetailPage';
// F-SVC-004: 내 서비스 요청 목록 (담당자 2)
import MyServiceRequestListPage from '@pages/service/MyServiceRequestListPage';

// 기존 지갑 주소를 유지하되, 결제 결과·모달 제어용 query string도 함께 전달한다.
const PointWalletRedirect = () => {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set('section', 'wallet');

  return <Navigate to={`/user/mypage?${params.toString()}`} replace />;
};

// ──────────────────────────────────────────
// Admin 페이지
// ──────────────────────────────────────────
import Dashboard        from '@pages/admin/Dashboard';
import OperationsIntegrationPreview from '@pages/admin/OperationsIntegrationPreview';
import AdminNoticeListPage from '@pages/admin/notice/AdminNoticeListPage';
import AdminNoticeFormPage from '@pages/admin/notice/AdminNoticeFormPage';
import AdminGuidePage from '@pages/admin/guide/AdminGuidePage';
import AdminCategoryPage from '@pages/admin/category/AdminCategoryPage';
import AdminServiceRequestPage from '@pages/admin/service/AdminServiceRequestPage';
import AdminProviderApprovalPage from '@pages/admin/provider/AdminProviderApprovalPage';
import AdminAuditLogPage from '@pages/admin/audit/AdminAuditLogPage';
import AdminSystemSettingPage from '@pages/admin/setting/AdminSystemSettingPage';
import AdminAuctionManagementPage from '@pages/admin/auction/AdminAuctionManagementPage';
import AdminNotificationPage from '@pages/admin/notification/AdminNotificationPage';

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

      {/* @ai_generated: 입력형 인증 화면은 공통 헤더·푸터를 AuthLayout에서 한 번만 조립한다. */}
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

        {/* 담당자 7의 F-COM-002/015 화면. 공통 route 소유자(담당자 1)에게 동일 manifest로 전달합니다. */}
        <Route path="/service" element={<ServiceListPage />} />
        {/* 담당자 2 · F-SVC: 서비스 요청서 상세는 비로그인도 조회 가능 (백엔드 permit-all) */}
        <Route path="/service-requests/:svcReqSn" element={<ServiceRequestDetailPage />} />
        <Route path="/providers/:providerId" element={<PublicProviderProfilePage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/customersupport/notice" element={<NoticeListPage />} />
        <Route path="/customersupport/notice/:noticeId" element={<NoticeDetailPage />} />
        <Route path="/customersupport/faq" element={<FaqPage />} />
      </Route>

      {/* 실제 거래 경로의 인증 정책과 분리된 개발용 화면 확인 경로 */}
      {isTradePreviewEnabled && (
        <>
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
          <Route path="/user/point" element={<PointWalletRedirect />} />
          <Route path="/user/notification" element={<NotificationPage />} />
          <Route
            path="/user/notification/settings"
            element={<NotificationSettingsPage />}
          />
          <Route path="/user/settlement" element={<SettlementListPage />} />
        </Route>
      </Route>

      {/* @ai_generated CHG-032: 아래는 일반회원 전용 기능이므로 ROLE_USER 현재 모드만 접근한다. */}
      <Route
        element={(
          <ProtectedRoute allowedRoles={['ROLE_USER']} />
        )}
      >
        <Route element={<UserLayout />}>
          <Route path="/user/auction-favorites" element={<AuctionFavoritesPage />} />
          <Route path="/user/reviews" element={<Navigate to="/user/mypage?section=review" replace />} />
          <Route element={<MyPageReviewLayout />}>
            <Route path="/user/reviews/write/:id" element={<ReviewWritePage />} />
            <Route path="/user/reviews/edit/:id" element={<ReviewEditPage />} />
          </Route>
          {/* 경매 거래내역 — 내 입찰 내역 + 내 판매 내역 2탭 (담당자3 HSK, F-AUC-022) */}
          <Route path="/my-bids" element={<MyBidHistoryPage />} />

          <Route path="/trades/:tradeId/chat" element={<TradeChat />} />
          <Route path="/trades/:tradeId" element={<TradeDetailBuyer />} />
          <Route
            path="/trades/:tradeId/seller"
            element={<TradeDetailSeller />}
          />

          {/* 상품 — 로그인 필요 */}
          {/* 담당자 7 · F-PROV-001/006: 마이페이지의 제공자 권한 신청 메뉴 목적지 */}
          <Route path="/provider/apply"              element={<ProviderApplyPage />} />
          {/* 담당자 7 · F-PROV-012/014: 신청 완료 후 내 심사 상태 확인 화면. 라우트 소유자에게 전달 필요. */}
          <Route path="/provider/applications/status" element={<ProviderApplicationStatusPage />} />
          <Route path="/product/register"        element={<ProductRegisterPage key={location.key} />} />
          <Route path="/product/me"              element={<MyProductListPage />} />
          <Route path="/product/:prdSn/seller"   element={<ProductDetailSellerPage />} />

          {/* 신고 접수 (담당자3 황성경 · F-COM-018) */}
          <Route path="/user/reports/new" element={<ReportFormPage />} />

          {/* 서비스 - 로그인 필요 */}
          {/* 담당자 2 · F-SVC-001~004: 서비스 요청서 작성/임시저장 폼. 라우트 소유자에게 전달 필요. */}
          <Route path="/service-requests/new" element={<ServiceRequestFormPage />} />
          {/* 담당자 2 · F-SVC-004: 내 서비스 요청 목록. 라우트 소유자에게 전달 필요. */}
          <Route path="/service-requests/me" element={<MyServiceRequestListPage />} />
        </Route>
      </Route>

      {/* 임시 화면도 관리자 정보 구조를 보여 주므로 ROLE_ADMIN만 접근할 수 있습니다. */}
      <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          {/* 대시보드 */}
          <Route index element={<Dashboard />} />
          <Route path="notices" element={<AdminNoticeListPage />} />
          <Route path="notices/new" element={<AdminNoticeFormPage />} />
          <Route path="notices/:noticeId" element={<AdminNoticeFormPage />} />
          <Route path="guides" element={<AdminGuidePage />} />
          <Route path="categories" element={<AdminCategoryPage />} />
          <Route path="services" element={<AdminServiceRequestPage />} />
          <Route path="provider-applications" element={<AdminProviderApprovalPage />} />
          <Route path="auctions" element={<AdminAuctionManagementPage />} />
          {/* 보안/감사·시스템 설정: 1단계 최소 설정은 담당자7 F-OPS-024, 3단계 감사/제한조회 화면은 담당자6 인수 범위입니다. */}
          <Route path="audit-logs" element={<AdminAuditLogPage />} />
          <Route path="system-settings" element={<AdminSystemSettingPage />} />
          {/* 관리자 알림 (담당자6, F-COM-004/005) */}
          <Route path="notifications" element={<AdminNotificationPage />} />
          {/* 담당자7 · F-OPS-013 민감정보 탐지 이벤트 읽기 전용 확인 화면 */}
          <Route path="operations-preview" element={<OperationsIntegrationPreview />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ROLE_SERVICE']} />}>
        <Route element={<UserLayout />}>
          <Route path="/provider/profile" element={<ProviderProfilePage />} />
          <Route path="/provider/quotes" element={<MyQuoteListPage />} />
          <Route path="/provider/quotes/new" element={<QuoteFormPage />} />
        </Route>
      </Route>

      {/* ────────────────────────────────
          로그인 필요 영역 (UserLayout + ProtectedRoute)
      
      <Route element={<ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_ADMIN']} />}>
        <Route element={<UserLayout />}>
          {/* 마이페이지 
          <Route path="/user/mypage" element={<MyPage />} />

          {/* 커뮤니티 글쓰기 
          <Route path="/showcase/hotplace/write"      element={<CommunityHotplaceWrite />} />
          <Route path="/showcase/hotplace/write/:id"  element={<CommunityHotplaceWrite />} />
          <Route path="/showcase/life/write"          element={<CommunityLifeWrite />} />
          <Route path="/showcase/life/write/:id"      element={<CommunityLifeWrite />} />

        </Route>
      </Route>
      ──────────────────────────────── */}

      {/* ────────────────────────────────
          관리자 전용 (AdminLayout + ProtectedRoute)
      <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          {/* 대시보드
          <Route index element={<Dashboard />} />

          {/* 공통 코드
          <Route path="common-codes" element={<CommonCodeList />} />

          {/* 회원 관리 
          <Route path="members">
            <Route index element={<AdminMemberList />} />
          </Route>

          {/* 관리자 관리
          <Route path="managers">
            <Route index element={<AdminManagerList />} />
          </Route>
        </Route>
      </Route>
      ──────────────────────────────── */}
      
      {/* 404 폴백 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
