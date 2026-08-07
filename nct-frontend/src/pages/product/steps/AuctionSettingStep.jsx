// src/pages/product/steps/AuctionSettingStep.jsx
// 0단계(상품 입력) 하단 영역: 시작가·기간·시작시점·입찰단위·경매정책 동의
// — 예전 3단계 구조의 "Step 1"이었으나 지금은 ProductInfoStep과 같은 0단계 화면에 함께 렌더된다
// Props: form, set, policyAgreed, setPolicyAgreed, auctionRange, setAuctionRange,
//        endDt, bidUnits, submitted, startAmtRef, ibyAmtRef, auctionRangeRef, policyRef
import { useEffect, useState } from 'react';
import DateRangePicker from '@components/product/DateRangePicker';
import { formatPoint } from '@/utils/common';

// 등록 시각(현재) 기준 최소 1시간 이후를 10분 단위로 올림한 "HH:mm" 문자열
// — 당일 즉시시작 종료 시간의 최소 기준(최소 1시간 진행 보장).
// Date 객체로 시:분을 더하면 자정을 넘길 때 날짜가 넘어가버려 "0시"가 되므로,
// 분 단위 숫자로만 계산해 자정을 넘기면 24 이상으로 남겨둔다 — 그러면 TimeRow가
// 오늘 시간 옵션을 전부 비활성화해서 "오늘은 더 이상 즉시시작 종료 시간을 고를 수 없음"을 표현한다.
function minEndTimeToday() {
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes() + 60;
  let h = Math.floor(totalMin / 60);
  let m = Math.ceil((totalMin % 60) / 10) * 10;
  if (m === 60) { m = 0; h += 1; }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// 현재 시각을 10분 단위로 올림한 "HH:mm" — 예약 시작일을 오늘로 고를 때 이미 지난 시간을
// 시작 시각으로 선택하지 못하게 막는 최소 기준. 즉시시작 종료 시간과 달리 최소 1시간 여유는
// 필요 없어(그냥 시작 시각일 뿐) minEndTimeToday()의 +60분 없이 "지금 이후"만 보장한다.
function minStartTimeToday() {
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  let h = Math.floor(totalMin / 60);
  let m = Math.ceil((totalMin % 60) / 10) * 10;
  if (m === 60) { m = 0; h += 1; }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// 예약 당일 종료 모드에서 시작 시간 기준 최소 1시간 이후 종료 시간 계산
function minEndTimeFromStart(startTimeStr) {
  const [h, m] = (startTimeStr || '09:00').split(':').map(Number);
  const totalMin = h * 60 + m + 60;
  return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
}

export default function AuctionSettingStep({
  form, set, policyAgreed, setPolicyAgreed,
  auctionRange, setAuctionRange, endDt,
  bidUnits, submitted,
  startAmtRef, ibyAmtRef, auctionRangeRef, policyRef,
}) {
  const [startAmtTouched, setStartAmtTouched] = useState(false);
  const startAmtInvalid = !!form.prdStartAmt && Number(form.prdStartAmt) % form.bidUnit !== 0;
  // 즉시시작 + 종료일이 당일이면 "등록 시각과 동일한 시:분"으로 자동 계산할 수 없어(이미 지난 시각이 됨) 직접 시간을 받아야 함
  const isSameDayInstant = form.startNow && !!auctionRange.end && auctionRange.end === auctionRange.start;
  // 예약 + 시작일이 오늘이면 이미 지난 시각을 시작 시각으로 고르지 못하게 막아야 함
  const isSameDayReserve = !form.startNow && auctionRange.start === todayStr();
  // 예약 + 시작일 = 종료일 = 오늘 → 종료 시간도 별도 선택 (시작 시간 + 최소 1시간)
  const isSameDayReserveAndEnd = !form.startNow && !!auctionRange.end && auctionRange.start === auctionRange.end && auctionRange.start === todayStr();

  // 당일 즉시시작으로 전환되는 순간, 이미 지난 시각이 기본값으로 남아있으면 현재 이후 시각으로 보정
  useEffect(() => {
    if (!isSameDayInstant) return;
    const min = minEndTimeToday();
    const current = auctionRange.startTime || '09:00';
    if (current < min) {
      setAuctionRange(prev => ({
        ...prev,
        startTime: min,
        // 복원된 endTime이 min보다 크면 유지 — 임시저장 재개 시 저장해둔 종료 시간을 덮어쓰지 않도록
        endTime: prev.endTime && prev.endTime > min ? prev.endTime : min,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSameDayInstant]);

  // 예약 시작일이 오늘로 바뀌는 순간에도 동일하게 보정
  useEffect(() => {
    if (!isSameDayReserve) return;
    const min = minStartTimeToday();
    const current = auctionRange.startTime || '09:00';
    if (current < min) {
      setAuctionRange(prev => ({ ...prev, startTime: min, endTime: min }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSameDayReserve]);

  // 예약 당일 종료 모드: 종료 시간이 시작 시간 + 1시간 미만이면 자동 보정
  useEffect(() => {
    if (!isSameDayReserveAndEnd) return;
    const minEnd = minEndTimeFromStart(auctionRange.startTime);
    if (!auctionRange.endTime || auctionRange.endTime < minEnd) {
      setAuctionRange(prev => ({ ...prev, endTime: minEnd }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSameDayReserveAndEnd, auctionRange.startTime]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <div className="field" ref={startAmtRef}>
          <label>시작가 <span style={{ color: '#c0392b' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <input
              className="input no-spinner"
              type="number"
              value={form.prdStartAmt}
              onChange={e => set('prdStartAmt', e.target.value)}
              onWheel={e => e.target.blur()}
              onBlur={() => setStartAmtTouched(true)}
              min={0}
              step={form.bidUnit}
              placeholder="0"
            />
            {submitted && !form.prdStartAmt && (
              <span style={{ position: 'absolute', top: '100%', left: 0, fontSize: 17, fontWeight: 700, color: '#c0392b', whiteSpace: 'nowrap' }}>시작가 입력은 필수입니다</span>
            )}
            {(submitted || startAmtTouched) && startAmtInvalid && (
              <span style={{ position: 'absolute', top: '100%', left: 0, fontSize: 17, fontWeight: 700, color: '#c0392b', whiteSpace: 'nowrap' }}>
                입찰 단위({formatPoint(form.bidUnit)})의 배수로 입력해 주세요
              </span>
            )}
          </div>
        </div>
        <div className="field" ref={ibyAmtRef}>
          <label>즉시구매가 <span style={{ fontWeight: 500, color: '#888780' }}>(백 단위 자동절삭)</span></label>
          <input
            className="input no-spinner"
            type="number"
            value={form.prdIbyAmt}
            onChange={e => set('prdIbyAmt', e.target.value)}
            onWheel={e => e.target.blur()}
            onBlur={e => {
              if (!e.target.value) return;
              const rounded = Math.floor(Number(e.target.value) / 100) * 100;
              set('prdIbyAmt', String(rounded));
            }}
            min={0}
            step={100}
            placeholder="입력 시 즉시구매 가능"
          />
        </div>
      </div>

      <div className="field" style={{ marginTop: 10 }}>
        <label>입찰 단위 <span>(최소 입찰 증가액)</span></label>
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          {bidUnits.map(u => (
            <button
              key={u}
              type="button"
              onClick={() => set('bidUnit', u)}
              className={`chip ${form.bidUnit === u ? 'active' : ''}`}
            >
              {formatPoint(u)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>시작 시점</label>
        <div className="row">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, cursor: 'pointer' }}>
            <input type="radio" checked={form.startNow} onChange={() => set('startNow', true)} />
            즉시 시작
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, cursor: 'pointer' }}>
            <input type="radio" checked={!form.startNow} onChange={() => set('startNow', false)} />
            예약
          </label>
        </div>
      </div>

      <div className="field" ref={auctionRangeRef}>
        <label>경매 기간 <span style={{ color: '#c0392b' }}>*</span></label>
        <div style={{ position: 'relative' }}>
        <DateRangePicker
          key={form.startNow ? 'instant' : 'reserve'}
          startDate={auctionRange.start}
          endDate={auctionRange.end}
          onChange={({ start, end }) => setAuctionRange(prev => ({ ...prev, start: start ?? '', end: end ?? '' }))}
          fixedStart={form.startNow}
          maxDurationDays={14}
          maxNavDate={(() => {
            const pad2 = n => String(n).padStart(2, '0');
            const now = new Date();
            if (form.startNow) {
              // 즉시시작: 종료일 선택 범위가 최대 2주이므로 탐색도 그만큼만 허용
              const d = new Date(now);
              d.setDate(d.getDate() + 14);
              return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
            }
            // 예약: 오늘 기준 2개월까지 탐색 가능 (실제 종료일은 시작일+14일로 제한)
            let m = now.getMonth() + 2; let y = now.getFullYear();
            if (m > 11) { m -= 12; y++; }
            const last = new Date(y, m + 1, 0).getDate();
            return `${y}-${pad2(m+1)}-${pad2(last)}`;
          })()}
          showTime={!form.startNow || isSameDayInstant}
          startTimeValue={auctionRange.startTime}
          onStartTimeChange={val => {
            if (isSameDayReserveAndEnd) {
              const minEnd = minEndTimeFromStart(val);
              setAuctionRange(prev => ({
                ...prev,
                startTime: val,
                endTime: prev.endTime && prev.endTime >= minEnd ? prev.endTime : minEnd,
              }));
            } else {
              setAuctionRange(prev => ({ ...prev, startTime: val, endTime: val }));
            }
          }}
          endTimeValue={isSameDayReserveAndEnd ? (auctionRange.endTime || minEndTimeFromStart(auctionRange.startTime)) : undefined}
          onEndTimeChange={isSameDayReserveAndEnd ? val => setAuctionRange(prev => ({ ...prev, endTime: val })) : undefined}
          minEndTime={isSameDayReserveAndEnd ? minEndTimeFromStart(auctionRange.startTime) : undefined}
          timeLabel={isSameDayInstant ? '종료 시간' : '시작 시간'}
          timeHint={isSameDayInstant ? '오늘 등록과 동시에 시작해서 이 시간에 종료됩니다' : '종료 시간은 시작 시간과 동일하게 적용됩니다'}
          minTime={isSameDayInstant ? minEndTimeToday() : isSameDayReserve ? minStartTimeToday() : undefined}
        />
        {submitted && !auctionRange.end && (
          <span style={{ position: 'absolute', top: '100%', left: 0, fontSize: 15, fontWeight: 700, color: '#c0392b', whiteSpace: 'nowrap' }}>경매 기간을 지정해 주세요</span>
        )}
        </div>
      </div>

      <div className="field" style={{ marginTop: 32 }}>
        <label>종료 예정일시</label>
        <p className="mono" style={{ fontSize: 17, color: '#0064ff' }}>
          {endDt
            ? endDt.toLocaleString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit',
              })
            : '—'}
        </p>
      </div>

      <div className="card" ref={policyRef} style={{ background: '#e5efff', border: 'none', marginTop: 16 }}>
        <h4 style={{ marginTop: 0, color: '#0048bf' }}>경매 정책 안내 <span style={{ color: '#c0392b' }}>*</span></h4>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 16, lineHeight: 2, listStyle: 'disc' }}>
          <li>마감 10분 이내 유효 입찰 시 잔여 시간이 10분으로 자동 연장됩니다 (1회)</li>
          <li>상품 등록 후에는 본문을 수정할 수 없으며 변경사항은 별도로 최대 3회까지 추가할 수 있습니다</li>
          <li>즉시구매가는 최고 입찰가보다 반드시 높아야 합니다</li>
          <li>낙찰 후 거래를 정당한 사유 없이 취소하면 포인트 패널티가 부과됩니다</li>
        </ul>
        <div className="policy-agree">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={policyAgreed}
              onChange={e => setPolicyAgreed(e.target.checked)}
            />
            위 경매 정책을 확인하였습니다.
          </label>
        </div>
      </div>

    </div>
  );
}
