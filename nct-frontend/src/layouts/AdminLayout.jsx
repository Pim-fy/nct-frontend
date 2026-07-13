// src/layouts/AdminLayout.jsx
import { Outlet } from 'react-router-dom';

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
        {/* TODO: AdminSidebar 컴포넌트로 교체 */}
      </aside>

      {/* 어드민 콘텐츠 */}
      <main style={{ marginLeft: '220px', padding: '24px', flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
