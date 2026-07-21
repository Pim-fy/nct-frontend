// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

/**
 * 인증이 필요한 라우트를 보호하는 컴포넌트
 * @param {string[]} allowedRoles - 허용할 역할 목록
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 인증 정보 로딩 중
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500 font-bold">
        인증 정보를 확인 중입니다...
      </div>
    );
  }

  // 비로그인 → 로그인 페이지로
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 역할 검사 - 백엔드 응답 필드: role (단수).
  // F-AUTH-013: 제공자 모드는 일반 사용자 권한을 포함한다. 관리자 역할의 상속은 없다.
  if (allowedRoles.length > 0) {
    const currentRole = user?.role;
    const hasRole = allowedRoles.includes(currentRole)
      || (currentRole === 'ROLE_SERVICE' && allowedRoles.includes('ROLE_USER'));
    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
