// src/pages/user/point/components/PointLedgerTable.jsx

// 원장유형(PTLG02)별 배지 색 — 목업 badge-success/warning/blue/gray 매핑
const TYPE_BADGE = {
  충전:       'bg-blue-100 text-blue-800',
  홀딩:       'bg-amber-100 text-amber-800',
  반환:       'bg-indigo-100 text-indigo-800',
  보관금전환: 'bg-amber-100 text-amber-800',
  정산:       'bg-blue-100 text-blue-800',
  보정:       'bg-gray-100 text-gray-600',
};

/**
 * 포인트 원장 내역 테이블 (F-PAY-039)
 */
const PointLedgerTable = ({ rows }) => {
  return (
    <section className="mt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3">포인트 내역</h3>

      <div className="overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="text-left font-bold px-4 py-3">일시</th>
              <th className="text-left font-bold px-4 py-3">유형</th>
              <th className="text-right font-bold px-4 py-3">변동금액</th>
              <th className="text-right font-bold px-4 py-3">잔액</th>
              <th className="text-left font-bold px-4 py-3">관련</th>
              <th className="text-left font-bold px-4 py-3">사유</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-10">
                  포인트 내역이 없습니다.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{row.date}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium ${TYPE_BADGE[row.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {row.type}
                  </span>
                  <span className="ml-1.5 text-xs text-gray-400">({row.category})</span>
                </td>
                <td className={`px-4 py-3 text-right whitespace-nowrap font-medium ${row.amount > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  {row.amount > 0 ? '+' : ''}{row.amount.toLocaleString()}P
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap text-gray-700">
                  {row.balanceAfter.toLocaleString()}P
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-500">{row.ref ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500">{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default PointLedgerTable;
