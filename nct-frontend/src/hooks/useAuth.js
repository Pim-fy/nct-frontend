// src/hooks/useAuth.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@hooks/useApi';
import { useConfig } from '@hooks/useConfig';

export const useAuth = () => {
  const apiTool = useApi();
  const { setConfig } = useConfig();
  const queryClient = useQueryClient();

  // ──────────────────────────────────────────
  // 1. 내 정보 조회 (HttpOnly 쿠키 기반)
  //    isLogin 플래그가 없으면 서버를 찌르지 않아 불필요한 요청 차단
  // ──────────────────────────────────────────
  const fetchUser = async () => {
    if (!localStorage.getItem('isLogin')) return null;
    try {
      const authData = await apiTool.fetchMe();
      setConfig('user', authData.data);
      return authData.data;
    } catch {
      localStorage.removeItem('isLogin');
      return null;
    }
  };

  const { data: user = null, isLoading: isUserLoading } = useQuery({
    queryKey : ['auth', 'user'],
    queryFn  : fetchUser,
    staleTime: 1000 * 60 * 5, // 5분 캐시 (화면 이동 시 중복 호출 방지)
  });

  // ──────────────────────────────────────────
  // 2. 로그인 Mutation
  // ──────────────────────────────────────────
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const loginRes = await apiTool.login(credentials);
      return loginRes.data;
      // loginRes.data -> 하단의 userData
    },
    onSuccess: async (userData) => {
      localStorage.setItem('isLogin', 'true');
      setConfig('user', userData);
      queryClient.setQueryData(['auth', 'user'], userData);

      // 로그인 성공 후 프로필 로드
      try {
        const profileRes = await apiTool.getProfile();
        const { mapDataToState } = await import('@utils/common');
        // 백엔드 응답 구조: { status, data: { id, email, name, ... } }
        const profileData = mapDataToState('profile', profileRes.data ?? profileRes);
        setConfig('profile', profileData);
      } catch (e) {
        console.error('프로필 로드 실패:', e);
      }
    },
  });

  // ──────────────────────────────────────────
  // 3. 로그아웃 Mutation
  // ──────────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const currentPath = window.location.pathname + window.location.search;
      await apiTool.logout();
      return currentPath;
    },
    onSuccess: (currentPath) => {
      localStorage.removeItem('isLogin');
      setConfig('user', {});
      setConfig('profile', null);
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();

      // 인증이 필요한 페이지에서 로그아웃하면 랜딩으로, 그 외는 현재 페이지 유지
      const restrictedPaths = ['/admin'];
      if (restrictedPaths.some((path) => currentPath.startsWith(path))) {
        window.location.href = '/';
      } else {
        window.location.href = currentPath;
      }
    },
    onError: () => {
      // 네트워크 오류 시에도 프론트 상태 강제 초기화
      localStorage.removeItem('isLogin');
      setConfig('user', {});
      setConfig('profile', null);
      queryClient.setQueryData(['auth', 'user'], null);
      window.location.href = '/';
    },
  });

  // ──────────────────────────────────────────
  // 4. 로컬 강제 로그아웃 (회원탈퇴 등 특수 케이스)
  // ──────────────────────────────────────────
  const localLogout = () => {
    localStorage.removeItem('isLogin');
    setConfig('user', {});
    setConfig('profile', null);
    queryClient.setQueryData(['auth', 'user'], null);
    window.location.href = '/';
  };

  return {
    user,
    loading        : isUserLoading || loginMutation.isPending || logoutMutation.isPending,
    isAuthenticated: !!user,   // ← 단일 소스, user 객체 기반 자동 동기화
    login          : loginMutation.mutateAsync,
    logout         : logoutMutation.mutateAsync,
    localLogout,
  };
};