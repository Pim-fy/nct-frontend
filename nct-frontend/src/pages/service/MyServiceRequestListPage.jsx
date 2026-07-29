// src/pages/service/MyServiceRequestListPage.jsx
// 내 서비스 요청서 목록 페이지 — 임시저장·공개·매칭완료·종료 필터 (F-SVC-004)
// 라우트: /service-requests/me
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyServiceRequests } from '@api/serviceRequestApi';
import Breadcrumb from '@components/common/Breadcrumb';
import Pagination from '@components/common/Pagination';
import ErrorMessage from '@components/common/ErrorMessage';

const FILTERS = [
  { label: '전체',     value: null },
  { label: '임시저장', value: 'DRAFT' },
  { label: '공개',     value: 'OPEN' },
  { label: '매칭완료', value: 'MATCHED' },
  { label: '종료',     value: 'CLOSED' },
];

const STATUS_LABEL = {
  SVCC0001: '임시저장',
  SVCC0002: '공개',
  SVCC0003: '매칭완료',
  SVCC0004: '종료',
};

const STATUS_BADGE = {
  SVCC0001: 'badge-gray',
  SVCC0002: 'badge-success',
  SVCC0003: 'badge-primary',
  SVCC0004: 'badge-gray',
};

function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtBudget(amt) {
  if (amt == null) return '예산 미정';
  return Number(amt).toLocaleString('ko-KR') + '원';
}

const PAGE_SIZE = 10;

export default function MyServiceRequestListPage() {
  const navigate = useNavigate();

  const [filter, setFilter]       = useState(null);
  const [list, setList]           = useState([]);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const load = useCallback((p, f) => {
    setLoading(true);
    setError('');
    getMyServiceRequests(p, PAGE_SIZE, f)
      .then(res => {
        setList(res.data?.list ?? []);
        setTotalPages(res.data?.pages ?? 1);
      })
      .catch(() => setError('요청서 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(page, filter);
  }, [page, filter, load]);

  const handleFilter = (val) => {
    setFilter(val);
    setPage(1);
  };

  return (
    <main className="container seller-page">
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '내 서비스 요청' }]} />
      <div className="page-title">
        <h1>내 서비스 요청</h1>
      </div>

      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#eef2fb', padding: '14px 20px' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>서비스 요청 내역</h3>
        </div>
        <div style={{ padding: '20px' }}>

          {/* 필터 칩 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {FILTERS.map(f => (
              <button
                key={String(f.value)}
                type="button"
                onClick={() => handleFilter(f.value)}
                className={`chip${filter === f.value ? ' active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {error && <ErrorMessage message={error} />}

          {/* 목록 */}
          {!loading && !error && list.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>
              등록된 서비스 요청이 없습니다.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {list.map(item => (
              <button
                key={item.svcReqSn}
                type="button"
                onClick={() => navigate(`/service-requests/${item.svcReqSn}`)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                  padding: '16px 20px', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className={`badge ${STATUS_BADGE[item.svcReqStatusCd] ?? 'badge-gray'}`}>
                    {STATUS_LABEL[item.svcReqStatusCd] ?? item.svcReqStatusCd}
                  </span>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{item.catNm}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  {item.svcReqTtl}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6b7280' }}>
                  <span>예산 {fmtBudget(item.svcReqBdgtAmt)}</span>
                  <span>등록 {fmtDate(item.svcReqRegDt)}</span>
                </div>
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ marginTop: 24 }}>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
