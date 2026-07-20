// src/api/productApi.js
// ─────────────────────────────────────────────────────────────────────────────
// 상품 API — 상품 등록 · 내 판매 목록 조회 · 상품 상세 조회 · 상품 삭제
//             ProductRegisterPage / MyProductListPage / ProductDetailSellerPage 에서 사용
// ─────────────────────────────────────────────────────────────────────────────
import api from './axios';

/** 상품 등록 */
export const registerProduct = (data) =>
  api.post('/products', data).then(res => res.data);

/** 내 판매 목록 */
export const getMyProducts = (page = 1, size = 10) =>
  api.get('/products/me', { params: { page, size } }).then(res => res.data);

/** 상품 상세 조회 */
export const getProduct = (prdSn) =>
  api.get(`/products/${prdSn}`).then(res => res.data);

/** 상품 삭제 */
export const deleteProduct = (prdSn) =>
  api.delete(`/products/${prdSn}`).then(res => res.data);

/** 금지 키워드 목록 조회 (F-AUC-004) */
export const fetchBannedKeywords = () =>
  api.get('/products/banned-keywords').then(res => res.data.data);
