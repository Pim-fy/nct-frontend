// src/pages/user/MyBidHistoryPage.jsx
// 마이페이지 사이드바 "상품 입찰 내역" 섹션 — 내 입찰 내역 전용
// 판매 내역은 MyProductList 컴포넌트로 분리 (마이페이지 "상품 판매 내역" 사이드바 항목)
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '@components/common/Pagination';
import { toImageUrl } from '@api/fileApi';
import { useMyBidHistory } from '@hooks/useBid';
import CardGridSkeleton from '@components/skeleton/CardGridSkeleton';

const BID_STATUS_META = {
  HIGHEST:  { label: '최고입찰', badge: 'badge-primary' },
  WON:      { label: '낙찰',     badge: 'badge-orange' },
  OUTBID:   { label: '반환',     badge: 'badge-outline-orange' },
  CANCELED: { label: '취소',     badge: 'badge-outline-gray' },
  UNKNOWN:  { label: '확인 필요', badge: 'badge-outline-gray' },
};

const BID_STATUS_FILTERS = [
  { value: 'all',      label: '전체' },
  { value: 'HIGHEST',  label: '최고입찰' },
  { value: 'WON',      label: '낙찰' },
  { value: 'OUTBID',   label: '반환' },
  { value: 'CANCELED', label: '취소' },
];

const BID_PAGE_SIZE = 10;

// ─── 날짜 헬퍼 ───────────────────────────────────────────────────────────────

function formatEndDate(endDateTime) {
  if (!endDateTime) return null;
  const end  = new Date(endDateTime);
  const now  = new Date();
  const diffMs   = end - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffMs <= 0)       return '종료됨';
  if (diffHours < 24) {
    const hh = String(end.getHours()).padStart(2, '0');
    const mm = String(end.getMinutes()).padStart(2, '0');
    return `오늘 ${hh}:${mm} 종료`;
  }
  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `마감 D-${days}`;
}

function isUrgent(endDateTime) {
  if (!endDateTime) return false;
  const diffMs = new Date(endDateTime) - new Date();
  return diffMs > 0 && diffMs < 24 * 60 * 60 * 1000;
}

function fmtPrice(n) {
  return n != null ? `${Number(n).toLocaleString()}원` : '-';
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function getBidDescription(item) {
  const { displayStatus, currentPrice, bidAmount, auctionEndDateTime, bidDateTime } = item;

  if (displayStatus === 'HIGHEST') {
    const parts = [];
    if (currentPrice != null) parts.push(`현재가 ${fmtPrice(currentPrice)}`);
    if (bidAmount    != null) parts.push(`내 입찰가 ${fmtPrice(bidAmount)}`);
    const endStr = formatEndDate(auctionEndDateTime);
    if (endStr) parts.push(endStr);
    return parts.join(' · ');
  }
  if (displayStatus === 'WON') {
    const parts = [`낙찰가 ${fmtPrice(bidAmount)}`];
    if (bidDateTime) parts.push(`${fmtDate(bidDateTime)} 낙찰 확정`);
    // 거래 상태는 TRADE 모듈 미완 — 담당자4(정민재) 완성 후 실값으로 교체
    parts.push('배송중');
    return parts.join(' · ');
  }
  if (displayStatus === 'OUTBID') {
    const parts = [`반환가 ${fmtPrice(bidAmount)}`];
    if (bidDateTime) parts.push(fmtDate(bidDateTime));
    return parts.join(' · ');
  }
  if (displayStatus === 'CANCELED') {
    const parts = ['취소'];
    if (bidDateTime) parts.push(fmtDate(bidDateTime));
    return parts.join(' · ');
  }
  const parts = [];
  if (bidAmount != null) parts.push(`입찰가 ${fmtPrice(bidAmount)}`);
  if (bidDateTime)       parts.push(new Date(bidDateTime).toLocaleString('ko-KR'));
  return parts.join(' · ');
}


// ─── 내 입찰 내역 탭 ──────────────────────────────────────────────────────────

function BidHistoryTab() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useMyBidHistory();
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const items = useMemo(
    () => (data ?? []).map((item) => ({ ...item, thumbnailUrl: toImageUrl(item.thumbnailPath) })),
    [data],
  );
  const filtered = useMemo(
    () => items.filter((item) => statusFilter === 'all' || (item.displayStatus ?? 'UNKNOWN') === statusFilter),
    [items, statusFilter],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / BID_PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * BID_PAGE_SIZE, page * BID_PAGE_SIZE);

  const handleFilterChange = (value) => { setStatusFilter(value); setPage(1); };
  const handleGoToAuction  = (aucSn) => navigate(`/auction/${aucSn}`);

  if (isLoading) return <CardGridSkeleton cardHeight={100} columns={1} count={4} />;
  if (isError) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <p className="mb-2" style={{ color: '#a32d2d' }}>입찰 내역을 불러오지 못했습니다.</p>
        <button type="button" onClick={() => refetch()} className="btn btn-outline">다시 시도</button>
      </div>
    );
  }

  return (
    <>
      {/* 필터 칩 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {BID_STATUS_FILTERS.map((f) => {
          const count = f.value === 'all'
            ? items.length
            : items.filter((i) => (i.displayStatus ?? 'UNKNOWN') === f.value).length;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => handleFilterChange(f.value)}
              className={`btn btn-sm ${statusFilter === f.value ? 'btn-primary' : 'btn-ghost'}`}
            >
              {f.label} {count}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <p className="muted">해당 조건의 입찰 내역이 없습니다.</p>
        </div>
      ) : (
        <>
          <div className="history-list">
            {paged.map((item) => {
              const statusMeta = BID_STATUS_META[item.displayStatus] ?? BID_STATUS_META.UNKNOWN;
              const urgent     = item.displayStatus === 'HIGHEST' && isUrgent(item.auctionEndDateTime);
              const isWon      = item.displayStatus === 'WON';

              return (
                <div key={item.bidSn} className="list-row">
                  {/* 썸네일 + 정보 */}
                  <div className="history-entry-main">
                    <div style={{ flex: '0 0 88px', width: 88, height: 88, border: '1px solid #f0efec', borderRadius: 8, background: '#e5e4df', overflow: 'hidden' }}>
                      {item.thumbnailUrl
                        ? <img src={item.thumbnailUrl} alt={item.auctionTitle ?? `경매 #${item.aucSn}`} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />
                        : null}
                    </div>
                    <div className="history-row-title">
                      {/* 뱃지 행 */}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <span className={`badge ${statusMeta.badge}`}>{statusMeta.label}</span>
                        {urgent && <span className="badge badge-urgent">마감임박</span>}
                        {isWon  && <span className="badge badge-teal">거래진행중</span>}
                      </div>
                      <h4>{item.auctionTitle ?? `경매 #${item.aucSn}`}</h4>
                      <p className="muted" style={{ fontSize: 14 }}>{getBidDescription(item)}</p>
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {isWon && (
                      <button
                        type="button"
                        onClick={() => handleGoToAuction(item.aucSn)}
                        className="btn btn-sm"
                        style={{ background: '#10b981', color: '#fff', border: 'none' }}
                      >
                        거래 상세
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleGoToAuction(item.aucSn)}
                      className={`btn btn-sm ${isWon ? 'btn-ghost' : 'btn-primary'}`}
                    >
                      경매 상세
                    </button>
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
    </>
  );
}

// ─── 페이지 루트 ──────────────────────────────────────────────────────────────

export default function MyBidHistoryPage() {
  return (
    <div className="container">
      <div className="page-title">
        <div>
          <h1>상품 입찰 내역</h1>
          <p className="muted">참여한 입찰 내역을 확인합니다.</p>
        </div>
      </div>
      <BidHistoryTab />
    </div>
  );
}
