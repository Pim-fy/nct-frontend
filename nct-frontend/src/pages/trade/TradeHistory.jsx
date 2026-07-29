import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, Gavel, RefreshCw } from 'lucide-react';
import { getTradeHistory } from '@api/tradeApi';
import {
  getTradeListItems,
  toTradeHistoryItem,
} from '@api/tradeAdapter';
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

const statusInfo = {
  DELIVERING: {
    label: '배송·직거래중',
    tone: 'blue',
  },
  WAITING_CONFIRMATION: {
    label: '상대 확인 대기',
    tone: 'orange',
  },
  // 구매자의 완료 확인 요청 직후 상태도 같은 대기 문구로 표시한다.
  CONFIRM_PENDING: {
    label: '상대 확인 대기',
    tone: 'orange',
  },
  COMPLETED: {
    label: '거래 완료',
    tone: 'green',
  },
  ON_HOLD: {
    label: '거래 보류',
    tone: 'red',
  },
  CANCELED: {
    label: '거래 취소',
    tone: 'gray',
  },
};

const statusPriority = {
  IN_PROGRESS: 0,
  DELIVERING: 1,
  WAITING_CONFIRMATION: 2,
  CONFIRM_PENDING: 2,
  COMPLETED: 3,
  ON_HOLD: 4,
  CANCELED: 5,
};

const activeTradeStatuses = new Set([
  'IN_PROGRESS',
  'DELIVERING',
  'WAITING_CONFIRMATION',
  'CONFIRM_PENDING',
]);

const tabs = [
  { value: 'ALL', label: '전체' },
  { value: 'BUYER', label: '구매 내역' },
  { value: 'SELLER', label: '판매 내역' },
];

// 마이페이지 경매 거래 내역은 구매자 역할로 고정되므로, 거래 상태만 빠르게 골라본다.
const buyerStatusFilters = [
  { value: 'ALL', label: '전체' },
  { value: 'IN_PROGRESS', label: '진행 중' },
  { value: 'DELIVERING', label: '배송·직거래 중' },
  { value: 'WAITING_CONFIRMATION', label: '확인 대기' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELED', label: '취소' },
];

const TRADES_PER_PAGE = 10;

// 사용자가 입력한 공백 차이로 동일한 상품을 놓치지 않도록 검색용 문자열을 통일한다.
const normalizeSearchText = (value) => String(value ?? '')
  .toLowerCase()
  .replaceAll(/\s+/g, '');

// 판매자 진행 건은 거래 방식에 맞춰 지금 필요한 행동을 상태 문구로 보여준다.
const getStatusInfo = (trade) => {
  // 거래 방식에 따라 현재 진행 상태를 구분해 사용자가 다음 상황을 바로 알 수 있게 한다.
  if (trade.status === 'DELIVERING') {
    return {
      label: trade.method === 'DELIVERY' ? '배송 중' : '직거래 중',
      tone: 'blue',
    };
  }

  if (trade.status === 'IN_PROGRESS') {
    if (trade.method === 'OFFLINE') {
      const hasMeetingSchedule = Boolean(
        trade.meetingDate
        && trade.meetingTime
        && trade.meetingPlace,
      );

      if (hasMeetingSchedule) {
        return {
          label: '직거래 중',
          tone: 'blue',
        };
      }

      let label = '일정 제안 필요';

      if (trade.type === 'BUYER') {
        label = '일정 확인 필요';
      }

      return {
        label,
        tone: 'orange',
      };
    }

    return {
      label: '배송 등록 필요',
      tone: 'orange',
    };
  }

  return statusInfo[trade.status] ?? {
    label: trade.status ?? '상태 확인 중',
    tone: 'gray',
  };
};

/**
 * 거래 목록을 독립 페이지 또는 마이페이지 본문 영역에서 재사용한다.
 * embedded=true이면 마이페이지의 사이드바·여백을 유지하고 목록 영역만 렌더링한다.
 * preview=true이면 마이페이지 내부에서도 서버 API 대신 개발용 거래 데이터를 사용한다.
 */
const TradeHistory = ({
  embedded = false,
  fixedRole = null,
  preview = false,
  returnSection = 'trade-history',
  onOpenTradeDetail = null,
}) => {
  const { pathname } = useLocation();
  const [allTradeItems, setAllTradeItems] = useState([]);
  const [filteredTradeItems, setFilteredTradeItems] = useState([]);
  const [activeTab, setActiveTab] = useState(fixedRole ?? 'ALL');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // 별도 미리보기 경로에서는 로그인 보호 경로가 아닌 미리보기 상세로 이동한다.
  const isPreview = preview || pathname.startsWith('/trades/preview');
  const tradeBasePath = isPreview ? '/trades/preview' : '/trades';

  const handleActiveTabChange = (nextTab) => {
    setActiveTab(nextTab);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setCurrentPage(1);
  };

  const handleKeywordChange = (event) => {
    setKeyword(event.target.value);
    setCurrentPage(1);
  };

  // 탭별 건수와 진행 중 건수는 필터와 무관한 전체 목록으로 계산한다.
  const tradeCounts = useMemo(() => {
    return allTradeItems.reduce((counts, trade) => {
      counts.ALL += 1;

      if (trade.type === 'BUYER') {
        counts.BUYER += 1;
      }

      if (trade.type === 'SELLER') {
        counts.SELLER += 1;
      }

      if (activeTradeStatuses.has(trade.status)) {
        counts.ACTIVE += 1;
      }

      return counts;
    }, {
      ALL: 0,
      BUYER: 0,
      SELLER: 0,
      ACTIVE: 0,
    });
  }, [allTradeItems]);

  // 역할이 고정된 입찰 내역에서는 해당 역할의 진행 건수만 요약에 표시한다.
  const activeTradeCount = useMemo(() => {
    return allTradeItems.filter((trade) => {
      const matchesRole = !fixedRole || trade.type === fixedRole;

      return matchesRole && activeTradeStatuses.has(trade.status);
    }).length;
  }, [allTradeItems, fixedRole]);

  // 상태 버튼의 건수는 검색어와 무관한 전체 구매 거래를 기준으로 표시한다.
  const buyerStatusCounts = useMemo(() => {
    const buyerTrades = allTradeItems.filter((trade) => trade.type === 'BUYER');

    return buyerStatusFilters.reduce((counts, filter) => {
      counts[filter.value] = filter.value === 'ALL'
        ? buyerTrades.length
        : buyerTrades.filter((trade) => trade.status === filter.value).length;

      return counts;
    }, {});
  }, [allTradeItems]);

  // 요약 영역은 조건과 관계없이 로그인한 사용자의 전체 거래를 기준으로 표시한다.
  const loadAllTradeItems = useCallback(async () => {
    try {
      const response = await getTradeHistory({}, { preview });
      const items = getTradeListItems(response).map(toTradeHistoryItem);

      setAllTradeItems(items);
    } catch (error) {
      // 실제 API·개발용 목업 중 어느 경로가 실패했는지 개발 도구에서 확인한다.
      console.error('[TradeHistory] 전체 거래 목록 조회 실패', error);
      setLoadError('거래 내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }, [preview]);

  // 탭·상태·검색어가 바뀌면 서버에 조건을 전달해 필요한 거래만 다시 조회한다.
  const loadFilteredTradeItems = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const params = {};

      if (activeTab !== 'ALL') {
        params.role = activeTab;
      }

      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const response = await getTradeHistory(params, { preview });
      const items = getTradeListItems(response).map(toTradeHistoryItem);

      setFilteredTradeItems(items);
    } catch (error) {
      // 필터 변경 후 실패도 남겨, 서버 응답 형식과 화면 어댑터 문제를 구분한다.
      console.error('[TradeHistory] 필터 거래 목록 조회 실패', error);
      setLoadError('거래 내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, preview, statusFilter]);

  // 첫 진입에는 탭별 건수용 전체 목록을 별도로 조회한다.
  useEffect(() => {
    const requestTimer = window.setTimeout(loadAllTradeItems, 0);

    return () => window.clearTimeout(requestTimer);
  }, [loadAllTradeItems]);

  // 검색어 입력은 짧게 지연해, 매 글자마다 서버 요청이 쌓이지 않게 한다.
  useEffect(() => {
    const requestTimer = window.setTimeout(loadFilteredTradeItems, 250);

    return () => window.clearTimeout(requestTimer);
  }, [loadFilteredTradeItems]);

  // 서버가 골라 준 목록은 현재 필요한 행동이 먼저 보이도록 화면에서만 정렬한다.
  const visibleTrades = useMemo(() => {
    const normalizedKeyword = normalizeSearchText(keyword);
    const searchedTrades = !normalizedKeyword
      ? filteredTradeItems
      : filteredTradeItems.filter((trade) => {
        const searchTarget = [
          trade.id,
          trade.productName,
          trade.counterpart,
        ].join(' ');

        return normalizeSearchText(searchTarget).includes(normalizedKeyword);
      });

    return [...searchedTrades].sort((firstTrade, secondTrade) => {
      const firstPriority = statusPriority[firstTrade.status] ?? 4;
      const secondPriority = statusPriority[secondTrade.status] ?? 4;

      return firstPriority - secondPriority;
    });
  }, [filteredTradeItems, keyword]);

  const totalPages = Math.ceil(visibleTrades.length / TRADES_PER_PAGE);
  const visiblePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedTrades = useMemo(() => {
    const startIndex = (visiblePage - 1) * TRADES_PER_PAGE;

    return visibleTrades.slice(startIndex, startIndex + TRADES_PER_PAGE);
  }, [visiblePage, visibleTrades]);

  const summaryItems = fixedRole === 'BUYER'
    ? [
      { key: 'all', label: '전체 구매', value: buyerStatusCounts.ALL ?? 0 },
      { key: 'active', label: '진행 중', value: activeTradeCount },
      { key: 'completed', label: '완료', value: buyerStatusCounts.COMPLETED ?? 0 },
    ]
    : [
      { key: 'all', label: '전체 거래', value: tradeCounts.ALL },
      { key: 'buyer', label: '구매 내역', value: tradeCounts.BUYER },
      { key: 'seller', label: '판매 내역', value: tradeCounts.SELLER },
    ];

  return (
    <div className={embedded ? '' : 'bg-[#f8f9fb] py-12 max-sm:py-6'}>
      <main className={embedded ? '' : 'container max-w-[850px]'}>
        <MyAuctionSection>
          <MyAuctionHeader
            title={fixedRole === 'BUYER' ? '상품 구매 내역' : '거래 내역'}
            description={fixedRole === 'BUYER'
              ? '낙찰 또는 즉시구매 후 생성된 구매 거래를 확인하세요.'
              : '구매와 판매 거래의 진행 상태를 한 곳에서 확인하세요.'}
          />

          {!isLoading && !loadError && <MyAuctionSummary items={summaryItems} />}

          {!isLoading && !loadError && (
            <>
              {!fixedRole && (
                <MyAuctionFilterTabs
                  ariaLabel="거래 역할"
                  value={activeTab}
                  onChange={handleActiveTabChange}
                  items={tabs.map((tab) => ({ ...tab, count: tradeCounts[tab.value] }))}
                />
              )}

              {fixedRole === 'BUYER' && (
                <MyAuctionFilterTabs
                  ariaLabel="구매 거래 상태"
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  items={buyerStatusFilters.map((filter) => ({
                    ...filter,
                    count: buyerStatusCounts[filter.value] ?? 0,
                  }))}
                />
              )}

              <div className="mb-5 grid max-w-[620px] grid-cols-[minmax(0,1fr)_180px] gap-3 max-sm:grid-cols-1">
                <label className="grid gap-1.5">
                  <span className="text-xs leading-[1.5] font-bold text-[#4b5565]">상품 구매 검색</span>
                  <input
                    className="min-h-11 rounded-lg border border-[#dce2ed] bg-white px-3 text-base outline-none focus:border-primary"
                    value={keyword}
                    onChange={handleKeywordChange}
                    placeholder="상품명, 상대방, 거래번호 검색"
                  />
                </label>
                {!fixedRole && (
                  <label className="grid gap-1.5">
                    <span className="text-xs leading-[1.5] font-bold text-[#4b5565]">거래 상태</span>
                    <select
                      className="min-h-11 cursor-pointer rounded-lg border border-[#dce2ed] bg-white px-3 text-base outline-none focus:border-primary"
                      value={statusFilter}
                      onChange={(event) => handleStatusFilterChange(event.target.value)}
                    >
                      <option value="ALL">전체 상태</option>
                      <option value="DELIVERING">배송중</option>
                      <option value="WAITING_CONFIRMATION">상대 확인 대기</option>
                      <option value="COMPLETED">거래 완료</option>
                      <option value="ON_HOLD">거래 보류</option>
                      <option value="CANCELED">거래 취소</option>
                    </select>
                  </label>
                )}
              </div>
            </>
          )}

          {isLoading ? (
            <MyAuctionListSkeleton />
          ) : loadError ? (
            <MyAuctionState
              tone="error"
              title={loadError}
              action={(
                <MyAuctionAction onClick={loadFilteredTradeItems}>
                  <RefreshCw size={16} />
                  다시 시도
                </MyAuctionAction>
              )}
            />
          ) : visibleTrades.length === 0 ? (
            <MyAuctionState
              icon={<Gavel size={28} />}
              title="조건에 맞는 거래가 없습니다."
              description="검색어나 필터를 변경해 다시 확인해 주세요."
            />
          ) : (
            <>
              <MyAuctionList>
                {paginatedTrades.map((trade) => {
                  const status = getStatusInfo(trade);
                  const detailPath = trade.type === 'SELLER'
                    ? `${tradeBasePath}/${trade.id}/seller`
                    : `${tradeBasePath}/${trade.id}`;
                  const detailTarget = embedded
                    ? `${detailPath}?from=mypage&section=${returnSection}`
                    : detailPath;
                  const action = onOpenTradeDetail ? (
                    <MyAuctionAction onClick={() => onOpenTradeDetail(trade.id)}>
                      거래 상세
                      <ChevronRight size={17} />
                    </MyAuctionAction>
                  ) : (
                    <MyAuctionAction to={detailTarget}>
                      거래 상세
                      <ChevronRight size={17} />
                    </MyAuctionAction>
                  );

                  return (
                    <MyAuctionCard
                      key={trade.id}
                      imageFallback="상품"
                      badges={(
                        <>
                          <MyAuctionBadge tone={status.tone}>{status.label}</MyAuctionBadge>
                          <MyAuctionBadge>{trade.type === 'SELLER' ? '판매' : '구매'}</MyAuctionBadge>
                        </>
                      )}
                      title={trade.productName}
                      description={`${trade.type === 'SELLER' ? '구매자' : '판매자'} ${trade.counterpart || '-'}`}
                      details={(
                        <>
                          <MyAuctionDetail label="거래 금액" value={trade.amount} />
                          <MyAuctionDetail label="거래일" value={trade.date} />
                        </>
                      )}
                      actions={action}
                    />
                  );
                })}
              </MyAuctionList>
              <MyAuctionPagination
                page={visiblePage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </MyAuctionSection>
      </main>
    </div>
  );
};

export default TradeHistory;
