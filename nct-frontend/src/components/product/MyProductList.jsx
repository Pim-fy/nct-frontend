// src/components/product/MyProductList.jsx
// 내 판매 목록 순수 목록 컴포넌트 — MyProductListPage · MyPage 아코디언에서 재사용
// 스타일 기준: MyBidHistoryPage.jsx (인라인 스타일, chipStyle, fmtPrice/fmtDate)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toImageUrl } from '@api/fileApi';
import { deleteProduct } from '@api/productApi';
import { TRADE_LABEL, TRADE_STATUS_LABEL } from '@/constants/productConstants';
import { useMyProducts } from '@hooks/useProduct';
import Pagination from '@components/common/Pagination';
import Toast from '@components/common/Toast';
import ConfirmModal from '@components/common/ConfirmModal';

// ─── 필터 ────────────────────────────────────────────────────────────────────

const FILTERS = [
  { value: null,      label: '전체' },
  { value: 'ACTIVE',  label: '진행중' },
  { value: 'WON',     label: '낙찰' },
  { value: 'TRADING', label: '거래중' },
  { value: 'CLOSED',  label: '종료' },
];

const CLOSED_SUB_FILTERS = [
  { value: '',         label: '전체 종료' },
  { value: 'DONE',     label: '완료' },
  { value: 'CANCELED', label: '취소' },
  { value: 'ENDED',    label: '유찰' },
];

// ─── 배지 ────────────────────────────────────────────────────────────────────

const AUC_STATUS_LABEL = {
  AUCC0001: '준비',
  AUCC0002: '진행중',
  AUCC0003: '낙찰',
  AUCC0004: '유찰',
  AUCC0005: '취소',
  AUCC0006: '취소요청',
};

const AUC_STATUS_BADGE = {
  AUCC0001: 'badge-outline-gray',
  AUCC0002: 'badge-outline-orange',
  AUCC0003: 'badge-outline-gray',
  AUCC0004: 'badge-outline-gray',
  AUCC0005: 'badge-danger',
  AUCC0006: 'badge-outline-orange',
};

const TRADE_BADGE = {
  TRDC0003: 'badge-teal',
  TRDC0004: 'badge-orange',
  TRDC0005: 'badge-orange',
  TRDC0006: 'badge-outline-gray',
  TRDC0007: 'badge-danger',
  TRDC0008: 'badge-danger',
};

const PRD_STATUS_LABEL = {
  PRDC0001: '임시저장',
  PRDC0002: '진행중',
  PRDC0003: '종료',
};

const PRD_STATUS_BADGE = {
  PRDC0001: 'badge-outline-gray',
  PRDC0002: 'badge-outline-orange',
  PRDC0003: 'badge-outline-gray',
};

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function fmtPrice(n) {
  return n != null ? `${Number(n).toLocaleString()}원` : '-';
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function chipStyle(active) {
  return {
    minHeight: 38,
    padding: '0 14px',
    borderRadius: 8,
    border: `1px solid ${active ? '#155eef' : '#dce2ed'}`,
    background: active ? '#155eef' : '#fff',
    color: active ? '#fff' : '#526079',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  };
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function MyProductList() {
  const navigate = useNavigate();
  const [filter, setFilter]       = useState(null);
  const [subFilter, setSubFilter] = useState('');
  const [draftOnly, setDraftOnly] = useState(false);
  const [page, setPage]           = useState(1);
  const [toast, setToast]         = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const activeFilterType = draftOnly
    ? 'DRAFT'
    : filter === 'CLOSED' && subFilter
    ? subFilter
    : filter;

  const { data, isLoading, isError, refetch } = useMyProducts(page, 10, activeFilterType);
  const list       = data?.list       ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleFilterChange = (value) => {
    setFilter(value);
    setSubFilter('');
    setPage(1);
  };

  const handleSubFilterChange = (value) => { setSubFilter(value); setPage(1); };
  const handleDraftToggle = () => { setDraftOnly(prev => !prev); setPage(1); };

  const handleDeleteConfirm = async () => {
    const { prdSn } = confirmTarget;
    setConfirmTarget(null);
    try {
      await deleteProduct(prdSn);
      refetch();
    } catch (err) {
      setToast(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  if (isLoading) return <p className="muted" style={{ textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p>;
  if (isError) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <p style={{ color: '#a32d2d', marginBottom: 8 }}>목록을 불러오지 못했습니다.</p>
        <button type="button" onClick={() => refetch()} className="btn btn-outline">다시 시도</button>
      </div>
    );
  }

  return (
    <>
      {/* 필터 행 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {/* 좌측: 필터 칩 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
          {FILTERS.map((f) => (
            <button
              key={String(f.value)}
              type="button"
              onClick={() => handleFilterChange(f.value)}
              style={chipStyle(!draftOnly && filter === f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 우측: 종료 콤보박스 */}
        {filter === 'CLOSED' && !draftOnly && (
          <select
            value={subFilter}
            onChange={e => handleSubFilterChange(e.target.value)}
            style={{ fontSize: 13, padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d0cc', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
          >
            {CLOSED_SUB_FILTERS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* 필터 박스 아래: 임시저장만 보기 토글 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, width: 'fit-content', fontSize: 13, color: draftOnly ? '#0064ff' : '#5f5e5a', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={draftOnly}
            onChange={handleDraftToggle}
            style={{ accentColor: '#0064ff', width: 15, height: 15, cursor: 'pointer' }}
          />
          임시저장만 보기
        </label>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p className="muted">해당 조건의 판매 내역이 없습니다.</p>
          {filter === null && (
            <button
              type="button"
              onClick={() => navigate('/product/register')}
              className="btn btn-primary"
              style={{ marginTop: 16 }}
            >
              경매 등록하기
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="history-list">
            {list.map((p) => {
              const badgeLabel = p.tradeSn
                ? (TRADE_STATUS_LABEL[p.tradeStatusCd] ?? p.tradeStatusCd)
                : p.aucStatusCd
                ? (AUC_STATUS_LABEL[p.aucStatusCd] ?? p.aucStatusCd)
                : (PRD_STATUS_LABEL[p.prdStatusCd] ?? p.prdStatusCd);

              const badgeClass = p.tradeSn
                ? (TRADE_BADGE[p.tradeStatusCd] ?? 'badge-outline-gray')
                : p.aucStatusCd
                ? (AUC_STATUS_BADGE[p.aucStatusCd] ?? 'badge-outline-gray')
                : (PRD_STATUS_BADGE[p.prdStatusCd] ?? 'badge-outline-gray');

              const isActive = p.prdStatusCd === 'PRDC0002';
              const isDraft  = p.prdStatusCd === 'PRDC0001';
              const isEnded  = p.prdStatusCd === 'PRDC0003';

              return (
                <div key={p.prdSn} className="list-row">
                  <div className="history-entry-main">
                    <div style={{ flex: '0 0 120px', width: 120, height: 120, border: '1px solid #f0efec', borderRadius: 8, background: '#e5e4df', overflow: 'hidden' }}>
                      {p.prdImgUrl && (
                        <img src={toImageUrl(p.prdImgUrl)} alt={p.prdNm} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div className="history-row-title">
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <span className={`badge ${badgeClass}`}>{badgeLabel}</span>
                      </div>
                      <h4>{p.prdNm}</h4>
                      <p className="muted" style={{ fontSize: 15 }}>
                        시작가 {fmtPrice(p.prdStartAmt)}
                        {p.prdIbyAmt != null && ` · 즉시구매 ${fmtPrice(p.prdIbyAmt)}`}
                        {` · ${TRADE_LABEL[p.prdTrdMethodCd] ?? p.prdTrdMethodCd}`}
                        {p.prdRegDt && ` · ${fmtDate(p.prdRegDt)}`}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {p.tradeSn && (
                      <button type="button" onClick={() => navigate(`/trades/${p.tradeSn}/seller`)} className="btn btn-sm btn-primary">
                        거래 관리
                      </button>
                    )}
                    {!p.tradeSn && isActive && (
                      <button type="button" onClick={() => navigate(`/product/${p.prdSn}/seller`)} className="btn btn-sm btn-primary">
                        판매 관리
                      </button>
                    )}
                    {isDraft && (
                      <button type="button" onClick={() => navigate(`/product/${p.prdSn}/seller`)} className="btn btn-sm btn-ghost">
                        경매 설정
                      </button>
                    )}
                    {!p.tradeSn && isEnded && (
                      <button type="button" onClick={() => navigate(`/product/${p.prdSn}/seller`)} className="btn btn-sm btn-ghost">
                        판매 기록
                      </button>
                    )}
                    {(isDraft || isEnded) && !p.tradeSn && p.aucStatusCd !== 'AUCC0003' && (
                      <button type="button" onClick={() => setConfirmTarget({ prdSn: p.prdSn, prdNm: p.prdNm })} className="btn btn-sm btn-danger">
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pagination">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
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
    </>
  );
}
