// src/pages/user/notification/NotificationSettingsPage.jsx
// Claude Code 작성 (BJN, 2026-07-16, 이벤트 단위로 재작성 2026-07-24)
import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

import { useNotificationSettings, useSaveNotificationSettings } from '../../../hooks/useNotification';
import { Skeleton } from '@components/skeleton/BaseSkeleton';

// 도메인 표시 순서·라벨 — 목업(34_notification_settings.html) 그룹 구분 그대로
const DOMAIN_LABELS = [
  { key: 'AUCTION', label: '경매' },
  { key: 'TRADE', label: '거래' },
  { key: 'SERVICE', label: '서비스' },
  { key: 'OPS', label: '운영' },
];

/**
 * 알림 설정 (목업 34_notification_settings.html, F-COM-012 세분화)
 * - GET/PUT /api/notification/settings 연동 (useNotification 훅) — 이벤트 13개 단위
 * - 저장 버튼을 눌러야 서버에 반영되는 명시적 저장 방식 — 체크할 때마다 저장하면
 *   연타 시 요청이 몰리고, 실수로 끈 걸 알아채기 어렵기 때문
 * - 서버에서 아직 실제로 이 설정을 확인하고 발행하는 이벤트가 일부뿐이다(경매·서비스·운영
 *   일부는 다른 담당자 쪽 연동 대기, 2026-07-24 팀전달 3건). 저장은 전부 정상 동작하지만
 *   일부 항목은 아직 알림 발행 자체에 반영되지 않을 수 있다는 점을 안내 문구로 표시한다.
 */
const NotificationSettingsPage = () => {
  const { data, isLoading } = useNotificationSettings();
  const saveMutation = useSaveNotificationSettings();

  // 편집 중 상태 — 서버 값을 그대로 상태로 복사하지 않고 "사용자가 만진 값"만 별도로 둔다
  // (NotificationPage와 동일한 이유: React 19 set-state-in-effect 규칙 회피)
  const [edits, setEdits] = useState(null); // null이면 아직 안 만짐 → 서버 값 그대로 사용
  const serverEvents = data?.events ?? [];
  const events = edits ?? serverEvents;

  const toggle = (eventCode, channel) =>
    setEdits(events.map((e) => (e.eventCode === eventCode ? { ...e, [channel]: !e[channel] } : e)));

  /** 열 전체 토글 — 목업의 "인앱/이메일 전체 선택" 체크박스와 동일한 동작 */
  const toggleColumn = (channel, checked) =>
    setEdits(events.map((e) => ({ ...e, [channel]: checked })));

  const allChecked = (channel) => events.length > 0 && events.every((e) => e[channel]);

  const handleSave = () => {
    saveMutation.mutate(
      { events: events.map(({ eventCode, inapp, email }) => ({ eventCode, inapp, email })) },
      {
        onSuccess: () => {
          Swal.fire({
            icon: 'success',
            title: '저장 완료',
            text: '알림 설정이 저장되었습니다.',
            confirmButtonColor: '#0064ff',
          });
        },
        onError: (err) => {
          Swal.fire({
            icon: 'error',
            title: '저장 실패',
            text: err?.response?.data?.message ?? '잠시 후 다시 시도해 주세요.',
            confirmButtonColor: '#0064ff',
          });
        },
      },
    );
  };

  return (
    <div className="max-w-[860px] mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 m-0">알림 설정</h1>
          <p className="text-sm text-gray-500 mt-1 mb-0">
            이벤트별로 인앱·이메일 알림 수신 여부를 설정합니다.
          </p>
        </div>
        <Link
          to="/user/notification"
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-4 py-2"
        >
          알림함으로
        </Link>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-50 text-blue-800">
              <th className="text-left font-bold px-5 py-3">알림 유형</th>
              <th className="text-center font-bold px-5 py-3 w-24">
                <div className="flex flex-col items-center gap-1.5">
                  <span>인앱</span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                    title="인앱 전체 선택"
                    checked={allChecked('inapp')}
                    disabled={isLoading}
                    onChange={(e) => toggleColumn('inapp', e.target.checked)}
                  />
                </div>
              </th>
              <th className="text-center font-bold px-5 py-3 w-24">
                <div className="flex flex-col items-center gap-1.5">
                  <span>이메일</span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                    title="이메일 전체 선택"
                    checked={allChecked('email')}
                    disabled={isLoading}
                    onChange={(e) => toggleColumn('email', e.target.checked)}
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && Array.from({ length: 6 }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                <td className="px-5 py-3"><Skeleton height={14} /></td>
                <td className="px-5 py-3"><Skeleton height={14} /></td>
                <td className="px-5 py-3"><Skeleton height={14} /></td>
              </tr>
            ))}
            {!isLoading && DOMAIN_LABELS.map(({ key: domainKey, label: domainLabel }) => {
              const domainEvents = events.filter((e) => e.domain === domainKey);
              if (domainEvents.length === 0) return null;
              return (
                <Fragment key={domainKey}>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-5 pt-4 pb-1.5 text-xs font-medium text-gray-400">
                      {domainLabel}
                    </td>
                  </tr>
                  {domainEvents.map((e) => (
                    <tr key={e.eventCode} className="hover:bg-gray-50">
                      <td className="px-5 py-3 pl-8 text-gray-700">{e.label}</td>
                      <td className="text-center px-5 py-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                          checked={e.inapp}
                          onChange={() => toggle(e.eventCode, 'inapp')}
                        />
                      </td>
                      <td className="text-center px-5 py-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-blue-600 cursor-pointer"
                          checked={e.email}
                          onChange={() => toggle(e.eventCode, 'email')}
                        />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3 mb-6">
        일부 항목(경매·서비스·공지 등)은 다른 기능과 연동 준비 중이라, 저장은 정상 동작하지만
        실제 알림 발행에는 아직 반영되지 않을 수 있습니다.
      </p>

      <div className="flex justify-end">
        <button
          type="button"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-6 py-2.5 transition-colors disabled:opacity-50"
          disabled={isLoading || saveMutation.isPending}
          onClick={handleSave}
        >
          {saveMutation.isPending ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
