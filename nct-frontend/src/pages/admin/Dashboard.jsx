import { createElement } from 'react';
import { Link } from 'react-router-dom';
import {
  BriefcaseBusiness,
  ClipboardCheck,
  Gavel,
  Handshake,
  Megaphone,
  RefreshCw,
  Scale,
  ShieldAlert,
  Users,
  WalletCards,
} from 'lucide-react';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import PageMeta from '@components/admin/PageMeta';
import { useAdminDashboardSummary } from '@hooks/useAdminDashboard';
import './Dashboard.css';

const SUMMARY_ITEMS = [
  {
    key: 'activeUserCount',
    label: '활성 사용자',
    description: '현재 이용 가능한 회원',
    icon: Users,
    tone: 'blue',
    unit: '명',
  },
  {
    key: 'totalTradeCount',
    label: '전체 거래',
    description: '생성된 거래 누적 건수',
    icon: Handshake,
    tone: 'indigo',
  },
  {
    key: 'activeDisputeCount',
    label: '진행 중 거래 문제',
    description: '접수 또는 처리 중',
    icon: Scale,
    tone: 'orange',
  },
  {
    key: 'incompleteSettlementCount',
    label: '미완료 정산',
    description: '대기 또는 보류 상태',
    icon: WalletCards,
    tone: 'purple',
  },
  {
    key: 'unprocessedRiskEventCount',
    label: '미처리 위험 이벤트',
    description: '운영 확인이 필요한 이벤트',
    icon: ShieldAlert,
    tone: 'red',
  },
];

const SHORTCUTS = [
  { label: '제공자 심사', to: '/admin/provider-applications', icon: ClipboardCheck },
  { label: '경매 관리', to: '/admin/auctions', icon: Gavel },
  { label: '서비스 요청 관리', to: '/admin/services', icon: BriefcaseBusiness },
  { label: '공지 관리', to: '/admin/notices', icon: Megaphone },
];

const formatCount = (value) =>
  value == null ? '-' : Number(value).toLocaleString('ko-KR');

/**
 * 담당자 7 · F-OPS-010: 실제 운영 집계와 관리자 메뉴를 보여 주는 대시보드입니다.
 */
const Dashboard = () => {
  const summaryQuery = useAdminDashboardSummary();
  const summary = summaryQuery.data ?? {};

  return (
    <div className="admin-dashboard">
      <PageMeta title="관리자 대시보드" />
      <MockupAdminPageHeader
        action={(
          <button
            className="admin-dashboard__refresh"
            disabled={summaryQuery.isFetching}
            onClick={() => summaryQuery.refetch()}
            type="button"
          >
            <RefreshCw aria-hidden="true" />
            새로고침
          </button>
        )}
        title="관리자 대시보드"
      />

      {summaryQuery.isError ? (
        <section className="admin-dashboard__error" role="alert">
          <div>
            <strong>운영 현황을 불러오지 못했습니다.</strong>
            <span>잠시 후 다시 시도해 주세요.</span>
          </div>
          <button onClick={() => summaryQuery.refetch()} type="button">다시 시도</button>
        </section>
      ) : (
        <section className="admin-dashboard__summary" aria-label="주요 운영 현황">
          {SUMMARY_ITEMS.map(({ key, label, description, icon: Icon, tone, unit = '건' }) => (
            <article className={`admin-summary-card admin-summary-card--${tone}`} key={key}>
              <span className="admin-summary-card__icon">
                {createElement(Icon, { 'aria-hidden': true })}
              </span>
              <div>
                <span>{label}</span>
                {summaryQuery.isLoading ? (
                  <span className="admin-summary-card__skeleton" aria-label={`${label} 불러오는 중`} />
                ) : (
                  <strong>
                    {formatCount(summary[key])}
                    {summary[key] != null && <small>{unit}</small>}
                  </strong>
                )}
                <p>{description}</p>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="admin-dashboard__content">
        {!summaryQuery.isError && (
          <article className="admin-dashboard-panel">
            <div className="admin-dashboard-panel__heading">
              <div>
                <h2>조치 필요 현황</h2>
                <p>현재 확인이 필요한 운영 항목입니다.</p>
              </div>
            </div>

            <div className="admin-dashboard-actions">
              <div className="admin-dashboard-action">
                <span className="admin-dashboard-action__icon admin-dashboard-action__icon--orange">
                  <Scale aria-hidden="true" />
                </span>
                <div>
                  <strong>진행 중 거래 문제</strong>
                  <span>
                    {summaryQuery.isLoading
                      ? '불러오는 중'
                      : summary.activeDisputeCount == null
                        ? '-'
                        : `접수·처리 중 ${formatCount(summary.activeDisputeCount)}건`}
                  </span>
                </div>
              </div>
              <div className="admin-dashboard-action">
                <span className="admin-dashboard-action__icon admin-dashboard-action__icon--purple">
                  <WalletCards aria-hidden="true" />
                </span>
                <div>
                  <strong>미완료 정산</strong>
                  <span>
                    {summaryQuery.isLoading
                      ? '불러오는 중'
                      : summary.incompleteSettlementCount == null
                        ? '-'
                        : `대기·보류 ${formatCount(summary.incompleteSettlementCount)}건`}
                  </span>
                </div>
              </div>
              <div className="admin-dashboard-action">
                <span className="admin-dashboard-action__icon admin-dashboard-action__icon--red">
                  <ShieldAlert aria-hidden="true" />
                </span>
                <div>
                  <strong>미처리 위험 이벤트</strong>
                  <span>
                    {summaryQuery.isLoading
                      ? '불러오는 중'
                      : `${formatCount(summary.unprocessedRiskEventCount)}건`}
                  </span>
                </div>
                <Link to="/admin/operations-preview">확인</Link>
              </div>
            </div>
          </article>
        )}

        <article className="admin-dashboard-panel">
          <div className="admin-dashboard-panel__heading">
            <div>
              <h2>운영 바로가기</h2>
              <p>자주 사용하는 관리 화면으로 이동합니다.</p>
            </div>
          </div>

          <div className="admin-dashboard-shortcuts">
            {SHORTCUTS.map(({ label, to, icon: Icon }) => (
              <Link key={to} to={to}>
                {createElement(Icon, { 'aria-hidden': true })}
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
};

export default Dashboard;
