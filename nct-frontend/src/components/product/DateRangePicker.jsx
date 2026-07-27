// src/components/product/DateRangePicker.jsx
// 날짜 범위 선택 달력 (호텔스컴바인 스타일 inline)
// Props: startDate, endDate, onChange({start,end})
//        maxNavDate: 달력 이동 가능한 최대 날짜 (YYYY-MM-DD) — 탐색 범위 제한
//        maxDurationDays: 시작일 기준 종료일 선택 가능 최대 일수 (예: 14 = 2주)
//        fixedStart: true이면 시작일을 오늘로 고정하고 종료일만 선택
//        showTime: 달력 하단 시간 선택 UI 표시 (예약 모드에서만 true)
//        startTimeValue, endTimeValue: HH:mm
//        onStartTimeChange, onEndTimeChange: (HH:mm) => void
import { useState } from 'react';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const MINS = [0, 10, 20, 30, 40, 50];

function toStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toStr(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseTime(val, defaultHour = 9) {
  const h24 = val ? Number(val.split(':')[0]) : defaultHour;
  const m   = val ? Number(val.split(':')[1]) : 0;
  return { isPm: h24 >= 12, hour12: h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24, min: m };
}

function toH24str(ampm, h12, m) {
  const pad = n => String(n).padStart(2, '0');
  const h24 = ampm === 'am' ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12);
  return `${pad(h24)}:${pad(m)}`;
}

function TimeRow({ value, onChange: onChangeProp }) {
  const pad = n => String(n).padStart(2, '0');
  const { isPm, hour12, min } = parseTime(value);
  const emit = (ampm, h, m) => onChangeProp && onChangeProp(toH24str(ampm, h, m));
  const ampm = isPm ? 'pm' : 'am';
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <select className="input" value={ampm} onChange={e => emit(e.target.value, hour12, min)} style={{ padding: '5px 8px', fontSize: 15 }}>
        <option value="am">오전</option>
        <option value="pm">오후</option>
      </select>
      <select className="input" value={hour12} onChange={e => emit(ampm, Number(e.target.value), min)} style={{ padding: '5px 8px', fontSize: 15 }}>
        {Array.from({ length: 12 }, (_, i) => <option key={i+1} value={i+1}>{i+1}시</option>)}
      </select>
      <select className="input" value={min} onChange={e => emit(ampm, hour12, Number(e.target.value))} style={{ padding: '5px 8px', fontSize: 15 }}>
        {MINS.map(m => <option key={m} value={m}>{pad(m)}분</option>)}
      </select>
    </div>
  );
}

export default function DateRangePicker({
  startDate, endDate, onChange, maxNavDate, maxDurationDays, fixedStart,
  showTime, startTimeValue, endTimeValue, onStartTimeChange, onEndTimeChange,
}) {
  const now = new Date();
  const todayStr = toStr(now.getFullYear(), now.getMonth(), now.getDate());

  const [leftYear, setLeftYear] = useState(now.getFullYear());
  const [leftMonth, setLeftMonth] = useState(now.getMonth());
  const [hovering, setHovering] = useState(null);
  const [phase, setPhase] = useState(fixedStart ? 'end' : 'start');

  // 시작/종료 모두 선택된 상태(즉시시작은 종료일만 선택되어도 해당) — 날짜 셀 비활성화
  const locked = fixedStart ? !!endDate : (!!startDate && !!endDate);

  // 시작일 기준(고정 시작이면 오늘) 선택 가능한 최대 종료일
  const durationLimit = maxDurationDays
    ? (fixedStart ? addDays(todayStr, maxDurationDays) : (startDate ? addDays(startDate, maxDurationDays) : null))
    : null;

  // 시작일이 달력 마지막 표시일 근처/그 날짜여서 durationLimit이 원래 탐색 상한을 넘어서면
  // 그 시작일 기준 2주 후까지 볼 수 있도록 탐색·선택 상한을 동적으로 확장
  const effectiveMaxNavDate = durationLimit && (!maxNavDate || durationLimit > maxNavDate)
    ? durationLimit
    : maxNavDate;

  let rightMonth = leftMonth + 1;
  let rightYear = leftYear;
  if (rightMonth > 11) { rightMonth = 0; rightYear++; }

  const canGoPrev = !(leftYear === now.getFullYear() && leftMonth === now.getMonth());
  const maxDt = effectiveMaxNavDate ? new Date(effectiveMaxNavDate + 'T00:00:00') : null;
  const canGoNext = maxDt
    ? !(rightYear > maxDt.getFullYear() || (rightYear === maxDt.getFullYear() && rightMonth >= maxDt.getMonth()))
    : true;

  function changeMonth(dir) {
    if (dir === -1 && !canGoPrev) return;
    if (dir === 1 && !canGoNext) return;
    let m = leftMonth + dir;
    let y = leftYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setLeftMonth(m);
    setLeftYear(y);
  }

  function handleClick(dateStr) {
    if (dateStr < todayStr) return;
    if (effectiveMaxNavDate && dateStr > effectiveMaxNavDate) return;
    if (locked) return; // 범위 선택 완료 → 클릭 차단
    if (fixedStart) {
      if (durationLimit && dateStr > durationLimit) return;
      onChange({ start: todayStr, end: dateStr });
      return;
    }
    if (phase === 'start') {
      onChange({ start: dateStr, end: null });
      setPhase('end');
    } else {
      const end = dateStr <= startDate ? startDate : dateStr;
      const start = dateStr <= startDate ? dateStr : startDate;
      if (durationLimit && end > durationLimit) return;
      onChange({ start, end });
      setPhase('start');
    }
  }

  function handleReset() {
    if (fixedStart) {
      onChange({ start: todayStr, end: null });
      return;
    }
    onChange({ start: null, end: null });
    setPhase('start');
  }

  function getEffectiveEnd() {
    return endDate || hovering || null;
  }

  function getCellStyle(dateStr, dow) {
    const effectiveEnd = getEffectiveEnd();
    const isStart = dateStr === startDate;
    const isEnd = dateStr === endDate;
    const isHover = !endDate && dateStr === hovering;
    const inRange = startDate && effectiveEnd &&
      dateStr > (startDate <= effectiveEnd ? startDate : effectiveEnd) &&
      dateStr < (startDate <= effectiveEnd ? effectiveEnd : startDate);

    let bg = 'transparent';
    if (isStart && effectiveEnd) {
      bg = startDate <= effectiveEnd
        ? 'linear-gradient(to right, transparent 50%, #e5efff 50%)'
        : 'linear-gradient(to left, transparent 50%, #e5efff 50%)';
    } else if ((isEnd || isHover) && startDate) {
      bg = startDate <= effectiveEnd
        ? 'linear-gradient(to left, transparent 50%, #e5efff 50%)'
        : 'linear-gradient(to right, transparent 50%, #e5efff 50%)';
    } else if (inRange) {
      bg = '#e5efff';
    }

    let spanBg = 'transparent';
    let color = dateStr < todayStr ? '#d1d5db'
      : dateStr === todayStr ? '#0064ff'
      : dow === 0 ? '#ef4444'
      : dow === 6 ? '#6366f1'
      : '#111827';
    let fw = dateStr === todayStr ? 700 : 400;

    if (isStart || isEnd || isHover) {
      spanBg = '#0064ff';
      color = '#fff';
      fw = 700;
    } else if (inRange) {
      color = '#0048bf';
    }

    return { bg, spanBg, color, fw };
  }

  function renderMonth(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const totalCells = firstDay + daysInMonth;
    const trailing = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
          {WEEKDAYS.map((wd, i) => (
            <div key={wd} style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, padding: '3px 0', color: i === 0 ? '#ef4444' : i === 6 ? '#6366f1' : '#9ca3af' }}>{wd}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`p${i}`} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#d1d5db' }}>
              {daysInPrev - firstDay + 1 + i}
            </div>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const dateStr = toStr(year, month, d);
            // 시작일 선택 완료 후(phase 'end')에는 시작일 이전 날짜도 비활성화
            const isPast = dateStr < todayStr || (!fixedStart && !locked && phase === 'end' && startDate && dateStr < startDate);
            // 달력 탐색 절대 상한(예: 오늘+2개월, 시작일 근처면 시작일+2주까지 확장) 이후 날짜는 항상 비활성화
            const isOverNav = effectiveMaxNavDate && dateStr > effectiveMaxNavDate;
            // 시작일이 정해진 뒤(또는 고정 시작)에는 시작일+N일까지만 종료일 선택 가능
            const isOverDuration = durationLimit && dateStr > durationLimit;
            // locked(시작·종료 모두 선택): 선택 범위 밖 날짜 비활성화
            const outOfRange = locked && !(dateStr >= startDate && dateStr <= endDate);
            const disabled = isPast || isOverNav || isOverDuration || outOfRange;
            const dow = new Date(year, month, d).getDay();
            const isToday = dateStr === todayStr;
            const { bg, spanBg, color, fw } = getCellStyle(dateStr, dow);

            return (
              <div
                key={d}
                onClick={() => !disabled && handleClick(dateStr)}
                onMouseEnter={() => !locked && phase === 'end' && !disabled && setHovering(dateStr)}
                onMouseLeave={() => setHovering(null)}
                style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1, position: 'relative' }}
              >
                <span style={{ width: '80%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: spanBg, color, fontWeight: fw, fontSize: 14 }}>
                  {d}
                </span>
                {isToday && spanBg === 'transparent' && (
                  <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#0064ff' }} />
                )}
              </div>
            );
          })}
          {Array.from({ length: trailing }, (_, i) => (
            <div key={`n${i}`} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#d1d5db' }}>{i + 1}</div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 8px', borderBottom: '1px solid #e5e7eb' }}>
        <button type="button" onClick={() => changeMonth(-1)} disabled={!canGoPrev} style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: canGoPrev ? 'pointer' : 'default', color: canGoPrev ? '#6b7280' : '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ display: 'flex', gap: 32, fontWeight: 700, fontSize: 16 }}>
          <span>{leftYear}년 {MONTHS[leftMonth]}</span>
          <span>{rightYear}년 {MONTHS[rightMonth]}</span>
        </div>
        <button type="button" onClick={() => changeMonth(1)} disabled={!canGoNext} style={{ width: 28, height: 28, background: 'none', border: 'none', cursor: canGoNext ? 'pointer' : 'default', color: canGoNext ? '#6b7280' : '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* 2개월 달력 */}
      <div style={{ display: 'flex', padding: '12px 16px 16px', gap: 16 }}>
        {renderMonth(leftYear, leftMonth)}
        <div style={{ width: 1, background: '#e5e7eb', flexShrink: 0 }} />
        {renderMonth(rightYear, rightMonth)}
      </div>

      {/* 선택 상태 + 다시 선택 버튼 */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '8px 16px', fontSize: 15, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>
          {fixedStart
            ? (!endDate && <span>종료일을 선택하세요</span>)
            : startDate && endDate
              ? <><strong style={{ color: '#0064ff' }}>{startDate}</strong> ~ <strong style={{ color: '#0064ff' }}>{endDate}</strong></>
              : startDate
                ? <><strong style={{ color: '#0064ff' }}>{startDate}</strong> ~ <span>종료일을 선택하세요</span></>
                : <span>시작일을 선택하세요</span>
          }
        </span>
        {((fixedStart && !!endDate) || (!fixedStart && !!startDate)) && (
          <button type="button" onClick={handleReset} style={{ fontSize: 14, color: '#6b7280', background: 'none', border: '1px solid #d1d5db', borderRadius: 5, padding: '3px 8px', cursor: 'pointer' }}>
            다시 선택
          </button>
        )}
      </div>

      {/* 시간 선택 — 예약 모드에서만 보이지만, 즉시시작에서도 같은 공간을 차지하도록 visibility로 숨김 */}
      <div style={{ borderTop: '1px solid #e5e7eb', padding: '10px 16px 14px', visibility: showTime ? 'visible' : 'hidden' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>시작 시간</span>
        <TimeRow value={startTimeValue} onChange={onStartTimeChange} />
        <span style={{ fontSize: 14, color: '#9ca3af', display: 'block', marginTop: 8 }}>종료 시간은 시작 시간과 동일하게 적용됩니다</span>
      </div>
    </div>
  );
}
