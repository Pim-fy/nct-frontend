import { useQuery } from '@tanstack/react-query';
import { getAdminRiskEvents, getAdminRiskEventSummary } from '@api/adminRiskEventApi';

/** 담당자 7 · F-OPS-013: 필터가 바뀌면 관리자 위험 이벤트 목록을 다시 읽습니다. */
export const useAdminRiskEvents = (filters) => useQuery({
  queryKey: ['admin', 'risk-events', filters],
  queryFn: () => getAdminRiskEvents(filters),
  select: (response) => response.data,
});

/** 담당자 7 · F-OPS-013: 유형 선택지와 상단 건수 표시에 쓰는 읽기 전용 집계입니다. */
export const useAdminRiskEventSummary = () => useQuery({
  queryKey: ['admin', 'risk-events', 'summary'],
  queryFn: () => getAdminRiskEventSummary(),
  select: (response) => response.data,
});
