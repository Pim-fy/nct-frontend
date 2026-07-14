// src/api/axios.js
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true,           // HttpOnly 쿠키 자동 전송
  headers: {
    'Content-Type': 'application/json',
  },
});

// 서버 장애(5xx) 시 공통 에러 페이지로 이동
// 이미 /500이면 무한 리다이렉트 방지
const redirectToServerError = () => {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/500') return;
  window.location.href = '/500';
};

// 401이 동시에 여러 건 발생해도 refresh 요청은 딱 한 번만 보낸다
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => config,
  (error)  => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 로그인·refresh 요청 자체가 실패한 경우 재시도 루프 방지
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    // 401 → access token 만료로 판단 후 refresh 시도 (1회만)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // refresh 중이면 현재 요청을 큐에 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${BACKEND_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        isRefreshing = false;
        processQueue(null);
        return api(originalRequest); // 원래 요청 재시도
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);

        if (!originalRequest.url?.includes('/auth/me')) {
          alert('보안을 위해 로그인이 만료되었습니다. 다시 로그인해 주세요.');
          localStorage.removeItem('isLogin');
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // 5xx 서버 오류 → 공통 에러 페이지
    if (error.response?.status >= 500) {
      redirectToServerError();
    }

    return Promise.reject(error);
  }
);

export default api;