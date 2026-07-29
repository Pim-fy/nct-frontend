// src/pages/user/point/components/PointChargeOrderTable.jsx
// Claude Code 작성 (BJN, 2026-07-16)
import PointTable from './PointTable';

// 충전주문상태(PCOG01)별 배지 색 — 원장 테이블(PointLedgerTable)의 TYPE_BADGE와 같은 방식
const STATUS_BADGE = {
  대기: 'bg-amber-100 text-amber-800',
  완료: 'bg-blue-100 text-blue-800',
  실패: 'bg-red-100 text-red-700',
  취소: 'bg-gray-100 text-gray-600',
};

const badge = (label) => (
  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium ${STATUS_BADGE[label] ?? 'bg-gray-100 text-gray-600'}`}>
    {label}
  </span>
);

// 표 배치는 공용 셸(PointTable)이 담당 — 여기는 컬럼 구성과 셀 내용만 정의한다 (2026-07-20 통합)
const COLUMNS = [
  { key: 'date', header: '일시', cellClass: 'whitespace-nowrap text-gray-700', render: (r) => r.date },
  {
    key: 'amount', header: '충전금액', align: 'right', cellClass: 'whitespace-nowrap font-medium text-gray-900',
    render: (r) => `${r.amount.toLocaleString()}P`,
  },
  { key: 'payMethod', header: '결제수단', cellClass: 'whitespace-nowrap text-gray-500', render: (r) => r.payMethod ?? '-' },
  { key: 'status', header: '상태', cellClass: 'whitespace-nowrap', render: (r) => badge(r.status) },
  { key: 'failReason', header: '비고', cellClass: 'text-gray-500', render: (r) => r.failReason ?? '-' },
];

// 완료(PCOC0002)·실패(PCOC0003)만 보여준다. 대기(PCOC0001)는 아직 결과가 안 나온 진행 중 건이라
// 계속 쌓이면 목록만 어지럽히고, 취소(PCOC0004)는 실제로는 별도 사유가 있는 게 아니라 대기가
// 3시간 지나 화면 표시만 바뀐 것(markExpiredForDisplay, DB 상태는 그대로 대기)이라 대기와
// 같이 뺀다. 실패는 카드 거절·내부 처리 오류 등 실제 사유가 있어 "결제는 됐는데 포인트가
// 안 들어왔다" 문의 시 필요해서 남긴다 (사용자 결정, 2026-07-29).
const VISIBLE_STATUS_CODES = new Set(['PCOC0002', 'PCOC0003']);

/** 충전 시도 이력 테이블 (F-PAY-011) — 완료·실패 건만 표시 */
const PointChargeOrderTable = ({ rows }) => (
  <PointTable
    title="충전 내역"
    columns={COLUMNS}
    rows={rows.filter((r) => VISIBLE_STATUS_CODES.has(r.statusCd))}
    emptyText="충전 내역이 없습니다."
  />
);

export default PointChargeOrderTable;
