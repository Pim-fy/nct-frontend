// src/components/common/Pagination.jsx
// TODO: 구현 예정
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="pagination">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <button
          key={p}
          className={`btn ${p === page ? 'btn-primary' : 'btn-ghost'}`}
          style={{ minWidth: '36px', padding: '6px 10px' }}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}
    </div>
  );
};
export default Pagination;
