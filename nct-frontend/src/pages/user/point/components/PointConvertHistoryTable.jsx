// src/pages/user/point/components/PointConvertHistoryTable.jsx
// Claude Code 작성 (BJN, 2026-07-30)
import PointTable from './PointTable';

// 표 배치는 공용 셸(PointTable)이 담당 — 여기는 컬럼 구성과 셀 내용만 정의한다 (2026-07-20 통합 방식과 동일)
const COLUMNS = [
  { key: 'date', header: '전환일시', cellClass: 'whitespace-nowrap text-gray-700', render: (r) => r.date },
  {
    key: 'amount', header: '전환 금액', align: 'right', cellClass: 'whitespace-nowrap font-medium text-blue-700',
    render: (r) => `${r.amount.toLocaleString()}P`,
  },
  {
    key: 'balanceAfter', header: '전환 후 사용가능 잔액', align: 'right', cellClass: 'whitespace-nowrap text-gray-700',
    render: (r) => `${r.balanceAfter.toLocaleString()}P`,
  },
];

/**
 * 전환 내역 테이블 (F-PAY-010)
 * - 충전·환전과 달리 전환은 승인 대기 상태 없이 즉시 완료돼서 별도 신청 이력 API가 없다.
 *   정산가능→사용가능 전환 1건은 원장(CONVERT, PTLC0012)에 −(정산가능)/+(사용가능) 두 행으로
 *   남는데, 여기서는 사용가능으로 들어온 + 행만 걸러서 "언제 얼마나 전환했는지" 1건당 1행으로
 *   보여준다. 짝이 되는 − 행은 포인트 내역(원장) 표에서 그대로 확인 가능하다 (2026-07-30)
 */
// limit을 주면(마이페이지 요약 카드) 최근 N건만 보여주고 "+"로 전체보기 모달을 띄운다.
// limit 없이 부르면(전체보기 모달 안) 전부 보여준다 (2026-07-29 다른 내역 표와 동일한 방식).
const PointConvertHistoryTable = ({ rows, limit, onExpand }) => {
  const convertRows = rows.filter((r) => r.typeCd === 'PTLC0012' && r.amount > 0);
  const visibleRows = limit ? convertRows.slice(0, limit) : convertRows;

  return (
    <PointTable
      title="전환 내역"
      columns={COLUMNS}
      rows={visibleRows}
      emptyText="전환 내역이 없습니다."
      onExpand={limit ? onExpand : undefined}
      pageSize={limit ? undefined : 10}
    />
  );
};

export default PointConvertHistoryTable;
