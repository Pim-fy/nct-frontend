// src/api/reviewApi.js
// ─────────────────────────────────────────────────────────────────────────────
// 리뷰 API — 리뷰 목록 조회 · 등록 · 수정 · 삭제
// ─────────────────────────────────────────────────────────────────────────────
import api from './axios';

/** 리뷰 목록 조회 */
export const getReviews = (params) =>
  api.get('/reviews', { params }).then(res => res.data);

/** 리뷰 등록 */
export const createReview = (data) =>
  api.post('/reviews', data).then(res => res.data);

/** 리뷰 수정 */
export const updateReview = (id, data) =>
  api.put(`/reviews/${id}`, data).then(res => res.data);

/** 리뷰 삭제 */
export const deleteReview = (id) =>
  api.delete(`/reviews/${id}`).then(res => res.data);
