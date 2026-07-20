// src/pages/user/point/components/PointChargeOrderTable.jsx
// Claude Code 작성 (BJN, 2026-07-16)

// 충전주문상태(PCOG01)별 배지 색 — 원장 테이블(PointLedgerTable)의 TYPE_BADGE와 같은 방식
const STATUS_BADGE = {
  대기: 'bg-amber-100 text-amber-800',
  완료: 'bg-blue-100 text-blue-800',
  실패: 'bg-red-100 text-red-700',
  취소: 'bg-gray-100 text-gray-600',
};

/**
 * 충전 시도 이력 테이블 (F-PAY-011)
 * - 원장(확정 충전만 기록)과 달리 실패·취소·대기 건까지 전부 보여준다
 *   → "충전을 시도했는데 포인트가 안 들어왔다" 문의 시 사용자가 직접 실패 사유를 확인할 수 있다
 */
const PointChargeOrderTable = ({ rows }) => {
  return (
    <section className="mt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3">충전 내역</h3>

      <div className="overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="text-left font-bold px-4 py-3">일시</th>
              <th className="text-left font-bold px-4 py-3">주문번호</th>
              <th className="text-right font-bold px-4 py-3">충전금액</th>
              <th className="text-left font-bold px-4 py-3">상태</th>
              <th className="text-left font-bold px-4 py-3">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  충전 내역이 없습니다.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{row.date}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono text-xs">{row.orderNo}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-gray-900">
                  {row.amount.toLocaleString()}P
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium ${STATUS_BADGE[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{row.failReason ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default PointChargeOrderTable;
