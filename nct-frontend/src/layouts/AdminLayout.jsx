// src/layouts/AdminLayout.jsx
import { NavLink, Outlet } from 'react-router-dom';

const AdminLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* 어드민 사이드바 - 추후 구현 */}
      <aside style={{
        width: '220px',
        minHeight: '100vh',
        background: '#1a1a18',
        color: '#d3d1c7',
        position: 'fixed',
        left: 0,
        top: 0,
        paddingTop: '18px',
      }}>
        <h1 style={{ color: '#fff', fontSize: '18px', margin: '0 18px 18px' }}>Ksteam Admin</h1>
        {/* 메뉴 공통 컴포넌트가 만들어지면 이 NavLink 묶음만 옮기면 됩니다. */}
        <nav style={{ display: 'grid', gap: '6px', padding: '0 10px' }}>
          <NavLink to="/admin" end style={({ isActive }) => ({
            padding: '10px 12px', borderRadius: '8px',
            background: isActive ? '#2d4f46' : 'transparent', color: '#fff',
          })}>대시보드</NavLink>
          <NavLink to="/admin/operations-preview" style={({ isActive }) => ({
            padding: '10px 12px', borderRadius: '8px',
            background: isActive ? '#2d4f46' : 'transparent', color: '#fff',
          })}>신고·위험 이벤트</NavLink>
        </nav>
      </aside>

      {/* 어드민 콘텐츠 */}
      <main style={{ marginLeft: '220px', padding: '24px', flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
