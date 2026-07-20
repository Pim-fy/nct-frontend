// src/components/admin/AdminPagination.jsx
const AdminPagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', margin: '20px 0' }}>
      <button className="btn btn-ghost" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>이전</button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button key={p} className={`btn ${p === page ? 'btn-primary' : 'btn-ghost'}`} style={{ minWidth: '36px', padding: '6px 10px' }} onClick={() => onPageChange(p)}>{p}</button>
      ))}
      <button className="btn btn-ghost" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>다음</button>
    </div>
  );
};
export default AdminPagination;
