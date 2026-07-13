// src/api/reviewApi.js
import api from './axios';

/** 리뷰 목록 조회 */
export const getReviews = (params) =>
  api.get('/api/reviews', { params }).then(res => res.data);

/** 리뷰 등록 */
export const createReview = (data) =>
  api.post('/api/reviews', data).then(res => res.data);

/** 리뷰 수정 */
export const updateReview = (id, data) =>
  api.put(`/api/reviews/${id}`, data).then(res => res.data);

/** 리뷰 삭제 */
export const deleteReview = (id) =>
  api.delete(`/api/reviews/${id}`).then(res => res.data);
