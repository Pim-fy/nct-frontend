// src/api/fileApi.js
// Claude Code 작성 (BJN, 2026-07-17)
// ─────────────────────────────────────────────────────────────────────────────
// 파일 업로드 API — 이미지 1장을 업로드하고 {flSn, url}을 받는다 (F-AUC-002 이미지 연계)
// ProductRegisterPage에서 사용. 응답 url은 백엔드 정적 리소스 경로(/uploads/...)라
// axios 인스턴스의 baseURL(.../api)과 축이 달라서, 화면에 그릴 땐 toImageUrl로
// 백엔드 origin을 직접 붙여줘야 한다.
// ─────────────────────────────────────────────────────────────────────────────
import api from './axios';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/** 이미지 1장 업로드 → { flSn, url } */
export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post('/files', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(res => res.data);
};

/** 서버가 내려준 상대 경로(/uploads/...)를 화면에 그릴 수 있는 절대 URL로 변환 */
export const toImageUrl = (path) => (path ? `${BACKEND_URL}${path}` : null);
