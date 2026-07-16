// src/hooks/useNotification.js
// 알림 조회·읽음 처리 훅 (TanStack Query)
// - 읽음 처리(mutation) 성공 시 목록 쿼리를 invalidate해서 서버 상태를 다시 가져온다
//   (1차 구현은 단순한 invalidate 방식 — 깜빡임이 거슬리면 낙관적 업데이트로 교체 여지)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getNotifications,
  getNotificationSettings,
  markAllNotificationsRead,
  markNotificationRead,
  saveNotificationSettings,
} from '../api/notificationApi';

/** 내 알림 목록 — data: [{ id, typeCd, type, domainCd, domain, title, content, read, regDt, ... }] */
export function useNotifications() {
  return useQuery({
    queryKey: ['notification', 'list'],
    queryFn: getNotifications,
    select: (res) => res.data,
  });
}

/** 개별 읽음 처리 — mutate(id) */
export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification'] }),
  });
}

/** 전체 읽음 처리 — mutate() */
export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification'] }),
  });
}

/** 알림 수신 설정 조회 (F-COM-012) — data: { aucInapp, ..., svcEmail } (전부 boolean) */
export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification', 'settings'],
    queryFn: getNotificationSettings,
    select: (res) => res.data,
  });
}

/** 알림 수신 설정 저장 — mutate({ aucInapp, ..., svcEmail }) */
export function useSaveNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveNotificationSettings,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notification', 'settings'] }),
  });
}
