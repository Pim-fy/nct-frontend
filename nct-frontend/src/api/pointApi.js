// src/api/pointApi.js
// 포인트 API 모듈 (담당자6 BJN)
// - 백엔드 응답은 ApiResponse 래핑 구조: { timestamp, status, httpCode, message, data }
// - authApi.js 관례대로 res.data(=ApiResponse)까지 벗겨서 반환하고,
//   실데이터(data) 추출은 훅(usePoint.js)의 select에서 담당한다
import api from './axios';

/** 내 포인트 잔액 조회 — { available, hold, settleable, total } */
export const getPointBalance = () =>
  api.get('/point/balance').then(res => res.data);

/** 내 포인트 원장 목록 조회 (최신순 100건) */
export const getPointLedger = () =>
  api.get('/point/ledger').then(res => res.data);

/** 충전 주문 생성 — 결제창/위젯을 띄우기 전에 서버가 신뢰 기준 금액을 먼저 기록한다 (F-PAY-011)
 *  method: 'WINDOW'(결제창) | 'WIDGET'(결제위젯) — 방식별로 토스 클라이언트 키가 달라 서버가 맞는 키를 내려준다
 *  응답 data: { orderId, amount, orderName, clientKey } — 이 값 그대로 토스 SDK를 호출한다 */
export const requestPointCharge = (amount, method = 'WINDOW') =>
  api.post('/point/charge/request', { amount, method }).then(res => res.data);

/** 결제 승인 확정 — 결제창 성공 리다이렉트 후 호출. 최종 지급 판단은 서버가 한다 */
export const confirmPointCharge = ({ orderId, paymentKey }) =>
  api.post('/point/charge/confirm', { orderId, paymentKey }).then(res => res.data);

/** 내 충전 주문 이력 조회 (실패·취소·대기 포함, 최신순 100건) */
export const getPointChargeOrders = () =>
  api.get('/point/charge/orders').then(res => res.data);
