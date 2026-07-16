import api from './axios';

export const getSettlementList = async () => {
  const response = await api.get('/settlement');
  return response.data.data;
};
