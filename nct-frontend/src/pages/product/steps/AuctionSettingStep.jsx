// src/pages/product/steps/AuctionSettingStep.jsx
// Step 1: 시작가·기간·시작시점·입찰단위·경매정책 동의
// Props: form, set, policyAgreed, setPolicyAgreed, auctionRange, setAuctionRange,
//        endDt, bidUnits, submitted
import { useState } from 'react';
import DateRangePicker from '@components/product/DateRangePicker';

export default function AuctionSettingStep({
  form, set, policyAgreed, setPolicyAgreed,
  auctionRange, setAuctionRange, endDt,
  bidUnits, submitted,
}) {
  const [startAmtTouched, setStartAmtTouched] = useState(false);
  const startAmtInvalid = !!form.prdStartAmt && Number(form.prdStartAmt) % form.bidUnit !== 0;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <div className="field">
          <label>시작가</label>
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
                입찰 단위({form.bidUnit.toLocaleString()}원)의 배수로 입력해 주세요
              </span>
            )}
          </div>
        </div>
        <div className="field">
          <label>즉시구매가 <span style={{ fontWeight: 500, color: '#888780' }}>(십 단위 자동절삭)</span></label>
          <input
            className="input no-spinner"
            type="number"
            value={form.prdIbyAmt}
            onChange={e => set('prdIbyAmt', e.target.value)}
            onWheel={e => e.target.blur()}
            onBlur={e => {
              if (!e.target.value) return;
              const rounded = Math.floor(Number(e.target.value) / 10) * 10;
              set('prdIbyAmt', String(rounded));
            }}
            min={0}
            step={10}
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
              {u.toLocaleString()}원
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>시작 시점</label>
        <div className="row">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, cursor: 'pointer' }}>
            <input type="radio" checked={form.startNow} onChange={() => { set('startNow', true); set('reserveDt', ''); }} />
            즉시 시작
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, cursor: 'pointer' }}>
            <input type="radio" checked={!form.startNow} onChange={() => set('startNow', false)} />
            예약
          </label>
        </div>
      </div>

      <div className="field">
        <label>경매 기간</label>
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
          showTime={!form.startNow}
          startTimeValue={auctionRange.startTime}
          onStartTimeChange={val => setAuctionRange(prev => ({ ...prev, startTime: val, endTime: val }))}
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

      <div className="card" style={{ background: '#e5efff', border: 'none', marginTop: 16 }}>
        <h4 style={{ marginTop: 0, color: '#0048bf' }}>경매 정책 안내</h4>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 16, lineHeight: 2 }}>
          <li>마감 10분 이내 유효 입찰 시 잔여 시간이 10분으로 자동 연장됩니다 (1회)</li>
          <li>경매 시작 후 상품 설명, 가격, 기간은 수정할 수 없습니다</li>
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
