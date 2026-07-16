// src/pages/admin/Dashboard.jsx
import { Link } from 'react-router-dom';

// 전체 대시보드가 구현되기 전, 이번 1단계 화면으로 들어갈 수 있게 둔 최소 안내입니다.
const Dashboard = () => (
  <div style={{ maxWidth: '760px' }}>
    <p style={{ color: '#1f6f5c', fontWeight: 800, marginBottom: '5px' }}>관리자 1단계 미리보기</p>
    <h1 style={{ marginTop: 0 }}>Dashboard</h1>
    <p style={{ color: '#6f746c' }}>신고·위험 이벤트 화면에서 목업용 마스킹 예시와 임시 연동 표시 상태를 확인할 수 있습니다.</p>
    <Link
      to="/admin/operations-preview"
      style={{ display: 'inline-block', marginTop: '12px', padding: '11px 16px', borderRadius: '9px', background: '#1f6f5c', color: '#fff', fontWeight: 800 }}
    >
      신고·위험 이벤트 보기
    </Link>
  </div>
);
export default Dashboard;
