import { useMemo, useState } from 'react';
import { Gavel, RefreshCw } from 'lucide-react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { toImageUrl } from '@api/fileApi';
import Pagination from '@components/common/Pagination';
import { ActionButton } from '@components/common/ui';
import MyPageListSectionLayout from '@components/mypage/MyPageListSectionLayout';
import MyPageContentHeader from '@components/mypage/MyPageContentHeader';
import MyPageListEmpty from '@components/mypage/MyPageListEmpty';
import MyPageListError from '@components/mypage/MyPageListError';
import MyPageAuctionListItem from '@components/mypage/MyPageAuctionListItem';
import MyPageStatusBadge from '@components/mypage/MyPageStatusBadge';
import useCountdown from '@hooks/useCountdown';
import { useMyBidHistory } from '@hooks/useBid';
import { formatDate, formatPoint } from '@utils/common';
import MyPageListSkeleton from '@components/skeleton/MyPageListSkeleton';
import AuctionCard from '@pages/auction/components/AuctionCard';
import '@assets/css/my-active-auctions.css';

const ACTIVE_AUCTION_STATUS_CODE = 'AUCC0002';
const PAGE_SIZE = 10;
const REFRESH_INTERVAL_MS = 15_000;

// @ai_generated: "진행 중인 경매"(active만)에서 "참여 경매"(전체 입찰 이력)로 범위를 넓히며,
// OUTBID(반환)를 경매 진행 여부로 다시 나눴다 - 진행 중이면 아직 재입찰할 수 있지만, 경매가
// 끝난 뒤의 OUTBID는 더 이상 할 수 있는 게 없는 "낙찰 실패"라 같은 라벨을 쓰면 오해를 준다.
// WON(낙찰)은 여기서 계속 뺀다 - 상품 구매 내역(거래) 화면이 이미 그 정보를 보여준다.
const OUTBID_ACTIVE = 'OUTBID_ACTIVE';
const OUTBID_ENDED = 'OUTBID_ENDED';

const STATUS_META = {
  HIGHEST: {
    label: '최고 입찰 중',
    badgeClass: 'badge-primary',
  },
  [OUTBID_ACTIVE]: {
    label: '재입찰 필요',
    badgeClass: 'badge-outline-orange',
  },
  [OUTBID_ENDED]: {
    label: '낙찰 실패',
    badgeClass: 'badge-outline-gray',
  },
  CANCELED: {
    label: '취소',
    badgeClass: 'badge-outline-gray',
  },
};

const FILTERS = [
  { value: 'ALL', label: '전체' },
  { value: 'HIGHEST', label: '최고 입찰 중' },
  { value: OUTBID_ACTIVE, label: '재입찰 필요' },
  { value: OUTBID_ENDED, label: '낙찰 실패' },
  { value: 'CANCELED', label: '취소' },
];

// 입찰 상태(OUTBID)는 경매가 아직 진행 중인지에 따라 의미가 갈려 별도 상태로 다시 계산한다.
const resolveDisplayStatus = (item) => {
  if (item.displayStatus === 'OUTBID') {
    return item.auctionStatusCode === ACTIVE_AUCTION_STATUS_CODE ? OUTBID_ACTIVE : OUTBID_ENDED;
  }
  return item.displayStatus;
};

const formatRemainingTime = (endDateTime, now) => {
  if (!endDateTime) return '종료 시간 미정';

  const diffMs = new Date(endDateTime).getTime() - now;
  if (diffMs <= 0) return '종료 처리 중';

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `종료까지 ${days}일 ${hours}시간`;
  if (hours > 0) return `종료까지 ${hours}시간 ${minutes}분`;
  return `종료까지 ${minutes}분`;
};

const toParticipatedAuctions = (items = []) => {
  const latestByAuction = new Map();

  [...items]
    .sort((left, right) => (
      new Date(right.bidDateTime || 0).getTime() - new Date(left.bidDateTime || 0).getTime()
    ))
    .forEach((item) => {
      const resolvedStatus = resolveDisplayStatus(item);
      const isVisibleBidStatus = Boolean(STATUS_META[resolvedStatus]);

      if (isVisibleBidStatus && !latestByAuction.has(item.aucSn)) {
        latestByAuction.set(item.aucSn, {
          ...item,
          resolvedStatus,
          thumbnailUrl: toImageUrl(item.thumbnailPath),
        });
      }
    });

  // 진행 중인 경매(종료일이 미래)를 먼저, 그 다음 최근에 끝난 순으로 보여준다.
  return [...latestByAuction.values()]
    .sort((left, right) => (
      new Date(right.auctionEndDateTime || 0).getTime()
      - new Date(left.auctionEndDateTime || 0).getTime()
    ));
};

// @ai_generated
const toAuctionCardItem = (item) => ({
  auctionId: item.aucSn,
  title: item.auctionTitle || `경매 #${item.aucSn}`,
  thumbnailPath: item.thumbnailPath || item.thumbnailUrl,
  currentPrice: item.currentPrice,
  instantBuyPrice: item.instantBuyPrice,
  tradeMethodCode: item.tradeMethodCode,
  tradeMethodName: item.tradeMethodName,
  sellerName: item.sellerName || item.sellerNickname || '정보 없음',
  bidCount: item.bidCount,
  endDateTime: item.auctionEndDateTime,
  auctionStatusCode: item.auctionStatusCode,
  categoryName: item.categoryName || '경매',
});

export default function MyActiveAuctionPage() {
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

  const participatedAuctions = useMemo(() => toParticipatedAuctions(data), [data]);
  const now = useCountdown(participatedAuctions.some((item) => item.auctionStatusCode === ACTIVE_AUCTION_STATUS_CODE));
  const statusCounts = useMemo(() => ({
    ALL: participatedAuctions.length,
    HIGHEST: participatedAuctions.filter((item) => item.resolvedStatus === 'HIGHEST').length,
    [OUTBID_ACTIVE]: participatedAuctions.filter((item) => item.resolvedStatus === OUTBID_ACTIVE).length,
    [OUTBID_ENDED]: participatedAuctions.filter((item) => item.resolvedStatus === OUTBID_ENDED).length,
    CANCELED: participatedAuctions.filter((item) => item.resolvedStatus === 'CANCELED').length,
  }), [participatedAuctions]);
  const filteredAuctions = useMemo(() => {
    const statusFiltered = statusFilter === 'ALL'
      ? participatedAuctions
      : participatedAuctions.filter((item) => item.resolvedStatus === statusFilter);
    const normalizedKeyword = keyword.toLowerCase();

    return normalizedKeyword
      ? statusFiltered.filter((item) => (
        String(item.auctionTitle ?? '').toLowerCase().includes(normalizedKeyword)
      ))
      : statusFiltered;
  }, [participatedAuctions, keyword, statusFilter]);
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
    window.scrollTo(0, 0);
  };
  if (isError) {
    return (
      <section className="my-active-auctions">
        <MyPageContentHeader title="참여 경매" />
        <MyPageListError
          message="참여 경매를 불러오지 못했습니다."
          onRetry={() => refetch()}
          retryIcon={<RefreshCw size={16} />}
        />
      </section>
    );
  }

  return (
    <section className="my-active-auctions">
      <MyPageListSectionLayout
        title="참여 경매"
        summaryItems={[
          { label: '최고 입찰 중', value: statusCounts.HIGHEST },
          { label: '재입찰 필요', value: statusCounts[OUTBID_ACTIVE] },
          { label: '낙찰 실패', value: statusCounts[OUTBID_ENDED] },
        ]}
        filterItems={FILTERS.map((filter) => ({
          ...filter,
          count: statusCounts[filter.value],
        }))}
        activeFilter={statusFilter}
        onFilterChange={handleFilterChange}
        filterAriaLabel="입찰 상태"
        onSearch={setKeyword}
        searchAriaLabel="참여 경매 검색"
        isLoading={isLoading}
      />

      {isLoading ? (
        <MyPageListSkeleton count={PAGE_SIZE} />
      ) : filteredAuctions.length === 0 ? (
        <MyPageListEmpty message="해당 조건의 참여 경매가 없습니다." />
      ) : (
          <>
          {/* history-list의 display:grid가 불레이어(unlayered) CSS라 Tailwind hidden(@layer utilities)보다
              우선 적용된다 — hidden/lg:block은 별도 래퍼에 둬서 두 display 선언이 충돌하지 않게 한다. */}
          <div className="hidden lg:block">
          <div className="history-list">
            {pagedAuctions.map((item) => {
              const status = STATUS_META[item.resolvedStatus];
              const isActiveAuction = item.auctionStatusCode === ACTIVE_AUCTION_STATUS_CODE;
              const remainingTime = isActiveAuction
                ? formatRemainingTime(item.auctionEndDateTime, now)
                : `종료 · ${formatDate(item.auctionEndDateTime)}`;

              return (
                <MyPageAuctionListItem
                  key={item.aucSn}
                  imageSrc={item.thumbnailUrl}
                  imageAlt={item.auctionTitle || `경매 ${item.aucSn}`}
                  imageFallback={<Gavel size={24} aria-hidden="true" />}
                  badge={<MyPageStatusBadge className={status.badgeClass}>{status.label}</MyPageStatusBadge>}
                  title={item.auctionTitle || `경매 #${item.aucSn}`}
                  topLine={remainingTime}
                  priceItems={[
                    { label: '현재 최고가', value: formatPoint(item.currentPrice) },
                    {
                      label: '즉시구매가',
                      value: Number(item.instantBuyPrice) > 0 ? formatPoint(item.instantBuyPrice) : '없음',
                    },
                  ]}
                  tradeMethodLabel={item.tradeMethodName || '정보 없음'}
                  actionButton={(
                    <ActionButton
                      size="sm"
                      state={{ from: location.pathname + location.search }}
                      to={`/auction/${item.aucSn}`}
                    >
                      경매 상세
                    </ActionButton>
                  )}
                />
              );
            })}
          </div>
          </div>
          <div className="grid gap-4 lg:hidden">
            {pagedAuctions.map((item) => (
              <AuctionCard key={item.aucSn} item={toAuctionCardItem(item)} />
            ))}
          </div>
          </>
      )}
      {!isLoading && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showSinglePage
        />
      )}
    </section>
  );
}
