// src/layouts/AdminLayout.jsx
import { Outlet } from 'react-router-dom';
import MockupAdminSidebar from '@components/admin/mockup/MockupAdminSidebar';

const AdminLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/*
        develop이 마련한 AdminSidebar 교체 자리를 그대로 사용합니다.
        팀 공통 AdminSidebar가 완성되면 아래 임시 컴포넌트 import와 태그만 교체합니다.
      */}
      <MockupAdminSidebar />

      {/* 어드민 콘텐츠: 각 담당자의 상세 화면은 Outlet 자리에 표시됩니다. */}
      <main style={{ marginLeft: '220px', padding: '24px', flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
