// src/api/productApi.js
import api from './axios';

/** 상품 등록 */
export const registerProduct = (data) =>
  api.post('/api/products', data).then(res => res.data);

/** 내 판매 목록 */
export const getMyProducts = (page = 1, size = 10) =>
  api.get('/api/products/me', { params: { page, size } }).then(res => res.data);

/** 상품 상세 조회 */
export const getProduct = (prdSn) =>
  api.get(`/api/products/${prdSn}`).then(res => res.data);

/** 상품 삭제 */
export const deleteProduct = (prdSn) =>
  api.delete(`/api/products/${prdSn}`).then(res => res.data);
