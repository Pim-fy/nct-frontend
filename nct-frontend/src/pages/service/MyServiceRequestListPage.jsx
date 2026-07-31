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
      <div className="page-title"><h1>내 서비스 요청</h1></div>
      <div className="flex flex-col gap-5">

        <div className="tab-group-1">
          {FILTERS.map(f => (
            <button
              key={String(f.value)}
              type="button"
              onClick={() => handleFilter(f.value)}
              className={`tab-pill${filter === f.value ? ' active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && <ErrorMessage message={error} />}

        {!loading && !error && list.length === 0 && (
          <div className="flex items-center justify-center py-20 text-center rounded-[15px] bg-white border border-[#e4e9f2]">
            <p className="text-[16px] text-[#969696] m-0">등록된 서비스 요청이 없습니다.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {list.map(item => (
            <button
              key={item.svcReqSn}
              type="button"
              onClick={() => navigate(`/service-requests/${item.svcReqSn}`)}
              className="w-full text-left bg-white border border-[#e4e9f2] rounded-[15px] px-5 py-4 cursor-pointer hover:border-[#a0aec0] transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`badge ${STATUS_BADGE[item.svcReqStatusCd] ?? 'badge-gray'}`} style={{ borderRadius: 5, fontSize: 13 }}>
                  {STATUS_LABEL[item.svcReqStatusCd] ?? item.svcReqStatusCd}
                </span>
                <span className="text-[13px] text-[#969696]">{item.catNm}</span>
              </div>
              <p className="font-bold text-[16px] text-[#1a1a1a] mb-1.5 m-0">{item.svcReqTtl}</p>
              <div className="flex gap-4 text-[13px] text-[#969696]">
                <span>예산 {fmtBudget(item.svcReqBdgtAmt)}</span>
                <span>등록 {fmtDate(item.svcReqRegDt)}</span>
              </div>
            </button>
          ))}
        </div>

        {totalPages > 1 && (
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>
    </main>
  );
}
