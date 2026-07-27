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
  { key: 'orderNo', header: '주문번호', cellClass: 'whitespace-nowrap text-gray-500 font-mono text-xs', render: (r) => r.orderNo },
  {
    key: 'amount', header: '충전금액', align: 'right', cellClass: 'whitespace-nowrap font-medium text-gray-900',
    render: (r) => `${r.amount.toLocaleString()}P`,
  },
  { key: 'status', header: '상태', cellClass: 'whitespace-nowrap', render: (r) => badge(r.status) },
  { key: 'failReason', header: '비고', cellClass: 'text-gray-500', render: (r) => r.failReason ?? '-' },
];

/**
 * 충전 시도 이력 테이블 (F-PAY-011)
 * - 원장(확정 충전만 기록)과 달리 실패·취소·대기 건까지 전부 보여준다
 *   → "충전을 시도했는데 포인트가 안 들어왔다" 문의 시 사용자가 직접 실패 사유를 확인할 수 있다
 */
const PointChargeOrderTable = ({ rows }) => (
  <PointTable title="충전 내역" columns={COLUMNS} rows={rows} emptyText="충전 내역이 없습니다." />
);

export default PointChargeOrderTable;
