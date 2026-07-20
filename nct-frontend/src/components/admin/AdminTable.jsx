// src/components/admin/AdminTable.jsx
const AdminTable = ({ columns = [], data = [], onRowClick }) => (
  <table>
    <thead>
      <tr>{columns.map(col => <th key={col.key}>{col.label}</th>)}</tr>
    </thead>
    <tbody>
      {data.length === 0
        ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', color: '#888', padding: '40px' }}>데이터가 없습니다.</td></tr>
        : data.map((row, idx) => (
            <tr key={idx} onClick={() => onRowClick?.(row)} style={{ cursor: onRowClick ? 'pointer' : 'default' }}>
              {columns.map(col => <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>)}
            </tr>
          ))
      }
    </tbody>
  </table>
);
export default AdminTable;
