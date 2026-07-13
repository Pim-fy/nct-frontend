// src/api/aiAxios.js
import { aiApi } from './axios';

/** AI 여행 플랜 생성 요청 */
export const generateAIPlan = (planData) =>
  aiApi.post('/ai/plan', planData).then(res => res.data);

/** AI 플랜 결과 조회 */
export const getAIPlanResult = (planId) =>
  aiApi.get(`/ai/plan/${planId}`).then(res => res.data);
