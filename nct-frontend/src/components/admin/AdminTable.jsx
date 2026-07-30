// src/components/admin/AdminTable.jsx
import { Skeleton } from '@components/skeleton/BaseSkeleton';

const AdminTable = ({
  columns = [], data = [], onRowClick, rowKey, emptyMessage = '데이터가 없습니다.',
  loading = false, loadingRows = 6,
}) => (
  <table className="admin-table">
    <thead>
      <tr>{columns.map(col => <th key={col.key}>{col.label}</th>)}</tr>
    </thead>
    <tbody>
      {loading
        ? Array.from({ length: loadingRows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => <td key={col.key}><Skeleton height={14} /></td>)}
            </tr>
          ))
        : data.length === 0
          ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', color: '#888', padding: '40px' }}>{emptyMessage}</td></tr>
          : data.map((row, idx) => (
              <tr key={rowKey ? rowKey(row) : idx} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
                {columns.map(col => (
                  <td className={col.className} key={col.key}>
                    {col.render ? col.render(row[col.key], row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
      }
    </tbody>
  </table>
);
export default AdminTable;
