// src/hooks/usePoint.js
// 포인트 조회 훅 (TanStack Query — 프로젝트 첫 사용례)
// - queryKey로 캐시가 관리되고, 전역 기본값(staleTime 5분)이 적용된다
// - select로 ApiResponse 껍질({status, data, ...})에서 실데이터만 꺼내
//   컴포넌트는 백엔드 래핑 구조를 몰라도 되게 한다
import { useQuery } from '@tanstack/react-query';

import { getPointBalance, getPointLedger } from '../api/pointApi';

/** 내 포인트 잔액 — data: { available, hold, settleable, total } */
export function usePointBalance() {
  return useQuery({
    queryKey: ['point', 'balance'],
    queryFn: getPointBalance,
    select: (res) => res.data,
  });
}

/** 내 포인트 원장 목록 — data: [{ id, date, type, category, amount, balanceAfter, ref, reason, ... }] */
export function usePointLedger() {
  return useQuery({
    queryKey: ['point', 'ledger'],
    queryFn: getPointLedger,
    select: (res) => res.data,
  });
}
