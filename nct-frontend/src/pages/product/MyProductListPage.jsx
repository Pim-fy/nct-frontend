// src/pages/product/MyProductListPage.jsx
// 내 판매 목록 페이지 — /product/me 라우트
// 황성경(3) 아코디언 통합 전까지 단독 페이지로 유지
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import MyProductList from '@components/product/MyProductList';

export default function MyProductListPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '내 판매 내역' }]} />
      <div className="page-title">
        <div>
          <h1>내 판매 내역</h1>
        </div>
        <a onClick={() => navigate('/product/register')} className="btn btn-outline" style={{ cursor: 'pointer' }}>
          경매 등록
        </a>
      </div>
      <MyProductList />
    </div>
  );
}
