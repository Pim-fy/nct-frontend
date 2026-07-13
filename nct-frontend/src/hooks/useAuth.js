// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';

/**
 * 인증 상태를 관리하는 커스텀 훅
 * - useNavigate 의존성 제거 → navigate는 호출부에서 처리
 */
export const useAuth = () => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // 초기 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) { setLoading(false); return; }

        // TODO: 실제 API 연동 시 /api/auth/me 호출로 교체
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  /** 로그아웃 */
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  }, []);

  /** 로그인 후 사용자 정보 저장 */
  const login = useCallback((userData, token) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  /** 특정 역할 보유 여부 확인 */
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.some(role => user.roles?.includes(role));
  }, [user]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    hasRole,
  };
};
