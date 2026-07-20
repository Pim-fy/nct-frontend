// src/pages/user/MyBidHistoryPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// 내 입찰 내역 (F-AUC-022) — 로그인한 회원이 참여한 모든 입찰을 확인하는 화면
// 라우트: /my-bids (업무분장 v10 4.2절 신규 화면)
// 백엔드: GET /api/bids/me (담당자5 제공, BID/AUCTION 고정 소유)
//
// 상태 배지 주의: MyBidHistoryItem.resolveDisplayStatus()는 아직 CMM_CODE 반영 전 임시
// 문자열("BID_ACTIVE" 등)과 비교하도록 짜여 있어 실제 DB 값(BIDC0001 등)과 안 맞고, 애초에
// getter 형태가 아니라 JSON에도 안 실린다. 그래서 이 화면에서 실제 BIDC0001~4/AUCC0001~6
// 코드를 직접 해석한다 — 담당자5가 resolveDisplayStatus()를 실제 코드 기준으로 고치면
// 그쪽 계약을 그대로 받아 쓰도록 바꿀 수 있다 (진행현황 문서 3절에 기록).
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '@components/common/Pagination';
import { useMyBidHistory } from '@hooks/useBid';

// BIDC0001=최고입찰, BIDC0002=상위갱신(밀림), BIDC0003=취소, BIDC0004=예외취소
// AUCC0002=진행, AUCC0003=종료(낙찰/즉시구매), AUCC0004=유찰, AUCC0005/6=취소(요청)
const resolveDisplayStatus = (bidStatusCd, auctionStatusCd) => {
  if (bidStatusCd === 'BIDC0003' || bidStatusCd === 'BIDC0004') {
    return { key: 'CANCELLED', label: '취소', badge: 'badge-gray' };
  }
  if (auctionStatusCd === 'AUCC0005' || auctionStatusCd === 'AUCC0006') {
    return { key: 'AUCTION_CANCELLED', label: '경매 취소', badge: 'badge-gray' };
  }
  if (auctionStatusCd === 'AUCC0004') {
    return { key: 'FAILED', label: '유찰', badge: 'badge-gray' };
  }
  if (bidStatusCd === 'BIDC0002') {
    return { key: 'OUTBID', label: '상위 입찰에 밀림', badge: 'badge-gray' };
  }
  // 이 아래는 BIDC0001(최고입찰) 기준
  if (auctionStatusCd === 'AUCC0003') {
    return { key: 'WON', label: '낙찰', badge: 'badge-success' };
  }
  return { key: 'HIGHEST', label: '최고 입찰중', badge: 'badge-warning' };
};

const STATUS_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'HIGHEST', label: '최고 입찰중' },
  { value: 'WON', label: '낙찰' },
  { value: 'OUTBID', label: '상위 입찰에 밀림' },
  { value: 'FAILED', label: '유찰·취소' },
];

const matchesFilter = (statusKey, filter) => {
  if (filter === 'all') return true;
  if (filter === 'FAILED') return statusKey === 'FAILED' || statusKey === 'CANCELLED' || statusKey === 'AUCTION_CANCELLED';
  return statusKey === filter;
};

const PAGE_SIZE = 10;

export default function MyBidHistoryPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useMyBidHistory();
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const items = useMemo(
    () => (data ?? []).map((item) => ({ ...item, status: resolveDisplayStatus(item.bidStatusCd, item.auctionStatusCd) })),
    [data],
  );

  const filtered = useMemo(
    () => items.filter((item) => matchesFilter(item.status.key, statusFilter)),
    [items, statusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const summary = useMemo(() => ({
    highest: items.filter((i) => i.status.key === 'HIGHEST').length,
    won: items.filter((i) => i.status.key === 'WON').length,
    outbid: items.filter((i) => i.status.key === 'OUTBID').length,
  }), [items]);

  const handleFilterChange = (value) => { setStatusFilter(value); setPage(1); };

  // TODO: 경매 상세 페이지 라우트가 아직 없다(담당자5 영역, AuctionSection.jsx의 동일한 TODO 참고).
  // 라우트가 생기면 이 경로만 실제 상세 페이지로 바꾸면 된다.
  const handleGoToAuction = (aucSn) => navigate(`/auction/${aucSn}`);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="page-title">
        <div>
          <h1>내 입찰 내역</h1>
          <p className="muted">참여한 모든 경매의 입찰 이력을 확인합니다.</p>
        </div>
      </div>

      <section className="grid-3" style={{ marginBottom: 16 }}>
        <div className="card"><h3>최고 입찰중</h3><p className="price">{summary.highest}건</p></div>
        <div className="card"><h3>낙찰</h3><p className="price">{summary.won}건</p></div>
        <div className="card"><h3>상위 입찰에 밀림</h3><p className="price" style={{ color: '#5f5e5a' }}>{summary.outbid}건</p></div>
      </section>

      <div className="row" style={{ marginBottom: 16 }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => handleFilterChange(f.value)}
            className={`chip ${statusFilter === f.value ? 'active' : ''}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="muted" style={{ textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p>
      )}

      {!isLoading && isError && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p className="mb-2" style={{ color: '#a32d2d' }}>입찰 내역을 불러오지 못했습니다.</p>
          <button type="button" onClick={() => refetch()} className="btn btn-outline">다시 시도</button>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p className="muted">해당 조건의 입찰 내역이 없습니다.</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <>
          <div className="history-list">
            {paged.map((item) => (
              <div key={item.bidSn} className="list-row">
                <div className="history-row-title">
                  <div className="row" style={{ gap: 6 }}>
                    <span className={`badge ${item.status.badge}`}>{item.status.label}</span>
                  </div>
                  <h4>경매 #{item.aucSn}</h4>
                  <p className="muted">
                    입찰금액 {item.bidAmt.toLocaleString()}원 · {new Date(item.bidRegDt).toLocaleString('ko-KR')}
                  </p>
                </div>

                <div className="row" style={{ gap: 8, flexShrink: 0 }}>
                  <button type="button" onClick={() => handleGoToAuction(item.aucSn)} className="btn btn-sm btn-outline">
                    경매 상세보기
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
