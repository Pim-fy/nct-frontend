// src/api/reviewApi.js
// 리뷰 관련 백엔드 API 요청 관리 파일.
// API 호출 함수를 만들어 타 파일에서도 사용할 수 있게 내보냄.
import api from './axios';

/** 작성 가능한 리뷰 목록 (완료 거래 중 아직 리뷰를 안 쓴 것) */
export const getWritableReviews = () =>
  api.get('/reviews/writable').then(res => res.data);

/** 내가 작성한 리뷰 목록 */
export const getMyReviews = () =>
  api.get('/reviews/me').then(res => res.data);

// axios 인스턴스 기본 헤더가 'Content-Type: application/json'이라, FormData를 보낼 땐
// multipart로 명시적으로 덮어써야 한다 (안 하면 서버가 파트를 못 읽고 필수 파라미터 누락으로 500)
// - fileApi.js의 uploadImage와 동일한 이유.
const MULTIPART_CONFIG = { headers: { 'Content-Type': 'multipart/form-data' } };

/** 리뷰 등록 (multipart/form-data: targetId, rating, content, photos) */
export const createReview = (data) =>
  api.post('/reviews', data, MULTIPART_CONFIG).then(res => res.data);

/** 리뷰 수정 (multipart/form-data: rating, content, photos) */
export const updateReview = (id, data) =>
  api.put(`/reviews/${id}`, data, MULTIPART_CONFIG).then(res => res.data);

/** 리뷰 삭제 */
export const deleteReview = (id) =>
  api.delete(`/reviews/${id}`).then(res => res.data);
