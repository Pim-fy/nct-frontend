// src/components/common/ExpandingSearch.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const ExpandingSearch = ({ placeholder = '검색어 입력' }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) { navigate(`/search/${encodeURIComponent(value.trim())}`); setOpen(false); setValue(''); }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {open && (
        <form onSubmit={handleSubmit}>
          <input autoFocus value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} className="input" style={{ width: '200px', animation: 'slideDown 0.2s ease' }} />
        </form>
      )}
      <button className="hicon" onClick={() => setOpen(o => !o)} type="button" aria-label="검색">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      </button>
    </div>
  );
};
export default ExpandingSearch;
