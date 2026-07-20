// src/components/admin/PageBreadcrumb.jsx
import { Link } from 'react-router-dom';
const PageBreadcrumb = ({ pageTitle, items = [] }) => (
  <div style={{ marginBottom: '20px' }}>
    <nav style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>
      <Link to="/admin" style={{ color: '#888' }}>관리자</Link>
      {items.map((item, idx) => (
        <span key={idx}>
          <span style={{ margin: '0 6px' }}>›</span>
          {item.href ? <Link to={item.href} style={{ color: '#888' }}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
    {pageTitle && <h1 style={{ margin: 0, fontSize: '24px' }}>{pageTitle}</h1>}
  </div>
);
export default PageBreadcrumb;
