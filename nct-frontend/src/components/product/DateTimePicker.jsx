// src/components/product/DateTimePicker.jsx
// 커스텀 날짜·시간 선택기 — 달력 그리드 + 시/분/오전오후 드롭다운 + 확인 버튼
// Props: value(string "YYYY-MM-DDTHH:mm"), onChange(fn), placeholder(string), minValue(string), trigger(ReactElement)
import { cloneElement, useEffect, useRef, useState } from 'react';

const pad = n => String(n).padStart(2, '0');

function toLocalDt(year, month, date, h24, min) {
  return `${year}-${pad(month + 1)}-${pad(date)}T${pad(h24)}:${pad(min)}`;
}

function parseValue(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

export default function DateTimePicker({ value, onChange, placeholder = '날짜 선택', minValue, trigger, inline }) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const parsed = parseValue(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? now.getMonth());

  const [selYear, setSelYear] = useState(parsed?.getFullYear() ?? null);
  const [selMonth, setSelMonth] = useState(parsed?.getMonth() ?? null);
  const [selDate, setSelDate] = useState(parsed?.getDate() ?? null);
  const [selHour, setSelHour] = useState(parsed ? (parsed.getHours() % 12 || 12) : (now.getHours() % 12 || 12));
  const [selMin, setSelMin] = useState(parsed ? Math.floor(parsed.getMinutes() / 5) * 5 : 0);
  const [selAmPm, setSelAmPm] = useState(parsed ? (parsed.getHours() < 12 ? 'AM' : 'PM') : (now.getHours() < 12 ? 'AM' : 'PM'));

  const minDt = parseValue(minValue);
  const minDay = minDt ? new Date(minDt.getFullYear(), minDt.getMonth(), minDt.getDate()) : null;

  const [timeError, setTimeError] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });

  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // open 중 스크롤/리사이즈 시 드롭다운 위치 재계산
  useEffect(() => {
    if (!open) return;
    const updatePos = () => {
      if (!wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const w = 370;
      let left = trigger ? rect.right - w : rect.left;
      if (left + w > window.innerWidth - 8) left = rect.right - w;
      if (left < 8) left = 8;
      setDropPos({ top: rect.bottom + 6, left });
    };
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, trigger]);

  useEffect(() => {
    const d = parseValue(value);
    if (!d) return;
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setSelYear(d.getFullYear());
    setSelMonth(d.getMonth());
    setSelDate(d.getDate());
    setSelHour(d.getHours() % 12 || 12);
    setSelMin(Math.floor(d.getMinutes() / 5) * 5);
    setSelAmPm(d.getHours() < 12 ? 'AM' : 'PM');
  }, [value]);

  function handleConfirm() {
    if (!selDate) return;
    const h24 = selAmPm === 'AM'
      ? (selHour === 12 ? 0 : selHour)
      : (selHour === 12 ? 12 : selHour + 12);
    const result = toLocalDt(selYear, selMonth, selDate, h24, selMin);
    if (minDt && result <= minValue) {
      setTimeError(true);
      return;
    }
    setTimeError(false);
    onChange(result);
    if (!inline) setOpen(false);
  }

  function changeMonth(dir) {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
  const totalCells = firstDay + daysInMonth;
  const trailing = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  const displayText = (() => {
    const d = parseValue(value);
    if (!d) return placeholder;
    return d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  })();

  const previewText = selDate !== null
    ? `${selYear}.${pad(selMonth + 1)}.${pad(selDate)} ${selAmPm === 'AM' ? '오전' : '오후'} ${pad(selHour)}:${pad(selMin)}`
    : null;

  const cellStyle = (bg, color, fw) => ({
    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, borderRadius: '50%', background: bg, color, fontWeight: fw,
  });

  const timeItemStyle = (selected) => ({
    fontSize: 12, textAlign: 'center', padding: '4px 2px', margin: '1px 3px',
    borderRadius: 5, cursor: 'pointer',
    background: selected ? '#0064ff' : 'transparent',
    color: selected ? '#fff' : '#6b7280',
    fontWeight: selected ? 700 : 400,
  });

  const calendarPanel = (
    <div style={{
      ...(inline
        ? { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden' }
        : { position: 'fixed', zIndex: 1000, top: dropPos.top, left: dropPos.left, background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.14)', border: '1px solid #e5e7eb', width: 370, overflow: 'hidden' }),
    }}>
          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 8px', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{viewYear}년 {viewMonth + 1}월</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); }}
                style={{ fontSize: 11, color: '#0064ff', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                오늘
              </button>
              <div style={{ display: 'flex', gap: 2 }}>
                {[[-1, 'M15 18l-6-6 6-6'], [1, 'M9 18l6-6-6-6']].map(([dir, d]) => (
                  <button key={dir} type="button" onClick={() => changeMonth(dir)}
                    style={{ width: 28, height: 28, background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={d} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 달력 + 시간 */}
          <div style={{ display: 'flex' }}>
            {/* 날짜 그리드 */}
            <div style={{ flex: 1, padding: '8px 10px 10px', borderRight: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
                {['일','월','화','수','목','금','토'].map((wd, i) => (
                  <div key={wd} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, padding: '3px 0', color: i === 0 ? '#ef4444' : i === 6 ? '#6366f1' : '#9ca3af' }}>{wd}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
                {/* 이전 달 */}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`p${i}`} style={cellStyle('transparent', '#d1d5db', 400)}>
                    {daysInPrev - firstDay + 1 + i}
                  </div>
                ))}
                {/* 현재 달 */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = i + 1;
                  const dt = new Date(viewYear, viewMonth, d);
                  const isPast = dt < today || (minDay && dt < minDay);
                  const isSel = selYear === viewYear && selMonth === viewMonth && selDate === d;
                  const isToday = dt.getTime() === today.getTime();
                  const dow = dt.getDay();
                  const textColor = isSel ? '#fff'
                    : isPast ? '#d1d5db'
                    : isToday ? '#0064ff'
                    : dow === 0 ? '#ef4444'
                    : dow === 6 ? '#6366f1'
                    : '#111827';
                  return (
                    <div key={d}
                      onClick={() => !isPast && (setSelYear(viewYear), setSelMonth(viewMonth), setSelDate(d))}
                      style={{ ...cellStyle(isSel ? '#0064ff' : 'transparent', textColor, isSel || isToday ? 700 : 400), cursor: isPast ? 'not-allowed' : 'pointer', opacity: isPast ? 0.4 : 1, position: 'relative' }}>
                      {d}
                      {isToday && !isSel && (
                        <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#0064ff' }} />
                      )}
                    </div>
                  );
                })}
                {/* 다음 달 */}
                {Array.from({ length: trailing }, (_, i) => (
                  <div key={`n${i}`} style={cellStyle('transparent', '#d1d5db', 400)}>{i + 1}</div>
                ))}
              </div>
            </div>

            {/* 시간 선택 */}
            <div style={{ width: 104, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                {['시', '분'].map((l, i) => (
                  <div key={l} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#9ca3af', padding: '6px 0', borderRight: i === 0 ? '1px solid #e5e7eb' : 'none' }}>{l}</div>
                ))}
                <div style={{ width: 40, textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#9ca3af', padding: '5px 0', borderLeft: '1px solid #e5e7eb', lineHeight: 1.3 }}>AM<br/>PM</div>
              </div>
              <div style={{ display: 'flex', flex: 1 }}>
                {/* 시 */}
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: 200, padding: '4px 0', scrollbarWidth: 'none' }}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <div key={h} onClick={() => setSelHour(h)} style={timeItemStyle(h === selHour)}>{pad(h)}</div>
                  ))}
                </div>
                {/* 분 */}
                <div style={{ flex: 1, overflowY: 'auto', maxHeight: 200, padding: '4px 0', borderLeft: '1px solid #e5e7eb', scrollbarWidth: 'none' }}>
                  {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (
                    <div key={m} onClick={() => setSelMin(m)} style={timeItemStyle(m === selMin)}>{pad(m)}</div>
                  ))}
                </div>
                {/* 오전/오후 */}
                <div style={{ width: 40, display: 'flex', flexDirection: 'column', padding: '6px 3px', gap: 4, borderLeft: '1px solid #e5e7eb' }}>
                  {[['AM','오전'],['PM','오후']].map(([v, label]) => (
                    <div key={v} onClick={() => setSelAmPm(v)}
                      style={{ fontSize: 11, textAlign: 'center', padding: '5px 2px', borderRadius: 5, cursor: 'pointer',
                        background: v === selAmPm ? '#0064ff' : 'transparent',
                        color: v === selAmPm ? '#fff' : '#6b7280',
                        fontWeight: v === selAmPm ? 700 : 400 }}>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 선택 미리보기 */}
          <div style={{ padding: '7px 14px', borderTop: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280', minHeight: 32, display: 'flex', alignItems: 'center' }}>
            {timeError
              ? <span style={{ color: '#ef4444' }}>시작 시간 이후로 선택해 주세요.</span>
              : previewText
                ? <><strong style={{ color: '#0064ff', fontWeight: 600, fontSize: 13, marginRight: 4 }}>{previewText}</strong>으로 설정됩니다</>
                : '날짜와 시간을 선택하세요'}
          </div>

          {/* 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '8px 12px 12px' }}>
            {!inline && <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost">취소</button>}
            <button type="button" onClick={handleConfirm} className="btn btn-primary" disabled={!selDate}>확인</button>
          </div>
        </div>
  );

  if (inline) return calendarPanel;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {trigger
        ? cloneElement(trigger, { onClick: () => {
            if (wrapRef.current) {
              const rect = wrapRef.current.getBoundingClientRect();
              const w = 370;
              let left = rect.right - w;
              if (left < 8) left = 8;
              setDropPos({ top: rect.bottom + 6, left });
            }
            setOpen(v => !v);
          }})
        : (
          <button
            type="button"
            className="input"
            onClick={() => {
              if (wrapRef.current) {
                const rect = wrapRef.current.getBoundingClientRect();
                const w = 370;
                let left = rect.left;
                if (left + w > window.innerWidth - 8) left = rect.right - w;
                if (left < 8) left = 8;
                setDropPos({ top: rect.bottom + 6, left });
              }
              setOpen(v => !v);
            }}
            style={{ width: '100%', textAlign: 'left', cursor: 'pointer', color: value ? undefined : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
          >
            <span>{displayText}</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#6b7280' }}>
              <path d="M8 2v4"/><path d="M16 2v4"/>
              <rect width="18" height="18" x="3" y="4" rx="2"/>
              <path d="M3 10h18"/>
              <path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/>
              <path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>
            </svg>
          </button>
        )
      }
      {open && calendarPanel}
    </div>
  );
}
