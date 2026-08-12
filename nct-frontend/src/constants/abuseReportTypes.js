/** 담당자 7 · F-COM-015/018: 신규 고객 신고에 허용하는 세부 사유 코드입니다. */
export const CUSTOMER_REPORT_TYPE_CODES = Object.freeze([
  'ABRC0009',
  'ABRC0010',
  'ABRC0011',
  'ABRC0012',
  'ABRC0013',
  'ABRC0014',
  'ABRC0015',
]);

const CUSTOMER_REPORT_TYPE_CODE_SET = new Set(CUSTOMER_REPORT_TYPE_CODES);

export const isCustomerReportTypeCode = (code) => (
  CUSTOMER_REPORT_TYPE_CODE_SET.has(String(code ?? '').trim().toUpperCase())
);

// 서버 공통코드명이 없는 과거 응답도 사람이 읽을 수 있도록 유지합니다.
export const REPORT_TYPE_FALLBACK_NAMES = Object.freeze({
  ABRC0001: '콘텐츠',
  ABRC0002: '사용자',
  ABRC0003: '스팸',
  ABRC0004: '기타',
  ABRC0009: '허위 정보·사기 의심',
  ABRC0010: '외부 연락·결제 유도',
  ABRC0011: '욕설·비방·괴롭힘',
  ABRC0012: '금지 품목·불법 거래',
  ABRC0013: '개인정보 노출·침해',
  ABRC0014: '스팸·광고·도배',
  ABRC0015: '기타',
  ABRC0016: '거래 미이행·연락두절',
  ABRC0017: '배송·파손·오배송',
  ABRC0018: '서비스 품질·일정',
  ABRC0019: '환불·보관금·정산',
});
