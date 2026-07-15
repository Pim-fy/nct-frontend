// src/api/axios.js
// 프론트엔드가 백엔드 API를 호출할 때 쓰는 공통 통신 설정 파일.
// 타 API 파일에서 이 파일의 api라는 Axios 인스턴스를 가져다 씀.
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * 백엔드 API 통신에 사용할 공통 Axios 인스턴스.
 * 기본 API 주소, JSON 요청 헤더, HttpOnly 쿠키 전송 설정 적용.
 */
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,    // api 요청 기본 URL.
  withCredentials: true,            // HttpOnly 쿠키 자동 전송.
  headers: {
    'Content-Type': 'application/json',   // 요청 본문이 json 형식.
  },
});

/**
 * 서버 장애(5xx) -> 공통 에러 페이지 이동.
 */
const redirectToServerError = () => {
  if (typeof window === 'undefined') return;        // 브라우저가 아니라면 종료.
  if (window.location.pathname === '/500') return;  // 이미 `/500`인 경우 무한 리다이렉트 방지
  window.location.href = '/500';                    // 브라우저의 현재 주소를 /500으로 변경하여 해당 페이지로 이동시킴.
};

// 401이 동시에 여러 건 발생해도 refresh 요청은 딱 한 번만 보낸다
let isRefreshing = false;     // Access Token 재발급 진행중.
                              // T: 이미 다른 요청이 재발급 중. F: 재발급 중이 아님.
let failedQueue  = [];        // 대기 요청 목록.

/**
 * 토큰 재발급 결과 나온 뒤, Queue에서 기다리던 요청들을 한꺼번에 처리.
 * error: refresh 요청 실패시 에러 객체, 성공 시 null
 */
const processQueue = (error) => {
  failedQueue.forEach((prom) => {   // 대기 중인 요청을 하나씩 꺼내 처리.
    if (error) prom.reject(error);  // 대기하던 요청이 실패 처리됨. -> .catch()
    else prom.resolve();            // 대기하던 요청이 다음 단계로 진행. -> .then()
  });
  failedQueue = [];
};

// API 요청 직전 실행되는 인터셉터.
api.interceptors.request.use(
  (config) => config,                   // 요청 설정이 정상일 때.
  (error)  => Promise.reject(error)     // 요청 준비 과정에서 오류 발생할 때.
);

// API 응답 직전 실행되는 인터셉터.
api.interceptors.response.use(
  (response) => response,       // 응답이 정상 응답일 때.
  async (error) => {            // 오류 응답 받으면 실행.
    const originalRequest = error.config;     // 실패한 요청의 정보.

    // 로그인·refresh 요청 자체가 실패한 경우 재시도 루프 방지
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);   // 작업 실패처리, error을 호출한 곳에 전달.
    }

    /**
     * 401 이면서, 재시도않은 요청인지 확인.
     * access token 만료로 판단 후 refresh 시도(1회).
     */
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 다른 요청이 토큰 재발급 중인 경우, 대기열에 넣음.
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))     // refresh 성공 -> prom.resolve() -> .then()
          .catch((err) => Promise.reject(err)); // refresh 실패 -> prom.rejecet(error) -> .catch()
      }

      originalRequest._retry = true;  // 요청이 재시도 한 상태.
      isRefreshing = true;            // 토큰 재발급 진행중인 상태.

      try {
        // refresh API 호출.
        await axios.post(       // `api.post`가 아닌 `axios.post` 사용 이유: refresh 요청이 응답 인터셉터를 다시 타면서 무한처리되는 것을 피하려 함.
          `${BACKEND_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // 토큰 재발급 성공 상태임.
        isRefreshing = false;         // 리프래시 요청을 보냈으니 토큰 재발급 진행중이 아닌 상태.
        processQueue(null);           // 대기열의 다른 요청들을 진행시킴.
        return api(originalRequest);  // 원래 요청 재시도
      } catch (refreshError) {        // 토큰 재발급 실패.
        isRefreshing = false;         // 리프래시 진행 상태 해제.
        processQueue(refreshError);   // 대기 중이던 다른 요청도 모두 실패 처리.

        // 비로그인 상태를 오류처럼 안내하지 않기 위한 처리.
        if (!originalRequest.url?.includes('/auth/me')) {
          alert('보안을 위해 로그인이 만료되었습니다. 다시 로그인해 주세요.');
          localStorage.removeItem('isLogin');     // localStorage의 islogin값 삭제.
          window.location.href = '/login';        // 브라우저 주소를 `/login`으로 변경. 로그인 페이지로 이동.
        }
        
        return Promise.reject(refreshError);      // 호출한 코드에 refresh 실패 전달.
      }
    }

    // 5xx 서버 오류 → 공통 에러 페이지
    if (error.response?.status >= 500) {
      redirectToServerError();
    }

    return Promise.reject(error);       // 처리하지 않은 오류는 호출한 곳에 전달함.
  }
);

export default api;