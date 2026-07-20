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
  DELIVERING: { label: '배송중', className: 'trade-history-status--progress' },
  WAITING_CONFIRMATION: { label: '구매자 확인 대기', className: 'trade-history-status--pending' },
  COMPLETED: { label: '거래 완료', className: 'trade-history-status--complete' },
};

const statusPriority = {
  IN_PROGRESS: 0,
  DELIVERING: 1,
  WAITING_CONFIRMATION: 2,
  CONFIRM_PENDING: 2,
  COMPLETED: 3,
};

const tabs = [
  { value: 'ALL', label: '전체' },
  { value: 'BUYER', label: '구매 내역' },
  { value: 'SELLER', label: '판매 내역' },
];

// 판매자 진행 건은 거래 방식에 맞춰 지금 필요한 행동을 상태 문구로 보여준다.
const getStatusInfo = (trade) => {
  if (trade.status === 'IN_PROGRESS') {
    if (trade.method === 'OFFLINE') {
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

const TradeHistory = () => {
  const { pathname } = useLocation();
  const [tradeItems, setTradeItems] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // 별도 미리보기 경로에서는 로그인 보호 경로가 아닌 미리보기 상세로 이동한다.
  const isPreview = pathname.startsWith('/trades/preview');
  const tradeBasePath = isPreview ? '/trades/preview' : '/trades';

  // 탭별 건수와 진행 중 건수를 실제 목록 데이터에서 계산해 요약 영역에 사용한다.
  const tradeCounts = useMemo(() => {
    return tradeItems.reduce((counts, trade) => {
      counts.ALL += 1;

      if (trade.type === 'BUYER') {
        counts.BUYER += 1;
      }

      if (trade.type === 'SELLER') {
        counts.SELLER += 1;
      }

      if (trade.status !== 'COMPLETED') {
        counts.ACTIVE += 1;
      }

      return counts;
    }, {
      ALL: 0,
      BUYER: 0,
      SELLER: 0,
      ACTIVE: 0,
    });
  }, [tradeItems]);

  // 거래 목록 API 응답을 화면 표시 데이터로 변환해 보관한다.
  const loadTrades = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await getTradeHistory();
      const items = getTradeListItems(response).map(toTradeHistoryItem);

      setTradeItems(items);
    } catch {
      setLoadError('거래 내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 진입 직후 요청을 예약해 렌더링 완료 후 서버 통신과 상태 변경을 시작한다.
  useEffect(() => {
    const requestTimer = window.setTimeout(loadTrades, 0);

    return () => window.clearTimeout(requestTimer);
  }, [loadTrades]);

  // 탭·검색어·상태 필터가 모두 반영된 거래 목록만 화면에 표시한다.
  const filteredTrades = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return tradeItems.filter((trade) => {
      if (activeTab !== 'ALL' && trade.type !== activeTab) {
        return false;
      }

      if (statusFilter !== 'ALL' && trade.status !== statusFilter) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      return (
        trade.productName.toLowerCase().includes(normalizedKeyword)
        || trade.counterpart.toLowerCase().includes(normalizedKeyword)
        || String(trade.id).includes(normalizedKeyword)
      );
    }).sort((firstTrade, secondTrade) => {
      const firstPriority = statusPriority[firstTrade.status] ?? 4;
      const secondPriority = statusPriority[secondTrade.status] ?? 4;

      return firstPriority - secondPriority;
    });
  }, [activeTab, keyword, statusFilter, tradeItems]);

  return (
    <div className="trade-history-page">
      <main className="container trade-history-page__content">
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
                onClick={loadTrades}
              >
                다시 시도
              </button>
            </div>
          )}

          {!isLoading && !loadError && filteredTrades.length === 0 && (
            <div className="trade-history-empty">
              <strong>조건에 맞는 거래가 없습니다.</strong>
              <p>검색어나 필터를 변경해 다시 확인해 주세요.</p>
            </div>
          )}

          {!isLoading && !loadError && filteredTrades.map((trade) => {
            const status = getStatusInfo(trade);
            const detailPath = trade.type === 'SELLER'
              ? `${tradeBasePath}/${trade.id}/seller`
              : `${tradeBasePath}/${trade.id}`;

            return (
              <Link className="trade-history-item" key={trade.id} to={detailPath}>
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
