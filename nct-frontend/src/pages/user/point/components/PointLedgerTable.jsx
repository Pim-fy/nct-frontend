// src/pages/user/point/components/PointLedgerTable.jsx
import PointTable from './PointTable';

// 원장유형(PTLG02)별 배지 색 — 목업 badge-success/warning/blue/gray 매핑
const TYPE_BADGE = {
  충전:       'bg-blue-100 text-blue-800',
  홀딩:       'bg-amber-100 text-amber-800',
  반환:       'bg-indigo-100 text-indigo-800',
  보관금전환: 'bg-amber-100 text-amber-800',
  정산:       'bg-blue-100 text-blue-800',
  보정:       'bg-gray-100 text-gray-600',
};

const badge = (label) => (
  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium ${TYPE_BADGE[label] ?? 'bg-gray-100 text-gray-600'}`}>
    {label}
  </span>
);

// 표 배치는 공용 셸(PointTable)이 담당 — 여기는 컬럼 구성과 셀 내용만 정의한다 (2026-07-20 통합)
const COLUMNS = [
  { key: 'date', header: '일시', cellClass: 'whitespace-nowrap text-gray-700', render: (r) => r.date },
  {
    key: 'type', header: '유형', cellClass: 'whitespace-nowrap',
    render: (r) => (
      <>
        {badge(r.type)}
        <span className="ml-1.5 text-xs text-gray-400">({r.category})</span>
      </>
    ),
  },
  {
    key: 'amount', header: '변동금액', align: 'right',
    cellClass: (r) => `whitespace-nowrap font-medium ${r.amount > 0 ? 'text-blue-700' : 'text-red-700'}`,
    render: (r) => `${r.amount > 0 ? '+' : ''}${r.amount.toLocaleString()}P`,
  },
  {
    key: 'balanceAfter', header: '잔액', align: 'right', cellClass: 'whitespace-nowrap text-gray-700',
    render: (r) => `${r.balanceAfter.toLocaleString()}P`,
  },
  { key: 'ref', header: '관련', cellClass: 'whitespace-nowrap text-gray-500', render: (r) => r.ref ?? '-' },
  { key: 'reason', header: '사유', cellClass: 'text-gray-500', render: (r) => r.reason },
];

/** 포인트 원장 내역 테이블 (F-PAY-039) */
const PointLedgerTable = ({ rows }) => (
  <PointTable title="포인트 내역" columns={COLUMNS} rows={rows} emptyText="포인트 내역이 없습니다." />
);

export default PointLedgerTable;
