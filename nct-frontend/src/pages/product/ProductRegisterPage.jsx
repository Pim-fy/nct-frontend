// src/pages/product/ProductRegisterPage.jsx
// 상품(경매) 등록 페이지 — 판매자가 경매에 올릴 상품을 3단계로 입력하는 화면
// 목업: 07_product_register_seller.html 기반
// 라우트: /product/register
// 단계: 0(상품정보) → 1(경매설정) → 2(등록확인)
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getCategories } from '@api/categoryApi';
import { fetchBannedKeywords, registerProduct, updateProduct, getProduct } from '@api/productApi';
import Breadcrumb from '@components/common/Breadcrumb';
import ErrorMessage from '@components/common/ErrorMessage';
import AuctionCalendarModal from '@components/product/AuctionCalendarModal';
import ProductInfoStep from './steps/ProductInfoStep';
import AuctionSettingStep from './steps/AuctionSettingStep';
import RegisterConfirmStep from './steps/RegisterConfirmStep';

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
const MAX_IMAGES = 5; // F-AUC-002 — 대표이미지 포함 최대 5장

export default function ProductRegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const editPrdSn = location.state?.prdSn ?? null; // 임시저장 수정 모드

  // ─── UI 상태 ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [policyAgreed, setPolicyAgreed] = useState(false); // 스텝1 경매 정책 동의
  const [agreed, setAgreed] = useState(false);             // 스텝2 최종 등록 동의
  const [customEndDt, setCustomEndDt] = useState('');      // 캘린더 모달로 설정한 종료일시
  const [calendarOpen, setCalendarOpen] = useState(false); // 캘린더 모달 열림 여부
  const [images, setImages] = useState([]);                // 업로드 완료된 이미지 [{ flSn, url }] — 첫 번째가 대표
  const [bannedKeywords, setBannedKeywords] = useState([]);
  const [bannedKeywordError, setBannedKeywordError] = useState('');

  // ─── 폼 입력값 ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    catSn: '',
    prdNm: '',
    prdCn: '',
    prdTrdMethodCd: 'TRDC0009',
    prdStartAmt: '',
    prdIbyAmt: '',
    durationDays: 3,
    startNow: true,
    reserveDt: '',
    bidUnit: 1000,
  });

  // ─── 카테고리 목록 + (수정 모드) 기존 상품 데이터 로드 ─────────────────
  useEffect(() => {
    const loads = [
      getCategories(PRODUCT_DOMAIN_CD)
        .then(res => {
          const children = res.data.filter(c => c.catParentSn !== null);
          setCategories(children);
        })
        .catch(() => setError('카테고리를 불러오지 못했습니다.')),
      fetchBannedKeywords()
        .then(res => setBannedKeywords(res.data))
        .catch(() => {}),
    ];

    if (editPrdSn) {
      loads.push(
        getProduct(editPrdSn)
          .then(res => {
            const p = res.data;
            setForm(prev => ({
              ...prev,
              catSn:          p.catSn ?? '',
              prdNm:          p.prdNm ?? '',
              prdCn:          p.prdCn ?? '',
              prdTrdMethodCd: p.prdTrdMethodCd ?? 'TRDC0009',
              prdStartAmt:    p.prdStartAmt != null ? String(p.prdStartAmt) : '',
              prdIbyAmt:      p.prdIbyAmt  != null ? String(p.prdIbyAmt)  : '',
            }));
          })
          .catch(() => setError('기존 상품 정보를 불러오지 못했습니다.'))
      );
    }

    Promise.all(loads);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!form.prdNm || bannedKeywords.length === 0) {
      setBannedKeywordError('');
      return;
    }
    const lower = form.prdNm.toLowerCase();
    const found = bannedKeywords.find(kwd => lower.includes(kwd.toLowerCase()));
    setBannedKeywordError(found ? `'${found}'은(는) 등록할 수 없는 키워드입니다.` : '');
  }, [form.prdNm, bannedKeywords]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

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

  // ─── 캘린더 모달 적용 ────────────────────────────────────────────────────
  // 유효성 검사 후 form 반영. 시작이 현재보다 1분 이상 뒤면 예약 시작으로 전환
  const handleCalendarApply = (startStr, endStr) => {
    if (!startStr || !endStr) return;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (end <= start) {
      setError('종료 시간은 시작 시간보다 뒤여야 합니다.');
      return;
    }
    const now = new Date();
    if (start.getTime() - now.getTime() > 60000) {
      set('startNow', false);
      set('reserveDt', startStr);
    }
    setCustomEndDt(endStr);
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
        // 수정 모드에서 새 이미지를 업로드하지 않으면 null → 백엔드에서 기존 이미지 유지
        flSnList:       images.length > 0 ? images.map(img => img.flSn) : null,
        aucStartDt:     isDraft ? null : startDt.toISOString(),
        aucEndDt:       isDraft || !endDt ? null : endDt.toISOString(),
        bidUnit:        isDraft ? null : form.bidUnit,
      };
      const result = editPrdSn
        ? await updateProduct(editPrdSn, payload)
        : await registerProduct(payload);
      const prdSn = result.data?.prdSn ?? editPrdSn;
      queryClient.invalidateQueries({ queryKey: ['products', 'my'] });
      navigate(`/product/${prdSn}/seller`);
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || (editPrdSn ? '상품 수정에 실패했습니다.' : '상품 등록에 실패했습니다.'));
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
      if (bannedKeywordError) {
        setError(bannedKeywordError);
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
  const selectedCat   = categories.find(c => String(c.catSn) === String(form.catSn));
  const selectedTrade = TRADE_METHODS.find(m => m.value === form.prdTrdMethodCd);
  const endDt = calcEndDt();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: editPrdSn ? '경매 설정 완료' : '상품 등록' }]} />
      <div className="page-title"><div><h1>{editPrdSn ? '경매 설정 완료' : '상품 등록'}</h1></div></div>

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

        <ErrorMessage message={error} />

        {step === 0 && (
          <ProductInfoStep
            form={form}
            set={set}
            categories={categories}
            bannedKeywordError={bannedKeywordError}
            images={images}
            onChange={setImages}
            tradeMethods={TRADE_METHODS}
            maxImages={MAX_IMAGES}
          />
        )}

        {step === 1 && (
          <AuctionSettingStep
            form={form}
            set={set}
            policyAgreed={policyAgreed}
            setPolicyAgreed={setPolicyAgreed}
            customEndDt={customEndDt}
            setCustomEndDt={setCustomEndDt}
            endDt={endDt}
            durationDays={DURATION_DAYS}
            bidUnits={BID_UNITS}
            onOpenCalendar={() => setCalendarOpen(true)}
          />
        )}

        {step === 2 && (
          <RegisterConfirmStep
            form={form}
            agreed={agreed}
            setAgreed={setAgreed}
            images={images}
            selectedCat={selectedCat}
            selectedTrade={selectedTrade}
            endDt={endDt}
          />
        )}

        {/* 하단 버튼 */}
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 24 }}>
          <button
            type="button"
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
            disabled={step === 0 || loading}
            className="btn btn-ghost"
          >
            이전
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

      <AuctionCalendarModal
        open={calendarOpen}
        durationDays={form.durationDays}
        onClose={() => setCalendarOpen(false)}
        onApply={handleCalendarApply}
      />
    </div>
  );
}
