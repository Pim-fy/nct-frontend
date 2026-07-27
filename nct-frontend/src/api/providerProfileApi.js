import api from './axios';

// 담당자 7 · F-PROV-004: 제공자 본인 프로필과 공개 프로필 조회 계약이다.
export const fetchMyProviderProfile = () =>
  api.get('/providers/me/profile').then((response) => response.data.data);

export const updateMyProviderProfile = ({ introduction, availableArea }) =>
  api.put('/providers/me/profile', { introduction, availableArea })
    .then((response) => response.data.data);

export const fetchPublicProviderProfile = (providerUserSn) =>
  api.get(`/providers/${providerUserSn}/profile`).then((response) => response.data.data);
