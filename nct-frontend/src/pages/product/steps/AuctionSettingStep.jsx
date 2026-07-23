// src/pages/product/steps/AuctionSettingStep.jsx
// Step 1: 시작가·기간·시작시점·입찰단위·경매정책 동의
// Props: form, set, policyAgreed, setPolicyAgreed, customEndDt, setCustomEndDt,
//        endDt, durationDays, bidUnits, onOpenCalendar
export default function AuctionSettingStep({
  form, set, policyAgreed, setPolicyAgreed,
  customEndDt, setCustomEndDt, endDt,
  durationDays, bidUnits, onOpenCalendar,
}) {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="grid grid-cols-2 gap-4">
        <div className="field">
          <label>시작가</label>
          <input
            className="input"
            type="number"
            value={form.prdStartAmt}
            onChange={e => set('prdStartAmt', e.target.value)}
            min={0}
            placeholder="0"
          />
        </div>
        <div className="field">
          <label>즉시구매가</label>
          <input
            className="input"
            type="number"
            value={form.prdIbyAmt}
            onChange={e => set('prdIbyAmt', e.target.value)}
            min={0}
            placeholder="입력 시 즉시구매 가능"
          />
        </div>
      </div>

      <div className="field">
        <label>경매 기간</label>
        <div className="row" style={{ gap: 8 }}>
          {durationDays.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => { set('durationDays', d); setCustomEndDt(''); }}
              className={`chip ${form.durationDays === d && !customEndDt ? 'active' : ''}`}
            >
              {d}일
            </button>
          ))}
          <button
            type="button"
            onClick={onOpenCalendar}
            title="종료일시 직접 설정"
            className={`chip calendar-icon-btn ${customEndDt ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="field">
        <label>시작 시점</label>
        <div className="row">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input
              type="radio"
              checked={form.startNow}
              onChange={() => { set('startNow', true); set('reserveDt', ''); }}
            />
            즉시 시작
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input
              type="radio"
              checked={!form.startNow}
              onChange={() => set('startNow', false)}
            />
            예약
          </label>
        </div>
        {!form.startNow && (
          <div className="schedule-panel">
            <input
              className="input"
              type="datetime-local"
              value={form.reserveDt}
              onChange={e => set('reserveDt', e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="field">
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
        <label>종료 예정일시</label>
        <p className="mono" style={{ fontSize: 15, color: '#0064ff' }}>
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
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 2 }}>
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

      <div className="card" style={{ background: '#fafaf8', marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>미리보기</h3>
        <h4 style={{ margin: 0 }}>{form.prdNm || '상품명 미입력'}</h4>
        <p className="muted" style={{ marginTop: 4 }}>
          시작가 {form.prdStartAmt ? Number(form.prdStartAmt).toLocaleString() + '원' : '—'}
          {form.prdIbyAmt ? ` · 즉시구매 ${Number(form.prdIbyAmt).toLocaleString()}원` : ''}
        </p>
      </div>
    </div>
  );
}
