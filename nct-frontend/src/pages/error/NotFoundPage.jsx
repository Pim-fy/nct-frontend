// src/pages/error/NotFoundPage.jsx
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div style={{ textAlign: 'center', padding: '80px 20px' }}>
    <h1 style={{ fontSize: '80px', margin: 0, color: '#e2e1dc' }}>404</h1>
    <h2 style={{ fontSize: '24px', marginTop: '16px' }}>페이지를 찾을 수 없습니다</h2>
    <p style={{ color: '#888', marginTop: '8px' }}>요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
    <Link to="/" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-flex' }}>
      홈으로 돌아가기
    </Link>
  </div>
);

export default NotFoundPage;
