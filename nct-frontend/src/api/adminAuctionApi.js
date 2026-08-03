import api from './axios';

// 담당자 7 · F-OPS-003/004: 관리자 경매 조회와 종료 경매 취소 요청 판정 API입니다.
export const fetchAdminAuctions = async (params) => {
  const response = await api.get('/admin/auctions', { params });
  return response.data.data;
};

export const fetchAdminAuctionOverview = async (auctionId) => {
  const response = await api.get(`/admin/auctions/${auctionId}`, {
    skipServerErrorRedirect: true,
  });
  return response.data.data;
};

export const fetchAdminAuctionCancellationRequest = async (auctionId) => {
  const response = await api.get(
    `/admin/seller-cancellations/auctions/${auctionId}/cancellation-request`,
    { skipServerErrorRedirect: true },
  );
  return response.data.data;
};

export const decideAdminAuctionCancellation = async ({ auctionId, decision, reason }) => {
  await api.post(`/admin/seller-cancellations/auctions/${auctionId}/cancellation-request/decision`, {
    decision,
    reason,
  });
};
