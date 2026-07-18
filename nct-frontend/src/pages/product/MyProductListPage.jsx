// src/pages/product/MyProductListPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// 경매 활동 내역 페이지 — 로그인한 판매자가 등록한 상품 목록을 확인하는 화면
// 목업: 19_mypage.html 경매 활동 내역 섹션 기반
// 라우트: /product/me
// ─────────────────────────────────────────────────────────────────────────────
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteProduct, getMyProducts } from '@api/productApi';
import { toImageUrl } from '@api/fileApi';
import Pagination from '@components/common/Pagination';
import { usePagination } from '@hooks/usePagination';

// ─── 상수 정의 ───────────────────────────────────────────────────────────────
// 상태 코드(PRDC)별 한글 라벨 · 배지 클래스 · 필터 옵션
// 거래방식 코드(TRDC)별 한글 라벨
const STATUS_LABEL = {
  PRDC0001: '임시저장',
  PRDC0002: '경매 진행중',
  PRDC0003: '종료',
  PRDC0004: '삭제',
};

const STATUS_BADGE = {
  PRDC0001: 'badge-gray',
  PRDC0002: 'badge-success',
  PRDC0003: 'badge-gray',
  PRDC0004: 'badge-danger',
};

const TRADE_LABEL = {
  TRDC0009: '배송만',
  TRDC0010: '직거래만',
  TRDC0020: '둘 다 가능',
};

const FILTERS = [
  { value: 'all',      label: '전체' },
  { value: 'PRDC0001', label: '임시저장' },
  { value: 'PRDC0002', label: '진행중' },
  { value: 'PRDC0003', label: '종료' },
];

export default function MyProductListPage() {
  const navigate = useNavigate();

  // ─── 페이지네이션 상태 ───────────────────────────────────────────────────
  const { page, size, totalPages, setTotalPages, goToPage } = usePagination(1, 10);

  // ─── 로컬 상태 ──────────────────────────────────────────────────────────
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('all'); // 상태별 필터 ('all' | 'PRDC0001' | ...)

  // ─── 목록 조회 ──────────────────────────────────────────────────────────
  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError('');
    getMyProducts(page, size)
      .then(res => {
        const { list, totalPages: tp } = res.data;
        setProducts(list);
        setTotalPages(tp);
      })
      .catch(() => setError('목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [page, size, setTotalPages]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ─── 삭제 처리 ──────────────────────────────────────────────────────────
  // 임시저장(PRDC0001) · 종료(PRDC0003) 상태 상품만 삭제 버튼 노출
  const handleDelete = async (prdSn, prdNm) => {
    if (!window.confirm(`"${prdNm}" 상품을 삭제하시겠습니까?`)) return;
    try {
      await deleteProduct(prdSn);
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message;
      alert(msg || '삭제에 실패했습니다.');
    }
  };

  // ─── 필터링 ─────────────────────────────────────────────────────────────
  // 전체 선택 시 서버에서 받은 전체 목록, 그 외는 상태 코드로 클라이언트 필터
  const filtered = filter === 'all'
    ? products
    : products.filter(p => p.prdStatusCd === filter);

  // ─── 렌더링 ─────────────────────────────────────────────────────────────
  // loading → 전체 빈 목록 → 목록+필터 3-way 분기
  // 필터 칩은 클라이언트 상태(filter)로 products 배열을 재필터링해 표시
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 페이지 타이틀 + 경매 등록 버튼 */}
      <div className="page-title">
        <div>
          <h1>경매 활동 내역</h1>
        </div>
        <a
          onClick={() => navigate('/product/register')}
          className="btn btn-outline"
          style={{ cursor: 'pointer' }}
        >
          경매 등록
        </a>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="muted" style={{ textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p className="muted" style={{ marginBottom: 16 }}>등록한 상품이 없습니다.</p>
          <button onClick={() => navigate('/product/register')} className="btn btn-primary">
            첫 상품 등록하기
          </button>
        </div>
      ) : (
        <>
          <div className="history-toolbar">
            <h3 className="card-title" style={{ margin: 0 }}>내 판매 목록</h3>
            <div className="row" style={{ gap: 8 }}>
              {FILTERS.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`chip ${filter === f.value ? 'active' : ''}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="history-list">
            {filtered.length === 0 ? (
              <p className="muted small" style={{ padding: '24px 0' }}>해당 상태의 상품이 없습니다.</p>
            ) : filtered.map(p => (
              <div key={p.prdSn} className="list-row">
                <div className="history-entry-main">
                  {/* 이미지 (F-AUC-002) — 대표이미지 없으면 빈 placeholder 유지 */}
                  <div className="history-thumb">
                    {p.prdImgUrl && <img src={toImageUrl(p.prdImgUrl)} alt={p.prdNm} />}
                  </div>

                  <div className="history-row-title">
                    <div className="row" style={{ gap: 6 }}>
                      <span className="badge badge-goods">판매</span>
                      <span className={`badge ${STATUS_BADGE[p.prdStatusCd] ?? 'badge-gray'}`}>
                        {STATUS_LABEL[p.prdStatusCd] ?? p.prdStatusCd}
                      </span>
                    </div>
                    <h4>{p.prdNm}</h4>
                    <p className="muted">
                      시작가 {p.prdStartAmt?.toLocaleString()}원
                      {p.prdIbyAmt != null && ` · 즉시구매 ${p.prdIbyAmt.toLocaleString()}원`}
                      {' · '}{TRADE_LABEL[p.prdTrdMethodCd] ?? p.prdTrdMethodCd}
                      {p.prdRegDt && ` · ${new Date(p.prdRegDt).toLocaleDateString('ko-KR')}`}
                    </p>
                  </div>
                </div>

                <div className="row" style={{ gap: 8, flexShrink: 0 }}>
                  {p.prdStatusCd === 'PRDC0002' && (
                    <>
                      <button
                        onClick={() => navigate(`/product/${p.prdSn}/seller`)}
                        className="btn btn-sm btn-outline"
                      >
                        판매 관리
                      </button>
                    </>
                  )}
                  {p.prdStatusCd === 'PRDC0001' && (
                    <button
                      onClick={() => navigate(`/product/${p.prdSn}/seller`)}
                      className="btn btn-sm btn-outline"
                    >
                      경매 설정
                    </button>
                  )}
                  {p.prdStatusCd === 'PRDC0003' && (
                    <button
                      onClick={() => navigate(`/product/${p.prdSn}/seller`)}
                      className="btn btn-sm btn-ghost"
                    >
                      판매 기록
                    </button>
                  )}
                  {(p.prdStatusCd === 'PRDC0001' || p.prdStatusCd === 'PRDC0003') && (
                    <button
                      onClick={() => handleDelete(p.prdSn, p.prdNm)}
                      className="btn btn-sm btn-danger"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          </div>
        </>
      )}
    </div>
  );
}
