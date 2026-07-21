// src/api/reviewApi.js
// 리뷰 관련 백엔드 API 요청 관리 파일.
// API 호출 함수를 만들어 타 파일에서도 사용할 수 있게 내보냄.
import api from './axios';

/** 리뷰 목록 조회 */
export const getReviews = (params) =>
  api.get('/reviews', { params }).then(res => res.data);

/** 거래 상세의 상대방 신뢰지표를 조회한다. totalScore가 null이면 작성된 리뷰가 없는 상태다. */
export const getUserReviewTrust = (userId) => (
  api.get(`/reviews/trust/${userId}`).then(res => res.data)
);

/** 물건·서비스 거래 유형을 구분한 상대방의 받은 리뷰 목록을 페이지 단위로 조회한다. */
export const getUserReviews = (userId, params) => (
  api.get(`/reviews/user/${userId}`, { params }).then(res => res.data)
);

/** 리뷰 등록 */
export const createReview = (data) =>
  api.post('/reviews', data).then(res => res.data);

/** 리뷰 수정 */
export const updateReview = (id, data) =>
  api.put(`/reviews/${id}`, data).then(res => res.data);

/** 리뷰 삭제 */
export const deleteReview = (id) =>
  api.delete(`/reviews/${id}`).then(res => res.data);
