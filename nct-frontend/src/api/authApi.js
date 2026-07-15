// src/api/authApi.js
// 인증, 회원 관련 백엔드 API 요청 관리 파일.
// API 호출 함수를 만들어 타 파일에서도 사용할 수 있게 내보냄.
// `api`(Axios 인스턴스)를 사용해 인증 API 호출.
import api from './axios';

/** 로그인 */
export const login = (credentials) =>
  api.post('/auth/login', credentials).then(res => res.data);

/** 로그아웃 */
export const logout = () =>
  api.post('/auth/logout').then(res => res.data);

/** 회원가입 */
export const signup = (userData) =>
  api.post('/auth/signup', userData).then(res => res.data);

/** 내 정보 조회 */
export const getMyInfo = () =>
  api.get('/auth/me').then(res => res.data);

/** 이메일 찾기 */
export const findEmail = (params) =>
  api.post('/auth/find-email', params).then(res => res.data);

/** 비밀번호 재설정 */
export const resetPassword = (params) =>
  api.post('/auth/reset-password', params).then(res => res.data);

/** 이메일 중복 확인 */
export const checkEmail = (email) =>
  api.get('/auth/check-email', { params: { email } }).then(res => res.data);

/** 닉네임 중복 확인 */
export const checkNickname = (nickname) =>
  api.get('/auth/check-nickname', { params: { nickname } }).then(res => res.data);
