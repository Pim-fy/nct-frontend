// src/api/axios.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const AI_URL   = import.meta.env.VITE_AI_API_URL || 'http://localhost:8090';

// 기본 API 인스턴스
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// AI API 인스턴스
export const aiApi = axios.create({
  baseURL: AI_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 공통 함수
const requestInterceptor = (config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
};

const requestErrorInterceptor = (error) => Promise.reject(error);

// 응답 에러 인터셉터 공통 함수
const responseErrorInterceptor = (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

api.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
api.interceptors.response.use((res) => res, responseErrorInterceptor);

aiApi.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
aiApi.interceptors.response.use((res) => res, responseErrorInterceptor);

export default api;
