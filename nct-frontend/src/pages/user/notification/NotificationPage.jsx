// src/pages/user/notification/NotificationPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';

import NotificationItem from './components/NotificationItem';
import { useMarkAllRead, useMarkRead, useNotifications } from '../../../hooks/useNotification';
import relativeTime from '../../../utils/relativeTime';

// 도메인 그룹 (목업 20_notification.html 기준)
// TODO(팀 결정): DB 알림도메인(NTFG03)에는 '채팅' 코드가 없어 채팅 카드는 항상 비어 있음
//               — NTFG03에 채팅 도메인을 추가할지, 채팅 탭을 제거할지 팀 협의 필요
const DOMAINS = ['경매·입찰', '거래·배송', '채팅', '서비스', '운영·환전'];
const FILTERS = ['전체', '경매', '거래', '채팅', '서비스', '운영'];
const FILTER_TO_DOMAIN = {
  경매: '경매·입찰',
  거래: '거래·배송',
  채팅: '채팅',
  서비스: '서비스',
  운영: '운영·환전',
};

// DB 도메인 코드(NTFG03) → 화면 그룹 라벨 매핑
// 코드값 기준으로 매핑해서 DB의 한글명(CMM_NM) 표기가 바뀌어도 그룹핑이 깨지지 않게 한다
const DOMAIN_CODE_TO_LABEL = {
  NTFC0010: '경매·입찰',
  NTFC0011: '거래·배송',
  NTFC0012: '서비스',
  NTFC0013: '운영·환전',
};

/** 서버 응답 알림 → 화면 표시용 형태로 변환 */
const toViewItem = (n) => ({
  id: n.id,
  domain: DOMAIN_CODE_TO_LABEL[n.domainCd] ?? n.domain, // 미지정 코드는 서버 한글명 그대로
  type: n.type,                                          // 유형 한글명 (배지 표시)
  title: n.title,
  time: relativeTime(n.regDt),                           // "방금 전 / N분 전" 상대 표기
  ref: n.refSn != null ? '관련 링크' : null,             // 참조 대상 페이지 라우팅은 해당 화면 구현 후
  read: n.read,
});

/**
 * 알림함 (목업 20_notification.html, F-UX-064/065)
 * - GET /api/notification + PATCH read/read-all 연동 (useNotification 훅)
 * - 읽음 처리는 서버 반영 후 목록 재조회(invalidate)로 갱신 — 새로고침해도 상태 유지
 */
const NotificationPage = () => {
  const [filter, setFilter] = useState('전체');

  const { data: notifications = [], isLoading } = useNotifications();
  const markReadMutation = useMarkRead();
  const markAllReadMutation = useMarkAllRead();

  const items = notifications.map(toViewItem);
  const unreadCount = items.filter((n) => !n.read).length;

  const markRead = (id) => markReadMutation.mutate(id);
  const markAllRead = () => markAllReadMutation.mutate();

  const visibleDomains =
    filter === '전체' ? DOMAINS : [FILTER_TO_DOMAIN[filter]];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">
      {/* 타이틀 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 m-0">알림</h1>
        <p className="text-gray-500 mt-1.5 mb-0">읽지 않은 알림 {unreadCount}개</p>
      </div>

      {/* 필터 탭 + 전체 읽음 */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3.5 py-2 text-sm border transition-colors
                ${filter === f
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={markAllRead}
            className="border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            전체 읽음
          </button>
          {/* 알림 수신 설정 화면(F-COM-012) 진입점 */}
          <Link
            to="/user/notification/settings"
            className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            알림 설정
          </Link>
        </div>
      </div>

      {/* 도메인별 그룹 카드 */}
      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-10">알림을 불러오는 중...</p>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          {visibleDomains.map((domain) => {
            const domainItems = items.filter((n) => n.domain === domain);
            return (
              <div
                key={domain}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)]"
              >
                <h3 className="text-base font-bold text-gray-900 mt-0 mb-3">{domain}</h3>
                <div className="grid gap-3">
                  {domainItems.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6 m-0">알림이 없습니다.</p>
                  )}
                  {domainItems.map((item) => (
                    <NotificationItem key={item.id} item={item} onRead={markRead} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default NotificationPage;
