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
import { uploadImage } from '@api/fileApi';
import ErrorMessage from '@components/common/ErrorMessage';
import ProductInfoStep from './steps/ProductInfoStep';
import AuctionSettingStep from './steps/AuctionSettingStep';
import RegisterConfirmStep from './steps/RegisterConfirmStep';
import { resolvePendingDescriptionImages } from '@components/product/richTextEditorImages';

// 브라우저 뒤로가기로 이 페이지에 돌아왔을 때 입력하던 내용이 사라지지 않도록,
// 컴포넌트가 언마운트돼도 살아있는 모듈 스코프 캐시에 폼 상태를 보관해둔다.
// DB에는 절대 쓰지 않는다 — 실제 저장은 여전히 임시저장·상품등록 클릭 시점에만 일어난다.
// 새로고침(F5)이나 탭을 닫으면 사라지는 순수 인메모리 캐시다(File 객체를 들고 있어 sessionStorage로 못 옮김).
let draftCache = null; // { key, form, images, auctionRange, step, policyAgreed, agreed, pendingDescFiles }

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
  const draftKey = editPrdSn ?? 'new'; // 뒤로가기로 돌아왔을 때 지금 이 진입과 같은 draft인지 구분하는 키
  // 렌더 중(첫 마운트) 한 번만 평가 — 아래 동기화 effect가 draftCache를 다시 써버리기 전에
  // "이번 마운트가 캐시에서 복원된 것인지"를 고정해둬야 서버 재조회 여부를 정확히 판단할 수 있다.
  const hasCachedDraft = draftCache?.key === draftKey;

  // ─── UI 상태 ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState(() => hasCachedDraft ? draftCache.step : 0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [policyAgreed, setPolicyAgreed] = useState(() => hasCachedDraft ? draftCache.policyAgreed : false); // 스텝1 경매 정책 동의
  const [agreed, setAgreed] = useState(() => hasCachedDraft ? draftCache.agreed : false);                   // 스텝2 최종 등록 동의
  const [auctionRange, setAuctionRange] = useState(() => hasCachedDraft
    ? draftCache.auctionRange
    : { start: '', end: '', startTime: '09:00', endTime: '09:00' }); // 경매 기간 범위
  const [images, setImages] = useState(() => hasCachedDraft ? draftCache.images : []); // [{ id, flSn, url, file }] — file이 있으면 아직 미업로드, 첫 번째가 대표
  const [bannedKeywords, setBannedKeywords] = useState([]);
  const [bannedKeywordError, setBannedKeywordError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorTick, setErrorTick] = useState(0); // 동일한 에러 메시지라도 재클릭 시 다시 스크롤시키기 위한 트리거
  const errorRef = useRef(null);
  // 상품설명 속 이미지(blobUrl -> File, 아직 업로드 안 됨) — RichTextEditor가 직접 채워넣고,
  // 여기 부모가 갖고 있어야 스텝 전환으로 RichTextEditor가 언마운트돼도 파일이 사라지지 않는다.
  // Map 자체는 절대 교체되지 않고 내부만 변경되는 안정적인 참조라 useState로 보관한다(렌더 중 ref.current 접근 금지 규칙 회피).
  const [pendingDescFilesMap] = useState(() => hasCachedDraft ? draftCache.pendingDescFiles : new Map());
  // 임시저장 draft 복원 시 startNow 변경으로 경매기간 초기화 효과가 복원값을 덮어쓰지 않도록 막는 플래그
  const suppressRangeResetRef = useRef(hasCachedDraft);
  // 제출 성공 후에는 캐시 동기화 effect가 다시 draftCache를 채우지 않도록 막는 플래그
  const submittedRef = useRef(false);

  // ─── 폼 입력값 ───────────────────────────────────────────────────────────
  const [form, setForm] = useState(() => hasCachedDraft ? draftCache.form : {
    catSn: '',
    prdNm: '',
    prdCn: '',
    prdTrdMethodCd: 'TRDC0009',
    prdStartAmt: '',
    prdIbyAmt: '',
    startNow: true,
    bidUnit: 1000,
  });

  // 폼·이미지·설명이 바뀔 때마다 모듈 캐시에 동기화 — 뒤로가기로 돌아왔을 때 복원할 원본
  useEffect(() => {
    if (submittedRef.current) return;
    draftCache = { key: draftKey, form, images, auctionRange, step, policyAgreed, agreed, pendingDescFiles: pendingDescFilesMap };
  }, [draftKey, form, images, auctionRange, step, policyAgreed, agreed, pendingDescFilesMap]);

  // ─── 카테고리 목록 + (수정 모드, 캐시 복원이 아닐 때만) 기존 상품 데이터 로드 ─────
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

    // 캐시로 복원된 경우엔 이미 최신 입력값을 들고 있으니 서버에서 다시 불러오지 않는다.
    if (editPrdSn && !hasCachedDraft) {
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
              bidUnit:        p.prdDraftBidUnit != null ? Number(p.prdDraftBidUnit) : prev.bidUnit,
              // 임시저장 시 경매기간을 저장해뒀다면 예약 모드로 복원 (즉시시작은 항상 당일 고정이라 재개 시 다시 고르면 됨)
              startNow:       p.prdDraftStartDt || p.prdDraftEndDt ? false : prev.startNow,
            }));
            if (p.prdDraftStartDt || p.prdDraftEndDt) {
              suppressRangeResetRef.current = true;
              const splitDt = (iso) => {
                if (!iso) return { date: '', time: '' };
                const [date, time] = iso.split('T');
                return { date, time: time ? time.slice(0, 5) : '' };
              };
              const start = splitDt(p.prdDraftStartDt);
              const end = splitDt(p.prdDraftEndDt);
              setAuctionRange(prev => ({
                ...prev,
                start: start.date,
                end: end.date,
                startTime: start.time || prev.startTime,
                endTime: end.time || prev.endTime,
              }));
            }
            if (p.imageList?.length > 0) {
              setImages(p.imageList.map(img => ({ id: img.flSn, flSn: img.flSn, url: img.url, file: null })));
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
    if (suppressRangeResetRef.current) {
      suppressRangeResetRef.current = false;
      return;
    }
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
      if (auctionRange.end === auctionRange.start) {
        // 즉시시작 + 당일 종료: 등록 시각과 같은 시:분으로는 계산할 수 없어(이미 지난 시각) 직접 고른 종료 시간을 사용
        return new Date(`${auctionRange.end}T${auctionRange.endTime || '09:00'}:00`);
      }
      // 즉시시작 + 이후 날짜 종료: 종료 시각을 등록 시각의 HH:mm으로 고정
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
      // 여기(임시저장·상품등록 클릭)에서만 실제로 서버에 업로드한다 — 그 전까지는 로컬 미리보기(blob:)뿐
      const [finalPrdCn, uploadedImages] = await Promise.all([
        resolvePendingDescriptionImages(form.prdCn, pendingDescFilesMap),
        Promise.all(images.map(async img => {
          if (img.flSn) return img; // 이미 업로드된(수정 모드 기존) 이미지는 재업로드하지 않음
          const res = await uploadImage(img.file, 'product');
          URL.revokeObjectURL(img.url);
          return { ...img, flSn: res.data.flSn, url: res.data.url };
        })),
      ]);
      setImages(uploadedImages); // 실패 후 재시도 시 중복 업로드되지 않도록 반영

      const endDt = calcEndDt();
      const startDt = form.startNow ? new Date() : (auctionRange.start ? new Date(`${auctionRange.start}T${auctionRange.startTime || '00:00'}:00`) : new Date());
      const payload = {
        catSn:          Number(form.catSn),
        prdNm:          form.prdNm.trim(),
        prdCn:          finalPrdCn || null,
        prdStartAmt:    Number(form.prdStartAmt),
        prdIbyAmt:      form.prdIbyAmt ? Number(form.prdIbyAmt) : null,
        prdTrdMethodCd: form.prdTrdMethodCd,
        prdStatusCd:    statusCd,
        // 수정 모드에서 새 이미지를 업로드하지 않으면 null → 백엔드에서 기존 이미지 유지
        flSnList:       uploadedImages.length > 0 ? uploadedImages.map(img => img.flSn) : null,
        // 임시저장이어도 값은 그대로 보낸다 — 백엔드가 prdStatusCd로 판단해 draft 보존 컬럼/AUCTION 중 알맞은 곳에 저장
        aucStartDt:     startDt.toISOString(),
        aucEndDt:       endDt ? endDt.toISOString() : null,
        bidUnit:        form.bidUnit,
      };
      const result = editPrdSn
        ? await updateProduct(editPrdSn, payload)
        : await registerProduct(payload);
      const prdSn = result.data?.prdSn ?? editPrdSn;
      queryClient.invalidateQueries({ queryKey: ['products', 'my'] });
      submittedRef.current = true;
      draftCache = null; // DB에 반영됐으니 임시 캐시는 정리 — 다음 진입은 "재개" 흐름(서버 재조회)이 담당
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
                auctionRange={auctionRange}
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
                pendingDescFilesMap={pendingDescFilesMap}
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
                const finalEndDt = calcEndDt();
                if (finalEndDt && finalEndDt.getTime() <= Date.now()) {
                  setError('경매 종료 시각이 이미 지났습니다. 이전 단계에서 경매 기간을 다시 확인해 주세요.');
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
