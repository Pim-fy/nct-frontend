// src/api/memberApi.js
// 회원 프로필 수정·탈퇴 관련 API 요청 관리 파일 (F-AUTH-010·011).
// `api`(Axios 인스턴스)를 사용해 /api/member/** 호출.
import api from './axios';

/** 프로필 기본 정보 수정 (닉네임·프로필사진·연락이메일·계좌번호) */
export const updateProfile = (payload) =>
  api.patch('/member/me', payload).then(res => res.data);

/** 회원 탈퇴 - 활성 계정(로그인 상태 + 현재 비밀번호 재확인) */
export const withdrawActive = (currentPassword) =>
  api.post('/member/me/withdraw', { currentPassword }).then(res => res.data);

// @ai_generated: F-AUTH-011 - 정지 계정 전용. 계정 상태와 무관하게 항상 동일한 성공 응답을 준다.
/** 정지 계정용 탈퇴 확인 링크 발송 */
export const requestWithdrawal = (params) =>
  api.post('/member/withdrawal-links', params).then(res => res.data);

/** 정지 계정용 탈퇴 확정 (이메일 링크의 토큰) */
export const confirmWithdrawal = (token) =>
  api.post('/member/withdrawal-links/confirm', { token }).then(res => res.data);
