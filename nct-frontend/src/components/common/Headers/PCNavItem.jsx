// src/components/common/Headers/PCNavItem.jsx
import { Link, useLocation } from 'react-router-dom';
const PCNavItem = ({ label, href, children }) => {
  const { pathname } = useLocation();
  const isActive = pathname.startsWith(href);
  return (
    <Link to={href} className={isActive ? 'active' : ''} style={{ textDecoration: 'none', color: isActive ? 'var(--color-primary, #0064ff)' : '#5f5e5a', fontWeight: '700', fontSize: '16px' }}>
      {label || children}
    </Link>
  );
};
export default PCNavItem;
