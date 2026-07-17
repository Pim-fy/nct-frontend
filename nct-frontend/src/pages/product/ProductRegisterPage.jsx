// src/pages/product/ProductRegisterPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// 상품(경매) 등록 페이지 — 판매자가 경매에 올릴 상품을 3단계로 입력하는 화면
// 목업: 07_product_register_seller.html 기반
// 라우트: /product/register
// 단계: 0(상품정보) → 1(경매설정) → 2(등록확인)
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '@api/categoryApi';
import { registerProduct } from '@api/productApi';

// ─── 거래방식 아이콘 SVG 컴포넌트 ───────────────────────────────────────────
// deal-options(.line-option) 버튼 안에 표시되는 아이콘
const TruckIcon = () => (
  <svg className="trade-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 7h11v10H3z" /><path d="M14 10h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" />
  </svg>
);
const PinIcon = () => (
  <svg className="trade-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s6-5.1 6-11a6 6 0 0 0-12 0c0 5.9 6 11 6 11z" /><circle cx="12" cy="10" r="2" />
  </svg>
);
const BothIcon = () => (
  <svg className="trade-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 7h11l-3-3" /><path d="M18 7l-3 3" /><path d="M17 17H6l3 3" /><path d="M6 17l3-3" />
  </svg>
);

// ─── 상수 정의 ───────────────────────────────────────────────────────────────
// 거래방식 옵션 · 경매 기간 선택지 · 입찰 단위 · 카테고리 도메인 코드 · 스텝 라벨
const TRADE_METHODS = [
  { value: 'TRDC0009', label: '배송만',    Icon: TruckIcon },
  { value: 'TRDC0010', label: '직거래만',  Icon: PinIcon },
  { value: 'TRDC0020', label: '둘 다 가능', Icon: BothIcon },
];

const DURATION_DAYS = [1, 3, 5, 7];
const BID_UNITS = [500, 1000, 5000, 10000];
const PRODUCT_DOMAIN_CD = 'CATC0001';
const STEP_LABELS = ['상품정보', '경매설정', '등록확인'];

export default function ProductRegisterPage() {
  const navigate = useNavigate();

  // ─── UI 상태 ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);          // 현재 스텝 (0·1·2)
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [policyAgreed, setPolicyAgreed] = useState(false); // 스텝1 경매 정책 동의
  const [agreed, setAgreed] = useState(false);             // 스텝2 최종 등록 동의
  const [customEndDt, setCustomEndDt] = useState('');      // 캘린더 모달로 설정한 종료일시
  const [calendarOpen, setCalendarOpen] = useState(false); // 캘린더 모달 열림 여부
  const [modalStart, setModalStart] = useState('');        // 캘린더 모달 임시 시작일시
  const [modalEnd, setModalEnd] = useState('');            // 캘린더 모달 임시 종료일시

  // ─── 폼 입력값 ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    catSn: '',
    prdNm: '',
    prdCn: '',
    prdTrdMethodCd: 'TRDC0011',
    prdStartAmt: '',
    prdIbyAmt: '',
    durationDays: 3,
    startNow: true,
    reserveDt: '',
    bidUnit: 1000,
  });

  // ─── 카테고리 목록 로드 ──────────────────────────────────────────────────
  // 마운트 시 1회 실행, 하위 카테고리(catParentSn != null)만 필터링해 사용
  useEffect(() => {
    getCategories(PRODUCT_DOMAIN_CD)
      .then(res => {
        const children = res.data.filter(c => c.catParentSn !== null);
        setCategories(children);
      })
      .catch(() => setError('카테고리를 불러오지 못했습니다.'));
  }, []);

  // ─── 폼 필드 단일 업데이트 헬퍼 ─────────────────────────────────────────
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  // ─── 날짜 유틸 ───────────────────────────────────────────────────────────
  // Date → 'YYYY-MM-DDTHH:mm' 형식 변환 (datetime-local input 값으로 사용)
  const toLocalDt = (d) => {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // ─── 종료일시 계산 ───────────────────────────────────────────────────────
  // 캘린더 직접 설정 > 예약 시작일 + 기간 > 즉시 시작 + 기간 순으로 우선 적용
  const calcEndDt = () => {
    if (customEndDt) return new Date(customEndDt);
    const startDt = form.startNow ? new Date() : (form.reserveDt ? new Date(form.reserveDt) : null);
    if (!startDt) return null;
    const endDt = new Date(startDt);
    endDt.setDate(endDt.getDate() + form.durationDays);
    return endDt;
  };

  // ─── 캘린더 모달 ─────────────────────────────────────────────────────────
  // 열기: 현재 시각 기준 기본값 세팅 / 적용: 시작·종료 유효성 검사 후 반영
  const openCalendar = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    setModalStart(toLocalDt(now));
    const defaultEnd = new Date(now);
    defaultEnd.setDate(defaultEnd.getDate() + form.durationDays);
    setModalEnd(toLocalDt(defaultEnd));
    setCalendarOpen(true);
  };

  const applyCalendar = () => {
    if (!modalStart || !modalEnd) return;
    const start = new Date(modalStart);
    const end = new Date(modalEnd);
    if (end <= start) {
      setError('종료 시간은 시작 시간보다 뒤여야 합니다.');
      return;
    }
    const now = new Date();
    if (start.getTime() - now.getTime() > 60000) {
      set('startNow', false);
      set('reserveDt', modalStart);
    }
    setCustomEndDt(modalEnd);
    setCalendarOpen(false);
    setError('');
  };

  // ─── 등록 / 임시저장 제출 ────────────────────────────────────────────────
  // statusCd: 'PRDC0002'(경매 등록) | 'PRDC0001'(임시저장)
  const handleSubmit = async (statusCd) => {
    setError('');
    setLoading(true);
    try {
      const endDt = calcEndDt();
      const startDt = form.startNow ? new Date() : (form.reserveDt ? new Date(form.reserveDt) : new Date());
      const isDraft = statusCd === 'PRDC0001';
      const payload = {
        catSn:          Number(form.catSn),
        prdNm:          form.prdNm.trim(),
        prdCn:          form.prdCn || null,
        prdStartAmt:    Number(form.prdStartAmt),
        prdIbyAmt:      form.prdIbyAmt ? Number(form.prdIbyAmt) : null,
        prdTrdMethodCd: form.prdTrdMethodCd,
        prdStatusCd:    statusCd,
        aucStartDt:     isDraft ? null : startDt.toISOString(),
        aucEndDt:       isDraft || !endDt ? null : endDt.toISOString(),
      };
      await registerProduct(payload);
      navigate('/product/me');
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || '상품 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ─── 다음 스텝 이동 전 유효성 검사 ─────────────────────────────────────
  // 스텝0: 상품명·카테고리·거래방식 필수 / 스텝1: 시작가·예약일시·정책동의 필수
  const goNext = () => {
    if (step === 0) {
      if (!form.prdNm.trim() || !form.catSn || !form.prdTrdMethodCd) {
        setError('상품명, 카테고리, 거래방식을 모두 입력해 주세요.');
        return;
      }
    }
    if (step === 1) {
      if (!form.prdStartAmt) {
        setError('시작가를 입력해 주세요.');
        return;
      }
      if (!form.startNow && !form.reserveDt) {
        setError('예약 시작일시를 입력해 주세요.');
        return;
      }
      if (!policyAgreed) {
        setError('경매 정책을 확인하고 동의해 주세요.');
        return;
      }
    }
    setError('');
    setStep(s => s + 1);
  };

  // ─── 렌더링용 파생값 ─────────────────────────────────────────────────────
  // 스텝2 확인 테이블 및 미리보기에 사용할 선택된 카테고리·거래방식·종료일시
  const selectedCat   = categories.find(c => String(c.catSn) === String(form.catSn));
  const selectedTrade = TRADE_METHODS.find(m => m.value === form.prdTrdMethodCd);
  const endDt = calcEndDt();

  // ─── 렌더링 ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="page-title"><div><h1>상품 등록</h1></div></div>

      <section className="card" style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* 스텝 인디케이터 */}
        <div className="steps">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`}
            >
              {label}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm" style={{ maxWidth: 720, margin: '0 auto 16px' }}>
            {error}
          </div>
        )}

        {/* ── Step 0: 상품정보 ── */}
        {step === 0 && (
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="field">
              <label>상품명 <span>{form.prdNm.length}/100</span></label>
              <input
                className="input"
                type="text"
                value={form.prdNm}
                onChange={e => set('prdNm', e.target.value)}
                maxLength={100}
                placeholder="다이슨 V11 청소기"
              />
            </div>

            <div className="row" style={{ marginBottom: 14 }}>
              {categories.map(cat => (
                <button
                  key={cat.catSn}
                  type="button"
                  onClick={() => set('catSn', String(cat.catSn))}
                  className={`chip ${String(form.catSn) === String(cat.catSn) ? 'active' : ''}`}
                >
                  {cat.catNm}
                </button>
              ))}
            </div>

            <div className="field deal-options" style={{ marginTop: 14 }}>
              <label>거래 형태</label>
              <div className="row">
                {TRADE_METHODS.map(({ value, label, Icon }) => (
                  <label
                    key={value}
                    className={`line-option ${form.prdTrdMethodCd === value ? 'checked' : ''}`}
                  >
                    <input
                      type="radio"
                      name="prdTrdMethodCd"
                      value={value}
                      checked={form.prdTrdMethodCd === value}
                      onChange={() => set('prdTrdMethodCd', value)}
                    />
                    <Icon />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>상품 설명 <span>{form.prdCn.length}/2000</span></label>
              <textarea
                className="input"
                value={form.prdCn}
                onChange={e => set('prdCn', e.target.value)}
                maxLength={2000}
                rows={5}
              />
            </div>

            {/* 이미지 업로드 — FILES API(담당자6 백종남) 연계 전 placeholder */}
            <div className="card" style={{ borderStyle: 'dashed' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <div>
                  <strong>상품 사진</strong>
                  <p className="muted small" style={{ margin: '4px 0 0' }}>드래그앤드롭 또는 파일 선택 · 최대 5장</p>
                </div>
                <button type="button" disabled className="btn btn-ghost" style={{ cursor: 'not-allowed', opacity: 0.45 }}>
                  파일 선택
                </button>
              </div>
              <p className="muted small" style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                이미지 업로드는 FILES 연계(담당자6 백종남) 후 활성화됩니다.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 1: 경매설정 ── */}
        {step === 1 && (
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
                {DURATION_DAYS.map(d => (
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
                  onClick={openCalendar}
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
                {BID_UNITS.map(u => (
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
        )}

        {/* ── Step 2: 등록확인 ── */}
        {step === 2 && (
          <div>
            <h3>등록 전 확인</h3>
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div className="card">
                <h4>상품 정보 (PRODUCT)</h4>
                <table>
                  <tbody>
                    {[
                      ['상품명', form.prdNm],
                      ['카테고리', selectedCat?.catNm || '—'],
                      ['거래 방식', selectedTrade?.label || '—'],
                      ['이미지', '0장 등록됨'],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <th>{k}</th>
                        <td>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h4>경매 조건 (AUCTION)</h4>
                <table>
                  <tbody>
                    {[
                      ['시작가', form.prdStartAmt ? Number(form.prdStartAmt).toLocaleString() + '원' : '—'],
                      ['즉시구매가', form.prdIbyAmt ? Number(form.prdIbyAmt).toLocaleString() + '원' : '미설정'],
                      ['입찰 단위', form.bidUnit.toLocaleString() + '원'],
                      ['경매 기간', `${form.durationDays}일`],
                      ['종료 예정', endDt ? endDt.toLocaleDateString('ko-KR') : '—'],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <th>{k}</th>
                        <td>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="policy-agree">
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <span>위 상품등록 정보를 확인하였으며, 경매시작 후 본문수정이 불가능함에 동의합니다.</span>
              </label>
            </div>
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 24 }}>
          <button
            type="button"
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
            disabled={step === 0 || loading}
            className="btn btn-ghost"
          >
            {step === 0 ? '이전' : '이전'}
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {step >= 1 && (
              <button
                type="button"
                onClick={() => handleSubmit('PRDC0001')}
                disabled={loading}
                className="btn btn-ghost"
              >
                임시저장
              </button>
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={goNext}
                className="btn btn-primary"
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!agreed) { setError('등록 정보 확인 및 동의가 필요합니다.'); return; }
                  handleSubmit('PRDC0002');
                }}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? '등록 중...' : '경매 등록'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 캘린더 모달 */}
      {calendarOpen && (
        <div
          className="modal open"
          onClick={e => { if (e.target === e.currentTarget) setCalendarOpen(false); }}
        >
          <div className="modal-box">
            <h3>경매 종료 시간 설정</h3>
            <div className="grid-2">
              <div className="field">
                <label>시작 시간</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={modalStart}
                  onChange={e => setModalStart(e.target.value)}
                />
              </div>
              <div className="field">
                <label>종료 시간</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={modalEnd}
                  onChange={e => setModalEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setCalendarOpen(false)} className="btn btn-ghost">취소</button>
              <button type="button" onClick={applyCalendar} className="btn btn-primary">적용</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
