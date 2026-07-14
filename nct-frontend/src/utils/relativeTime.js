// src/utils/relativeTime.js
// ISO 일시 문자열("2026-07-14T10:21:33")을 "방금 전 / N분 전 / N시간 전 / 어제 / N일 전 / yyyy-MM-dd"
// 상대 표기로 변환한다. 서버는 절대 시각만 내려주고, 상대 표기는 화면(현재 시각 기준) 책임.
export default function relativeTime(isoString) {
  if (!isoString) return '';

  const then = new Date(isoString);
  if (Number.isNaN(then.getTime())) return '';

  const diffMs = Date.now() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return '어제';
  if (diffDay < 7) return `${diffDay}일 전`;

  // 일주일 이상 지난 알림은 절대 날짜가 더 읽기 쉽다
  const y = then.getFullYear();
  const m = String(then.getMonth() + 1).padStart(2, '0');
  const d = String(then.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
