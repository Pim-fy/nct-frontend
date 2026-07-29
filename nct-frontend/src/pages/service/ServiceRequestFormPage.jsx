// src/pages/service/ServiceRequestFormPage.jsx
// 서비스 요청서 작성 — 아코디언 위저드 (F-SVC-001~004)
// 라우트: /service-requests/new (신규), location.state.svcReqSn로 임시저장 수정
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getCategories } from '@api/categoryApi';
import { registerServiceRequest, updateServiceRequest, getServiceRequest } from '@api/serviceRequestApi';
import DaumPostcode from 'react-daum-postcode';
import ErrorMessage from '@components/common/ErrorMessage';
import AlertModal from '@components/common/AlertModal';
import ConfirmModal from '@components/common/ConfirmModal';
import { WIZARD_STEPS, CATEGORY_NEXT_STEP, CATEGORY_META } from './serviceRequestWizardSteps';

const SERVICE_DOMAIN_CD = 'CATC0002';
const ETC = '기타';

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
          <line x1="18" y1="2" x2="12" y2="13" />
          <line x1="6" y1="13" x2="18" y2="13" />
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
          <path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-2 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.2 0-.9.7-1.6 1.6-1.6H16a4 4 0 0 0 4-4c0-4.4-3.6-8-8-8z" />
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

// 이 단계에서 선택에 따라 다음 단계가 달라지는가
function isBranchingStep(stepId) {
  const step = WIZARD_STEPS[stepId];
  return step?.type === 'single' && step.options.some(o => o.next);
}

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
  const editSvcReqSn = location.state?.svcReqSn ?? null;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [alertMsg, setAlertMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const errorRef = useRef(null);

  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chain, setChain] = useState([]);
  const [answers, setAnswers] = useState({});
  const [stepDraft, setStepDraft] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [freeTextDraft, setFreeTextDraft] = useState({});
  const [pendingEtcStep, setPendingEtcStep] = useState(null);

  // 아코디언 상태
  const [editingStepId, setEditingStepId] = useState(null); // 재편집 중인 완료 단계
  const [editingCategory, setEditingCategory] = useState(false); // 카테고리 재선택 중
  const [confirmPending, setConfirmPending] = useState(null); // { msg, action } | null
  const [collapsedSteps, setCollapsedSteps] = useState(new Set()); // 수동으로 접힌 단계
  const [fieldErrors, setFieldErrors] = useState({}); // { 'stepId:fieldKey': 에러 메시지 }
  const [addressSearchKey, setAddressSearchKey] = useState(null); // 주소 검색 중인 'stepId:fieldKey'

  const cardRefs = useRef({});

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

  useEffect(() => {
    const lastId = chain[chain.length - 1];
    if (!lastId || answers[lastId]) return; // 새로 추가된 미답변 단계만 스크롤
    const el = cardRefs.current[lastId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [chain]);

  // ── 기존 헬퍼 ───────────────────────────────────────────────────────────────

  const truncateAfter = (stepId) => {
    const idx = chain.indexOf(stepId);
    const kept = idx === -1 ? [] : chain.slice(0, idx + 1);
    const removed = chain.slice(kept.length);
    if (removed.length) {
      setAnswers(prev => { const n = { ...prev }; removed.forEach(id => delete n[id]); return n; });
      setStepDraft(prev => { const n = { ...prev }; removed.forEach(id => delete n[id]); return n; });
      setFreeTextDraft(prev => {
        const n = { ...prev };
        Object.keys(n).forEach(key => { if (removed.some(id => key.startsWith(`${id}:`))) delete n[key]; });
        return n;
      });
      setPendingEtcStep(prev => (removed.includes(prev) ? null : prev));
      setCollapsedSteps(prev => { const n = new Set(prev); removed.forEach(id => n.delete(id)); return n; });
      setFieldErrors(prev => {
        const n = { ...prev };
        Object.keys(n).forEach(key => { if (removed.some(id => key.startsWith(`${id}:`))) delete n[key]; });
        return n;
      });
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

  // ── 카테고리 ────────────────────────────────────────────────────────────────

  const handleCategoryCardHeaderClick = () => {
    if (!selectedCategory) return;
    if (editingCategory) { setEditingCategory(false); return; } // 접기 토글
    const hasAnsweredDownstream = chain.some(id => answers[id] !== undefined);
    if (hasAnsweredDownstream) {
      setConfirmPending({
        msg: '카테고리를 변경하면 이후 입력한 내용이 모두 초기화됩니다.',
        action: () => {
          setSelectedCategory(null);
          setChain([]);
          setAnswers({});
          setStepDraft({});
          setFreeTextDraft({});
          setPendingEtcStep(null);
          setEditingStepId(null);
          setIsComplete(false);
          setEditingCategory(false);
        },
      });
    } else {
      setEditingCategory(true);
    }
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory({ catSn: cat.catSn, catNm: cat.catNm });
    setAnswers({});
    setStepDraft({});
    setFreeTextDraft({});
    setPendingEtcStep(null);
    setIsComplete(false);
    setEditingCategory(false);
    setEditingStepId(null);
    setFieldErrors({});
    setError('');
    const firstStep = CATEGORY_NEXT_STEP[cat.catNm];
    setChain(firstStep ? [firstStep] : []);
  };

  // ── 단계 카드 헤더 클릭 (토글) ─────────────────────────────────────────────

  const handleStepCardHeaderClick = (stepId) => {
    const expanded = isStepExpanded(stepId);
    if (expanded) {
      // 펼쳐진 상태 → 접기
      if (editingStepId === stepId) setEditingStepId(null);
      setCollapsedSteps(prev => new Set([...prev, stepId]));
    } else {
      // 접힌 상태 → 열기
      setCollapsedSteps(prev => { const n = new Set(prev); n.delete(stepId); return n; });
      if (answers[stepId]) handleCompletedStepClick(stepId);
    }
  };

  // ── 완료된 단계 카드 클릭 ───────────────────────────────────────────────────

  const handleCompletedStepClick = (stepId) => {
    if (editingStepId === stepId) return;
    const stepIdx = chain.indexOf(stepId);
    const hasDownstream = chain.slice(stepIdx + 1).some(id => answers[id] !== undefined);

    if (isBranchingStep(stepId) && hasDownstream) {
      setConfirmPending({
        msg: '이 항목을 변경하면 이후 입력한 내용이 초기화됩니다.',
        action: () => {
          // stepId 포함 이후 answers·draft 전부 제거
          const idx = chain.indexOf(stepId);
          const removed = chain.slice(idx);
          setAnswers(prev => { const n = { ...prev }; removed.forEach(id => delete n[id]); return n; });
          setStepDraft(prev => { const n = { ...prev }; removed.forEach(id => delete n[id]); return n; });
          setFreeTextDraft(prev => {
            const n = { ...prev };
            Object.keys(n).forEach(key => { if (removed.some(id => key.startsWith(`${id}:`))) delete n[key]; });
            return n;
          });
          setChain(chain.slice(0, idx + 1));
          setPendingEtcStep(null);
          setIsComplete(false);
          setEditingStepId(null);
        },
      });
    } else {
      // 비분기 단계: 그냥 펼침, 이후 카드 유지
      setEditingStepId(stepId);
    }
  };

  // ── single 선택 ─────────────────────────────────────────────────────────────

  const handleSingleSelect = (stepId, option) => {
    if (option.label === ETC) {
      setPendingEtcStep(stepId);
      return;
    }
    setPendingEtcStep(prev => (prev === stepId ? null : prev));

    if (editingStepId === stepId) {
      // 비분기 재편집: 답변만 교체, 이후 유지
      setAnswers(prev => ({ ...prev, [stepId]: option.label }));
      setEditingStepId(null);
      return;
    }

    const step = WIZARD_STEPS[stepId];
    const kept = truncateAfter(stepId);
    setAnswers(prev => ({ ...prev, [stepId]: option.label }));
    proceed(kept, option.next || step.next);
  };

  const handleEtcSingleConfirm = (stepId) => {
    const step = WIZARD_STEPS[stepId];
    const text = (freeTextDraft[`${stepId}:${ETC}`] || '').trim();
    if (!text) { setAlertMsg('기타 내용을 입력해 주세요.'); return; }
    const option = step.options.find(o => o.label === ETC);

    if (editingStepId === stepId) {
      setAnswers(prev => ({ ...prev, [stepId]: `${ETC}(${text})` }));
      setPendingEtcStep(null);
      setEditingStepId(null);
      return;
    }

    const kept = truncateAfter(stepId);
    setAnswers(prev => ({ ...prev, [stepId]: `${ETC}(${text})` }));
    setPendingEtcStep(null);
    proceed(kept, option?.next || step.next);
  };

  // ── multi 선택 ──────────────────────────────────────────────────────────────

  const NONE_LABEL = '없음';
  const handleMultiToggle = (stepId, label) => {
    setStepDraft(prev => {
      const cur = prev[stepId] || [];
      if (label === NONE_LABEL) {
        // 없음 선택 → 다른 선택지 전부 해제, 없음만 남김 (토글)
        const next = cur.includes(NONE_LABEL) ? [] : [NONE_LABEL];
        return { ...prev, [stepId]: next };
      }
      // 일반 선택지 → 없음 해제 후 토글
      const withoutNone = cur.filter(l => l !== NONE_LABEL);
      const next = withoutNone.includes(label) ? withoutNone.filter(l => l !== label) : [...withoutNone, label];
      return { ...prev, [stepId]: next };
    });
  };

  const handleMultiConfirm = (stepId) => {
    const step = WIZARD_STEPS[stepId];
    const picked = stepDraft[stepId] || [];
    if (picked.length === 0) { setAlertMsg('한 개 이상 선택해 주세요.'); return; }
    if (picked.includes(ETC) && !(freeTextDraft[`${stepId}:${ETC}`] || '').trim()) {
      setAlertMsg('기타 내용을 입력해 주세요.'); return;
    }
    const labels = picked.map(l => (l === ETC ? `${ETC}(${freeTextDraft[`${stepId}:${ETC}`].trim()})` : l));

    if (editingStepId === stepId) {
      setAnswers(prev => ({ ...prev, [stepId]: labels.join(', ') }));
      setEditingStepId(null);
      return;
    }

    const kept = truncateAfter(stepId);
    setAnswers(prev => ({ ...prev, [stepId]: labels.join(', ') }));
    proceed(kept, step.next);
  };

  // ── form 입력 ───────────────────────────────────────────────────────────────

  const handleFormFieldChange = (stepId, key, value) => {
    setStepDraft(prev => ({ ...prev, [stepId]: { ...(prev[stepId] || {}), [key]: value } }));
  };

  const handleFormConfirm = (stepId) => {
    const step = WIZARD_STEPS[stepId];
    const values = stepDraft[stepId] || {};

    const missingRequired = step.fields.find(f => f.required && !(values[f.key] || '').toString().trim());
    if (missingRequired) {
      const errKey = `${stepId}:${missingRequired.key}`;
      const msg = `${missingRequired.key}을(를) 입력해 주세요.`;
      setFieldErrors(prev => ({ ...prev, [errKey]: msg }));
      setAlertMsg(msg);
      cardRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const missingDigit = step.fields.find(f => f.requireDigit && !/\d/.test((values[f.key] || '').toString()));
    if (missingDigit) {
      const errKey = `${stepId}:${missingDigit.key}`;
      const msg = `${missingDigit.key}에 숫자를 포함해 입력해 주세요.`;
      setFieldErrors(prev => ({ ...prev, [errKey]: msg }));
      setAlertMsg(msg);
      cardRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const etcFieldMissingText = step.fields.some(
      f => f.type === 'choice' && values[f.key] === ETC && !(freeTextDraft[`${stepId}:${f.key}`] || '').trim()
    );
    if (etcFieldMissingText) { setAlertMsg('기타 내용을 입력해 주세요.'); return; }

    // 통과 시 이 단계 에러 전부 제거
    setFieldErrors(prev => {
      const n = { ...prev };
      step.fields.forEach(f => delete n[`${stepId}:${f.key}`]);
      return n;
    });

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

    if (editingStepId === stepId) {
      setAnswers(prev => ({ ...prev, [stepId]: vals.length ? vals.join(' / ') : '(입력 없음)' }));
      setEditingStepId(null);
      return;
    }

    const kept = truncateAfter(stepId);
    setAnswers(prev => ({ ...prev, [stepId]: vals.length ? vals.join(' / ') : '(입력 없음)' }));
    proceed(kept, step.next);
  };

  // ── 제출 ────────────────────────────────────────────────────────────────────

  const validateBasic = () => {
    setSubmitted(true);
    if (!title.trim() || !selectedCategory) {
      setAlertMsg('요청 제목과 카테고리를 모두 입력해 주세요.');
      return false;
    }
    return true;
  };

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
      setAlertMsg(err.response?.data?.message || (editSvcReqSn ? '요청서 수정에 실패했습니다.' : '요청서 등록에 실패했습니다.'));
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

  const handleConfirmOk = () => { confirmPending?.action(); setConfirmPending(null); };
  const handleConfirmCancel = () => setConfirmPending(null);

  const handleAddressComplete = (data) => {
    if (!addressSearchKey) return;
    const colonIdx = addressSearchKey.indexOf(':');
    const stepId = addressSearchKey.slice(0, colonIdx);
    const fieldKey = addressSearchKey.slice(colonIdx + 1);
    const address = data.roadAddress || data.jibunAddress || '';
    handleFormFieldChange(stepId, fieldKey, address);
    if (fieldErrors[addressSearchKey]) setFieldErrors(prev => { const n = { ...prev }; delete n[addressSearchKey]; return n; });
    setAddressSearchKey(null);
  };

  // ── 파생 상태 ────────────────────────────────────────────────────────────────

  const isCategoryExpanded = !selectedCategory || editingCategory;
  const isStepExpanded = (stepId) => !collapsedSteps.has(stepId) && (!answers[stepId] || editingStepId === stepId);

  // ── 렌더 ────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white pb-14 text-base leading-[1.6] text-[#1d1d1f]">
      <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-6">
        <div className="pt-9 pb-4">
          <h1 className="text-2xl font-bold">
            {editSvcReqSn ? '서비스 요청서 수정' : '서비스 요청서 작성'}
          </h1>
        </div>

        <div ref={errorRef}><ErrorMessage message={error} /></div>

        <div className="flex flex-col gap-4">

          {/* ── 요청 제목 ── */}
          <section className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm">
            <div className="border-b border-[#e8e8e8] px-6 py-4">
              <h2 className="text-base font-bold">요청 제목</h2>
            </div>
            <div className="px-6 py-5">
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-[#5f5e5a]">제목</label>
                <span className="text-xs text-[#888780]">{title.length}/200</span>
              </div>
              <input
                className="w-full rounded-lg border border-[#e2e1dc] bg-white px-3 py-2.5 text-sm text-[#1d1d1f] outline-none transition-colors focus:border-primary"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
                placeholder="예) 성수동 원룸 이사 운반"
              />
              {submitted && !title.trim() && (
                <p className="mt-1.5 text-xs font-semibold text-red-600">제목을 입력해 주세요.</p>
              )}
            </div>
          </section>

          {/* ── 카테고리 카드 ── */}
          <section className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between px-6 py-4 text-left"
              onClick={handleCategoryCardHeaderClick}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e5efff] text-xs font-bold text-[#0048bf]">
                  1
                </span>
                <h2 className="text-base font-bold">카테고리</h2>
              </div>
              {selectedCategory && (
                <div className="flex items-center gap-2">
                  {!isCategoryExpanded && (
                    <span className="text-sm font-semibold text-primary">{selectedCategory.catNm}</span>
                  )}
                  {isCategoryExpanded
                    ? <ChevronUp size={16} className="shrink-0 text-[#5f5e5a]" />
                    : <ChevronDown size={16} className="shrink-0 text-[#5f5e5a]" />
                  }
                </div>
              )}
            </button>

            {isCategoryExpanded && (
              <div className="border-t border-[#e8e8e8] px-6 py-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {categories.map(cat => {
                    const meta = CATEGORY_META[cat.catNm] || {};
                    const active = selectedCategory?.catSn === cat.catSn;
                    const color = meta.color || '#5f5e5a';
                    return (
                      <button
                        key={cat.catSn}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className="relative cursor-pointer rounded-xl p-4 text-left text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: color, outline: active ? '3px solid #1a1a18' : 'none', outlineOffset: 2 }}
                      >
                        {active && (
                          <span
                            className="absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-white text-xs font-bold"
                            style={{ color }}
                          >✓</span>
                        )}
                        <CategoryIcon name={cat.catNm} className="mb-2" />
                        <p className="m-0 text-base font-bold leading-tight">{cat.catNm}</p>
                        {meta.sub && <p className="m-0 mt-1 text-xs opacity-80">{meta.sub}</p>}
                      </button>
                    );
                  })}
                </div>
                {submitted && !selectedCategory && (
                  <p className="mt-3 text-xs font-semibold text-red-600">카테고리를 선택해 주세요.</p>
                )}
                {editingCategory && selectedCategory && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      className="rounded-lg border border-[#e2e1dc] px-4 py-1.5 text-sm text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary"
                      onClick={() => setEditingCategory(false)}
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── 단계 카드들 ── */}
          {chain.map((stepId, index) => {
            const step = WIZARD_STEPS[stepId];
            if (!step) return null;
            const expanded = isStepExpanded(stepId);
            const stepNum = index + 2;

            return (
              <section
                key={stepId}
                className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm"
                ref={el => { if (el) cardRefs.current[stepId] = el; }}
              >
                {/* 카드 헤더 */}
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between px-6 py-4 text-left"
                  onClick={() => handleStepCardHeaderClick(stepId)}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e5efff] text-xs font-bold text-[#0048bf]">
                      {stepNum}
                    </span>
                    <h2 className="text-base font-bold">{step.title}</h2>
                  </div>
                  {answers[stepId] && (
                    <div className="flex items-center gap-3">
                      {!expanded && (
                        <span className="max-w-[200px] truncate text-right text-sm text-[#5f5e5a] lg:max-w-[320px]">
                          {answers[stepId]}
                        </span>
                      )}
                      {expanded
                        ? <ChevronUp size={16} className="shrink-0 text-[#5f5e5a]" />
                        : <ChevronDown size={16} className="shrink-0 text-[#5f5e5a]" />
                      }
                    </div>
                  )}
                </button>

                {/* 펼쳐진 내용 */}
                {expanded && (
                  <div className="border-t border-[#e8e8e8] px-6 py-5">
                    {step.desc && (
                      <p className="mb-3 ml-9 text-sm text-[#5f5e5a]">{step.desc}</p>
                    )}

                    {/* single · multi */}
                    {(step.type === 'single' || step.type === 'multi') && (
                      <>
                        <div
                          className="grid gap-2"
                          style={{ gridTemplateColumns: `repeat(${step.options.length}, 1fr)` }}
                        >
                          {step.options.map(opt => {
                            const active = step.type === 'single'
                              ? (answers[stepId] === opt.label
                                  || (opt.label === ETC && (answers[stepId]?.startsWith(`${ETC}(`) || pendingEtcStep === stepId)))
                              : (stepDraft[stepId] || []).includes(opt.label);
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => step.type === 'single'
                                  ? handleSingleSelect(stepId, opt)
                                  : handleMultiToggle(stepId, opt.label)
                                }
                                className={`flex flex-col rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                                  active
                                    ? 'border-primary bg-[#e5efff] font-semibold text-[#0048bf]'
                                    : 'border-[#e2e1dc] bg-white text-[#1d1d1f] hover:border-primary'
                                }`}
                              >
                                {opt.icon && <span className="mb-1.5 text-xl leading-none">{opt.icon}</span>}
                                <span className="font-medium leading-snug">{opt.label}</span>
                                {opt.sub && <span className="mt-0.5 text-xs text-[#888780]">{opt.sub}</span>}
                              </button>
                            );
                          })}
                        </div>

                        {/* 기타 텍스트 입력 — multi */}
                        {step.type === 'multi' && (stepDraft[stepId] || []).includes(ETC) && (
                          <input
                            className="mt-3 w-full rounded-lg border border-[#e2e1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                            placeholder="기타 내용을 입력해 주세요"
                            value={freeTextDraft[`${stepId}:${ETC}`] || ''}
                            onChange={e => setFreeTextDraft(prev => ({ ...prev, [`${stepId}:${ETC}`]: e.target.value }))}
                          />
                        )}

                        {/* 기타 텍스트 입력 — single */}
                        {step.type === 'single' && pendingEtcStep === stepId && (
                          <div className="mt-3 flex gap-2">
                            <input
                              className="flex-1 rounded-lg border border-[#e2e1dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
                              placeholder="기타 내용을 입력해 주세요"
                              value={freeTextDraft[`${stepId}:${ETC}`] || ''}
                              onChange={e => setFreeTextDraft(prev => ({ ...prev, [`${stepId}:${ETC}`]: e.target.value }))}
                            />
                            <button
                              type="button"
                              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#0048bf]"
                              onClick={() => handleEtcSingleConfirm(stepId)}
                            >다음</button>
                          </div>
                        )}

                        {/* 다음 버튼 — multi */}
                        {step.type === 'multi' && (
                          <div className="mt-4 flex items-center justify-between">
                            <p className="text-xs text-[#888780]">해당하는 항목을 모두 선택한 뒤 다음을 눌러 주세요.</p>
                            <button
                              type="button"
                              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#0048bf]"
                              onClick={() => handleMultiConfirm(stepId)}
                            >
                              {editingStepId === stepId ? '수정 완료' : '다음'}
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* form */}
                    {step.type === 'form' && (
                      <>
                        <div className={step.layout === 'row' ? 'grid gap-3' : ''} style={step.layout === 'row' ? { gridTemplateColumns: `repeat(${step.fields.length}, 1fr)` } : undefined}>
                        {step.fields.map(f => (
                          <div className={step.layout === 'row' ? '' : 'mb-4 last:mb-0'} key={f.key}>
                            <label className="mb-1.5 block text-sm font-medium text-[#5f5e5a]">
                              {f.key}
                              {f.required && <span className="text-red-600"> *</span>}
                            </label>
                            {f.type === 'choice' ? (
                              <>
                                <div className="flex flex-wrap gap-2">
                                  {f.options.map(o => (
                                    <button
                                      key={o}
                                      type="button"
                                      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                                        stepDraft[stepId]?.[f.key] === o
                                          ? 'border-primary bg-[#e5efff] font-semibold text-[#0048bf]'
                                          : 'border-[#e2e1dc] bg-white text-[#5f5e5a] hover:border-primary'
                                      }`}
                                      onClick={() => handleFormFieldChange(stepId, f.key, o)}
                                    >{o}</button>
                                  ))}
                                </div>
                                {stepDraft[stepId]?.[f.key] === ETC && (
                                  <input
                                    className="mt-2 w-full rounded-lg border border-[#e2e1dc] px-3 py-2.5 text-sm outline-none focus:border-primary"
                                    placeholder="기타 내용을 입력해 주세요"
                                    value={freeTextDraft[`${stepId}:${f.key}`] || ''}
                                    onChange={e => setFreeTextDraft(prev => ({ ...prev, [`${stepId}:${f.key}`]: e.target.value }))}
                                  />
                                )}
                              </>
                            ) : f.type === 'address' ? (
                              <>
                                <div className="flex gap-2">
                                  <input
                                    readOnly
                                    className={`flex-1 rounded-lg border bg-[#f8f8f6] px-3 py-2.5 text-sm outline-none ${fieldErrors[`${stepId}:${f.key}`] ? 'border-red-500' : 'border-[#e2e1dc]'}`}
                                    placeholder={f.placeholder}
                                    value={stepDraft[stepId]?.[f.key] || ''}
                                  />
                                  <button
                                    type="button"
                                    className="shrink-0 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-[#e5efff]"
                                    onClick={() => setAddressSearchKey(`${stepId}:${f.key}`)}
                                  >
                                    주소 검색
                                  </button>
                                </div>
                                {fieldErrors[`${stepId}:${f.key}`] && (
                                  <p className="mt-1 text-xs text-red-600">{fieldErrors[`${stepId}:${f.key}`]}</p>
                                )}
                              </>
                            ) : f.type === 'textarea' ? (
                              <textarea
                                className="w-full resize-vertical rounded-lg border border-[#e2e1dc] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                                rows={3}
                                placeholder={f.placeholder}
                                value={stepDraft[stepId]?.[f.key] || ''}
                                onChange={e => handleFormFieldChange(stepId, f.key, e.target.value)}
                              />
                            ) : (
                              <>
                                <input
                                  className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary ${fieldErrors[`${stepId}:${f.key}`] ? 'border-red-500' : 'border-[#e2e1dc]'}`}
                                  type={f.type}
                                  placeholder={f.placeholder}
                                  value={stepDraft[stepId]?.[f.key] || ''}
                                  onChange={e => {
                                    handleFormFieldChange(stepId, f.key, e.target.value);
                                    if (fieldErrors[`${stepId}:${f.key}`]) setFieldErrors(prev => { const n = { ...prev }; delete n[`${stepId}:${f.key}`]; return n; });
                                  }}
                                />
                                {fieldErrors[`${stepId}:${f.key}`] && (
                                  <p className="mt-1 text-xs text-red-600">{fieldErrors[`${stepId}:${f.key}`]}</p>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#0048bf]"
                            onClick={() => handleFormConfirm(stepId)}
                          >
                            {editingStepId === stepId ? '수정 완료' : (step.next ? '다음' : '입력 완료')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>
            );
          })}

          {/* ── 요청 내용 확인 ── */}
          {isComplete && (
            <section className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm">
              <div className="border-b border-[#e8e8e8] px-6 py-4">
                <h2 className="text-base font-bold">요청 내용 확인</h2>
                <p className="mt-0.5 text-sm text-[#5f5e5a]">아래 내용으로 서비스 요청서가 등록됩니다.</p>
              </div>
              <div className="divide-y divide-[#e8e8e8] px-6">
                {chain.map(stepId => (
                  <div key={stepId} className="flex gap-4 py-3.5">
                    <span className="w-36 shrink-0 text-sm text-[#888780]">{WIZARD_STEPS[stepId].title}</span>
                    <span className="text-sm font-medium text-[#1d1d1f]">{answers[stepId]}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 하단 버튼 ── */}
          <div className="flex items-center justify-end gap-3 pb-4">
            <button
              type="button"
              onClick={handleDraft}
              disabled={loading}
              className="rounded-lg border border-[#e2e1dc] bg-white px-5 py-2.5 text-sm font-semibold text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >임시저장</button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={loading}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0048bf] disabled:opacity-50"
            >
              {loading ? '등록 중...' : '요청서 공개'}
            </button>
          </div>
        </div>
      </div>

      <AlertModal open={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg('')} />

      {/* 주소 검색 모달 — MyPageProfileEdit·SignupPage와 동일한 패턴 */}
      {addressSearchKey && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
          onClick={() => setAddressSearchKey(null)}
        >
          <div
            className="w-full max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-[0_20px_80px_rgba(0,0,0,0.25)]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e8e8e8] px-5 py-3">
              <p className="text-base font-bold">주소 검색</p>
              <button
                type="button"
                className="rounded-lg border border-[#e2e1dc] px-3 py-1.5 text-sm text-[#5f5e5a] hover:border-primary hover:text-primary"
                onClick={() => setAddressSearchKey(null)}
              >
                닫기
              </button>
            </div>
            <DaumPostcode autoClose={false} onComplete={handleAddressComplete} />
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmPending}
        message={confirmPending?.msg || ''}
        subMessage="이 작업은 되돌릴 수 없습니다."
        confirmLabel="변경"
        onConfirm={handleConfirmOk}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
}
