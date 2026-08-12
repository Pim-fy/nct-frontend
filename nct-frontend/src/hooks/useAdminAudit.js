// Claude Code 작성 (BJN, 2026-07-18)
// src/hooks/useAdminAudit.js
// 감사로그 관리자 훅 (TanStack Query, 담당자6 BJN, F-OPS-014/016)
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getAuditHistory, getAuditLogs, requestSensitiveView } from '../api/adminAuditApi';

/**
 * 감사로그 조건별 조회 — filters가 바뀌면 queryKey가 바뀌어 자동 재조회된다
 * data: [{ id, date, userName, userSn, type, typeCd, refType, refSn, reason, ipAddr }]
 */
export function useAuditLogs(filters = {}) {
  return useQuery({
    queryKey: ['admin', 'audit', 'logs', filters],
    queryFn: () => getAuditLogs(filters),
    select: (res) => res.data,
  });
}

/** 담당자 7 · F-OPS-016: 모든 관리자 상세 화면이 재사용하는 대상별 이력 훅입니다. */
export function useAdminHistory(refType, refSn, limit = 100) {
  return useQuery({
    queryKey: ['admin', 'audit', 'history', refType, refSn, limit],
    queryFn: () => getAuditHistory({ refType, refSn, limit }),
    enabled: Boolean(refType && Number(refSn) > 0),
  });
}

/**
 * 민감정보 원문 제한 조회 — mutate({ chMsgSn, reportSn, reason })
 * 성공하면 감사로그가 방금 한 건 늘었으므로 목록을 다시 가져온다
 */
export function useSensitiveView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestSensitiveView,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'audit', 'logs'] }),
  });
}
