// src/api/notificationApi.js
// 알림 API 모듈 (담당자6 BJN)
import api from './axios';

/** 내 알림 목록 조회 (최신순 100건) */
export const getNotifications = () =>
  api.get('/api/notification').then(res => res.data);

/** 미읽음 개수 조회 — { count } (헤더 종 배지 확장 대비) */
export const getUnreadCount = () =>
  api.get('/api/notification/unread-count').then(res => res.data);

/** 개별 읽음 처리 — 서버가 본인 알림인지 검증하므로 남의 id는 무시된다 */
export const markNotificationRead = (id) =>
  api.patch(`/api/notification/${id}/read`).then(res => res.data);

/** 전체 읽음 처리 */
export const markAllNotificationsRead = () =>
  api.patch('/api/notification/read-all').then(res => res.data);
