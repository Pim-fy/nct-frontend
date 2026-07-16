const STATUS_BADGE = {
  대기: 'bg-amber-100 text-amber-800',
  보류: 'bg-red-100 text-red-800',
  완료: 'bg-blue-100 text-blue-800',
};

const SettlementTable = ({ rows, filter, onFilterChange }) => {
  const filteredRows = filter === '전체' ? rows : rows.filter((row) => row.statusName === filter);

  return (
    <section className="mt-6">
      <div className="flex gap-2 mb-3">
        {['전체', '대기', '보류', '완료'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onFilterChange(item)}
            className={`rounded-lg px-3.5 py-2 text-sm border transition-colors ${
              filter === item
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500">
              <th className="text-left font-bold px-4 py-3">정산번호</th>
              <th className="text-left font-bold px-4 py-3">거래번호</th>
              <th className="text-left font-bold px-4 py-3">등록일시</th>
              <th className="text-right font-bold px-4 py-3">금액</th>
              <th className="text-left font-bold px-4 py-3">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  정산 내역이 없습니다.
                </td>
              </tr>
            )}
            {filteredRows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">STL-{row.id}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">TRD-{row.tradeId}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{row.regDate}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-gray-900">
                  {row.amount.toLocaleString()}원
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium ${STATUS_BADGE[row.statusName] ?? 'bg-gray-100 text-gray-600'}`}>
                    {row.statusName}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SettlementTable;
