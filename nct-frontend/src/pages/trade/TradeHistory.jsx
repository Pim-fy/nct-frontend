import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMyPagePath } from '@/routes/myPageRoutes';
import { CalendarCheck, CalendarDays } from 'lucide-react';
import { toImageUrl } from '@api/fileApi';
import { getTradeHistory } from '@api/tradeApi';
import {
  getTradeListItems,
  toTradeHistoryItem,
} from '@api/tradeAdapter';
import Pagination from '@components/common/Pagination';
import MyPageListSkeleton from '@components/skeleton/MyPageListSkeleton';
import MyPageListSectionLayout from '@components/mypage/MyPageListSectionLayout';
import MyPageContentHeader from '@components/mypage/MyPageContentHeader';
import MyPageListEmpty from '@components/mypage/MyPageListEmpty';
import MyPageListError from '@components/mypage/MyPageListError';
import MyPageAuctionListItem from '@components/mypage/MyPageAuctionListItem';
import MyPageStatusBadge from '@components/mypage/MyPageStatusBadge';
import MyPageMobileCard from '@components/mypage/MyPageMobileCard';
import '@assets/css/trade-history.css';

const statusInfo = {
  DELIVERING: {
    label: '배송·직거래 중',
    badgeClass: 'badge-teal',
  },
  WAITING_CONFIRMATION: {
    label: '상대 확인 대기',
    badgeClass: 'badge-orange',
  },
  // 구매자의 완료 확인 요청 직후 상태도 같은 대기 문구로 표시한다.
  CONFIRM_PENDING: {
    label: '상대 확인 대기',
    badgeClass: 'badge-orange',
  },
  COMPLETED: {
    label: '거래 완료',
    badgeClass: 'badge-outline-gray',
  },
  ON_HOLD: {
    label: '거래 보류',
    badgeClass: 'badge-outline-orange',
  },
  CANCELED: {
    label: '거래 취소',
    badgeClass: 'badge-danger',
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

// 경매 하위 목록(진행 중인 경매/구매 내역/판매 내역) 공통 페이지당 건수
const PAGE_SIZE = 10;

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
      badgeClass: 'badge-teal',
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
          label: '직거래 진행 중',
          badgeClass: 'badge-teal',
        };
      }

      let label = '일정 제안 필요';

      if (trade.type === 'BUYER') {
        label = '일정 확인 필요';
      }

      return {
        label,
        badgeClass: 'badge-primary',
      };
    }

    return {
      label: '배송 등록 필요',
      badgeClass: 'badge-primary',
    };
  }

  return statusInfo[trade.status] ?? {
    label: trade.status ?? '상태 확인 중',
    badgeClass: 'badge-orange',
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
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [allTradeItems, setAllTradeItems] = useState([]);
  const [filteredTradeItems, setFilteredTradeItems] = useState([]);
  const [activeTab, setActiveTab] = useState(fixedRole ?? 'ALL');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);

  // 별도 미리보기 경로에서는 로그인 보호 경로가 아닌 미리보기 상세로 이동한다.
  const isPreview = preview || pathname.startsWith('/trades/preview');
  const tradeBasePath = isPreview ? '/trades/preview' : '/trades';

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

  const totalPages = Math.max(1, Math.ceil(visibleTrades.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedTrades = visibleTrades.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className={embedded
      ? 'trade-history-page trade-history-page--embedded'
      : 'trade-history-page'}
    >
      <main className={embedded
        ? 'trade-history-page__content'
        : 'container trade-history-page__content'}
      >
        {fixedRole === 'BUYER' ? (
          <MyPageListSectionLayout
            title="상품 구매 내역"
            summaryItems={[
              { label: '진행 중', value: buyerStatusCounts.IN_PROGRESS ?? 0 },
              { label: '배송·직거래 중', value: buyerStatusCounts.DELIVERING ?? 0 },
              {
                label: '확인 대기',
                value: (buyerStatusCounts.WAITING_CONFIRMATION ?? 0)
                  + allTradeItems.filter(
                    (trade) => trade.type === 'BUYER' && trade.status === 'CONFIRM_PENDING',
                  ).length,
              },
            ]}
            filterItems={buyerStatusFilters.map((filter) => ({
              ...filter,
              count: buyerStatusCounts[filter.value] ?? 0,
            }))}
            activeFilter={statusFilter}
            onFilterChange={setStatusFilter}
            filterAriaLabel="구매 거래 상태"
            onSearch={setKeyword}
            searchAriaLabel="구매 거래 검색"
            isLoading={isLoading}
          />
        ) : (
          <MyPageContentHeader title="거래 내역" />
        )}

        {!fixedRole && !isLoading && !loadError && (
          <section className="trade-history-summary" aria-label="진행 중 거래 요약">
            <div>
              <span>진행 중 거래</span>
              <strong>{activeTradeCount}건</strong>
            </div>
            <p>확인이 필요한 거래부터 순서대로 확인해 주세요.</p>
          </section>
        )}

        <section className="trade-history-panel" aria-label="거래 내역 필터">
          {!fixedRole && (
            <div className="trade-history-tabs" role="tablist">
              {tabs.map((tab) => (
                <button
                  className={`trade-history-tab ${
                    activeTab === tab.value ? 'trade-history-tab--active' : ''
                  }`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.value}
                  key={tab.value}
                  onClick={() => { setActiveTab(tab.value); setPage(1); }}
                >
                  {tab.label} <span>{tradeCounts[tab.value]}</span>
                </button>
              ))}
            </div>
          )}

          {!fixedRole && <div className="trade-history-filters">
            <label className="trade-history-search">
              <span className="trade-history-search__label">상품 구매 검색</span>
              <input
                className="input"
                value={keyword}
                onChange={(event) => { setKeyword(event.target.value); setPage(1); }}
                placeholder="상품명, 상대방, 거래번호 검색"
              />
            </label>
            {!fixedRole && (
              <label className="trade-history-select">
                <span className="trade-history-search__label">거래 상태</span>
                <select
                  className="input"
                  value={statusFilter}
                  onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}
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
          </div>}
        </section>

        <section className={fixedRole ? '!mt-0' : ''} aria-live="polite">
          {isLoading && <MyPageListSkeleton count={5} />}

          {loadError && (
            <MyPageListError message={loadError} onRetry={loadFilteredTradeItems} />
          )}

          {!isLoading && !loadError && visibleTrades.length === 0 && (
            <MyPageListEmpty message="해당 조건의 구매 내역이 없습니다." />
          )}

          {/* history-list의 display:grid가 불레이어 CSS라 Tailwind hidden(@layer utilities)보다 우선
              적용된다 — hidden/lg:block은 별도 래퍼에 둬서 두 display 선언이 충돌하지 않게 한다. */}
          <div className="hidden lg:block">
          <div className="history-list">
          {!isLoading && !loadError && pagedTrades.map((trade) => {
            const status = getStatusInfo(trade);
            const detailPath = trade.type === 'SELLER'
              ? `${tradeBasePath}/${trade.id}/seller`
              : `${tradeBasePath}/${trade.id}`;
            const detailState = embedded
              ? { from: isPreview ? '/user/mypage/preview/trades' : getMyPagePath(returnSection) }
              : undefined;

            return (
              <MyPageAuctionListItem
                key={trade.id}
                to={detailPath}
                state={detailState}
                imageSrc={toImageUrl(trade.productImageUrl)}
                imageAlt={trade.productName}
                imageFallback="상품 이미지"
                badge={<MyPageStatusBadge className={status.badgeClass}>{status.label}</MyPageStatusBadge>}
                title={trade.productName}
                topLine={`확정날짜 ${trade.date} / 완료날짜 ${trade.completedDate ?? '-'}`}
                priceItems={[
                  { label: '확정 금액', value: trade.amount },
                ]}
                tradeMethodLabel={trade.method === 'DELIVERY' ? '배송' : '직거래'}
                actionButton={<span className="btn btn-sm btn-primary">거래 상세</span>}
              />
            );
          })}
          </div>
          </div>

          <div className="grid gap-4 lg:hidden">
            {!isLoading && !loadError && pagedTrades.map((trade) => {
              const status = getStatusInfo(trade);
              const detailPath = trade.type === 'SELLER'
                ? `${tradeBasePath}/${trade.id}/seller`
                : `${tradeBasePath}/${trade.id}`;
              const detailState = embedded
                ? { from: isPreview ? '/user/mypage/preview/trades' : getMyPagePath(returnSection) }
                : undefined;
              const actionButton = (
                <button className="btn btn-sm btn-primary" type="button" onClick={() => navigate(detailPath, { state: detailState })}>
                  거래 상세
                </button>
              );

              return (
                <MyPageMobileCard
                  key={trade.id}
                  imageSrc={toImageUrl(trade.productImageUrl)}
                  imageAlt={trade.productName}
                  imageFallbackLabel="상품 이미지"
                  badge={<MyPageStatusBadge className={status.badgeClass}>{status.label}</MyPageStatusBadge>}
                  title={trade.productName}
                  price={trade.amount}
                  infoItems={[
                    { icon: CalendarDays, label: '확정날짜', value: trade.date },
                    { icon: CalendarCheck, label: '완료날짜', value: trade.completedDate ?? '-' },
                  ]}
                  footerLeft={`거래 방식 · ${trade.method === 'DELIVERY' ? '배송' : '직거래'}`}
                  actionButton={actionButton}
                />
              );
            })}
          </div>
        </section>

        {!isLoading && !loadError && (
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} showSinglePage />
        )}
      </main>
    </div>
  );
};

export default TradeHistory;
