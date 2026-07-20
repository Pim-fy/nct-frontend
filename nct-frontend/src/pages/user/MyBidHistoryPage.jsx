// src/pages/user/MyBidHistoryPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// 경매 거래내역 (마이페이지 사이드바 "경매 거래내역") — 내 입찰 내역 / 내 판매 내역 두 탭
// 라우트: /my-bids (업무분장 v10 4.2절 F-AUC-022 "신규 /my-bids" + 디자인시안
//         mypage_mybid_내입찰내역.png / mypage_mybid_내판매내역.png)
//
// 화면(레이아웃·탭 구성)은 CHG-015로 마이페이지 소유권을 받은 담당자3(나) 몫이지만, 데이터는
// 두 곳에서 그대로 소비만 한다:
// - 내 입찰 내역: GET /api/bids/me (BID/AUCTION 고정 소유 담당자5)
// - 내 판매 내역: GET /api/products/me (PRODUCT 고정 소유 담당자2, MyProductListPage.jsx가
//   쓰는 것과 동일한 API) — "판매관리"/"취소요청" 버튼은 둘 다 담당자2가 이미 만들어 둔
//   /product/:prdSn/seller(취소 요청 모달 포함)로 보낸다. 그 화면을 직접 손대지 않는다.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '@components/common/Pagination';
import { toImageUrl } from '@api/fileApi';
import { useMyBidHistory } from '@hooks/useBid';
import { useMyProducts } from '@hooks/useProduct';

const BID_STATUS_META = {
  HIGHEST: { label: '최고입찰', badge: 'badge-primary' },
  WON:     { label: '낙찰',    badge: 'badge-orange' },
  OUTBID:  { label: '반환',    badge: 'badge-outline-orange' },
  CANCELED:{ label: '취소',    badge: 'badge-outline-gray' },
  UNKNOWN: { label: '확인 필요', badge: 'badge-outline-gray' },
};

const BID_STATUS_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'HIGHEST', label: '최고입찰' },
  { value: 'WON', label: '낙찰' },
  { value: 'OUTBID', label: '반환' },
  { value: 'CANCELED', label: '취소' },
];

// PRDC0001=임시저장, PRDC0002=경매 진행중, PRDC0003=종료, PRDC0004=삭제 (MyProductListPage.jsx와 동일 코드)
const PRODUCT_STATUS_META = {
  PRDC0001: { label: '임시저장', badge: 'badge-outline-gray' },
  PRDC0002: { label: '진행중',   badge: 'badge-outline-orange' },
  PRDC0003: { label: '완료',     badge: 'badge-outline-gray' },
  PRDC0004: { label: '삭제',     badge: 'badge-danger' },
};

const BID_PAGE_SIZE = 10;
const SALE_PAGE_SIZE = 10;

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
  const paged = filtered.slice((page - 1) * BID_PAGE_SIZE, page * BID_PAGE_SIZE);

  const handleFilterChange = (value) => { setStatusFilter(value); setPage(1); };
  // TODO: 경매 상세 "화면"이 아직 없다(담당자5 영역 - 백엔드 GET /api/auctions/{id}는 이미 있음).
  const handleGoToAuction = (aucSn) => navigate(`/auction/${aucSn}`);

  if (isLoading) return <p className="muted" style={{ textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p>;
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
      <div className="row" style={{ marginBottom: 16 }}>
        {BID_STATUS_FILTERS.map((f) => {
          const count = f.value === 'all' ? items.length : items.filter((i) => (i.displayStatus ?? 'UNKNOWN') === f.value).length;
          return (
            <button key={f.value} type="button" onClick={() => handleFilterChange(f.value)} className={`chip ${statusFilter === f.value ? 'active' : ''}`}>
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
              return (
                <div key={item.bidSn} className="list-row">
                  <div className="history-entry-main">
                    <div className="history-thumb">
                      {item.thumbnailUrl && <img src={item.thumbnailUrl} alt={item.auctionTitle ?? `경매 #${item.aucSn}`} />}
                    </div>
                    <div className="history-row-title">
                      <div className="row" style={{ gap: 6 }}>
                        <span className={`badge ${statusMeta.badge}`}>{statusMeta.label}</span>
                      </div>
                      <h4>{item.auctionTitle ?? `경매 #${item.aucSn}`}</h4>
                      <p className="muted">
                        내 입찰가 {item.bidAmount?.toLocaleString()}원
                        {item.currentPrice != null && ` · 현재가 ${item.currentPrice.toLocaleString()}원`}
                        {item.sellerName && ` · 판매자 ${item.sellerName}`}
                        {' · '}{new Date(item.bidDateTime).toLocaleString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <div className="row" style={{ gap: 8, flexShrink: 0 }}>
                    <button type="button" onClick={() => handleGoToAuction(item.aucSn)} className="btn btn-sm btn-ghost">경매 상세</button>
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

function SalesHistoryTab() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useMyProducts(page, SALE_PAGE_SIZE);

  const list = data?.list ?? [];
  const totalPages = data?.totalPages ?? 1;

  // 판매관리·취소요청 둘 다 담당자2 소유 화면(판매 관리 + 취소 요청 모달 포함)으로 보낸다.
  const handleManage = (prdSn) => navigate(`/product/${prdSn}/seller`);

  if (isLoading) return <p className="muted" style={{ textAlign: 'center', padding: '40px 0' }}>불러오는 중...</p>;
  if (isError) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <p className="mb-2" style={{ color: '#a32d2d' }}>판매 내역을 불러오지 못했습니다.</p>
        <button type="button" onClick={() => refetch()} className="btn btn-outline">다시 시도</button>
      </div>
    );
  }
  if (list.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <p className="muted">등록한 판매 내역이 없습니다.</p>
        <button type="button" onClick={() => navigate('/product/register')} className="btn btn-primary" style={{ marginTop: 16 }}>
          경매 등록하기
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="history-list">
        {list.map((p) => {
          const statusMeta = PRODUCT_STATUS_META[p.prdStatusCd] ?? { label: p.prdStatusCd, badge: 'badge-gray' };
          return (
            <div key={p.prdSn} className="list-row">
              <div className="history-entry-main">
                <div className="history-thumb">
                  {p.prdImgUrl && <img src={toImageUrl(p.prdImgUrl)} alt={p.prdNm} />}
                </div>
                <div className="history-row-title">
                  <div className="row" style={{ gap: 6 }}>
                    <span className={`badge ${statusMeta.badge}`}>{statusMeta.label}</span>
                  </div>
                  <h4>{p.prdNm}</h4>
                  <p className="muted">
                    시작가 {p.prdStartAmt?.toLocaleString()}원
                    {p.prdIbyAmt != null && ` · 즉시구매 ${p.prdIbyAmt.toLocaleString()}원`}
                    {p.prdRegDt && ` · ${new Date(p.prdRegDt).toLocaleDateString('ko-KR')}`}
                  </p>
                </div>
              </div>
              <div className="row" style={{ gap: 8, flexShrink: 0 }}>
                {p.prdStatusCd === 'PRDC0002' && (
                  <>
                    <button type="button" onClick={() => handleManage(p.prdSn)} className="btn btn-sm btn-primary">판매관리</button>
                    <button type="button" onClick={() => handleManage(p.prdSn)} className="btn btn-sm btn-danger">취소 요청</button>
                  </>
                )}
                {(p.prdStatusCd === 'PRDC0003' || p.prdStatusCd === 'PRDC0001') && (
                  <button type="button" onClick={() => handleManage(p.prdSn)} className="btn btn-sm btn-ghost">
                    {p.prdStatusCd === 'PRDC0001' ? '경매 설정' : '판매기록'}
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
  );
}

export default function MyBidHistoryPage() {
  const [activeTab, setActiveTab] = useState('bids'); // 'bids' | 'sales'
  const { data: bids } = useMyBidHistory();
  const { data: salesPage } = useMyProducts(1, SALE_PAGE_SIZE);

  const tabs = [
    { key: 'bids', label: '내 입찰 내역', count: bids?.length ?? 0 },
    { key: 'sales', label: '내 판매 내역', count: salesPage?.total ?? 0 },
  ];

  return (
    <div className="absolute contents left-[448px] top-[167px]">
      <div className="page-title">
        <div>
          <h1>경매 거래내역</h1>
          <p className="muted">참여한 입찰과 등록한 판매 내역을 확인합니다.</p>
        </div>
      </div>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label} {tab.count}
          </button>
        ))}
      </div>

      {activeTab === 'bids' ? <BidHistoryTab /> : <SalesHistoryTab />}
    </div>
  );
}
