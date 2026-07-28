// src/pages/service/ServiceRequestFormPage.jsx
// 서비스 요청서 작성 페이지 — 요청자가 서비스를 요청하는 폼 (F-SVC-001~004)
// 라우트 예정: /service-requests/new (신규), 수정 시 location.state.svcReqSn로 임시저장 불러오기
// 목업: 팀전달_목업_서비스신청_카테고리선택_260727.html (백종남6 제공) — 카테고리 선택 →
// 하위 단계 카드가 순차적으로 쌓이는 위저드 방식. 단계 데이터는 serviceRequestWizardSteps.js 참고.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCategories } from '@api/categoryApi';
import { registerServiceRequest, updateServiceRequest, getServiceRequest } from '@api/serviceRequestApi';
import ErrorMessage from '@components/common/ErrorMessage';
import AlertModal from '@components/common/AlertModal';
import { WIZARD_STEPS, CATEGORY_NEXT_STEP, CATEGORY_META } from './serviceRequestWizardSteps';

const SERVICE_DOMAIN_CD = 'CATC0002';
const ETC = '기타'; // '기타' 선택지는 어디에 있든 텍스트 입력을 추가로 받는다

// 카테고리 선택 카드 아이콘 — 마이페이지 대시보드 통계카드(StatCard)와 같은
// "컬러 박스 + 화이트 아이콘" 톤을 맞추기 위한 라인 아이콘 (해당 카테고리 전용 이미지 에셋이 아직 없어 인라인 SVG로 대체)
function CategoryIcon({ name, className }) {
  const common = { viewBox: '0 0 24 24', width: 32, height: 32, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', className };
  switch (name) {
    case '이사':
      return (
        <svg {...common}>
          <path d="M1 4h13v11H1z" />
          <path d="M14 8h4l3 3v4h-7V8z" />
          <circle cx="5.5" cy="18" r="1.8" />
          <circle cx="18.5" cy="18" r="1.8" />
        </svg>
      );
    case '청소':
      return (
        <svg {...common}>
          {/* 손잡이 */}
          <line x1="18" y1="2" x2="12" y2="13" />
          {/* 대걸레 머리 고정대 */}
          <line x1="6" y1="13" x2="18" y2="13" />
          {/* 술(걸레 가닥) */}
          <line x1="7" y1="13" x2="6" y2="21" />
          <line x1="10" y1="13" x2="9.5" y2="21" />
          <line x1="13" y1="13" x2="13" y2="21" />
          <line x1="16" y1="13" x2="16.5" y2="21" />
        </svg>
      );
    case '설치·수리':
      return (
        <svg {...common}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z" />
        </svg>
      );
    case '인테리어':
      return (
        <svg {...common}>
          <path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-2 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.2 0-.9.7-1.5 1.6-1.5H16a4 4 0 0 0 4-4c0-4.4-3.6-8-8-8z" />
          <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="10.5" cy="7" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="7.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="11" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case '레슨':
      return (
        <svg {...common}>
          <path d="M22 9L12 4 2 9l10 5 10-5z" />
          <path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
          <path d="M22 9v6" />
        </svg>
      );
    default:
      return null;
  }
}

// 확정된 답변 문자열("건물 유형: 원룸", "평수: 8평 / 거주 인원: 1명")을 편집 화면 입력값으로 되돌린다.
// 임시저장 이어서 작성 시에만 쓰이며, single 타입은 answers[stepId] 자체가 선택값이라 별도 변환이 필요 없다.
// "기타(입력내용)" 형태는 체크박스/칩 값은 '기타'로, 입력내용은 freeText로 분리해 돌려준다.
function parseAnswerToDraft(step, value) {
  if (step.type === 'multi') {
    const labels = value ? value.split(', ') : [];
    const freeText = {};
    const draft = labels.map(l => {
      const m = l.match(/^기타\((.*)\)$/);
      if (m) { freeText[ETC] = m[1]; return ETC; }
      return l;
    });
    return { draft, freeText };
  }
  if (step.type === 'form') {
    if (value === '(입력 없음)') return { draft: {}, freeText: {} };
    const draft = {};
    const freeText = {};
    value.split(' / ').forEach(pair => {
      const sep = pair.indexOf(': ');
      if (sep === -1) return;
      const key = pair.slice(0, sep);
      let v = pair.slice(sep + 2);
      const m = v.match(/^기타\((.*)\)$/);
      if (m) { freeText[key] = m[1]; v = ETC; }
      draft[key] = v;
    });
    return { draft, freeText };
  }
  return { draft: undefined, freeText: {} };
}

export default function ServiceRequestFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const editSvcReqSn = location.state?.svcReqSn ?? null; // 임시저장 수정 모드

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // 카테고리·기존 요청서 로딩 실패 등 페이지 상단 배너용
  const [alertMsg, setAlertMsg] = useState(''); // 유효성 검증·제출 실패 등 화면 중앙 알림 모달(AlertModal)용
  const [submitted, setSubmitted] = useState(false);
  const errorRef = useRef(null);

  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null); // { catSn, catNm }

  // 위저드 진행 상태 — chain: 화면에 쌓인 단계 id 순서, answers: 단계별 확정된 표시 문자열,
  // stepDraft: multi 선택 중 항목 / form 입력 중 값(다음 버튼 누르기 전까지의 임시 상태)
  const [chain, setChain] = useState([]);
  const [answers, setAnswers] = useState({});
  const [stepDraft, setStepDraft] = useState({});
  const [isComplete, setIsComplete] = useState(false); // memo 단계까지 완료해야 공개 가능

  // '기타' 선택 시 추가로 받는 텍스트 — key: `${stepId}:${라벨 또는 form 필드 key}`
  const [freeTextDraft, setFreeTextDraft] = useState({});
  // single 타입 단계에서 '기타'를 눌러 텍스트 입력을 기다리는 중인 stepId (즉시 다음으로 못 넘어감)
  const [pendingEtcStep, setPendingEtcStep] = useState(null);

  const cardRefs = useRef({});

  // 저장된 items 배열("단계 제목: 답변" 순서 저장)을 카테고리 분기 그래프를 따라가며 되감아
  // chain·answers·stepDraft를 복원한다. 저장 형식을 이 화면이 직접 정하므로 결정적으로 복원 가능.
  function restoreFromExisting(cat, s) {
    setSelectedCategory({ catSn: cat.catSn, catNm: cat.catNm });

    const items = Array.isArray(s.items) ? s.items : [];
    let stepId = CATEGORY_NEXT_STEP[cat.catNm];
    let idx = 0;
    const newChain = [];
    const newAnswers = {};
    const newDraft = {};
    const newFreeText = {};

    while (stepId && WIZARD_STEPS[stepId] && idx < items.length) {
      const step = WIZARD_STEPS[stepId];
      const raw = items[idx];
      const prefix = `${step.title}: `;
      if (typeof raw !== 'string' || !raw.startsWith(prefix)) break;

      const value = raw.slice(prefix.length);
      newAnswers[stepId] = value;
      const parsed = parseAnswerToDraft(step, value);
      newDraft[stepId] = parsed.draft;
      Object.entries(parsed.freeText).forEach(([key, text]) => { newFreeText[`${stepId}:${key}`] = text; });
      newChain.push(stepId);
      idx += 1;

      let nextId = step.next;
      if (step.type === 'single') {
        const answerLabel = value.startsWith(`${ETC}(`) ? ETC : value;
        const opt = step.options.find(o => o.label === answerLabel);
        if (opt?.next) nextId = opt.next;
      }
      stepId = nextId;
    }

    // budget·memo는 items가 아니라 전용 컬럼(svcReqBdgtAmt·svcReqCn)에서 복원한다.
    if (s.svcReqBdgtAmt != null) {
      newDraft.budget = { 예산: '금액 입력', 금액: String(s.svcReqBdgtAmt) };
    }
    if (s.svcReqCn) {
      newDraft.memo = { 메모: s.svcReqCn };
    }

    setChain(newChain);
    setAnswers(newAnswers);
    setStepDraft(prev => ({ ...prev, ...newDraft }));
    setFreeTextDraft(prev => ({ ...prev, ...newFreeText }));
  }

  useEffect(() => {
    getCategories(SERVICE_DOMAIN_CD)
      .then(res => {
        const children = res.data.filter(c => c.catParentSn !== null);
        setCategories(children);

        if (editSvcReqSn) {
          getServiceRequest(editSvcReqSn)
            .then(res2 => {
              const s = res2.data;
              setTitle(s.svcReqTtl ?? '');
              const cat = children.find(c => String(c.catSn) === String(s.catSn));
              if (cat) restoreFromExisting(cat, s);
            })
            .catch(() => setError('기존 요청서 정보를 불러오지 못했습니다.'));
        }
      })
      .catch(() => setError('카테고리를 불러오지 못했습니다.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  // 새 단계 카드가 추가될 때만 그 위치로 스크롤 (매 렌더마다 스크롤되면 입력 중 커서가 튐)
  useEffect(() => {
    const lastId = chain[chain.length - 1];
    const el = lastId && cardRefs.current[lastId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [chain]);

  // stepId "뒤"에 쌓인 카드·답변·입력중 값을 전부 제거한다 (앞 단계 재선택 시 초기화).
  const truncateAfter = (stepId) => {
    const idx = chain.indexOf(stepId);
    const kept = idx === -1 ? [] : chain.slice(0, idx + 1);
    const removed = chain.slice(kept.length);
    if (removed.length) {
      setAnswers(prev => {
        const next = { ...prev };
        removed.forEach(id => delete next[id]);
        return next;
      });
      setStepDraft(prev => {
        const next = { ...prev };
        removed.forEach(id => delete next[id]);
        return next;
      });
      setFreeTextDraft(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (removed.some(id => key.startsWith(`${id}:`))) delete next[key];
        });
        return next;
      });
      setPendingEtcStep(prev => (removed.includes(prev) ? null : prev));
    }
    setIsComplete(false);
    return kept;
  };

  const proceed = (kept, nextId) => {
    if (nextId) {
      setChain([...kept, nextId]);
    } else {
      setChain(kept);
      setIsComplete(true);
    }
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory({ catSn: cat.catSn, catNm: cat.catNm });
    setAnswers({});
    setStepDraft({});
    setFreeTextDraft({});
    setPendingEtcStep(null);
    setIsComplete(false);
    setError('');
    const firstStep = CATEGORY_NEXT_STEP[cat.catNm];
    setChain(firstStep ? [firstStep] : []);
  };

  const handleSingleSelect = (stepId, option) => {
    // '기타'는 즉시 확정하지 않고 텍스트 입력을 기다린다 (handleEtcSingleConfirm에서 확정)
    if (option.label === ETC) {
      setPendingEtcStep(stepId);
      return;
    }
    setPendingEtcStep(prev => (prev === stepId ? null : prev));
    const step = WIZARD_STEPS[stepId];
    const kept = truncateAfter(stepId);
    setAnswers(prev => ({ ...prev, [stepId]: option.label }));
    proceed(kept, option.next || step.next);
  };

  const handleEtcSingleConfirm = (stepId) => {
    const step = WIZARD_STEPS[stepId];
    const text = (freeTextDraft[`${stepId}:${ETC}`] || '').trim();
    if (!text) {
      setAlertMsg('기타 내용을 입력해 주세요.');
      return;
    }
    const option = step.options.find(o => o.label === ETC);
    const kept = truncateAfter(stepId);
    setAnswers(prev => ({ ...prev, [stepId]: `${ETC}(${text})` }));
    setPendingEtcStep(null);
    proceed(kept, option?.next || step.next);
  };

  const handleMultiToggle = (stepId, label) => {
    setStepDraft(prev => {
      const current = prev[stepId] || [];
      const next = current.includes(label) ? current.filter(l => l !== label) : [...current, label];
      return { ...prev, [stepId]: next };
    });
  };

  const handleMultiConfirm = (stepId) => {
    const step = WIZARD_STEPS[stepId];
    const picked = stepDraft[stepId] || [];
    if (picked.length === 0) {
      setAlertMsg('한 개 이상 선택해 주세요.');
      return;
    }
    if (picked.includes(ETC) && !(freeTextDraft[`${stepId}:${ETC}`] || '').trim()) {
      setAlertMsg('기타 내용을 입력해 주세요.');
      return;
    }
    const kept = truncateAfter(stepId);
    const labels = picked.map(l => (l === ETC ? `${ETC}(${freeTextDraft[`${stepId}:${ETC}`].trim()})` : l));
    setAnswers(prev => ({ ...prev, [stepId]: labels.join(', ') }));
    proceed(kept, step.next);
  };

  const handleFormFieldChange = (stepId, key, value) => {
    setStepDraft(prev => ({ ...prev, [stepId]: { ...(prev[stepId] || {}), [key]: value } }));
  };

  const handleFormConfirm = (stepId) => {
    const step = WIZARD_STEPS[stepId];
    const values = stepDraft[stepId] || {};
    const missingRequired = step.fields.find(f => f.required && !(values[f.key] || '').toString().trim());
    if (missingRequired) {
      setAlertMsg(`${missingRequired.key}을(를) 입력해 주세요.`);
      return;
    }
    const missingDigit = step.fields.find(f => f.requireDigit && !/\d/.test((values[f.key] || '').toString()));
    if (missingDigit) {
      setAlertMsg(`${missingDigit.key}에 숫자를 포함해 입력해 주세요.`);
      return;
    }
    const etcFieldMissingText = step.fields.some(
      f => f.type === 'choice' && values[f.key] === ETC && !(freeTextDraft[`${stepId}:${f.key}`] || '').trim()
    );
    if (etcFieldMissingText) {
      setAlertMsg('기타 내용을 입력해 주세요.');
      return;
    }
    const vals = step.fields
      .map(f => {
        let v = (values[f.key] || '').toString().trim();
        if (f.type === 'choice' && v === ETC) {
          const text = (freeTextDraft[`${stepId}:${f.key}`] || '').trim();
          if (text) v = `${ETC}(${text})`;
        }
        return { k: f.key, v };
      })
      .filter(x => x.v)
      .map(x => `${x.k}: ${x.v}`);
    const kept = truncateAfter(stepId);
    setAnswers(prev => ({ ...prev, [stepId]: vals.length ? vals.join(' / ') : '(입력 없음)' }));
    proceed(kept, step.next);
  };

  const validateBasic = () => {
    setSubmitted(true);
    if (!title.trim() || !selectedCategory) {
      setAlertMsg('요청 제목과 카테고리를 모두 입력해 주세요.');
      return false;
    }
    return true;
  };

  // 위저드 각 단계 답변을 등록 API가 받는 형태로 변환한다.
  // budget·memo 단계는 전용 필드(svcReqBdgtAmt·svcReqCn)로, 나머지 단계는 SVC_REQ_ITEM 자유 텍스트 목록으로 보낸다.
  const buildPayload = (statusCd) => {
    const budgetDraft = stepDraft.budget || {};
    const hasBudget = budgetDraft['예산'] === '금액 입력' && budgetDraft['금액'];
    const budgetAmount = hasBudget ? Number(String(budgetDraft['금액']).replace(/[^0-9]/g, '')) : null;
    const memoText = (stepDraft.memo?.['메모'] || '').trim() || null;

    const items = chain
      .filter(id => id !== 'budget' && id !== 'memo')
      .map(id => `${WIZARD_STEPS[id].title}: ${answers[id]}`);

    return {
      catSn: Number(selectedCategory.catSn),
      svcReqTtl: title.trim(),
      svcReqCn: memoText,
      svcReqBdgtAmt: budgetAmount != null && !Number.isNaN(budgetAmount) ? budgetAmount : null,
      svcReqStatusCd: statusCd,
      items,
    };
  };

  const submit = async (statusCd) => {
    setLoading(true);
    try {
      const payload = buildPayload(statusCd);
      const result = editSvcReqSn
        ? await updateServiceRequest(editSvcReqSn, payload)
        : await registerServiceRequest(payload);
      const svcReqSn = result.data?.svcReqSn ?? editSvcReqSn;
      navigate(`/service-requests/${svcReqSn}`);
    } catch (err) {
      const msg = err.response?.data?.message;
      setAlertMsg(msg || (editSvcReqSn ? '요청서 수정에 실패했습니다.' : '요청서 등록에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDraft = () => { if (validateBasic()) submit('SVCC0001'); };
  const handlePublish = () => {
    if (!validateBasic()) return;
    if (!isComplete) {
      setAlertMsg('모든 단계를 마쳐야 요청서를 공개할 수 있어요. 진행 중이라면 임시저장을 이용해 주세요.');
      return;
    }
    submit('SVCC0002');
  };

  return (
    <main className="container seller-page">
      <div className="page-title"><div><h1>{editSvcReqSn ? '서비스 요청서 수정' : '서비스 요청서 작성'}</h1></div></div>

      <div ref={errorRef}><ErrorMessage message={error} /></div>

      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#eef2fb', padding: '14px 20px' }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>요청 정보</h3>
        </div>
        <div style={{ padding: '20px' }}>
          <div className="field">
            <label>요청 제목 <span>{title.length}/200</span></label>
            <input
              className="input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={200}
              placeholder="예) 성수동 원룸 이사 운반"
            />
          </div>

          <div className="field">
            <label>카테고리</label>
            {/* 마이페이지 대시보드 통계카드(MyPageDashboard StatCard)와 같은 톤 —
                컬러 박스 + 화이트 아이콘, 선택 시 우측 상단에 체크 배지 표시 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {categories.map(cat => {
                const meta = CATEGORY_META[cat.catNm] || {};
                const active = selectedCategory?.catSn === cat.catSn;
                const color = meta.color || '#5f5e5a';
                return (
                  <button
                    key={cat.catSn}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className="relative rounded-[10px] text-white p-4 text-left border-none cursor-pointer"
                    style={{ backgroundColor: color, boxShadow: active ? '0 0 0 3px #1a1a18' : 'none' }}
                  >
                    {active && (
                      <span
                        className="absolute right-3 top-3 flex items-center justify-center size-[20px] rounded-full bg-white text-[13px] font-bold"
                        style={{ color }}
                      >✓</span>
                    )}
                    <CategoryIcon name={cat.catNm} className="mb-2" />
                    <p className="font-bold text-[16px] leading-tight m-0">{cat.catNm}</p>
                    {meta.sub && <p className="text-[12px] opacity-80 mt-1 m-0">{meta.sub}</p>}
                  </button>
                );
              })}
            </div>
            {submitted && !selectedCategory && (
              <span style={{ fontSize: 15, fontWeight: 700, color: '#c0392b', display: 'block', marginTop: 6 }}>카테고리를 선택해 주세요</span>
            )}
          </div>
        </div>
      </section>

      {/* ─── 단계 카드 ─────────────────────────────────────────
          카테고리 선택 이후 이어지는 세부 질문. chain 순서대로 하나씩 쌓이고,
          앞 단계를 다시 선택하면 그 뒤 카드는 truncateAfter로 전부 사라진다. */}
      {chain.map((stepId, index) => {
        const step = WIZARD_STEPS[stepId];
        if (!step) return null;
        return (
          <section
            key={stepId}
            className="card"
            style={{ marginTop: 16 }}
            ref={el => { if (el) cardRefs.current[stepId] = el; }}
          >
            <div className="row" style={{ gap: 10, alignItems: 'baseline', marginBottom: step.desc ? 4 : 14 }}>
              <span style={{
                flex: 'none', width: 26, height: 26, borderRadius: '50%',
                background: '#e5efff', color: '#0048bf', fontSize: 13, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{index + 1}</span>
              <h2 style={{ margin: 0, fontSize: 18 }}>{step.title}</h2>
            </div>
            {step.desc && <p className="muted small" style={{ margin: '0 0 14px 36px' }}>{step.desc}</p>}

            {(step.type === 'single' || step.type === 'multi') && (
              <>
                <div className="wizard-option-grid">
                  {step.options.map(opt => {
                    const active = step.type === 'single'
                      ? (answers[stepId] === opt.label
                          || (opt.label === ETC && (answers[stepId]?.startsWith(`${ETC}(`) || pendingEtcStep === stepId)))
                      : (stepDraft[stepId] || []).includes(opt.label);
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        className={`wizard-option${active ? ' active' : ''}`}
                        onClick={() => (step.type === 'single' ? handleSingleSelect(stepId, opt) : handleMultiToggle(stepId, opt.label))}
                      >
                        {opt.icon && <span className="wizard-option-icon">{opt.icon}</span>}
                        <span className="wizard-option-label">{opt.label}</span>
                        {opt.sub && <span className="wizard-option-sub">{opt.sub}</span>}
                      </button>
                    );
                  })}
                </div>
                {step.type === 'multi' && (stepDraft[stepId] || []).includes(ETC) && (
                  <input
                    className="input"
                    style={{ marginTop: 10 }}
                    placeholder="기타 내용을 입력해 주세요"
                    value={freeTextDraft[`${stepId}:${ETC}`] || ''}
                    onChange={e => setFreeTextDraft(prev => ({ ...prev, [`${stepId}:${ETC}`]: e.target.value }))}
                  />
                )}
                {step.type === 'single' && pendingEtcStep === stepId && (
                  <div className="row" style={{ marginTop: 10 }}>
                    <input
                      className="input"
                      placeholder="기타 내용을 입력해 주세요"
                      value={freeTextDraft[`${stepId}:${ETC}`] || ''}
                      onChange={e => setFreeTextDraft(prev => ({ ...prev, [`${stepId}:${ETC}`]: e.target.value }))}
                    />
                    <button type="button" className="btn btn-primary" onClick={() => handleEtcSingleConfirm(stepId)}>다음</button>
                  </div>
                )}
                {step.type === 'multi' && (
                  <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
                    <span className="muted small" style={{ marginRight: 'auto' }}>해당 항목을 모두 선택한 뒤 다음을 눌러 주세요.</span>
                    <button type="button" className="btn btn-primary" onClick={() => handleMultiConfirm(stepId)}>다음</button>
                  </div>
                )}
              </>
            )}

            {step.type === 'form' && (
              <>
                {step.fields.map(f => (
                  <div className="field" key={f.key}>
                    <label>{f.key}{f.required && <span style={{ color: '#c0392b' }}> *</span>}</label>
                    {f.type === 'choice' ? (
                      <>
                        <div className="row">
                          {f.options.map(o => (
                            <button
                              key={o}
                              type="button"
                              className={`chip${stepDraft[stepId]?.[f.key] === o ? ' active' : ''}`}
                              onClick={() => handleFormFieldChange(stepId, f.key, o)}
                            >
                              {o}
                            </button>
                          ))}
                        </div>
                        {stepDraft[stepId]?.[f.key] === ETC && (
                          <input
                            className="input"
                            style={{ marginTop: 8 }}
                            placeholder="기타 내용을 입력해 주세요"
                            value={freeTextDraft[`${stepId}:${f.key}`] || ''}
                            onChange={e => setFreeTextDraft(prev => ({ ...prev, [`${stepId}:${f.key}`]: e.target.value }))}
                          />
                        )}
                      </>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        className="input"
                        rows={3}
                        placeholder={f.placeholder}
                        value={stepDraft[stepId]?.[f.key] || ''}
                        onChange={e => handleFormFieldChange(stepId, f.key, e.target.value)}
                      />
                    ) : (
                      <input
                        className="input"
                        type={f.type}
                        placeholder={f.placeholder}
                        value={stepDraft[stepId]?.[f.key] || ''}
                        onChange={e => handleFormFieldChange(stepId, f.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
                <div className="row" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
                  <button type="button" className="btn btn-primary" onClick={() => handleFormConfirm(stepId)}>
                    {step.next ? '다음' : '입력 완료'}
                  </button>
                </div>
              </>
            )}
          </section>
        );
      })}

      {isComplete && (
        <section className="card" style={{ marginTop: 16 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>요청 내용 확인</h2>
          <p className="muted small" style={{ margin: '0 0 14px' }}>아래 내용으로 서비스 요청서가 등록됩니다.</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {chain.map(stepId => (
              <div key={stepId} className="row" style={{ borderBottom: '1px solid #f0efec', paddingBottom: 8, gap: 12 }}>
                <span className="muted small" style={{ flex: '0 0 160px' }}>{WIZARD_STEPS[stepId].title}</span>
                <span style={{ fontWeight: 500 }}>{answers[stepId]}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="row" style={{ justifyContent: 'space-between', padding: '16px 0', marginTop: 16 }}>
        <div />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleDraft} disabled={loading} className="btn btn-ghost">임시저장</button>
          <button type="button" onClick={handlePublish} disabled={loading} className="btn btn-primary">
            {loading ? '등록 중...' : '요청서 공개'}
          </button>
        </div>
      </div>

      <AlertModal open={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg('')} />
    </main>
  );
}
