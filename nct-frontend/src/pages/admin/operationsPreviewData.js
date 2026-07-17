/**
 * 화면 모양을 먼저 확인하기 위한 임시 자료입니다.
 * 실제 API가 연결되면 이 파일 대신 TanStack Query의 서버 응답을 넘기면 됩니다.
 * 실제 회원 개인정보는 넣지 않고 모두 가명·마스킹 값만 사용합니다.
 */
export const operationsSummary = [
  { label: '미처리 위험 이벤트', value: 2, helper: '운영자 확인 필요', tone: 'danger' },
  { label: '민감정보 탐지', value: 2, helper: '연락처·계좌번호', tone: 'warning' },
  { label: '신고 연동 대기', value: 1, helper: '담당자 5 계약 대기', tone: 'info' },
];

export const operationsIssues = [
  {
    id: 'RISK-001',
    workType: '자동 탐지',
    category: '외부 연락',
    target: '채팅',
    content: '연락처가 [연락처 마스킹]으로 치환됨',
    member: '판매자 A**',
    date: '07-15',
    status: '신고 연동 대기',
    tone: 'info',
  },
  {
    id: 'RISK-002',
    workType: '자동 탐지',
    category: '계좌 정보',
    target: '상품 문의',
    content: '계좌번호가 [계좌번호 마스킹]으로 치환됨',
    member: '회원 B**',
    date: '07-15',
    status: '검토 필요',
    tone: 'warning',
  },
  {
    id: 'ABR-002',
    workType: '신고',
    category: '사용자',
    target: '채팅',
    content: '욕설 신고',
    member: '구매자 C**',
    date: '07-14',
    status: '접수',
    tone: 'danger',
  },
  {
    id: 'ABR-006',
    workType: '신고',
    category: '콘텐츠',
    target: '상품글',
    content: '금지 표현 검토 완료',
    member: '판매자 D**',
    date: '07-13',
    status: '처리 완료',
    tone: 'success',
  },
];
