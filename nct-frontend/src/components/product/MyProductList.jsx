// src/components/product/MyProductList.jsx
// F-AUC-005 내 판매 상품 목록 — 마이페이지 "상품 판매 내역" 사이드바 섹션용 순수 목록 컴포넌트
// 포함 제외: 타이틀(h1), Breadcrumb, 경매 등록 버튼
// 경매 등록이 필요하면 /product/register 버튼을 사용하는 쪽에서 직접 추가
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteProduct, getMyProducts } from '@api/productApi';
import { toImageUrl } from '@api/fileApi';
import { TRADE_LABEL, STATUS_LABEL, STATUS_BADGE } from '@/constants/productConstants';
import Pagination from '@components/common/Pagination';
import { usePagination } from '@hooks/usePagination';
import ErrorMessage from '@components/common/ErrorMessage';
import ListSkeleton from '@components/skeleton/ListSkeleton';
import Toast from '@components/common/Toast';
import ConfirmModal from '@components/common/ConfirmModal';

const AUC_STATUS_LABEL = {
  AUCC0001: '준비',
  AUCC0002: '진행중',
  AUCC0003: '종료',
  AUCC0004: '유찰',
  AUCC0005: '취소',
};

const AUC_STATUS_BADGE = {
  AUCC0001: 'badge-gray',
  AUCC0002: 'badge-success',
  AUCC0003: 'badge-gray',
  AUCC0004: 'badge-warning',
  AUCC0005: 'badge-danger',
};

// prdStatusCd 기반 필터 칩 — 낙찰·거래중·완료·취소·유찰 코드는 백엔드 상태코드 확정 후 교체
const FILTERS = [
  { value: 'all',      label: '전체' },
  { value: 'PRDC0001', label: '임시저장' },
  { value: 'PRDC0002', label: '진행중' },
  { value: 'AUCC0003', label: '낙찰' },
  { value: 'TRAD0001', label: '거래중' },
  { value: 'PRDC0003', label: '완료' },
  { value: 'AUCC0005', label: '취소' },
  { value: 'AUCC0004', label: '유찰' },
];

function chipStyle(active) {
  return {
    padding: '4px 14px',
    borderRadius: 100,
    border: `1px solid ${active ? '#0064ff' : '#d1d0cc'}`,
    background: active ? '#e5efff' : '#fff',
    color: active ? '#0064ff' : '#5f5e5a',
    fontWeight: active ? 700 : 400,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}

function fmtPrice(n) {
  return n != null ? `${Number(n).toLocaleString()}원` : '-';
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function MyProductList() {
  const navigate = useNavigate();
  const { page, size, totalPages, setTotalPages, goToPage } = usePagination(1, 10);

  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [filter, setFilter]             = useState('all');
  const [toast, setToast]               = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError('');
    getMyProducts(page, size, filter === 'all' ? null : filter)
      .then(res => {
        const { list, totalPages: tp } = res.data;
        setProducts(list);
        setTotalPages(tp);
      })
      .catch(() => setError('목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [page, size, filter, setTotalPages]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDeleteClick = (prdSn, prdNm) => setConfirmTarget({ prdSn, prdNm });

  const handleDeleteConfirm = async () => {
    const { prdSn } = confirmTarget;
    setConfirmTarget(null);
    try {
      await deleteProduct(prdSn);
      fetchProducts();
    } catch (err) {
      setToast(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  const handleFilterChange = (value) => { setFilter(value); goToPage(1); };

  return (
    <div>
      <ErrorMessage message={error} />

      {loading ? (
        <ListSkeleton />
      ) : filter === 'all' && products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p className="muted" style={{ marginBottom: 16 }}>등록한 상품이 없습니다.</p>
          <button onClick={() => navigate('/product/register')} className="btn btn-primary">
            첫 상품 등록하기
          </button>
        </div>
      ) : (
        <>
          {/* 필터 칩 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {FILTERS.map(f => (
              <button
                key={f.value}
                type="button"
                onClick={() => handleFilterChange(f.value)}
                style={chipStyle(filter === f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="history-list">
            {products.length === 0 ? (
              <p className="muted small" style={{ padding: '24px 0' }}>해당 상태의 상품이 없습니다.</p>
            ) : products.map(p => (
              <div key={p.prdSn} className="list-row">
                <div className="history-entry-main">
                  <div style={{ flex: '0 0 80px', width: 80, height: 80, border: '1px solid #f0efec', borderRadius: 8, background: '#e5e4df', overflow: 'hidden' }}>
                    {p.prdImgUrl && (
                      <img
                        src={toImageUrl(p.prdImgUrl)}
                        alt={p.prdNm}
                        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div className="history-row-title">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="badge badge-goods">판매</span>
                      {p.aucStatusCd ? (
                        <span className={`badge ${AUC_STATUS_BADGE[p.aucStatusCd] ?? 'badge-gray'}`}>
                          경매 {AUC_STATUS_LABEL[p.aucStatusCd] ?? p.aucStatusCd}
                        </span>
                      ) : (
                        <span className={`badge ${STATUS_BADGE[p.prdStatusCd] ?? 'badge-gray'}`}>
                          {STATUS_LABEL[p.prdStatusCd] ?? p.prdStatusCd}
                        </span>
                      )}
                    </div>
                    <h4>{p.prdNm}</h4>
                    <p className="muted" style={{ fontSize: 13 }}>
                      시작가 {fmtPrice(p.prdStartAmt)}
                      {p.prdIbyAmt != null && ` · 즉시구매 ${fmtPrice(p.prdIbyAmt)}`}
                      {p.prdTrdMethodCd && ` · ${TRADE_LABEL[p.prdTrdMethodCd] ?? p.prdTrdMethodCd}`}
                      {p.prdRegDt && ` · ${fmtDate(p.prdRegDt)}`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {p.prdStatusCd === 'PRDC0002' && (
                    <button
                      onClick={() => navigate(`/product/${p.prdSn}/seller`)}
                      className="btn btn-sm btn-outline"
                    >
                      판매 관리
                    </button>
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
                      onClick={() => handleDeleteClick(p.prdSn, p.prdNm)}
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

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <ConfirmModal
        open={!!confirmTarget}
        message={confirmTarget ? `"${confirmTarget.prdNm}" 상품을 삭제하시겠습니까?` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}
