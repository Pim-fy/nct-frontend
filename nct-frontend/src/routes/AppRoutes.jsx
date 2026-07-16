// src/routes/AppRoutes.jsx
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
// 담당자 7 공개 콘텐츠 route. 공통 route 소유자(담당자 1)에게 동일 manifest로 전달합니다.
import GuidePage from '@pages/content/GuidePage';
import NoticeListPage from '@pages/content/NoticeListPage';
import NoticeDetailPage from '@pages/content/NoticeDetailPage';
import ServiceListPage from '@pages/service/ServiceListPage';
import PublicProviderProfilePage from '@pages/provider/PublicProviderProfilePage';

// ──────────────────────────────────────────
// Admin 페이지
// ──────────────────────────────────────────
import Dashboard        from '@pages/admin/Dashboard';
import OperationsIntegrationPreview from '@pages/admin/OperationsIntegrationPreview';
import AdminNoticeListPage from '@pages/admin/notice/AdminNoticeListPage';
import AdminNoticeFormPage from '@pages/admin/notice/AdminNoticeFormPage';
import AdminGuidePage from '@pages/admin/guide/AdminGuidePage';


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
        {/* 담당자 7의 F-COM-002/015 화면. 공통 route 소유자(담당자 1)에게 동일 manifest로 전달합니다. */}
        <Route path="/services" element={<ServiceListPage />} />
        <Route path="/providers/:providerId" element={<PublicProviderProfilePage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/customersupport/notice" element={<NoticeListPage />} />
        <Route path="/customersupport/notice/:noticeId" element={<NoticeDetailPage />} />
        {/* 마이페이지 */}
        <Route path="/user/mypage" element={<MyPage />} />
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
