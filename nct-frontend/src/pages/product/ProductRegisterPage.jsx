// src/pages/product/ProductRegisterPage.jsx
// 상품(경매) 등록 페이지 — 판매자가 경매에 올릴 상품을 3단계로 입력하는 화면
// 목업: 07_product_register_seller.html 기반
// 라우트: /product/register
// 단계: 0(상품정보) → 1(경매설정) → 2(등록확인)
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getCategories } from '@api/categoryApi';
import { fetchBannedKeywords, registerProduct, updateProduct, getProduct } from '@api/productApi';
import ErrorMessage from '@components/common/ErrorMessage';
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
  { value: 'TRDC0009', label: '배송',      Icon: TruckIcon },
  { value: 'TRDC0010', label: '직거래',    Icon: PinIcon },
  { value: 'TRDC0020', label: '둘 다 가능', Icon: BothIcon },
];

const BID_UNITS = [500, 1000, 5000, 10000, 50000, 100000];
const PRODUCT_DOMAIN_CD = 'CATC0001';
const STEP_LABELS = ['상품 입력', '등록 확인'];
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
  const [auctionRange, setAuctionRange] = useState({ start: '', end: '', startTime: '09:00', endTime: '09:00' }); // 경매 기간 범위
  const [images, setImages] = useState([]);                // 업로드 완료된 이미지 [{ flSn, url }] — 첫 번째가 대표
  const [bannedKeywords, setBannedKeywords] = useState([]);
  const [bannedKeywordError, setBannedKeywordError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorTick, setErrorTick] = useState(0); // 동일한 에러 메시지라도 재클릭 시 다시 스크롤시키기 위한 트리거
  const errorRef = useRef(null);

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
            if (p.imageList?.length > 0) {
              setImages(p.imageList.map(img => ({ flSn: img.flSn, url: img.url })));
            }
          })
          .catch(() => setError('기존 상품 정보를 불러오지 못했습니다.'))
      );
    }

    Promise.all(loads);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error, errorTick]);

  // 즉시시작/예약 전환 시 날짜 범위 초기화
  useEffect(() => {
    if (form.startNow) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      setAuctionRange(prev => ({ ...prev, start: todayStr, end: '' }));
    } else {
      setAuctionRange(prev => ({ ...prev, start: '', end: '' }));
    }
  }, [form.startNow]);

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
    if (!auctionRange.end) return null;
    if (form.startNow) {
      // 즉시시작: 종료 시각을 현재(등록) 시각의 HH:mm으로 고정
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      return new Date(`${auctionRange.end}T${hh}:${mm}:00`);
    }
    return new Date(`${auctionRange.end}T${auctionRange.startTime || '09:00'}:00`);
  };

  // ─── 등록 / 임시저장 제출 ────────────────────────────────────────────────
  // statusCd: 'PRDC0002'(경매 등록) | 'PRDC0001'(임시저장)
  const handleSubmit = async (statusCd) => {
    setError('');
    setLoading(true);
    try {
      const endDt = calcEndDt();
      const startDt = form.startNow ? new Date() : (auctionRange.start ? new Date(`${auctionRange.start}T${auctionRange.startTime || '00:00'}:00`) : new Date());
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

  // ─── 상품정보 + 경매설정 유효성 검사 ────────────────────────────────────
  // goNext(다음)와 임시저장 모두 동일한 검사·알림을 사용
  // requirePolicyAgreed: 임시저장은 아직 경매를 확정하는 게 아니므로 정책 동의를 요구하지 않음
  const validateStep0 = (requirePolicyAgreed = true) => {
    setSubmitted(true);
    const fail = (msg) => {
      setError(msg);
      setErrorTick(t => t + 1); // 동일 메시지 재클릭 시에도 스크롤이 다시 일어나도록
      return false;
    };
    if (!form.prdNm.trim() || !form.catSn || !form.prdTrdMethodCd) {
      return fail('상품명, 카테고리, 거래 형태를 모두 입력해 주세요.');
    }
    if (bannedKeywordError) {
      return fail(bannedKeywordError);
    }
    if (!form.prdStartAmt) {
      return fail('시작가를 입력해 주세요.');
    }
    if (!auctionRange.end) {
      return fail('경매 기간을 지정해 주세요.');
    }
    if (Number(form.prdStartAmt) % form.bidUnit !== 0) {
      return fail(`시작가는 입찰 단위(${form.bidUnit.toLocaleString()}원)의 배수로 입력해 주세요.`);
    }
    if (form.prdIbyAmt && Number(form.prdIbyAmt) % form.bidUnit !== 0) {
      return fail(`즉시구매가는 입찰 단위(${form.bidUnit.toLocaleString()}원)의 배수로 입력해 주세요.`);
    }
    if (requirePolicyAgreed && !policyAgreed) {
      return fail('경매 정책을 확인하고 동의해 주세요.');
    }
    setError('');
    return true;
  };

  // ─── 다음 스텝 이동 전 유효성 검사 ─────────────────────────────────────
  // step 0: 상품정보 + 경매설정 모두 검사 후 등록확인(step 1)으로 이동
  const goNext = () => {
    if (validateStep0()) setStep(1);
  };

  // ─── 렌더링용 파생값 ─────────────────────────────────────────────────────
  const selectedCat   = categories.find(c => String(c.catSn) === String(form.catSn));
  const selectedTrade = TRADE_METHODS.find(m => m.value === form.prdTrdMethodCd);
  const endDt = calcEndDt();

  return (
    <main className="container seller-page">
<div className="page-title"><div><h1>{editPrdSn ? '경매 설정 완료' : '상품 등록'}</h1></div></div>

      {/* 스텝 인디케이터 */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ background: '#eef2fb', padding: '14px 20px' }}>
          <div className="steps" style={{ margin: 0 }}>
            {STEP_LABELS.map((label, i) => (
              <div key={label} className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%',
                  border: '1.5px solid currentColor',
                  fontSize: 14, fontWeight: 700, marginRight: 8, flexShrink: 0,
                }}>{i + 1}</span>
                {label}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <>
            <div ref={errorRef}>
              <ErrorMessage message={error} />
            </div>
            <div style={{ padding: '20px' }}>
              <RegisterConfirmStep
                form={form}
                agreed={agreed}
                setAgreed={setAgreed}
                images={images}
                selectedCat={selectedCat}
                selectedTrade={selectedTrade}
                endDt={endDt}
                maxImages={MAX_IMAGES}
              />
            </div>
          </>
        )}
      </div>

      {/* step 0: 상품입력 탭 — 기존과 동일하게 스텝 카드 바깥에 알림 표시 */}
      {step === 0 && <div ref={errorRef}><ErrorMessage message={error} /></div>}

      {/* step 0: 상품 정보 + 경매 설정 카드 나란히 */}
      {step === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'stretch' }}>
          <section className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#eef2fb', padding: '14px 20px' }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>상품 정보</h3>
            </div>
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
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
            </div>
          </section>

          <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: '#eef2fb', padding: '14px 20px' }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>경매 설정</h3>
            </div>
            <div style={{ padding: '20px' }}>
              <AuctionSettingStep
                form={form}
                set={set}
                policyAgreed={policyAgreed}
                setPolicyAgreed={setPolicyAgreed}
                auctionRange={auctionRange}
                setAuctionRange={setAuctionRange}
                endDt={endDt}
                bidUnits={BID_UNITS}
                submitted={submitted}
              />
            </div>
          </section>
        </div>
      )}

      {/* 하단 버튼 */}
      <div className="row" style={{ justifyContent: 'space-between', padding: '16px 0', marginTop: 16 }}>
        {step > 0 ? (
          <button type="button" onClick={() => { setStep(0); setSubmitted(false); }} disabled={loading} className="btn btn-ghost">
            이전
          </button>
        ) : (
          <div />
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => { if (validateStep0(false)) handleSubmit('PRDC0001'); }} disabled={loading} className="btn btn-ghost">
            임시저장
          </button>

          {step < 1 ? (
            <button type="button" onClick={goNext} className="btn btn-primary">
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!agreed) {
                  setError('등록 정보 확인 및 동의가 필요합니다.');
                  setErrorTick(t => t + 1);
                  return;
                }
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

    </main>
  );
}
