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
import LoginPage          from '@pages/auth/LoginPage';
import SignupPage         from '@pages/auth/SignupPage';
import FindEmailPage      from '@pages/auth/FindEmailPage';
import ResetPasswordPage  from '@pages/auth/ResetPasswordPage';
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
import PointWalletPage from '@pages/user/point/PointWalletPage';
import NotificationPage from '@pages/user/notification/NotificationPage';
import NotificationSettingsPage from '@pages/user/notification/NotificationSettingsPage';
import SettlementListPage from '@pages/user/settlement/SettlementListPage';
import ReviewListPage from '@pages/user/ReviewListPage';
>>>>>>> origin/develop

// ──────────────────────────────────────────
// Admin 페이지
// ──────────────────────────────────────────
import Dashboard        from '@pages/admin/Dashboard';


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
      <Route path="/oauth/redirect"  element={<OAuthRedirectHandler />} />
      <Route path="/unauthorized"    element={<Unauthorized />} />
      <Route path="/403"             element={<Unauthorized />} />
      <Route path="/404"             element={<NotFoundPage />} />
      <Route path="/500"             element={<ServerErrorPage />} />

      {/* ────────────────────────────────
          공개 조회 영역 (UserLayout)
      ──────────────────────────────── */}
      <Route element={<UserLayout />}>
        {/* 마이페이지 */}
        <Route path="/user/mypage" element={<MyPage />} />
        {/* 포인트 지갑 (BJN) */}
        <Route path="/user/point" element={<PointWalletPage />} />
        {/* 알림함 (BJN) */}
        <Route path="/user/notification" element={<NotificationPage />} />
        {/* 알림 설정 (BJN) */}
        <Route path="/user/notification/settings" element={<NotificationSettingsPage />} />
        {/* 정산 관리 - 제공자용 (BJN) */}
        <Route path="/user/settlement" element={<SettlementListPage />} />
        {/* 리뷰작성 목록 */}
        <Route path="/user/reviews" element={<ReviewListPage />} />

        {/* 상품 — 로그인 필요 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/product/register"        element={<ProductRegisterPage />} />
          <Route path="/product/me"              element={<MyProductListPage />} />
          <Route path="/product/:prdSn/seller"   element={<ProductDetailSellerPage />} />
        </Route>
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        {/* 대시보드 */}
        <Route index element={<Dashboard />} />
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
