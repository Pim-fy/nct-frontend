// Claude Code 작성 (BJN, 2026-08-05)
// 상태/유형 배지 렌더러 — 원장·충전·전환·환전 네 내역 테이블(PointLedgerTable 등)이 같은
// 배지 마크업을 4벌 복사해 쓰던 것을 통합 (2026-08-05 코드 점검 후속). 표마다 다른 건
// 라벨→색 클래스 매핑뿐이라 colorMap만 받아 badge 함수를 돌려준다. 매핑에 없는 라벨은
// 회색 기본값. PointTable.jsx에 두지 않은 이유: 컴포넌트 파일에 비컴포넌트 export를 섞으면
// 개발 중 화면 자동 새로고침(fast refresh) 경고가 생겨서 quickAmounts.js처럼 별도 파일로 분리.
//
// 사용: const badge = pointBadge(STATUS_BADGE);  →  badge('완료')

const pointBadge = (colorMap) => {
  const badge = (label) => (
    <span className={`badge ${colorMap[label] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
  return badge;
};

export default pointBadge;
