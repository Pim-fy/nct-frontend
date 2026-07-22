// src/hooks/useBid.js
// 입찰 조회 훅 (usePoint.js/useReview.js 관례 동일)
import { useQuery } from '@tanstack/react-query';

import { getMyBidHistory } from '../api/bidApi';

/** 내 입찰 내역 — data: [{ bidSn, aucSn, bidAmt, bidStatusCd, auctionStatusCd, bidRegDt }] */
export function useMyBidHistory() {
  return useQuery({
    queryKey: ['bids', 'my'],
    queryFn: getMyBidHistory,
    select: (res) => res.data,
  });
}
