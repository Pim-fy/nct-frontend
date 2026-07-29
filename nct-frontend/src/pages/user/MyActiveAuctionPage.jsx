import { useMemo } from 'react';
import { ChevronRight, Gavel, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toImageUrl } from '@api/fileApi';
import {
  MyAuctionAction,
  MyAuctionBadge,
  MyAuctionCard,
  MyAuctionDetail,
  MyAuctionFilterTabs,
  MyAuctionHeader,
  MyAuctionList,
  MyAuctionListSkeleton,
  MyAuctionPagination,
  MyAuctionSection,
  MyAuctionState,
  MyAuctionSummary,
} from '@components/mypage/MyAuctionSectionUi';
import useCountdown from '@hooks/useCountdown';
import { useMyBidHistory } from '@hooks/useBid';

const ACTIVE_AUCTION_STATUS_CODE = 'AUCC0002';
const PAGE_SIZE = 8;
const REFRESH_INTERVAL_MS = 15_000;

const STATUS_META = {
  HIGHEST: {
    label: '최고 입찰 중',
    tone: 'blue',
  },
  OUTBID: {
    label: '재입찰 필요',
    tone: 'orange',
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
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

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

  if (isLoading) {
    return (
      <MyAuctionSection aria-busy="true">
        <MyAuctionHeader
          title="진행중인 경매"
          description="현재 참여 중인 경매와 내 입찰 상태를 확인하세요."
        />
        <MyAuctionListSkeleton />
      </MyAuctionSection>
    );
  }

  if (isError) {
    return (
      <MyAuctionSection>
        <MyAuctionHeader
          title="진행중인 경매"
          description="현재 참여 중인 경매와 내 입찰 상태를 확인하세요."
        />
        <MyAuctionState
          tone="error"
          title="진행 중인 경매를 불러오지 못했습니다."
          action={(
            <MyAuctionAction onClick={() => refetch()}>
              <RefreshCw size={16} />
              다시 시도
            </MyAuctionAction>
          )}
        />
      </MyAuctionSection>
    );
  }

  return (
    <MyAuctionSection>
      <MyAuctionHeader
        title="진행중인 경매"
        description="현재 참여 중인 경매와 내 입찰 상태를 확인하세요."
      />

      <MyAuctionSummary items={[
        { key: 'all', label: '참여 중', value: statusCounts.ALL },
        { key: 'highest', label: '최고 입찰 중', value: statusCounts.HIGHEST },
        { key: 'outbid', label: '재입찰 필요', value: statusCounts.OUTBID },
      ]} />

      <MyAuctionFilterTabs
        ariaLabel="입찰 상태"
        value={statusFilter}
        onChange={handleFilterChange}
        items={FILTERS.map((filter) => ({
          ...filter,
          count: statusCounts[filter.value],
        }))}
      />

      {filteredAuctions.length === 0 ? (
        <MyAuctionState
          icon={<Gavel size={28} />}
          title="해당 상태의 진행 중인 경매가 없습니다."
          description="새로운 경매에 참여하면 이곳에서 입찰 상태를 확인할 수 있습니다."
        />
      ) : (
        <>
          <MyAuctionList>
            {pagedAuctions.map((item) => {
              const status = STATUS_META[item.displayStatus];
              const remainingTime = formatRemainingTime(item.auctionEndDateTime, now);

              return (
                <MyAuctionCard
                  key={item.aucSn}
                  imageUrl={item.thumbnailUrl}
                  imageAlt={item.auctionTitle || `경매 ${item.aucSn}`}
                  imageFallback={<Gavel size={24} aria-hidden="true" />}
                  badges={(
                    <>
                      <MyAuctionBadge tone={status.tone}>{status.label}</MyAuctionBadge>
                      <MyAuctionBadge>{remainingTime}</MyAuctionBadge>
                    </>
                  )}
                  title={item.auctionTitle || `경매 #${item.aucSn}`}
                  description={`판매자 ${item.sellerName || '-'}`}
                  details={(
                    <>
                      <MyAuctionDetail label="현재가" value={formatPrice(item.currentPrice)} />
                      <MyAuctionDetail label="내 입찰가" value={formatPrice(item.bidAmount)} />
                    </>
                  )}
                  actions={(
                    <MyAuctionAction
                      onClick={() => navigate(`/auction/${item.aucSn}`, {
                        state: { from: location.pathname + location.search },
                      })}
                    >
                      경매 상세
                      <ChevronRight size={17} />
                    </MyAuctionAction>
                  )}
                />
              );
            })}
          </MyAuctionList>
          <MyAuctionPagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </MyAuctionSection>
  );
}
