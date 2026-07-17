// src/pages/user/point/components/PointExchangeOrderTable.jsx
// Claude Code 작성 (BJN, 2026-07-17)

// 환전주문상태(PEOG01)별 배지 색 — 충전 이력 테이블(PointChargeOrderTable)과 같은 방식
const STATUS_BADGE = {
  신청: 'bg-amber-100 text-amber-800',
  완료: 'bg-blue-100 text-blue-800',
  반려: 'bg-red-100 text-red-700',
};

/**
 * 환전 신청 이력 테이블 (F-PAY-012, D-026)
 * - 신청·완료·반려 전 상태를 보여준다. 신청 즉시 포인트가 차감되므로
 *   "신청" 상태 = 차감은 끝났고 관리자 지급(수동 이체)만 남은 상태다
 * - 입금 계좌는 신청 시점 스냅샷 — 신청 후 마이페이지에서 계좌를 바꿔도 여기 표시는 안 바뀐다
 *   ("내가 어디로 받기로 했더라?" 확인용)
 */
const PointExchangeOrderTable = ({ rows }) => {
  return (
    <section className="mt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-3">환전 내역</h3>

      <div className="overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="text-left font-bold px-4 py-3">신청일시</th>
              <th className="text-right font-bold px-4 py-3">신청금액</th>
              <th className="text-left font-bold px-4 py-3">입금 계좌</th>
              <th className="text-left font-bold px-4 py-3">상태</th>
              <th className="text-left font-bold px-4 py-3">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  환전 내역이 없습니다.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{row.date}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-gray-900">
                  {row.amount.toLocaleString()}P
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                  {row.bankName} {row.accountNo}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium ${STATUS_BADGE[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {row.status}
                  </span>
                </td>
                {/* 반려면 사유, 처리됐으면 처리일, 둘 다 아니면(지급 대기) 안내 문구 */}
                <td className="px-4 py-3 text-gray-500">
                  {row.rejectReason ?? row.processedDate ?? '며칠 내 지급 예정'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default PointExchangeOrderTable;
