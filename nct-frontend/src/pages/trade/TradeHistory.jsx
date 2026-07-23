import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getTradeHistory } from '@api/tradeApi';
import {
  getTradeListItems,
  toTradeHistoryItem,
} from '@api/tradeAdapter';
import '@assets/css/trade-history.css';

const statusInfo = {
  DELIVERING: {
    label: '배송·직거래중',
    className: 'trade-history-status--progress',
  },
  WAITING_CONFIRMATION: {
    label: '상대 확인 대기',
    className: 'trade-history-status--pending',
  },
  // 구매자의 완료 확인 요청 직후 상태도 같은 대기 문구로 표시한다.
  CONFIRM_PENDING: {
    label: '상대 확인 대기',
    className: 'trade-history-status--pending',
  },
  COMPLETED: {
    label: '거래 완료',
    className: 'trade-history-status--complete',
  },
  ON_HOLD: {
    label: '거래 보류',
    className: 'trade-history-status--problem',
  },
  CANCELED: {
    label: '거래 취소',
    className: 'trade-history-status--canceled',
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
      className: 'trade-history-status--progress',
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
          className: 'trade-history-status--progress',
        };
      }

      let label = '일정 제안 필요';

      if (trade.type === 'BUYER') {
        label = '일정 확인 필요';
      }

      return {
        label,
        className: 'trade-history-status--action',
      };
    }

    return {
      label: '배송 등록 필요',
      className: 'trade-history-status--action',
    };
  }

  return statusInfo[trade.status] ?? {
    label: trade.status ?? '상태 확인 중',
    className: 'trade-history-status--pending',
  };
};

/**
 * 거래 목록을 독립 페이지 또는 마이페이지 본문 영역에서 재사용한다.
 * embedded=true이면 마이페이지의 사이드바·여백을 유지하고 목록 영역만 렌더링한다.
 * preview=true이면 마이페이지 내부에서도 서버 API 대신 개발용 거래 데이터를 사용한다.
 */
const TradeHistory = ({ embedded = false, preview = false }) => {
  const { pathname } = useLocation();
  const [allTradeItems, setAllTradeItems] = useState([]);
  const [filteredTradeItems, setFilteredTradeItems] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

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
  }, [activeTab, keyword, preview, statusFilter]);

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

  return (
    <div className={embedded
      ? 'trade-history-page trade-history-page--embedded'
      : 'trade-history-page'}
    >
      <main className={embedded
        ? 'trade-history-page__content'
        : 'container trade-history-page__content'}
      >
        <header className="trade-history-page__header">
          <div>
            <p className="trade-history-page__eyebrow">MY TRANSACTIONS</p>
            <h1>거래 내역</h1>
            <p>구매와 판매 거래의 진행 상태를 한 곳에서 확인하세요.</p>
          </div>
        </header>

        {!isLoading && !loadError && (
          <section className="trade-history-summary" aria-label="진행 중 거래 요약">
            <div>
              <span>진행 중 거래</span>
              <strong>{tradeCounts.ACTIVE}건</strong>
            </div>
            <p>확인이 필요한 거래부터 순서대로 확인해 주세요.</p>
          </section>
        )}

        <section className="trade-history-panel" aria-label="거래 내역 필터">
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
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label} <span>{tradeCounts[tab.value]}</span>
              </button>
            ))}
          </div>

          <div className="trade-history-filters">
            <label className="trade-history-search">
              <span className="trade-history-search__label">거래 검색</span>
              <input
                className="input"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="상품명, 상대방, 거래번호 검색"
              />
            </label>
            <label className="trade-history-select">
              <span className="trade-history-search__label">거래 상태</span>
              <select
                className="input"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">전체 상태</option>
                <option value="DELIVERING">배송중</option>
                <option value="WAITING_CONFIRMATION">상대 확인 대기</option>
                <option value="COMPLETED">거래 완료</option>
                <option value="ON_HOLD">거래 보류</option>
                <option value="CANCELED">거래 취소</option>
              </select>
            </label>
          </div>
        </section>

        <section className="trade-history-list" aria-live="polite">
          {isLoading && (
            <div className="trade-history-empty">
              <strong>거래 내역을 불러오는 중입니다.</strong>
            </div>
          )}

          {loadError && (
            <div className="trade-history-empty" role="alert">
              <strong>{loadError}</strong>
              <button
                className="btn btn-outline trade-history-empty__button"
                type="button"
                onClick={loadFilteredTradeItems}
              >
                다시 시도
              </button>
            </div>
          )}

          {!isLoading && !loadError && visibleTrades.length === 0 && (
            <div className="trade-history-empty">
              <strong>조건에 맞는 거래가 없습니다.</strong>
              <p>검색어나 필터를 변경해 다시 확인해 주세요.</p>
            </div>
          )}

          {!isLoading && !loadError && visibleTrades.map((trade) => {
            const status = getStatusInfo(trade);
            const detailPath = trade.type === 'SELLER'
              ? `${tradeBasePath}/${trade.id}/seller`
              : `${tradeBasePath}/${trade.id}`;
            // 마이페이지 안에서 연 상세는 목록 버튼도 같은 거래내역 탭으로 되돌린다.
            const detailTarget = embedded
              ? `${detailPath}?from=mypage`
              : detailPath;

            return (
              <Link className="trade-history-item" key={trade.id} to={detailTarget}>
                <article>
                  <div className="trade-history-item__image">상품 이미지</div>
                  <div className="trade-history-item__body">
                    <h2>{trade.productName}</h2>
                    <p>{trade.counterpart} · {trade.amount} · {trade.date}</p>
                    <span className="trade-history-item__type">
                      {trade.type === 'SELLER' ? '판매' : '구매'} · 거래번호 {trade.id}
                    </span>
                  </div>
                  <div className="trade-history-item__action">
                    <span className={`trade-history-status ${status.className}`}>
                      {status.label}
                    </span>
                    <span className="trade-history-item__arrow" aria-hidden="true">
                      →
                    </span>
                  </div>
                </article>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
};

export default TradeHistory;
