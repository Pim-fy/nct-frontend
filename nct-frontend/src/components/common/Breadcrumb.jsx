// src/components/common/Breadcrumb.jsx
import { Link } from 'react-router-dom';
const Breadcrumb = ({ items = [] }) => (
  <nav style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
    {items.map((item, idx) => (
      <span key={idx}>
        {idx > 0 && <span style={{ margin: '0 6px' }}>›</span>}
        {item.href ? <Link to={item.href} style={{ color: '#888' }}>{item.label}</Link> : <span>{item.label}</span>}
      </span>
    ))}
  </nav>
);
export default Breadcrumb;
