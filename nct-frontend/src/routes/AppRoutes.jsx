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
import TradeHistory from '@pages/trade/TradeHistory';
import TradeDetailBuyer from '@pages/trade/TradeDetailBuyer';
import TradeDetailSeller from '@pages/trade/TradeDetailSeller';
import TradeChat from '@pages/trade/TradeChat';

// ──────────────────────────────────────────
// Admin 페이지
// ──────────────────────────────────────────
import Dashboard        from '@pages/admin/Dashboard';

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
      <Route path="/oauth/redirect"  element={<OAuthRedirectHandler />} />
      <Route path="/unauthorized"    element={<Unauthorized />} />
      <Route path="/403"             element={<Unauthorized />} />
      <Route path="/404"             element={<NotFoundPage />} />
      <Route path="/500"             element={<ServerErrorPage />} />

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
          <ProtectedRoute
            allowedRoles={['ROLE_USER', 'ROLE_SERVICE', 'ROLE_ADMIN']}
          />
        )}
      >
        <Route element={<UserLayout />}>
        <Route path="/user/mypage" element={<MyPage />} />
        <Route path="/trades" element={<TradeHistory />} />
        {/* 물건 거래 상세: 인증·거래 API 연결 후 당사자 역할에 따라 단일 경로로 통합 */}
        <Route path="/trades/:tradeId" element={<TradeDetailBuyer />} />
        <Route path="/trades/:tradeId/seller" element={<TradeDetailSeller />} />
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
