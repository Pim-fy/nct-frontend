// src/api/authApi.js
import api from './axios';

/** 로그인 */
export const login = (credentials) =>
  api.post('/api/auth/login', credentials).then(res => res.data);

/** 로그아웃 */
export const logout = () =>
  api.post('/api/auth/logout').then(res => res.data);

/** 회원가입 */
export const signup = (userData) =>
  api.post('/api/auth/signup', userData).then(res => res.data);

/** 내 정보 조회 */
export const getMyInfo = () =>
  api.get('/api/auth/me').then(res => res.data);

/** 이메일 찾기 */
export const findEmail = (params) =>
  api.post('/api/auth/find-email', params).then(res => res.data);

/** 비밀번호 재설정 */
export const resetPassword = (params) =>
  api.post('/api/auth/reset-password', params).then(res => res.data);

/** 이메일 중복 확인 */
export const checkEmail = (email) =>
  api.get('/api/auth/check-email', { params: { email } }).then(res => res.data);

/** 닉네임 중복 확인 */
export const checkNickname = (nickname) =>
  api.get('/api/auth/check-nickname', { params: { nickname } }).then(res => res.data);
