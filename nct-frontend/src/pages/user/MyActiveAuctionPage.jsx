import { useMemo, useState } from 'react';
import { Gavel, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toImageUrl } from '@api/fileApi';
import Pagination from '@components/common/Pagination';
import MyPageListSectionLayout from '@components/mypage/MyPageListSectionLayout';
import MyPageContentHeader from '@components/mypage/MyPageContentHeader';
import MyPageListEmpty from '@components/mypage/MyPageListEmpty';
import MyPageListError from '@components/mypage/MyPageListError';
import MyPageListItem from '@components/mypage/MyPageListItem';
import MyPageStatusBadge from '@components/mypage/MyPageStatusBadge';
import useCountdown from '@hooks/useCountdown';
import { useMyBidHistory } from '@hooks/useBid';
import { formatPrice } from '@utils/common';
import MyPageListSkeleton from '@components/skeleton/MyPageListSkeleton';
import '@assets/css/my-active-auctions.css';

const ACTIVE_AUCTION_STATUS_CODE = 'AUCC0002';
const PAGE_SIZE = 8;
const REFRESH_INTERVAL_MS = 15_000;

const STATUS_META = {
  HIGHEST: {
    label: '최고 입찰 중',
    badgeClass: 'badge-primary',
  },
  OUTBID: {
    label: '재입찰 필요',
    badgeClass: 'badge-outline-orange',
  },
};

const FILTERS = [
  { value: 'ALL', label: '전체' },
  { value: 'HIGHEST', label: '최고 입찰 중' },
  { value: 'OUTBID', label: '재입찰 필요' },
];

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
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState('');

  const rawFilter = searchParams.get('filter');
  const statusFilter = FILTERS.some((f) => f.value === rawFilter) ? rawFilter : 'ALL';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
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
  const filteredAuctions = useMemo(() => {
    const statusFiltered = statusFilter === 'ALL'
      ? activeAuctions
      : activeAuctions.filter((item) => item.displayStatus === statusFilter);
    const normalizedKeyword = keyword.toLowerCase();

    return normalizedKeyword
      ? statusFiltered.filter((item) => (
        String(item.auctionTitle ?? '').toLowerCase().includes(normalizedKeyword)
      ))
      : statusFiltered;
  }, [activeAuctions, keyword, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredAuctions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAuctions = filteredAuctions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleFilterChange = (nextFilter) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('filter', nextFilter);
      next.set('page', '1');
      return next;
    });
  };

  const handlePageChange = (nextPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(nextPage));
      return next;
    });
  };
  if (isError) {
    return (
      <section className="my-active-auctions">
        <MyPageContentHeader title="진행 중인 경매" />
        <MyPageListError
          message="진행 중인 경매를 불러오지 못했습니다."
          onRetry={() => refetch()}
          retryIcon={<RefreshCw size={16} />}
        />
      </section>
    );
  }

  return (
    <section className="my-active-auctions">
      <MyPageListSectionLayout
        title="진행 중인 경매"
        summaryItems={[
          { label: '참여 중', value: statusCounts.ALL },
          { label: '최고 입찰 중', value: statusCounts.HIGHEST },
          { label: '재입찰 필요', value: statusCounts.OUTBID },
        ]}
        filterItems={FILTERS.map((filter) => ({
          ...filter,
          count: statusCounts[filter.value],
        }))}
        activeFilter={statusFilter}
        onFilterChange={handleFilterChange}
        filterAriaLabel="입찰 상태"
        onSearch={setKeyword}
        searchAriaLabel="진행 중인 경매 검색"
        isLoading={isLoading}
      />

      {isLoading ? (
        <MyPageListSkeleton count={4} />
      ) : filteredAuctions.length === 0 ? (
        <MyPageListEmpty message="해당 조건의 진행 중인 경매가 없습니다." />
      ) : (
        <>
          <div className="my-active-auctions__list">
            {pagedAuctions.map((item) => {
              const status = STATUS_META[item.displayStatus];
              const remainingTime = formatRemainingTime(item.auctionEndDateTime, now);

              return (
                <MyPageListItem
                  key={item.aucSn}
                  imageSrc={item.thumbnailUrl}
                  imageAlt={item.auctionTitle || `경매 ${item.aucSn}`}
                  imageFallback={<Gavel size={24} aria-hidden="true" />}
                  badge={(
                    <>
                      <MyPageStatusBadge className={status.badgeClass}>{status.label}</MyPageStatusBadge>
                      <span className="text-xs font-bold text-[#667085]">{remainingTime}</span>
                    </>
                  )}
                  title={item.auctionTitle || `경매 #${item.aucSn}`}
                  actions={(
                    <button
                      className="btn btn-sm btn-primary"
                      type="button"
                      onClick={() => navigate(`/auction/${item.aucSn}`, { state: { from: location.pathname + location.search } })}
                    >
                      경매 상세
                    </button>
                  )}
                >
                  <p>판매자 {item.sellerName || '-'}</p>
                  <p>
                    현재가 {formatPrice(item.currentPrice)} · 내 입찰가 {formatPrice(item.bidAmount)}
                  </p>
                </MyPageListItem>
              );
            })}
          </div>
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </section>
  );
}
