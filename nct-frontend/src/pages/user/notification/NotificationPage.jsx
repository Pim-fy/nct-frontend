// src/pages/user/notification/NotificationPage.jsx
import { useState } from 'react';

import NotificationItem from './components/NotificationItem';

// 도메인 그룹 (목업 20_notification.html 기준, DB 알림도메인 NTFG03 매핑 예정)
const DOMAINS = ['경매·입찰', '거래·배송', '채팅', '서비스', '운영·환전'];
const FILTERS = ['전체', '경매', '거래', '채팅', '서비스', '운영'];
const FILTER_TO_DOMAIN = {
  경매: '경매·입찰',
  거래: '거래·배송',
  채팅: '채팅',
  서비스: '서비스',
  운영: '운영·환전',
};

// 임시 더미 데이터 - 실제 API 연동 시 교체 (GET /api/notification)
const DUMMY_NOTIFICATIONS = [
  { id: 1,  domain: '경매·입찰', type: '입찰',   title: '다이슨 V11에서 내 입찰이 최고 입찰로 업데이트 되었습니다', time: '방금 전',  ref: '관련 링크', read: false },
  { id: 2,  domain: '경매·입찰', type: '경매',   title: '관심 상품 마감 10분 전입니다 - 아이패드 프로 12.9인치',   time: '15분 전',  ref: '관련 링크', read: false },
  { id: 3,  domain: '경매·입찰', type: '입찰',   title: '상위 입찰 발생으로 홀딩 포인트가 반환되었습니다',          time: '3일 전',   ref: '관련 링크', read: true },
  { id: 4,  domain: '거래·배송', type: '거래',   title: '판매자가 송장을 입력했습니다. CJ대한통운 / 123456789',    time: '2시간 전', ref: '관련 링크', read: true },
  { id: 5,  domain: '거래·배송', type: '리뷰',   title: '거래 완료 후 리뷰를 작성할 수 있습니다',                   time: '3일 전',   ref: '관련 링크', read: true },
  { id: 6,  domain: '채팅',      type: '채팅',   title: '이**님이 새 메시지를 보냈습니다',                         time: '2일 전',   ref: '채팅 바로가기', read: true },
  { id: 7,  domain: '서비스',    type: '서비스', title: '새로운 견적이 도착했습니다 - 이사/운반',                   time: '3시간 전', ref: '관련 링크', read: false },
  { id: 8,  domain: '서비스',    type: '서비스', title: '견적이 만료 예정입니다',                                   time: '4일 전',   ref: '관련 링크', read: true },
  { id: 9,  domain: '운영·환전', type: '운영',   title: '제공자 신청이 승인되었습니다 - 청소 카테고리',             time: '어제',     ref: '관련 링크', read: true },
  { id: 10, domain: '운영·환전', type: '환전',   title: '환전 가능 포인트 85,000P가 생성되었습니다',                time: '어제',     ref: '관련 링크', read: true },
  { id: 11, domain: '운영·환전', type: '운영',   title: '거래 문제 접수가 완료되었습니다',                          time: '2일 전',   ref: '관련 링크', read: true },
];

/**
 * 알림함 (목업 20_notification.html, F-UX-064/065)
 */
const NotificationPage = () => {
  const [items, setItems] = useState(DUMMY_NOTIFICATIONS);
  const [filter, setFilter] = useState('전체');

  const unreadCount = items.filter((n) => !n.read).length;

  // TODO: 실제 API 연동 시 PATCH /api/notification/{id}/read 호출로 교체
  const markRead = (id) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

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
        <button
          type="button"
          onClick={markAllRead}
          className="border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          전체 읽음
        </button>
      </div>

      {/* 도메인별 그룹 카드 */}
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
    </div>
  );
};

export default NotificationPage;
