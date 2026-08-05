// src/pages/product/ProductRegisterPage.jsx
// 상품(경매) 등록 페이지 — 판매자가 경매에 올릴 상품을 2단계로 입력하는 화면
// 목업: 07_product_register_seller.html 기반
// 라우트: /product/register
// 단계: 0(상품 입력 — 상품정보+경매설정 통합) → 1(등록 확인)  ※ STEP_LABELS 참조
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getCategories } from '@api/categoryApi';
import { fetchBannedKeywords, registerProduct, updateProduct, getProduct } from '@api/productApi';
import { uploadImage } from '@api/fileApi';
import ErrorMessage from '@components/common/ErrorMessage';
import AlertModal from '@components/common/AlertModal';
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
  const navigationType = useNavigationType(); // 'POP'(뒤로/앞으로가기) | 'PUSH'(링크·버튼으로 새로 진입) | 'REPLACE'
  const queryClient = useQueryClient();
  const editPrdSn = location.state?.prdSn ?? null; // 임시저장 수정 모드
  // 유찰 상품 재등록 모드 — AUCTION.PRD_SN이 UNIQUE 제약이라 같은 상품번호로는 경매를 다시 만들 수 없어서,
  // 기존 데이터를 불러와 새 상품으로 등록한다(editPrdSn은 null로 둬서 제출 시 POST/신규 생성되게 함).
  const relistFromPrdSn = location.state?.relistFromPrdSn ?? null;
  const draftKey = editPrdSn ?? (relistFromPrdSn ? `relist-${relistFromPrdSn}` : 'new'); // 뒤로가기로 돌아왔을 때 지금 이 진입과 같은 draft인지 구분하는 키
  // 렌더 중(첫 마운트) 한 번만 평가 — 아래 동기화 effect가 draftCache를 다시 써버리기 전에
  // "이번 마운트가 캐시에서 복원된 것인지"를 고정해둬야 서버 재조회 여부를 정확히 판단할 수 있다.
  // navigationType이 'POP'(진짜 뒤로가기)일 때만 캐시를 쓴다 — 그래야 "메인페이지 갔다가 경매등록
  // 버튼을 새로 클릭"(PUSH)했을 때는 이전 미완성 내용이 아니라 항상 빈 폼으로 시작한다.
  const hasCachedDraft = navigationType === 'POP' && draftCache?.key === draftKey;

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
  const [alertMsg, setAlertMsg] = useState(''); // 화면 중앙 알림 모달(AlertModal) — 유효성 검사 안내용
  const errorRef = useRef(null);
  // 상품설명 속 이미지(blobUrl -> File, 아직 업로드 안 됨) — RichTextEditor가 직접 채워넣고,
  // 여기 부모가 갖고 있어야 스텝 전환으로 RichTextEditor가 언마운트돼도 파일이 사라지지 않는다.
  // Map 자체는 절대 교체되지 않고 내부만 변경되는 안정적인 참조라 useState로 보관한다(렌더 중 ref.current 접근 금지 규칙 회피).
  const [pendingDescFilesMap] = useState(() => hasCachedDraft ? draftCache.pendingDescFiles : new Map());
  // 임시저장 draft 복원 시 startNow 변경으로 경매기간 초기화 효과가 복원값을 덮어쓰지 않도록 막는 플래그
  const suppressRangeResetRef = useRef(hasCachedDraft);
  // 제출 성공 후에는 캐시 동기화 effect가 다시 draftCache를 채우지 않도록 막는 플래그
  const submittedRef = useRef(false);
  const imgSectionRef = useRef(null);
  const prdNmRef = useRef(null);
  const catRef = useRef(null);
  const tradeRef = useRef(null);
  const startAmtRef = useRef(null);
  const ibyAmtRef = useRef(null);
  const auctionRangeRef = useRef(null);
  const policyRef = useRef(null);

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
    tradeRegions: [], // 직거래(TRDC0010)·둘 다 가능(TRDC0020) 희망 거래지역, 최대 5곳 — [{code, name}]
  });

  // 폼·이미지·설명이 바뀔 때마다 모듈 캐시에 동기화 — 뒤로가기로 돌아왔을 때 복원할 원본
  useEffect(() => {
    if (submittedRef.current) return;
    draftCache = { key: draftKey, form, images, auctionRange, step, policyAgreed, agreed, pendingDescFiles: pendingDescFilesMap };
  }, [draftKey, form, images, auctionRange, step, policyAgreed, agreed, pendingDescFilesMap]);

  // ─── 카테고리 목록 + (수정 모드, 캐시 복원이 아닐 때만) 기존 상품 데이터 로드 ─────
  // 세 요청은 서로 독립적이고 결과를 한데 모아 쓰는 곳이 없어서 각자 실행만 한다
  // (예전엔 배열에 모아 Promise.all로 감쌌지만 await도 반환도 하지 않는 무의미한 호출이라 제거, 2026-08-05 점검 정리)
  useEffect(() => {
    getCategories(PRODUCT_DOMAIN_CD)
      .then(res => {
        const children = res.data.filter(c => c.catParentSn !== null);
        setCategories(children);
      })
      .catch(() => setError('카테고리를 불러오지 못했습니다.'));
    fetchBannedKeywords()
      .then(res => setBannedKeywords(res.data))
      .catch(() => {});

    // 캐시로 복원된 경우엔 이미 최신 입력값을 들고 있으니 서버에서 다시 불러오지 않는다.
    if (editPrdSn && !hasCachedDraft) {
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
              tradeRegions:   p.tradeRegions ?? prev.tradeRegions,
              startNow:       p.prdDraftStartNowYn === 'Y' ? true
                            : p.prdDraftStartNowYn === 'N' ? false
                            : (p.prdDraftStartDt || p.prdDraftEndDt) ? false  // prdDraftStartNowYn 없는 이전 데이터 호환
                            : prev.startNow,
            }));
            if (p.prdDraftStartDt || p.prdDraftEndDt) {
              suppressRangeResetRef.current = true;
              // 백엔드는 오프셋 없는 로컬(KST) 시각 그대로 저장하므로 그대로 파싱한다 (toLocalIsoString과 짝)
              const splitDt = (iso) => {
                if (!iso) return { date: '', time: '' };
                const d = new Date(iso);
                const pad = n => String(n).padStart(2, '0');
                return {
                  date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
                  time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
                };
              };
              const isStartNow = p.prdDraftStartNowYn === 'Y';
              const start = splitDt(p.prdDraftStartDt);
              const end = splitDt(p.prdDraftEndDt);
              setAuctionRange(prev => ({
                ...prev,
                start: start.date,
                end: end.date,
                // 즉시시작이면 UI의 "종료 시간"이 startTime에 저장되므로 prdDraftEndDt 시각을 startTime으로 복원
                startTime: isStartNow ? (end.time || prev.startTime) : (start.time || prev.startTime),
                endTime: end.time || prev.endTime,
              }));
            }
            if (p.imageList?.length > 0) {
              setImages(p.imageList.map(img => ({ id: img.flSn, flSn: img.flSn, url: img.url, file: null })));
            }

            if (p.prdDraftPolicyAgreedYn === 'Y') {
              setPolicyAgreed(true);
            }
          })
          .catch(() => setError('기존 상품 정보를 불러오지 못했습니다.'))
      );
    } else if (relistFromPrdSn && !hasCachedDraft) {
      // 재등록 모드 — 날짜·시작시점·입찰단위·정책동의는 새로 정해야 하니 기본값 그대로 두고
      // 나머지 정보만 불러온다. editPrdSn이 null이라 제출 시 신규 등록(POST)으로 처리된다.
      getProduct(relistFromPrdSn)
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
            tradeRegions:   p.tradeRegions ?? prev.tradeRegions,
          }));
          if (p.imageList?.length > 0) {
            setImages(p.imageList.map(img => ({ id: img.flSn, flSn: img.flSn, url: img.url, file: null })));
          }
        })
        .catch(() => setError('기존 상품 정보를 불러오지 못했습니다.'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

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

  // 서버(백엔드 LocalDateTime, 서버도 KST)로 보낼 때는 UTC로 변환하는 toISOString() 대신
  // 화면에 보이는 시각 그대로(오프셋 없이) 보낸다 — toISOString()을 쓰면 백엔드가 오프셋을 무시하고
  // 숫자만 그대로 읽어서(예: KST 12:00 → UTC 03:00 문자열 → LocalDateTime "03:00") 9시간 밀린 값이
  // LocalDateTime.now()와 비교되어 이미 지난 시각으로 오판되는 문제가 있었다.
  const toLocalIsoString = (date) => {
    const pad = n => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  // 희망 거래지역 변경 — RegionSelector가 넘겨주는 선택 목록을 {code, name} 형태로 저장.
  // 6곳째부터는 반영하지 않고 안내만 띄운다(해제는 계속 허용).
  const MAX_TRADE_REGIONS = 5;
  const handleTradeRegionsChange = (selections) => {
    if (selections.length > MAX_TRADE_REGIONS) {
      setAlertMsg(`희망 거래지역은 최대 ${MAX_TRADE_REGIONS}곳까지 선택할 수 있습니다.`);
      return;
    }
    set('tradeRegions', selections.map(s => ({ code: s.code, name: s.label })));
  };

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
    // 예약 + 시작일 = 종료일 (당일 종료): 별도 선택한 종료 시간 사용
    if (auctionRange.start === auctionRange.end && auctionRange.endTime) {
      return new Date(`${auctionRange.end}T${auctionRange.endTime}:00`);
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
      // 업로드에 걸린 시간만큼 시각이 흘렀을 수 있어, 실제 전송 직전(업로드 완료 후)에 다시 한번 검증한다.
      // 클릭 시점에만 검사하면 업로드하는 몇 초 사이에 종료 시각이 지나버려 서버에서 거부될 수 있었다.
      if (statusCd === 'PRDC0002' && endDt && endDt.getTime() <= Date.now()) {
        setAlertMsg('경매 종료 시각이 이미 지났습니다. 이전 단계에서 경매 기간을 다시 확인해 주세요.');
        return;
      }
      const startDt = form.startNow ? new Date() : (auctionRange.start ? new Date(`${auctionRange.start}T${auctionRange.startTime || '00:00'}:00`) : new Date());
      // 업로드하는 사이 시간이 흘러 작성 시작 시점엔 유효했던 예약 시작 시각이 이미 지나버렸을 수 있어
      // endDt와 동일하게 실제 전송 직전(업로드 완료 후) 다시 한번 검증한다.
      if (statusCd === 'PRDC0002' && !form.startNow && startDt.getTime() <= Date.now()) {
        setAlertMsg('경매 시작 시각이 이미 지났습니다. 이전 단계에서 시작 시각을 다시 확인해 주세요.');
        return;
      }
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
        aucStartDt:     toLocalIsoString(startDt),
        startNow:       form.startNow,
        aucEndDt:       endDt ? toLocalIsoString(endDt) : null,
        bidUnit:        form.bidUnit,
        // 임시저장일 때만 의미 있음 — 재개 시 등록확인 탭으로 바로 이동할지 판단하는 값
        policyAgreed:   policyAgreed,
        // 직거래·둘 다 가능일 때만 의미 있음 — 그 외 거래방식이면 빈 배열
        tradeRegions:   form.tradeRegions,
      };
      const result = editPrdSn
        ? await updateProduct(editPrdSn, payload)
        : await registerProduct(payload);
      const prdSn = result.data?.prdSn ?? editPrdSn;
      queryClient.invalidateQueries({ queryKey: ['products', 'my'] });
      submittedRef.current = true;
      draftCache = null; // DB에 반영됐으니 임시 캐시는 정리 — 다음 진입은 "재개" 흐름(서버 재조회)이 담당
      // 임시저장은 판매내역 목록으로, 실제 경매 등록은 방금 만든 상품 상세로 이동
      navigate(statusCd === 'PRDC0001' ? '/user/mypage?section=auction-sales' : `/product/${prdSn}/seller`);
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
      setAlertMsg(msg);
      return false;
    };
    if (!form.prdNm.trim()) {
      prdNmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return fail('상품명을 입력해 주세요.');
    }
    if (!form.catSn) {
      catRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return fail('카테고리를 선택해 주세요.');
    }
    if (!form.prdTrdMethodCd) {
      tradeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return fail('거래 형태를 선택해 주세요.');
    }
    if (bannedKeywordError) {
      prdNmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return fail(bannedKeywordError);
    }
    if (images.length === 0) {
      imgSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return fail('상품 사진을 1개 이상 등록해 주세요.');
    }
    if (!form.prdStartAmt) {
      startAmtRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return fail('시작가를 입력해 주세요.');
    }
    if (!auctionRange.end) {
      auctionRangeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return fail('경매 기간을 지정해 주세요.');
    }
    // 임시저장 재개 시 저장해뒀던 기간이 그대로 복원될 수 있어, 실제 등록으로 진행할 때(requirePolicyAgreed)만
    // 이미 지난 날짜/시각인지 확인한다 — 임시저장은 지난 값이어도 그대로 보존하는 게 기존 정책이라 검사하지 않는다.
    if (requirePolicyAgreed) {
      const currentEndDt = calcEndDt();
      if (currentEndDt && currentEndDt.getTime() <= Date.now()) {
        auctionRangeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return fail('경매 종료 시각이 이미 지났습니다. 경매 기간을 다시 확인해 주세요.');
      }
      if (!form.startNow && auctionRange.start) {
        const currentStartDt = new Date(`${auctionRange.start}T${auctionRange.startTime || '00:00'}:00`);
        if (currentStartDt.getTime() <= Date.now()) {
          auctionRangeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return fail('경매 시작 시각이 이미 지났습니다. 시작 시각을 다시 확인해 주세요.');
        }
      }
    }
    if (Number(form.prdStartAmt) % form.bidUnit !== 0) {
      startAmtRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return fail(`시작가는 입찰 단위(${form.bidUnit.toLocaleString()}원)의 배수로 입력해 주세요.`);
    }
    if (form.prdIbyAmt && Number(form.prdIbyAmt) % form.bidUnit !== 0) {
      ibyAmtRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return fail(`즉시구매가는 입찰 단위(${form.bidUnit.toLocaleString()}원)의 배수로 입력해 주세요.`);
    }
    if (requirePolicyAgreed && !policyAgreed) {
      policyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    <main className="container">
<div className="page-title"><div><h1 style={{ fontWeight: 700 }}>{editPrdSn ? '경매 설정 완료' : relistFromPrdSn ? '상품 재등록' : '상품 등록'}</h1></div></div>

      {/* 스텝 인디케이터 */}
      <div className="card product-register-steps" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
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
        <div className="product-register-grid">
          {/* 래퍼: grid row 높이(경매설정 카드 기준)만큼 늘어나는 빈 셀 — 모바일에서는 일반 흐름으로 전환(common.css) */}
          <div className="product-info-cell">
            {/* 카드 자체는 absolute로 띄워 grid row 높이 계산에 관여하지 않음 — 모바일에서는 static으로 전환(common.css) */}
            <section className="card product-info-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#eef2fb', padding: '14px 20px', flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>상품 정보</h3>
              </div>
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
                  submitted={submitted}
                  imgSectionRef={imgSectionRef}
                  prdNmRef={prdNmRef}
                  catRef={catRef}
                  tradeRef={tradeRef}
                  onTradeRegionsChange={handleTradeRegionsChange}
                />
              </div>
            </section>
          </div>

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
                startAmtRef={startAmtRef}
                ibyAmtRef={ibyAmtRef}
                auctionRangeRef={auctionRangeRef}
                policyRef={policyRef}
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
                  setAlertMsg('등록 정보 확인 및 본문수정이 불가능함에 동의가 필요합니다.');
                  return;
                }
                // 종료 시각이 지났는지 검사는 이미지 업로드가 끝난 뒤(handleSubmit 내부)에서 한다 —
                // 여기서 미리 검사해봤자 업로드하는 동안 시간이 흘러 의미가 없다.
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

      <AlertModal open={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg('')} />

    </main>
  );
}
