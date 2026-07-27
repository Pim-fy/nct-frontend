// src/pages/user/point/components/PointTable.jsx
// Claude Code 작성 (BJN, 2026-07-20)

/**
 * 포인트 화면 공용 테이블 셸 — 원장·충전·환전 세 내역 테이블이 같은 표 구조(제목 + 카드형
 * 래퍼 + thead/tbody + 빈 상태 행 + hover 행)를 3벌 복사해 쓰던 것을 하나로 통합 (2026-07-20).
 *
 * 표마다 다른 것(컬럼 구성·셀 내용·셀 스타일)은 columns 설정으로 받는다:
 *   { key, header, align?('right'면 우측 정렬), cellClass?(문자열 또는 (row)=>문자열), render(row) }
 * 배지 같은 셀 생김새는 각 테이블 파일이 render로 정의 — 셸은 배치만 책임진다.
 */
const PointTable = ({ title, columns, rows, emptyText }) => (
  <section className="mt-6">
    <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>

    <div className="overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`${col.align === 'right' ? 'text-right' : 'text-left'} font-bold px-4 py-3`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center text-gray-400 py-10">
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {columns.map((col) => {
                // 셀 스타일이 행 값에 따라 달라지는 컬럼(예: 금액 +/- 색)은 함수로 받는다
                const cellClass = typeof col.cellClass === 'function' ? col.cellClass(row) : (col.cellClass ?? '');
                return (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''} ${cellClass}`}
                  >
                    {col.render(row)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export default PointTable;
