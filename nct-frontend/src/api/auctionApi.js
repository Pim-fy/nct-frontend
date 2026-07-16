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
