// Claude Code 작성 (BJN, 2026-07-19)
// 관리자 알림 화면 (담당자6 BJN, F-COM-004/005 — 목업 03_관리자/20_notification.html 기준)
// - 회원·제공자 / 신고·거래문제 / 경매·서비스 / 환전·시스템, 4개 탭으로 운영 알림을 모아 보여준다
// - 카드 데이터는 각 도메인 테이블을 서버가 읽기 전용으로 집계한 실제 값이다 (더미 아님)
// - linkPath가 있는 카드만 클릭 가능 — 담당자6가 만든 화면(감사로그)만 실제 이동 대상이 있고,
//   회원·제공자·신고·경매·서비스 관리 화면은 아직 없어서 정보만 보여주고 이동은 막는다
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import CardGroupSkeleton from '@components/skeleton/CardGroupSkeleton';
import { useAdminNotificationSummary } from '@hooks/useAdminNotification';
import './adminNotificationPage.css';

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'userProvider', label: '회원·제공자' },
  { key: 'report', label: '신고·거래문제' },
  { key: 'auctionService', label: '경매·서비스' },
  { key: 'exchangeSystem', label: '환전·시스템' },
];

const GROUP_TITLES = {
  userProvider: '회원·제공자',
  report: '신고·거래문제',
  auctionService: '경매·서비스',
  exchangeSystem: '환전·시스템',
};

const NotificationCard = ({ item }) => {
  const navigate = useNavigate();
  const clickable = Boolean(item.linkPath);
  return (
    <div
      className={`admin-noti-card${clickable ? ' is-clickable' : ''}`}
      onClick={clickable ? () => navigate(item.linkPath) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      <strong>{item.title}</strong>
      <p>{item.detail}</p>
    </div>
  );
};

const AdminNotificationPage = () => {
  const [tab, setTab] = useState('all');
  const { data, isLoading, isError } = useAdminNotificationSummary();

  const groups = data
    ? [
        { key: 'userProvider', items: data.userProvider },
        { key: 'report', items: data.report },
        { key: 'auctionService', items: data.auctionService },
        { key: 'exchangeSystem', items: data.exchangeSystem },
      ]
    : [];

  const visibleGroups = tab === 'all' ? groups : groups.filter((g) => g.key === tab);
  const totalCount = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div className="admin-bjn-page">
      <MockupAdminPageHeader
        eyebrow="운영"
        title="알림"
        description={data ? `확인이 필요한 운영 알림 ${totalCount}건` : '운영 알림을 불러오는 중입니다'}
      />

      <div className="admin-noti-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`admin-noti-tab${tab === t.key ? ' is-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <CardGroupSkeleton />}
      {isError && <div className="admin-bjn-state is-error">알림 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.</div>}

      {!isLoading && !isError && (
        <div className="admin-noti-grid">
          {visibleGroups.map((group) => (
            <div className="admin-noti-group" key={group.key}>
              <h3>{GROUP_TITLES[group.key]}</h3>
              {group.items.length === 0 ? (
                <p className="admin-noti-empty">확인할 알림이 없습니다.</p>
              ) : (
                <div className="admin-noti-list">
                  {group.items.map((item) => (
                    <NotificationCard item={item} key={item.title} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationPage;
