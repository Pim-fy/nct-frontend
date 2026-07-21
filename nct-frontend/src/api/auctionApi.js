import api from './axios';

export const fetchAuctions = async (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => query.append(key, item));
      return;
    }
    query.set(key, value);
  });

  const queryString = query.toString();
  const response = await api.get(`/auctions${queryString ? `?${queryString}` : ''}`);
  return response.data.data;
};

export const fetchAuctionDetail = async (auctionId) => {
  const response = await api.get(`/auctions/${auctionId}`);
  return response.data.data;
};

export const placeAuctionBid = async (auctionId, payload) => {
  const response = await api.post(`/auctions/${auctionId}/bids`, payload);
  return response.data.data;
};

export const buyNowAuction = async (auctionId, payload) => {
  const response = await api.post(`/auctions/${auctionId}/buy-now`, payload);
  return response.data.data;
};

export const addAuctionFavorite = async (auctionId) => {
  const response = await api.put(`/auctions/${auctionId}/favorite`);
  return response.data.data;
};

export const removeAuctionFavorite = async (auctionId) => {
  const response = await api.delete(`/auctions/${auctionId}/favorite`);
  return response.data.data;
};

export const fetchAuctionFavoriteStatus = async (auctionId) => {
  const response = await api.get(`/auctions/${auctionId}/favorite`);
  return response.data.data;
};

export const fetchMyFavoriteAuctions = async (params) => {
  const response = await api.get('/auctions/favorites/me', { params });
  return response.data.data;
};

export const getAuctionStatus = async (productId) => {
  const response = await api.get(`/auctions/product/${productId}`);
  return response.data.data;
};
