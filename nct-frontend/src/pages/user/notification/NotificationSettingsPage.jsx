// src/pages/user/notification/NotificationSettingsPage.jsx
// Claude Code 작성 (BJN, 2026-07-16)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

import { useNotificationSettings, useSaveNotificationSettings } from '../../../hooks/useNotification';

// 도메인 3종 × 채널 2종 — USER_NOTIFICATION_SETTING의 고정 컬럼 구조 그대로 (정본 DDL v4 기준)
// 목업(34_notification_settings.html)은 이벤트 단위까지 세분화돼 있지만 DB는 도메인 단위라
// 정본 DDL을 따른다. 목업의 '운영' 도메인도 DDL에 컬럼이 없어 제외 (정본 불일치 보고됨)
const DOMAIN_ROWS = [
  { key: 'auc', label: '경매', desc: '입찰가 갱신, 마감 임박, 낙찰/유찰 결과' },
  { key: 'trd', label: '거래', desc: '배송 시작, 거래 확정 요청, 거래 완료' },
  { key: 'svc', label: '서비스', desc: '새 견적 도착, 견적 선택, 서비스 완료' },
];

// 서버 응답이 오기 전 화면이 깨지지 않도록 쓰는 기본값 (서버 기본값과 동일하게 전부 수신)
const DEFAULT_SETTINGS = {
  aucInapp: true, aucEmail: true,
  trdInapp: true, trdEmail: true,
  svcInapp: true, svcEmail: true,
};

/**
 * 알림 설정 (목업 34_notification_settings.html, F-COM-012)
 * - GET/PUT /api/notification/settings 연동 (useNotification 훅)
 * - 저장 버튼을 눌러야 서버에 반영되는 명시적 저장 방식 — 체크할 때마다 저장하면
 *   연타 시 요청이 몰리고, 실수로 끈 걸 알아채기 어렵기 때문
 * - 이메일 채널은 발송 기능 자체가 미구현(F-COM-006 미결정)이라 설정만 저장된다는 안내 표시
 */
const NotificationSettingsPage = () => {
  const { data: serverSettings, isLoading } = useNotificationSettings();
  const saveMutation = useSaveNotificationSettings();

  // 편집 중 상태 (수정 2026-07-17, 담당자6 백종남 — F-COM-012 알림 수신 설정)
  // [무엇을 하는 부분] 화면 체크박스에 보여줄 값을 정한다.
  // [왜 바꿨나] 원래는 "서버 값이 도착하면 useEffect 안에서 setSettings로 복사"하는 방식이었는데,
  //   화면을 그린 직후 상태를 또 바꾸면 같은 화면을 연달아 두 번 그리게 되어
  //   React 19의 ESLint 규칙(react-hooks/set-state-in-effect)이 금지한다.
  // [어떻게 바꿨나] 서버 값을 상태로 복사하지 않고, "사용자가 직접 만진 값"만 상태(edits)로 둔다.
  //   화면에 보여줄 값 = 사용자가 만진 값이 있으면 그 값 → 없으면 서버 값 → 그것도 없으면 기본값.
  //   이러면 useEffect 없이도 기존 동작(서버 값으로 시작, 이후 편집값 유지)이 그대로 유지된다.
  const [edits, setEdits] = useState(null); // 사용자가 화면에서 바꾼 값 (아직 안 만졌으면 null)
  const settings = edits ?? serverSettings ?? DEFAULT_SETTINGS;

  const toggle = (field) => setEdits({ ...settings, [field]: !settings[field] });

  /** 열 전체 토글 — 목업의 "인앱/이메일 전체 선택" 체크박스와 동일한 동작 */
  const toggleColumn = (channel, checked) =>
    setEdits({
      ...settings,
      aucInapp: channel === 'Inapp' ? checked : settings.aucInapp,
      trdInapp: channel === 'Inapp' ? checked : settings.trdInapp,
      svcInapp: channel === 'Inapp' ? checked : settings.svcInapp,
      aucEmail: channel === 'Email' ? checked : settings.aucEmail,
      trdEmail: channel === 'Email' ? checked : settings.trdEmail,
      svcEmail: channel === 'Email' ? checked : settings.svcEmail,
    });

  const allChecked = (channel) => DOMAIN_ROWS.every((row) => settings[`${row.key}${channel}`]);

  const handleSave = () => {
    saveMutation.mutate(settings, {
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
    });
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 py-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 m-0">알림 설정</h1>
          <p className="text-sm text-gray-500 mt-1 mb-0">
            도메인별로 인앱·이메일 알림 수신 여부를 설정합니다.
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
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-10">설정을 불러오는 중...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500">
                <th className="text-left font-bold px-5 py-3">알림 유형</th>
                <th className="text-center font-bold px-5 py-3 w-28">
                  <div className="flex flex-col items-center gap-1.5">
                    <span>인앱</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                      title="인앱 전체 선택"
                      checked={allChecked('Inapp')}
                      onChange={(e) => toggleColumn('Inapp', e.target.checked)}
                    />
                  </div>
                </th>
                <th className="text-center font-bold px-5 py-3 w-28">
                  <div className="flex flex-col items-center gap-1.5">
                    <span>이메일</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                      title="이메일 전체 선택"
                      checked={allChecked('Email')}
                      onChange={(e) => toggleColumn('Email', e.target.checked)}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DOMAIN_ROWS.map((row) => (
                <tr key={row.key} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 m-0">{row.label}</p>
                    <p className="text-xs text-gray-400 m-0 mt-0.5">{row.desc}</p>
                  </td>
                  <td className="text-center px-5 py-4">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                      checked={settings[`${row.key}Inapp`]}
                      onChange={() => toggle(`${row.key}Inapp`)}
                    />
                  </td>
                  <td className="text-center px-5 py-4">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-blue-600 cursor-pointer"
                      checked={settings[`${row.key}Email`]}
                      onChange={() => toggle(`${row.key}Email`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 mb-6">
        이메일 알림은 발송 기능 준비 중이라 설정만 먼저 저장됩니다.
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
