// src/hooks/useReview.js
// 리뷰 조회 훅 (usePoint.js/useSettlement.js 관례 동일)
import { useQuery } from '@tanstack/react-query';

import { getWritableReviews, getMyReviews } from '../api/reviewApi';

/** 작성 가능한 리뷰 목록 — data: [{ id, thumbnail, title, dealType, partyLabel, partyName, completedDate }] */
export function useWritableReviews() {
  return useQuery({
    queryKey: ['reviews', 'writable'],
    queryFn: getWritableReviews,
    select: (res) => res.data,
  });
}

/** 내가 작성한 리뷰 목록 — data: [{ id, tradeId, rating, content, title, dealType, partyLabel, partyName, completedDate, photos }] */
export function useMyReviews() {
  return useQuery({
    queryKey: ['reviews', 'my'],
    queryFn: getMyReviews,
    select: (res) => res.data,
  });
}
