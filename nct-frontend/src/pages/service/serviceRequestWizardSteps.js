// src/pages/service/serviceRequestWizardSteps.js
// 서비스 요청서 카테고리 표시 메타(부제·색상) — 실제 위저드 단계/필드는 서버 동적 폼(F-SVC-002,
// SVC_REQ_FIELD_DEF 등)에서 내려오며 serviceRequestFormAdapter.buildServiceRequestWizardCatalog가
// 조립한다. 이 파일은 카테고리 선택 카드 UI에만 쓰는 부제·색상 표시값을 담는다.

// 카테고리 선택 카드에 쓰는 부제·색상 (마이페이지 대시보드 통계카드(MyPageDashboard StatCard)와 같은 팔레트로 맞춤)
export const CATEGORY_META = {
  '이사': { sub: '포장 · 반포장 · 일반 · 보관', color: '#0064ff' },
  '청소': { sub: '가정 · 사업장 (입주/정기/부분)', color: '#0d9488' },
  '설치·수리': { sub: '가전 · 가구 · 수도/보일러/전기', color: '#d97706' },
  '인테리어': { sub: '종합 · 부분 시공', color: '#776bf8' },
  '레슨': { sub: '취미 · 자기계발 · 과외', color: '#e63946' },
};
