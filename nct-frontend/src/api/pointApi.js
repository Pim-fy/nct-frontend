// src/api/pointApi.js
// 포인트 API 모듈 (담당자6 BJN)
// - 백엔드 응답은 ApiResponse 래핑 구조: { timestamp, status, httpCode, message, data }
// - authApi.js 관례대로 res.data(=ApiResponse)까지 벗겨서 반환하고,
//   실데이터(data) 추출은 훅(usePoint.js)의 select에서 담당한다
import api from './axios';

/** 내 포인트 잔액 조회 — { available, hold, settleable, total } */
export const getPointBalance = () =>
  api.get('/api/point/balance').then(res => res.data);

/** 내 포인트 원장 목록 조회 (최신순 100건) */
export const getPointLedger = () =>
  api.get('/api/point/ledger').then(res => res.data);
