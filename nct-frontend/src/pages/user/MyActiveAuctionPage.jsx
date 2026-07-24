import { useMemo, useState } from 'react';
import { ChevronRight, Gavel, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toImageUrl } from '@api/fileApi';
import Pagination from '@components/common/Pagination';
import useCountdown from '@hooks/useCountdown';
import { useMyBidHistory } from '@hooks/useBid';
import '@assets/css/my-active-auctions.css';

const ACTIVE_AUCTION_STATUS_CODE = 'AUCC0002';
const PAGE_SIZE = 8;
const REFRESH_INTERVAL_MS = 15_000;

const STATUS_META = {
  HIGHEST: {
    label: '최고 입찰 중',
    className: 'my-active-auction-status--highest',
  },
  OUTBID: {
    label: '재입찰 필요',
    className: 'my-active-auction-status--outbid',
  },
};

const FILTERS = [
  { value: 'ALL', label: '전체' },
  { value: 'HIGHEST', label: '최고 입찰 중' },
  { value: 'OUTBID', label: '재입찰 필요' },
];

const formatPrice = (value) => (
  value == null ? '-' : `${Number(value).toLocaleString('ko-KR')}원`
);

const formatRemainingTime = (endDateTime, now) => {
  if (!endDateTime) return '종료 시간 미정';

  const diffMs = new Date(endDateTime).getTime() - now;
  if (diffMs <= 0) return '종료 처리 중';

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}일 ${hours}시간 남음`;
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  return `${minutes}분 남음`;
};

const toLatestActiveAuctions = (items = []) => {
  const latestByAuction = new Map();

  [...items]
    .sort((left, right) => (
      new Date(right.bidDateTime || 0).getTime() - new Date(left.bidDateTime || 0).getTime()
    ))
    .forEach((item) => {
      const isActiveAuction = item.auctionStatusCode === ACTIVE_AUCTION_STATUS_CODE;
      const isVisibleBidStatus = Boolean(STATUS_META[item.displayStatus]);

      if (isActiveAuction && isVisibleBidStatus && !latestByAuction.has(item.aucSn)) {
        latestByAuction.set(item.aucSn, {
          ...item,
          thumbnailUrl: toImageUrl(item.thumbnailPath),
        });
      }
    });

  return [...latestByAuction.values()]
    .sort((left, right) => (
      new Date(left.auctionEndDateTime || 0).getTime()
      - new Date(right.auctionEndDateTime || 0).getTime()
    ));
};

export default function MyActiveAuctionPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useMyBidHistory({ refetchInterval: REFRESH_INTERVAL_MS });

  const activeAuctions = useMemo(() => toLatestActiveAuctions(data), [data]);
  const now = useCountdown(activeAuctions.length > 0);
  const statusCounts = useMemo(() => ({
    ALL: activeAuctions.length,
    HIGHEST: activeAuctions.filter((item) => item.displayStatus === 'HIGHEST').length,
    OUTBID: activeAuctions.filter((item) => item.displayStatus === 'OUTBID').length,
  }), [activeAuctions]);
  const filteredAuctions = useMemo(() => (
    statusFilter === 'ALL'
      ? activeAuctions
      : activeAuctions.filter((item) => item.displayStatus === statusFilter)
  ), [activeAuctions, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredAuctions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAuctions = filteredAuctions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleFilterChange = (nextFilter) => {
    setStatusFilter(nextFilter);
    setPage(1);
  };

  if (isLoading) {
    return (
      <section className="my-active-auctions" aria-busy="true">
        <header className="my-active-auctions__header">
          <p>MY AUCTIONS</p>
          <h1>진행중인 경매</h1>
        </header>
        <div className="my-active-auctions__state">진행 중인 경매를 불러오는 중입니다.</div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="my-active-auctions">
        <header className="my-active-auctions__header">
          <p>MY AUCTIONS</p>
          <h1>진행중인 경매</h1>
        </header>
        <div className="my-active-auctions__state my-active-auctions__state--error">
          <strong>진행 중인 경매를 불러오지 못했습니다.</strong>
          <button type="button" onClick={() => refetch()}>
            <RefreshCw size={16} />
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="my-active-auctions">
      <header className="my-active-auctions__header">
        <div>
          <p>MY AUCTIONS</p>
          <h1>진행중인 경매</h1>
          <span>현재 참여 중인 경매와 내 입찰 상태를 확인하세요.</span>
        </div>
      </header>

      <div className="my-active-auctions__summary" aria-label="진행 중인 경매 요약">
        <div>
          <span>참여 중</span>
          <strong>{statusCounts.ALL}</strong>
        </div>
        <div>
          <span>최고 입찰 중</span>
          <strong>{statusCounts.HIGHEST}</strong>
        </div>
        <div>
          <span>재입찰 필요</span>
          <strong>{statusCounts.OUTBID}</strong>
        </div>
      </div>

      <div className="my-active-auctions__filters" role="tablist" aria-label="입찰 상태">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={statusFilter === filter.value}
            className={statusFilter === filter.value ? 'is-active' : ''}
            onClick={() => handleFilterChange(filter.value)}
          >
            {filter.label}
            <span>{statusCounts[filter.value]}</span>
          </button>
        ))}
      </div>

      {filteredAuctions.length === 0 ? (
        <div className="my-active-auctions__state">
          <Gavel size={28} />
          <strong>해당 상태의 진행 중인 경매가 없습니다.</strong>
          <p>새로운 경매에 참여하면 이곳에서 입찰 상태를 확인할 수 있습니다.</p>
        </div>
      ) : (
        <>
          <div className="my-active-auctions__list">
            {pagedAuctions.map((item) => {
              const status = STATUS_META[item.displayStatus];
              const remainingTime = formatRemainingTime(item.auctionEndDateTime, now);

              return (
                <article className="my-active-auction-item" key={item.aucSn}>
                  <div className="my-active-auction-item__image">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.auctionTitle || `경매 ${item.aucSn}`}
                      />
                    ) : (
                      <Gavel size={24} aria-hidden="true" />
                    )}
                  </div>

                  <div className="my-active-auction-item__body">
                    <div className="my-active-auction-item__title-row">
                      <span className={`my-active-auction-status ${status.className}`}>
                        {status.label}
                      </span>
                      <span className="my-active-auction-item__time">{remainingTime}</span>
                    </div>
                    <h2>{item.auctionTitle || `경매 #${item.aucSn}`}</h2>
                    <p>판매자 {item.sellerName || '-'}</p>
                    <dl>
                      <div>
                        <dt>현재가</dt>
                        <dd>{formatPrice(item.currentPrice)}</dd>
                      </div>
                      <div>
                        <dt>내 입찰가</dt>
                        <dd>{formatPrice(item.bidAmount)}</dd>
                      </div>
                    </dl>
                  </div>

                  <button
                    className="my-active-auction-item__action"
                    type="button"
                    onClick={() => navigate(`/auction/${item.aucSn}`)}
                  >
                    경매 상세
                    <ChevronRight size={17} />
                  </button>
                </article>
              );
            })}
          </div>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </section>
  );
}
