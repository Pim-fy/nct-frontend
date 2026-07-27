// src/pages/product/MyProductListPage.jsx
// 내 판매 목록 페이지 — /product/me 라우트
// 황성경(3) 아코디언 통합 전까지 단독 페이지로 유지
import { useNavigate } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb';
import MyProductList from '@components/product/MyProductList';

export default function MyProductListPage() {
  const navigate = useNavigate();

  return (
    <main className="container seller-page">
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '내 판매 내역' }]} />
      <div className="page-title">
        <div><h1>내 판매 내역</h1></div>
        <button type="button" onClick={() => navigate('/product/register')} className="btn btn-outline">
          경매 등록
        </button>
      </div>

      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#eef2fb', padding: '14px 20px' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>상품 판매 내역</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <MyProductList />
        </div>
      </section>
    </main>
  );
}
