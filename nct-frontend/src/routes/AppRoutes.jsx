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
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Layouts
import LandingLayout from '@layouts/LandingLayout';
import UserLayout    from '@layouts/UserLayout';
import AdminLayout   from '@layouts/AdminLayout';

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
import TradeHistory from '@pages/trade/TradeHistory';
import TradeDetailBuyer from '@pages/trade/TradeDetailBuyer';
import TradeDetailSeller from '@pages/trade/TradeDetailSeller';
import TradeChat from '@pages/trade/TradeChat';
// 담당자 7 공개 콘텐츠 route. 공통 route 소유자(담당자 1)에게 동일 manifest로 전달합니다.
import GuidePage from '@pages/content/GuidePage';
import NoticeListPage from '@pages/content/NoticeListPage';
import NoticeDetailPage from '@pages/content/NoticeDetailPage';
import ServiceListPage from '@pages/service/ServiceListPage';
import PublicProviderProfilePage from '@pages/provider/PublicProviderProfilePage';
import ProviderApplyPage from '@pages/provider/ProviderApplyPage';
import ProviderApplicationStatusPage from '@pages/provider/ProviderApplicationStatusPage';
import PointWalletPage from '@pages/user/point/PointWalletPage';
import NotificationPage from '@pages/user/notification/NotificationPage';
import NotificationSettingsPage from '@pages/user/notification/NotificationSettingsPage';
import SettlementListPage from '@pages/user/settlement/SettlementListPage';
import ReviewListPage from '@pages/user/ReviewListPage';
import ReviewWritePage from '@pages/user/ReviewWritePage';
import ReviewEditPage from '@pages/user/ReviewEditPage';

// 담당자 7 병합 검증: develop의 상품 route가 참조하는 페이지 import가 누락되어 런타임 빈 화면이 발생해 복구했습니다.
// 임시 코드는 아니며 상품 기능의 구현·소유권은 기존 상품 담당자에게 그대로 있습니다.
import ProductRegisterPage from '@pages/product/ProductRegisterPage';
import MyProductListPage from '@pages/product/MyProductListPage';
import ProductDetailSellerPage from '@pages/product/ProductDetailSellerPage';

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

// 개발 플래그가 켜진 로컬 환경에서만 로그인 없는 거래 화면 검토 경로를 제공한다.
const isTradePreviewEnabled = import.meta.env.VITE_USE_TRADE_PREVIEW === 'true';

const AppRoutes = () => {
  return (
    <Routes>
      {/* ────────────────────────────────
          랜딩 페이지 (LandingLayout)
      ──────────────────────────────── */}
      <Route element={<LandingLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
      </Route>

      {/* ────────────────────────────────
          공개 독립 페이지 (레이아웃 없음)
      ──────────────────────────────── */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/login/signup"    element={<SignupPage />} />
      <Route path="/find-email"      element={<FindEmailPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      <Route path="/withdrawal"      element={<WithdrawalRequestPage />} />
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
        <Route path="/services" element={<ServiceListPage />} />
        <Route path="/providers/:providerId" element={<PublicProviderProfilePage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/customersupport/notice" element={<NoticeListPage />} />
        <Route path="/customersupport/notice/:noticeId" element={<NoticeDetailPage />} />
      </Route>

      {/* 실제 거래 경로의 인증 정책과 분리된 개발용 화면 확인 경로 */}
      {isTradePreviewEnabled && (
        <>
          <Route path="/trades/preview" element={<TradeHistory />} />
          <Route path="/trades/preview/chat" element={<TradeChat />} />
          <Route
            path="/trades/preview/:tradeId"
            element={<TradeDetailBuyer />}
          />
          <Route
            path="/trades/preview/:tradeId/seller"
            element={<TradeDetailSeller />}
          />
        </>
      )}

      {/* 거래와 마이페이지는 로그인한 사용자만 접근한다. */}
      <Route
        element={(
          <ProtectedRoute allowedRoles={['ROLE_USER', 'ROLE_SERVICE', 'ROLE_ADMIN']} />
        )}
      >
        <Route element={<UserLayout />}>
          <Route path="/user/mypage" element={<MyPage />} />
          <Route path="/user/point" element={<PointWalletPage />} />
          <Route path="/user/notification" element={<NotificationPage />} />
          <Route
            path="/user/notification/settings"
            element={<NotificationSettingsPage />}
          />
          <Route path="/user/settlement" element={<SettlementListPage />} />
          <Route path="/user/reviews" element={<ReviewListPage />} />
          <Route path="/user/reviews/write/:id" element={<ReviewWritePage />} />
          <Route path="/user/reviews/edit/:id" element={<ReviewEditPage />} />

          <Route path="/trades" element={<TradeHistory />} />
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
          <Route path="/product/register"        element={<ProductRegisterPage />} />
          <Route path="/product/me"              element={<MyProductListPage />} />
          <Route path="/product/:prdSn/seller"   element={<ProductDetailSellerPage />} />
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
          {/* 보안/감사·시스템 설정 (담당자6, F-OPS-014/016/024) */}
          <Route path="audit-logs" element={<AdminAuditLogPage />} />
          <Route path="system-settings" element={<AdminSystemSettingPage />} />
          {/* 관리자 알림 (담당자6, F-COM-004/005) */}
          <Route path="notifications" element={<AdminNotificationPage />} />
          {/* F-OPS-012/013 임시 연동 및 신고 목업 확인용 읽기 전용 화면 */}
          <Route path="operations-preview" element={<OperationsIntegrationPreview />} />
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
