// src/hooks/useApi.js
import { useState, useCallback, useMemo } from 'react';
import api from '@api/axios';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const execute = useCallback(async (apiCall, fullResponse = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiCall();
      return fullResponse ? res : res.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // useMemo로 참조값 고정 → useAuth의 useQuery dependency 안정화
  const services = useMemo(() => ({

    // ──────────────────────────────────────────
    // 인증
    // ──────────────────────────────────────────
    fetchMe : ()      => execute(() => api.get('/auth/me')),
    login   : (creds) => execute(() => api.post('/auth/login', creds), false),
    logout  : ()      => execute(() => api.post('/auth/logout'), false),

    // ──────────────────────────────────────────
    // 프로필
    // ──────────────────────────────────────────
    getProfile    : ()         => execute(() => api.get('/auth/me')),
    checkNickname : (nickname) => execute(() => api.get('/auth/check-nickname', { params: { nickname } })),
    updateProfile : (formData) => execute(() => api.post('/member/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }), true),
    withdrawMember: (payload)  => execute(() => api.delete('/member/me', { data: payload })),

  }), [execute]);

  return { loading, error, ...services };
};