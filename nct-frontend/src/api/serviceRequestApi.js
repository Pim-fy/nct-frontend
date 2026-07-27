// src/api/serviceRequestApi.js
// ─────────────────────────────────────────────────────────────────────────────
// 서비스 요청서 API — 요청서 등록 · 내 요청 목록 조회 · 요청서 상세 조회 · 삭제
//             ServiceRequestFormPage 등에서 사용 (F-SVC-001~004)
// ─────────────────────────────────────────────────────────────────────────────
import api from './axios';

/** 요청서 등록 */
export const registerServiceRequest = (data) =>
  api.post('/service-requests', data).then(res => res.data);

/** 내 요청서 목록 — filterType: DRAFT | OPEN | MATCHED | CLOSED | null(전체) */
export const getMyServiceRequests = (page = 1, size = 10, filterType = null) =>
  api.get('/service-requests/me', { params: { page, size, ...(filterType ? { filterType } : {}) } }).then(res => res.data);

/** 요청서 상세 조회 */
export const getServiceRequest = (svcReqSn) =>
  api.get(`/service-requests/${svcReqSn}`).then(res => res.data);

/** 임시저장 요청서 수정 및 공개 전환 */
export const updateServiceRequest = (svcReqSn, data) =>
  api.put(`/service-requests/${svcReqSn}`, data).then(res => res.data);

/** 요청서 삭제 */
export const deleteServiceRequest = (svcReqSn) =>
  api.delete(`/service-requests/${svcReqSn}`).then(res => res.data);

/** 요청서 마감 (F-SVC-003) */
export const closeServiceRequest = (svcReqSn) =>
  api.patch(`/service-requests/${svcReqSn}/close`).then(res => res.data);
