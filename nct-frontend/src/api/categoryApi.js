// src/api/categoryApi.js
import api from './axios';

/** 카테고리 목록 조회 (domainCd: 'CATC0001' = 물건) */
export const getCategories = (domainCd) =>
  api.get('/api/categories', { params: { domainCd } }).then(res => res.data);
