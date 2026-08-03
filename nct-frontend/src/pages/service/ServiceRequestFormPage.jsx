// src/pages/service/ServiceRequestFormPage.jsx
// 서비스 요청서 작성 — 아코디언 위저드 (F-SVC-001~004)
// 라우트: /service-requests/new (신규), location.state.svcReqSn로 임시저장 수정
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Truck, BrushCleaning, Wrench, Armchair, GraduationCap } from 'lucide-react';
import { getCategories } from '@api/categoryApi';
import { registerServiceRequest, updateServiceRequest, getServiceRequest } from '@api/serviceRequestApi';
import DaumPostcode from 'react-daum-postcode';
import ErrorMessage from '@components/common/ErrorMessage';
import AlertModal from '@components/common/AlertModal';
import ConfirmModal from '@components/common/ConfirmModal';
import ServiceRequestImageUpload from '@components/service/ServiceRequestImageUpload';
import { toImageUrl } from '@api/fileApi';
import DateRangePicker from '@components/product/DateRangePicker';
import RegionSelector from '@components/common/RegionSelector';
import { WIZARD_STEPS, CATEGORY_NEXT_STEP, CATEGORY_META } from './serviceRequestWizardSteps';

const MAX_IMAGES = 5;

const SERVICE_DOMAIN_CD = 'CATC0002';
const ETC = '기타';
const STEP_LABELS = ['요청 정보 입력', '요청 확인'];

// 한글 단어 끝음절 받침 유무에 따라 "을/를" 조사를 붙인다 (유효성 검증 문구용)
function withEulReul(word) {
  const last = word[word.length - 1];
  const code = last.charCodeAt(0) - 0xac00;
  const hasBatchim = code < 0 || code > 11171 ? true : code % 28 !== 0;
  return `${word}${hasBatchim ? '을' : '를'}`;
}

const CATEGORY_ICON = {
  '이사': Truck,
  '청소': BrushCleaning,
  '설치·수리': Wrench,
  '인테리어': Armchair,
  '레슨': GraduationCap,
};

function CategoryIcon({ name, className, style }) {
  const Icon = CATEGORY_ICON[name];
  if (!Icon) return null;
  return <Icon size={32} strokeWidth={1.7} className={className} style={style} />;
}

// 확인 탭 "상세 내용" 표에서 "출발지 주소: 서울.. / 출발지 상세주소: 105 / ..."처럼
// " / "로 이어붙인 답변을 필드별로 나눠서 2열 그리드로 보여줄 때 쓴다
function parseFieldPart(raw) {
  const idx = raw.indexOf(': ');
  if (idx === -1) return { label: null, value: raw };
  return { label: raw.slice(0, idx), value: raw.slice(idx + 2) };
}

// "과목 (복수 선택)", "특이사항 메모 (선택)"처럼 뒤에 괄호 안내문이 붙는 제목은 어중간하게
// 줄바꿈되지 않도록 "제목" / "(안내문)" 두 줄로 자연스럽게 나눠 보여준다
function renderStepTitle(title) {
  const match = title.match(/^(.+) (\([^)]*\))$/);
  if (!match) return title;
  return (
    <>
      {match[1]}
      <br />
      {match[2]}
    </>
  );
}

// 카테고리 진행률 분모 — 실제 chain은 답변할 때마다 늘어나 분모로 못 씀.
// 분기 중 가장 긴 경로 기준으로 해당 카테고리의 전체 단계 수를 고정 계산한다.
function getCategoryMaxSteps(stepId, visited = new Set()) {
  if (!stepId || !WIZARD_STEPS[stepId] || visited.has(stepId)) return 0;
  const step = WIZARD_STEPS[stepId];
  const nextVisited = new Set(visited);
  nextVisited.add(stepId);
  let maxNext = 0;
  if (step.type === 'single') {
    step.options.forEach(opt => {
      maxNext = Math.max(maxNext, getCategoryMaxSteps(opt.next || step.next, nextVisited));
    });
  } else {
    maxNext = getCategoryMaxSteps(step.next, nextVisited);
  }
  return 1 + maxNext;
}

// 분기 단계에서 "기본값(첫 번째 선택지)"을 따라갔을 때의 다음 단계 — 미리보기 카드 자리 계산용
function getDefaultNextStep(stepId) {
  const step = WIZARD_STEPS[stepId];
  if (!step) return null;
  return step.type === 'single' ? (step.options[0]?.next || step.next) : step.next;
}

// 아직 답변 전이라 실제 다음 단계를 알 수 없는 구간을, 기본 선택지를 따라간 경로로 미리 보여주기
// 위한 미리보기 단계 id 목록 (실제로 답변하면 이 자리들이 진짜 카드로 교체된다)
function buildPreviewSteps(startStepId, excludeIds) {
  const preview = [];
  const visited = new Set(excludeIds);
  let cur = startStepId;
  while (cur && WIZARD_STEPS[cur] && !visited.has(cur)) {
    visited.add(cur);
    preview.push(cur);
    cur = getDefaultNextStep(cur);
  }
  return preview;
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
  // [{ id, flSn, url, file }] — SERVICE_REQUEST_FILE 연결 테이블·업로드 API 정본요청 전까지는
  // 로컬 미리보기만 유지한다. API 확정되면 submit 시점에 업로드·연결 호출만 추가하면 됨.
  const [images, setImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [chain, setChain] = useState([]);
  const [answers, setAnswers] = useState({});
  const [stepDraft, setStepDraft] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [freeTextDraft, setFreeTextDraft] = useState({});
  const [pendingEtcStep, setPendingEtcStep] = useState(null);

  // 경매등록과 같은 2단계 구성: 0=요청 정보 입력, 1=요청 확인
  const [step, setStep] = useState(0);
  const [confirmPhotoIndex, setConfirmPhotoIndex] = useState(0); // 요청 확인 탭 사진 박스 슬라이드 인덱스
  const [agreed, setAgreed] = useState(false); // 확인 탭 최종 동의
  const [policyAgreed, setPolicyAgreed] = useState(false); // 요청 정보 입력 탭 — 견적 요청 정책 동의
  const policyRef = useRef(null);
  const agreedRef = useRef(null);

  // 아코디언 상태 — 단계 카드는 한 번에 하나만 펼쳐진다(진행 중인 카드든 재편집하려는
  // 완료 카드든 동일하게 이 값 하나로 표현)
  const [expandedStepId, setExpandedStepId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(false); // 카테고리 재선택 중
  const [confirmPending, setConfirmPending] = useState(null); // { msg, action } | null
  const [fieldErrors, setFieldErrors] = useState({}); // { 'stepId:fieldKey': 에러 메시지 }
  const [addressSearchKey, setAddressSearchKey] = useState(null); // 주소 검색 중인 'stepId:fieldKey'

  const cardRefs = useRef({});
  const titleSectionRef = useRef(null);
  const categorySectionRef = useRef(null);

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
      newDraft.budget = { 예산: String(s.svcReqBdgtAmt) };
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

  // 요청 정보 입력(0)↔요청 확인(1) 탭 전환 시 맨 위로 스크롤한다.
  // 안 그러면 스크롤이 한참 내려간 채로 탭만 바뀌어서, 화면이 짧아진 쪽으로 넘어갈 때
  // 아무 반응이 없는 것처럼 보인다(예: 맨 아래 특이사항 메모 카드에서 "다음" 클릭).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [step]);

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
      setExpandedStepId(nextId);
    } else {
      setChain(kept);
      setIsComplete(true);
      setExpandedStepId(null);
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
          setExpandedStepId(null);
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
    setFieldErrors({});
    setError('');
    const firstStep = CATEGORY_NEXT_STEP[cat.catNm];
    setChain(firstStep ? [firstStep] : []);
    setExpandedStepId(firstStep || null);
    // 카테고리를 고르면 아래 상세 설정 카드는 정책 동의 전까지 비활성 상태이므로,
    // 바로 정책 안내 쪽으로 포커스를 옮겨 동의부터 하도록 유도한다.
    if (!policyAgreed) {
      policyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // ── 단계 카드 헤더 클릭 (토글) — 카드는 한 번에 하나만 펼쳐진다 ─────────────────

  const handleStepCardHeaderClick = (stepId) => {
    setExpandedStepId(prev => (prev === stepId ? null : stepId));
  };

  // 편집 중이던 분기 단계의 답변을 교체할 때 공통으로 쓰는 로직 —
  // 새 답변이 이어지는 다음 단계가 기존과 같으면 하위 입력을 그대로 유지하고,
  // 다르면 하위 입력이 있을 때만 확인 후 초기화한다.
  const applyEditedBranchAnswer = (stepId, answerText, newNext, afterApply) => {
    const stepIdx = chain.indexOf(stepId);
    const currentNextId = chain[stepIdx + 1] ?? null;

    if (newNext === currentNextId) {
      // 하위 단계 구성은 그대로라 지우지 않되, 이어지는 다음 카드를 계속 볼 수 있게 펼쳐둔다
      setAnswers(prev => ({ ...prev, [stepId]: answerText }));
      setExpandedStepId(currentNextId);
      afterApply?.();
      return;
    }

    const hasDownstream = chain.slice(stepIdx + 1).some(id => answers[id] !== undefined);
    const applyChange = () => {
      const kept = truncateAfter(stepId);
      setAnswers(prev => ({ ...prev, [stepId]: answerText }));
      afterApply?.();
      proceed(kept, newNext);
    };

    if (hasDownstream) {
      setConfirmPending({ msg: '이 항목을 변경하면 이후 입력한 내용이 초기화됩니다.', action: applyChange });
    } else {
      applyChange();
    }
  };

  // ── single 선택 ─────────────────────────────────────────────────────────────

  const handleSingleSelect = (stepId, option) => {
    if (fieldErrors[`${stepId}:single`]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[`${stepId}:single`]; return n; });
    }
    if (option.label === ETC) {
      setPendingEtcStep(stepId);
      return;
    }
    setPendingEtcStep(prev => (prev === stepId ? null : prev));

    const step = WIZARD_STEPS[stepId];
    const newNext = option.next || step.next;

    if (answers[stepId] !== undefined) {
      applyEditedBranchAnswer(stepId, option.label, newNext);
      return;
    }

    const kept = truncateAfter(stepId);
    setAnswers(prev => ({ ...prev, [stepId]: option.label }));
    proceed(kept, newNext);
  };

  const handleEtcSingleConfirm = (stepId) => {
    if (fieldErrors[`${stepId}:single`]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[`${stepId}:single`]; return n; });
    }
    const step = WIZARD_STEPS[stepId];
    const text = (freeTextDraft[`${stepId}:${ETC}`] || '').trim();
    if (!text) {
      setAlertMsg('기타 내용을 입력해 주세요.');
      cardRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const option = step.options.find(o => o.label === ETC);
    const newNext = option?.next || step.next;

    if (answers[stepId] !== undefined) {
      applyEditedBranchAnswer(stepId, `${ETC}(${text})`, newNext, () => setPendingEtcStep(null));
      return;
    }

    const kept = truncateAfter(stepId);
    setAnswers(prev => ({ ...prev, [stepId]: `${ETC}(${text})` }));
    setPendingEtcStep(null);
    proceed(kept, newNext);
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
    if (fieldErrors[`${stepId}:multi`]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[`${stepId}:multi`]; return n; });
    }
  };

  const handleMultiConfirm = (stepId) => {
    const step = WIZARD_STEPS[stepId];
    const picked = stepDraft[stepId] || [];
    if (picked.length === 0) {
      const cleanTitle = step.title.replace(/\s*\(복수 선택\)$/, '');
      const msg = `${withEulReul(cleanTitle)} 선택해 주세요.`;
      setAlertMsg(msg);
      setFieldErrors(prev => ({ ...prev, [`${stepId}:multi`]: msg }));
      cardRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (picked.includes(ETC) && !(freeTextDraft[`${stepId}:${ETC}`] || '').trim()) {
      setAlertMsg('기타 내용을 입력해 주세요.');
      cardRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setFieldErrors(prev => { const n = { ...prev }; delete n[`${stepId}:multi`]; return n; });
    const labels = picked.map(l => (l === ETC ? `${ETC}(${freeTextDraft[`${stepId}:${ETC}`].trim()})` : l));

    if (answers[stepId] !== undefined) {
      setAnswers(prev => ({ ...prev, [stepId]: labels.join(', ') }));
      // 재편집 성공 — 하위 단계 구성은 그대로라 이어지는 다음 카드를 계속 볼 수 있게 펼쳐둔다
      setExpandedStepId(chain[chain.indexOf(stepId) + 1] ?? null);
      return;
    }

    const kept = truncateAfter(stepId);
    setAnswers(prev => ({ ...prev, [stepId]: labels.join(', ') }));
    proceed(kept, step.next);
  };

  // ── form 입력 ───────────────────────────────────────────────────────────────

  const handleFormFieldChange = (stepId, key, value) => {
    setStepDraft(prev => ({ ...prev, [stepId]: { ...(prev[stepId] || {}), [key]: value } }));
    const errKey = `${stepId}:${key}`;
    setFieldErrors(prev => {
      if (!prev[errKey]) return prev;
      const n = { ...prev };
      delete n[errKey];
      return n;
    });
  };

  // form 단계의 필수·숫자포함·기타텍스트 검증 — 실패 시 알림+포커스 이동+인라인 에러를 설정하고
  // false를 반환한다. 카드 안의 "다음" 버튼과 화면 하단 전체 "다음" 버튼(goNext) 양쪽에서 재사용
  const validateFormStep = (stepId) => {
    const step = WIZARD_STEPS[stepId];
    const values = stepDraft[stepId] || {};
    // hideWhen 조건에 걸려 화면에 안 보이는 필드(예: 온라인·화상 레슨의 지역)와,
    // 같은 단계 안 다른 필드가 채워져 비활성화된 필드(예: 예상 금액대 선택 시 예산)는 검증에서도 뺀다
    const visibleFields = step.fields.filter(f =>
      (!f.hideWhen || answers[f.hideWhen.step] !== f.hideWhen.equals)
      && (!f.disabledWhenFilled || !(values[f.disabledWhenFilled] || '').toString().trim())
    );

    // 필드를 하나씩 순서대로 확인해서, 앞선 필드의 숫자 검증이 뒤에 있는 다른 필드의
    // 필수 입력 검증보다 먼저 걸리도록 한다 (필수/숫자를 전체 필드 두 번 훑지 않음)
    for (const f of visibleFields) {
      const raw = (values[f.key] || '').toString().trim();
      if (f.required && !raw) {
        const errKey = `${stepId}:${f.key}`;
        const verb = f.type === 'choice' || f.type === 'select' || f.type === 'calendar' ? '선택' : '입력';
        const msg = `${withEulReul(f.key)} ${verb}해 주세요.`;
        setFieldErrors(prev => ({ ...prev, [errKey]: msg }));
        setAlertMsg(msg);
        cardRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
      if (f.requireDigit && raw && !/\d/.test(raw)) {
        const errKey = `${stepId}:${f.key}`;
        const msg = `${f.key}에 숫자를 포함해 입력해 주세요.`;
        setFieldErrors(prev => ({ ...prev, [errKey]: msg }));
        setAlertMsg(msg);
        cardRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
    }
    const etcFieldMissingText = visibleFields.some(
      f => f.type === 'choice' && values[f.key] === ETC && !(freeTextDraft[`${stepId}:${f.key}`] || '').trim()
    );
    if (etcFieldMissingText) {
      setAlertMsg('기타 내용을 입력해 주세요.');
      cardRefs.current[stepId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const handleFormConfirm = (stepId) => {
    if (!validateFormStep(stepId)) return;
    const step = WIZARD_STEPS[stepId];
    const values = stepDraft[stepId] || {};
    // hideWhen 조건에 걸려 숨겨졌거나 disabledWhenFilled로 비활성화된 필드는
    // 값이 남아있어도 저장하지 않는다
    const visibleFields = step.fields.filter(f =>
      (!f.hideWhen || answers[f.hideWhen.step] !== f.hideWhen.equals)
      && (!f.disabledWhenFilled || !(values[f.disabledWhenFilled] || '').toString().trim())
    );

    // 통과 시 이 단계 에러 전부 제거
    setFieldErrors(prev => {
      const n = { ...prev };
      step.fields.forEach(f => delete n[`${stepId}:${f.key}`]);
      return n;
    });

    const vals = visibleFields
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

    if (answers[stepId] !== undefined) {
      setAnswers(prev => ({ ...prev, [stepId]: vals.length ? vals.join(' / ') : '(입력 없음)' }));
      // 재편집 성공 — 하위 단계 구성은 그대로라 이어지는 다음 카드를 계속 볼 수 있게 펼쳐둔다
      setExpandedStepId(chain[chain.indexOf(stepId) + 1] ?? null);
      return;
    }

    const kept = truncateAfter(stepId);
    setAnswers(prev => ({ ...prev, [stepId]: vals.length ? vals.join(' / ') : '(입력 없음)' }));
    proceed(kept, step.next);
  };

  // ── 제출 ────────────────────────────────────────────────────────────────────

  const validateBasic = () => {
    setSubmitted(true);
    if (!title.trim()) {
      setAlertMsg('요청 제목을 입력해 주세요.');
      titleSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    if (!selectedCategory) {
      setAlertMsg('카테고리를 선택해 주세요.');
      categorySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const buildPayload = (statusCd) => {
    const budgetDraft = stepDraft.budget || {};
    const budgetRaw = budgetDraft['예산'];
    const hasBudget = budgetRaw && budgetRaw !== '미정';
    const budgetAmount = hasBudget ? Number(String(budgetRaw).replace(/[^0-9]/g, '')) : null;
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

  const goNext = () => {
    if (!validateBasic()) return;

    if (!policyAgreed) {
      setAlertMsg('견적 요청 정책을 확인하고 동의해 주세요.');
      policyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 이미 답변된 단계를 다시 열어 편집하는 중이면, 그 초안이 지금 유효한지부터 확인한다.
    // 안 그러면 체인 맨 끝(재편집 중인 단계와 무관한 이후 단계)이 엉뚱하게 지목된다.
    if (expandedStepId && answers[expandedStepId] !== undefined) {
      const editingStep = WIZARD_STEPS[expandedStepId];
      if (editingStep?.type === 'multi') {
        const picked = stepDraft[expandedStepId] || [];
        if (picked.length === 0) {
          const cleanTitle = editingStep.title.replace(/\s*\(복수 선택\)$/, '');
          const msg = `${withEulReul(cleanTitle)} 선택해 주세요.`;
          setAlertMsg(msg);
          setFieldErrors(prev => ({ ...prev, [`${expandedStepId}:multi`]: msg }));
          cardRefs.current[expandedStepId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      } else if (editingStep?.type === 'form') {
        if (!validateFormStep(expandedStepId)) return;
      }
    }

    // isComplete는 상태값이라 재편집 흐름(같은 분기로 재선택 등)에서 실제 진행 상황과 어긋날 수 있어,
    // 여기서는 체인 끝 단계가 실제로 답변됐고 다음 단계가 없는지를 그 자리에서 다시 계산해 사용한다.
    const lastId = chain[chain.length - 1];
    const lastStep = lastId ? WIZARD_STEPS[lastId] : null;
    const actuallyComplete = !!lastId && answers[lastId] !== undefined && !lastStep?.next;

    if (!actuallyComplete) {
      if (lastStep?.type === 'form') {
        // 카드 안 "다음" 버튼과 동일한 검증(알림+포커스+인라인 에러)을 그대로 재사용.
        if (!validateFormStep(lastId)) return;
        // 필수 항목이 하나도 없는 단계(예: 특이사항 메모)는 안내 문구로 막을 이유가 없으니
        // 카드 안 버튼을 누른 것과 동일하게 바로 확정 처리한다.
        if (!lastStep.fields.some(f => f.required)) {
          handleFormConfirm(lastId);
          // 이 단계가 마지막(다음 단계 없음)이면 확정과 동시에 완료된 것이므로 바로 확인 탭으로 넘어간다.
          // isComplete는 handleFormConfirm 내부 setState라 이 시점엔 아직 반영 전이라 여기서 직접 판단한다.
          if (!lastStep.next) setStep(1);
          return;
        }
        // 필수 항목은 다 채웠지만 카드 안 버튼을 아직 안 눌러 확정 안 된 경우엔 여기서
        // return하지 않고 아래 공용 안내 문구로 이어지게 한다.
      }
      if (lastStep?.type === 'multi') {
        const picked = stepDraft[lastId] || [];
        if (picked.length === 0) {
          const cleanTitle = lastStep.title.replace(/\s*\(복수 선택\)$/, '');
          const msg = `${withEulReul(cleanTitle)} 선택해 주세요.`;
          setAlertMsg(msg);
          setFieldErrors(prev => ({ ...prev, [`${lastId}:multi`]: msg }));
          cardRefs.current[lastId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }

      const msg = lastStep?.type === 'single'
        ? `${withEulReul(lastStep.title)} 선택해 주세요.`
        : '모든 단계를 마쳐야 다음으로 진행할 수 있어요. \n진행 중이라면 임시저장을 이용해 주세요.';
      setAlertMsg(msg);
      if (lastId) {
        cardRefs.current[lastId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (lastStep?.type === 'single') {
          setFieldErrors(prev => ({ ...prev, [`${lastId}:single`]: msg }));
        }
      }
      return;
    }
    setStep(1);
  };

  const handlePublish = () => {
    if (!validateBasic()) return;
    if (!isComplete) {
      setAlertMsg('모든 단계를 마쳐야 요청서를 공개할 수 있어요. \n진행 중이라면 임시저장을 이용해 주세요.');
      return;
    }
    if (!agreed) {
      setAlertMsg('요청 내용 확인 및 동의가 필요합니다.');
      agreedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  const isStepExpanded = (stepId) => expandedStepId === stepId;
  // 이미 답변된 이전 단계를 재편집하는 중이면, 그 이후(다운스트림) 단계들은 값은 그대로 둔 채
  // 비활성화한다 — 재편집이 성공(그대로 유지 또는 다음 답변으로 교체)하거나 실패(계속 편집 중)
  // 하는 동안 expandedStepId가 자연스럽게 이 조건을 갱신하므로 별도 해제 로직이 필요 없다.
  const editingStepIndex = expandedStepId && answers[expandedStepId] !== undefined ? chain.indexOf(expandedStepId) : -1;
  // 카테고리별 전체 단계 수(분기 중 가장 긴 경로 기준) — chain.length 대신 진행률 분모로 사용
  const categoryMaxSteps = selectedCategory ? getCategoryMaxSteps(CATEGORY_NEXT_STEP[selectedCategory.catNm]) : 0;
  const answeredStepCount = chain.filter(id => answers[id] !== undefined).length;
  // 현재 진행 중인(맨 마지막) 단계 다음부터 기본 경로를 따라간 미리보기 카드 — 아직 실제로 답변하지 않은 구간
  const previewStepIds = selectedCategory && chain.length > 0
    ? buildPreviewSteps(getDefaultNextStep(chain[chain.length - 1]), chain)
    : [];
  // 희망일 달력에서 최대 6개월 뒤까지만 넘겨볼 수 있게 제한
  const maxCalendarNavDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // ── 렌더 ────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white pb-14 text-base leading-[1.6] text-[#1d1d1f]">
      <div className="container">
        <div className="pt-9 pb-4">
          <h1 className="text-[28px] font-bold">
            {editSvcReqSn ? '전문가 견적 요청서 수정' : '전문가 견적 요청서 작성'}
          </h1>
        </div>

        {/* ── 스텝 인디케이터 (경매등록과 동일한 2단계 구성: 입력 → 확인) ── */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-[#e8e8e8]">
          <div className="flex bg-[#eef2fb] px-5 py-3.5">
            {STEP_LABELS.map((label, i) => (
              <div
                key={label}
                className={`flex flex-1 items-center justify-center gap-2 border-b-[3px] p-3 text-lg ${
                  i === step ? 'border-primary font-bold text-primary'
                  : i < step ? 'border-[#e5efff] text-[#5f5e5a]'
                  : 'border-[#f0efec] text-[#888780]'
                }`}
              >
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-current text-sm font-bold">
                  {i + 1}
                </span>
                {label}
              </div>
            ))}
          </div>
        </div>

        <div ref={errorRef}><ErrorMessage message={error} /></div>

        {/* ── STEP 0: 요청 정보 입력 ── */}
        {step === 0 && (
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
            {/* 왼쪽: 요청 정보 (제목 + 카테고리 하나로 묶음) — 오른쪽 카드 높이와 억지로 맞추지 않고
                자기 콘텐츠만큼만 자연스럽게 높이를 가짐 */}
            <section className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm">
              <div className="border-b border-[#e8e8e8] bg-[#eef2fb] px-6 py-4">
                <h2 className="text-lg font-bold">요청 정보</h2>
              </div>

              {/* 1. 제목 */}
              <div ref={titleSectionRef} className="border-b border-[#e8e8e8] px-6 py-5">
                <div className="mb-1.5 flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e5efff] text-xs font-bold text-[#0048bf]">
                    1
                  </span>
                  <label className="text-base font-semibold text-[#5f5e5a]">제목</label>
                  <span className="ml-auto text-xs text-[#888780]">{title.length}/200</span>
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

              {/* 2. 카테고리 */}
              <div ref={categorySectionRef}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                  onClick={handleCategoryCardHeaderClick}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e5efff] text-xs font-bold text-[#0048bf]">
                      2
                    </span>
                    <h3 className="text-base font-semibold text-[#5f5e5a]">카테고리</h3>
                  </div>
                  {selectedCategory && (
                    <div className="flex items-center gap-2">
                      {isCategoryExpanded
                        ? <ChevronUp size={16} className="shrink-0 text-[#5f5e5a]" />
                        : <ChevronDown size={16} className="shrink-0 text-[#5f5e5a]" />
                      }
                    </div>
                  )}
                </button>

                {/* 선택된 카테고리 요약 배너 — 접힌 상태에서 아이콘·이름·설명을 크게 보여줌 */}
                {!isCategoryExpanded && selectedCategory && (
                  <div className="px-6 pb-5">
                    <button
                      type="button"
                      onClick={handleCategoryCardHeaderClick}
                      className="flex w-full cursor-pointer items-center gap-4 rounded-xl p-4 text-left text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: (CATEGORY_META[selectedCategory.catNm] || {}).color || '#5f5e5a' }}
                    >
                      <CategoryIcon name={selectedCategory.catNm} />
                      <div>
                        <p className="m-0 text-lg font-bold leading-tight">{selectedCategory.catNm}</p>
                        {(CATEGORY_META[selectedCategory.catNm] || {}).sub && (
                          <p className="m-0 mt-1 text-sm opacity-90">{CATEGORY_META[selectedCategory.catNm].sub}</p>
                        )}
                      </div>
                    </button>
                  </div>
                )}

                {isCategoryExpanded && (
                  <div className="border-t border-[#e8e8e8] px-6 py-5">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
              </div>

              {/* 상세 항목 진행률 — 오른쪽 위저드 번호 배지와 같은 점-연결선 형태로 표시 */}
              {selectedCategory && categoryMaxSteps > 0 && (
                <div className="border-t border-[#e8e8e8] px-6 py-5">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-[#5f5e5a]">상세 항목 진행률</span>
                    <span className="font-bold text-primary">{answeredStepCount}/{categoryMaxSteps}</span>
                  </div>
                  <div className="flex w-full items-center">
                    {Array.from({ length: categoryMaxSteps }, (_, i) => {
                      const state = i < answeredStepCount ? 'done' : i === answeredStepCount ? 'current' : 'upcoming';
                      return (
                        <div key={i} className="flex flex-1 items-center last:flex-none">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              state === 'done' ? 'bg-primary text-white'
                              : state === 'current' ? 'bg-[#e5efff] text-primary ring-2 ring-primary'
                              : 'bg-[#eceae4] text-[#9f9e9a]'
                            }`}
                          >
                            {i + 1}
                          </span>
                          {i < categoryMaxSteps - 1 && (
                            <span className={`h-[2px] flex-1 ${i < answeredStepCount ? 'bg-primary' : 'bg-[#e2e1dc]'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {isComplete && (
                    <p className="mt-3 text-xs font-semibold text-primary">모든 항목을 입력했어요!</p>
                  )}
                </div>
              )}

              {/* 3. 사진 첨부 */}
              <div className="border-t border-[#e8e8e8] px-6 py-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e5efff] text-xs font-bold text-[#0048bf]">
                    3
                  </span>
                  <h3 className="text-base font-semibold text-[#5f5e5a]">사진 첨부</h3>
                  <span className="text-xs text-[#888780]">(선택)</span>
                </div>
                <p className="mb-3 text-xs text-[#888780]">사진을 첨부하면 더 정확한 견적을 받을 수 있어요.</p>
                <ServiceRequestImageUpload images={images} onChange={setImages} maxImages={MAX_IMAGES} />
              </div>

              {/* 견적 요청 정책 안내 — 경매등록 정책 안내와 동일한 스타일 */}
              <div ref={policyRef} className="border-t border-[#e8e8e8] px-6 py-5">
                <div className="rounded-[10px] bg-[#e5efff] p-5">
                  <h4 className="mb-2 font-bold text-[#0048bf]">
                    견적 요청 정책 안내 <span className="text-[#c0392b]">*</span>
                  </h4>
                  <ul className="list-disc space-y-2 pl-[18px] text-[15px] leading-[1.7] text-[#1d1d1f]">
                    <li>요청서 등록 후에는 본문을 수정할 수 없으며, 변경사항은 별도로 최대 3회까지 추가할 수 있습니다</li>
                    <li>포인트 홀딩은 제공자의 견적을 선택한 시점부터 시작됩니다</li>
                    <li>매칭 후 거래를 정당한 사유 없이 취소하면 포인트 패널티가 부과됩니다</li>
                    <li>요청서 삭제는 관리자에게 요청하여 정당한 사유가 확인된 경우에만 처리됩니다</li>
                  </ul>
                  <div className="mt-3 rounded-lg border border-[#f0efec] bg-white px-3.5 py-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1d1d1f]">
                      <input
                        type="checkbox"
                        checked={policyAgreed}
                        onChange={e => setPolicyAgreed(e.target.checked)}
                      />
                      위 견적 요청 정책을 확인하였습니다.
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* 오른쪽: 요청 상세 설정 — 정책 미동의 시 비활성화 */}
            <section
              className={`overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm transition-opacity ${
                policyAgreed ? '' : 'pointer-events-none opacity-50'
              }`}
            >
              <div className="border-b border-[#e8e8e8] bg-[#eef2fb] px-6 py-4">
                <h2 className="text-lg font-bold">요청 상세 설정</h2>
              </div>
              <div className="px-6 py-5">
                {!policyAgreed ? (
                  <p className="py-16 text-center text-sm text-[#888780]">견적 요청 정책에 동의하면 상세 항목을 입력할 수 있습니다.</p>
                ) : !selectedCategory ? (
                  <p className="py-16 text-center text-sm text-[#888780]">카테고리를 선택하면 상세 항목이 나타납니다.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {chain.map((stepId, index) => {
            const step = WIZARD_STEPS[stepId];
            if (!step) return null;
            const expanded = isStepExpanded(stepId);
            const stepNum = index + 1;
            const disabledByEdit = editingStepIndex !== -1 && index > editingStepIndex;

            return (
              <section
                key={stepId}
                className={`overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm ${disabledByEdit ? 'pointer-events-none opacity-50' : ''}`}
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
                    <h2 className="text-lg font-bold">{step.title}</h2>
                  </div>
                  {answers[stepId] && (
                    <div className="flex items-center gap-3">
                      {!expanded && (
                        <span className="max-w-[220px] truncate text-right text-[15px] font-semibold text-primary">
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
                        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
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
                                className={`flex flex-col items-start rounded-xl border px-3.5 py-2.5 text-left text-[15px] transition-colors ${
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

                        {step.type === 'single' && fieldErrors[`${stepId}:single`] && (
                          <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors[`${stepId}:single`]}</p>
                        )}

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
                          <>
                          {fieldErrors[`${stepId}:multi`] && (
                            <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors[`${stepId}:multi`]}</p>
                          )}
                          <div className="mt-4 flex items-center justify-between">
                            <p className="text-xs text-[#888780]">해당하는 항목을 모두 선택한 뒤 다음을 눌러 주세요.</p>
                            <button
                              type="button"
                              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#0048bf]"
                              onClick={() => handleMultiConfirm(stepId)}
                            >
                              다음
                            </button>
                          </div>
                          </>
                        )}
                      </>
                    )}

                    {/* form */}
                    {step.type === 'form' && (() => {
                      // f.row 키가 같은 연속 필드를 하나의 그룹으로 묶음
                      // calendar 필드의 embed 목록에 든 필드는 달력 박스 안에서 같이 렌더링되므로
                      // 별도 그룹으로 다시 만들지 않는다
                      // hideWhen 조건에 걸리는 필드(예: 온라인·화상 레슨일 땐 지역 불필요)는 아예 뺀다
                      const visibleFields = step.fields.filter(f => !f.hideWhen || answers[f.hideWhen.step] !== f.hideWhen.equals);
                      const embeddedKeys = new Set(visibleFields.flatMap(f => f.embed || []));
                      const groups = [];
                      visibleFields.forEach(f => {
                        if (embeddedKeys.has(f.key)) return;
                        if (f.row) {
                          const last = groups[groups.length - 1];
                          if (last?.rowKey === f.row) last.fields.push(f);
                          else groups.push({ rowKey: f.row, fields: [f] });
                        } else {
                          groups.push({ rowKey: null, fields: [f] });
                        }
                      });

                      const renderNormalField = (f) => (
                        <div key={f.key} className={step.layout === 'row' ? '' : 'mb-4 last:mb-0'}>
                          <label className="mb-1.5 block text-base font-semibold text-[#5f5e5a]">
                            <span className="flex items-center gap-1">
                              {f.key}{f.required && <span className="text-red-600"> *</span>}
                              {f.tooltip && (
                                <span className="group/tip relative inline-flex cursor-default">
                                  <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#9f9e9a] text-[10px] font-bold leading-none text-[#9f9e9a]">?</span>
                                  <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1.5 whitespace-nowrap rounded-lg border border-[#e2e1dc] bg-white px-3 py-1.5 text-xs font-normal text-[#3b3a36] shadow-md opacity-0 transition-opacity group-hover/tip:opacity-100">
                                    {f.tooltip}
                                  </span>
                                </span>
                              )}
                            </span>
                          </label>
                          {f.type === 'choice' ? (
                            <>
                              <div className="flex flex-wrap gap-2">
                                {f.options.map(o => (
                                  <button key={o} type="button"
                                    className={`rounded-lg border px-3 py-1.5 text-[15px] transition-colors ${stepDraft[stepId]?.[f.key] === o ? 'border-primary bg-[#e5efff] font-semibold text-[#0048bf]' : 'border-[#e2e1dc] bg-white text-[#5f5e5a] hover:border-primary'}`}
                                    onClick={() => handleFormFieldChange(stepId, f.key, f.toggleable && stepDraft[stepId]?.[f.key] === o ? '' : o)}
                                  >{o}</button>
                                ))}
                              </div>
                              {stepDraft[stepId]?.[f.key] === ETC && (
                                <input className="mt-2 w-full rounded-lg border border-[#e2e1dc] px-3 py-2.5 text-sm outline-none focus:border-primary"
                                  placeholder="기타 내용을 입력해 주세요"
                                  value={freeTextDraft[`${stepId}:${f.key}`] || ''}
                                  onChange={e => setFreeTextDraft(prev => ({ ...prev, [`${stepId}:${f.key}`]: e.target.value }))}
                                />
                              )}
                            </>
                          ) : f.type === 'select' ? (
                            <>
                              <select
                                className="w-full rounded-lg border border-[#e2e1dc] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                                value={stepDraft[stepId]?.[f.key] || ''}
                                onChange={e => handleFormFieldChange(stepId, f.key, e.target.value)}
                              >
                                <option value="" disabled>선택</option>
                                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                              {fieldErrors[`${stepId}:${f.key}`] && (
                                <p className="mt-1 text-xs text-red-600">{fieldErrors[`${stepId}:${f.key}`]}</p>
                              )}
                            </>
                          ) : f.type === 'calendar' ? (
                            <DateRangePicker
                              fixedStart
                              maxNavDate={maxCalendarNavDate}
                              endDate={stepDraft[stepId]?.[f.key] || null}
                              onChange={({ end }) => handleFormFieldChange(stepId, f.key, end)}
                              hideStatus={!!f.embed}
                              gridPadding="24px 16px 8px"
                              footer={f.embed && (
                                <div className="flex flex-col gap-3">
                                  {f.embed.map(embedKey => {
                                    const embedField = step.fields.find(ef => ef.key === embedKey);
                                    if (!embedField) return null;
                                    return (
                                      <div key={embedKey}>
                                        <label className="mb-1.5 block text-sm font-semibold text-[#5f5e5a]">{embedField.key}</label>
                                        <div className="flex flex-wrap gap-2">
                                          {embedField.options.map(o => (
                                            <button key={o} type="button"
                                              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${stepDraft[stepId]?.[embedKey] === o ? 'border-primary bg-[#e5efff] font-semibold text-[#0048bf]' : 'border-[#e2e1dc] bg-white text-[#5f5e5a] hover:border-primary'}`}
                                              onClick={() => handleFormFieldChange(stepId, embedKey, o)}
                                            >{o}</button>
                                          ))}
                                        </div>
                                        {fieldErrors[`${stepId}:${embedKey}`] && (
                                          <p className="mt-1 text-xs text-red-600">{fieldErrors[`${stepId}:${embedKey}`]}</p>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {(() => {
                                    const dateVal = stepDraft[stepId]?.[f.key];
                                    const parts = [];
                                    if (dateVal) {
                                      const [y, m, d] = dateVal.split('-').map(Number);
                                      parts.push(`${y}년 ${m}월 ${d}일`);
                                    }
                                    f.embed.forEach(embedKey => {
                                      const v = stepDraft[stepId]?.[embedKey];
                                      if (v) parts.push(v);
                                    });
                                    if (parts.length === 0) return null;
                                    return (
                                      <div className="rounded-lg bg-[#f5f7ff] px-3 py-2.5 text-sm">
                                        <span className="text-[#5f5e5a]">선택한 일정: </span>
                                        <span className="font-semibold text-primary">{parts.join(' · ')}</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            />
                          ) : f.type === 'amount-toggle' ? (
                            (() => {
                              const disabledByOther = f.disabledWhenFilled && !!(stepDraft[stepId]?.[f.disabledWhenFilled] || '').toString().trim();
                              return (
                                <>
                                  <div className="flex gap-2">
                                    <input
                                      className={`flex-1 rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary disabled:bg-[#f8f8f6] disabled:text-[#9f9e9a] ${fieldErrors[`${stepId}:${f.key}`] ? 'border-red-500' : 'border-[#e2e1dc]'}`}
                                      placeholder={f.placeholder}
                                      disabled={disabledByOther || stepDraft[stepId]?.[f.key] === '미정'}
                                      value={stepDraft[stepId]?.[f.key] === '미정' ? '' : (stepDraft[stepId]?.[f.key] || '')}
                                      onChange={e => handleFormFieldChange(stepId, f.key, e.target.value)}
                                    />
                                    <button type="button"
                                      disabled={disabledByOther}
                                      className={`shrink-0 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${stepDraft[stepId]?.[f.key] === '미정' ? 'border-primary bg-[#e5efff] text-[#0048bf]' : 'border-[#e2e1dc] bg-white text-[#5f5e5a] hover:border-primary'}`}
                                      onClick={() => handleFormFieldChange(stepId, f.key, stepDraft[stepId]?.[f.key] === '미정' ? '' : '미정')}
                                    >미정</button>
                                  </div>
                                  {fieldErrors[`${stepId}:${f.key}`] && (
                                    <p className="mt-1 text-xs text-red-600">{fieldErrors[`${stepId}:${f.key}`]}</p>
                                  )}
                                </>
                              );
                            })()
                          ) : f.type === 'address' ? (
                            <>
                              <div className="flex gap-2">
                                <input readOnly
                                  className={`flex-1 rounded-lg border bg-[#f8f8f6] px-3 py-2.5 text-sm outline-none ${fieldErrors[`${stepId}:${f.key}`] ? 'border-red-500' : 'border-[#e2e1dc]'}`}
                                  placeholder={f.placeholder}
                                  value={stepDraft[stepId]?.[f.key] || ''}
                                />
                                <button type="button"
                                  className="shrink-0 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-[#e5efff]"
                                  onClick={() => setAddressSearchKey(`${stepId}:${f.key}`)}
                                >주소 검색</button>
                              </div>
                              {fieldErrors[`${stepId}:${f.key}`] && (
                                <p className="mt-1 text-xs text-red-600">{fieldErrors[`${stepId}:${f.key}`]}</p>
                              )}
                            </>
                          ) : f.type === 'textarea' ? (
                            <textarea
                              className="w-full resize-vertical rounded-lg border border-[#e2e1dc] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                              rows={3} placeholder={f.placeholder}
                              value={stepDraft[stepId]?.[f.key] || ''}
                              onChange={e => handleFormFieldChange(stepId, f.key, e.target.value)}
                            />
                          ) : (
                            <>
                              <input
                                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary ${fieldErrors[`${stepId}:${f.key}`] ? 'border-red-500' : 'border-[#e2e1dc]'}`}
                                type={f.type} placeholder={f.placeholder}
                                value={stepDraft[stepId]?.[f.key] || ''}
                                onChange={e => handleFormFieldChange(stepId, f.key, e.target.value)}
                              />
                              {fieldErrors[`${stepId}:${f.key}`] && (
                                <p className="mt-1 text-xs text-red-600">{fieldErrors[`${stepId}:${f.key}`]}</p>
                              )}
                            </>
                          )}
                        </div>
                      );

                      return (
                        <>
                          <div
                            className={step.layout === 'row' ? 'grid gap-3' : ''}
                            style={step.layout === 'row' ? { gridTemplateColumns: `repeat(${step.fields.length}, 1fr)` } : undefined}
                          >
                            {groups.map(group => group.rowKey ? (
                              <div key={group.rowKey} className="mb-4 flex items-start gap-3">
                                {group.fields.map(f => (
                                  <div key={f.key} className={f.type === 'address' || f.type === 'region' ? 'flex-[6]' : f.wide ? 'flex-[4]' : f.compact ? 'w-20 shrink-0' : f.type === 'text' ? 'w-32 shrink-0' : f.type === 'select' ? 'w-36 shrink-0' : f.narrow ? 'w-48 shrink-0' : 'flex-1'}>
                                    {f.type !== 'region' && (
                                      <label className="mb-1.5 block text-base font-semibold text-[#5f5e5a]">{f.key}</label>
                                    )}
                                    {f.type === 'choice' ? (
                                      <>
                                        <div className="flex gap-2">
                                          {f.options.map(o => (
                                            <button key={o} type="button"
                                              className={`flex-1 rounded-lg border px-3 py-2.5 text-[15px] transition-colors ${stepDraft[stepId]?.[f.key] === o ? 'border-primary bg-[#e5efff] font-semibold text-[#0048bf]' : 'border-[#e2e1dc] bg-white text-[#5f5e5a] hover:border-primary'}`}
                                              onClick={() => handleFormFieldChange(stepId, f.key, o)}
                                            >{o}</button>
                                          ))}
                                        </div>
                                        {fieldErrors[`${stepId}:${f.key}`] && (
                                          <p className="mt-1 text-xs text-red-600">{fieldErrors[`${stepId}:${f.key}`]}</p>
                                        )}
                                      </>
                                    ) : f.type === 'select' ? (
                                      <>
                                        <select
                                          className="w-full rounded-lg border border-[#e2e1dc] bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                                          value={stepDraft[stepId]?.[f.key] || ''}
                                          onChange={e => handleFormFieldChange(stepId, f.key, e.target.value)}
                                        >
                                          <option value="" disabled>선택</option>
                                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                        {fieldErrors[`${stepId}:${f.key}`] && (
                                          <p className="mt-1 text-xs text-red-600">{fieldErrors[`${stepId}:${f.key}`]}</p>
                                        )}
                                      </>
                                    ) : f.type === 'address' ? (
                                      <>
                                        <div className="flex gap-2">
                                          <input readOnly
                                            className={`flex-1 rounded-lg border bg-[#f8f8f6] px-3 py-2.5 text-sm outline-none ${fieldErrors[`${stepId}:${f.key}`] ? 'border-red-500' : 'border-[#e2e1dc]'}`}
                                            placeholder={f.placeholder}
                                            value={stepDraft[stepId]?.[f.key] || ''}
                                          />
                                          <button type="button"
                                            className="shrink-0 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-[#e5efff]"
                                            onClick={() => setAddressSearchKey(`${stepId}:${f.key}`)}
                                          >주소 검색</button>
                                        </div>
                                        {fieldErrors[`${stepId}:${f.key}`] && (
                                          <p className="mt-1 text-xs text-red-600">{fieldErrors[`${stepId}:${f.key}`]}</p>
                                        )}
                                      </>
                                    ) : f.type === 'region' ? (
                                      <>
                                        <RegionSelector
                                          label={f.key}
                                          placeholder={f.placeholder}
                                          size="sm"
                                          multiple
                                          maxSelections={f.maxSelections}
                                          value={stepDraft[stepId]?.[f.key] ? stepDraft[stepId][f.key].split(', ') : []}
                                          onChange={sel => handleFormFieldChange(stepId, f.key, sel.map(s => s.label).join(', '))}
                                        />
                                        {f.desc && <p className="mt-1 text-xs text-[#888780]">{f.desc}</p>}
                                        {fieldErrors[`${stepId}:${f.key}`] && (
                                          <p className="mt-1 text-xs text-red-600">{fieldErrors[`${stepId}:${f.key}`]}</p>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <input
                                          className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary ${fieldErrors[`${stepId}:${f.key}`] ? 'border-red-500' : 'border-[#e2e1dc]'}`}
                                          placeholder={f.placeholder}
                                          value={stepDraft[stepId]?.[f.key] || ''}
                                          onChange={e => handleFormFieldChange(stepId, f.key, e.target.value)}
                                        />
                                        {fieldErrors[`${stepId}:${f.key}`] && (
                                          <p className="mt-1 text-xs text-red-600">{fieldErrors[`${stepId}:${f.key}`]}</p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : renderNormalField(group.fields[0]))}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button type="button"
                              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#0048bf]"
                              onClick={() => handleFormConfirm(stepId)}
                            >
                              {step.next ? '다음' : '입력 완료'}
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </section>
            );
                    })}

                    {/* 아직 답변하지 않은 다음 단계들 — 자리만 미리 보여주고 클릭 비활성 */}
                    {previewStepIds.map((stepId, i) => {
                      const previewStep = WIZARD_STEPS[stepId];
                      if (!previewStep) return null;
                      return (
                        <section
                          key={`preview-${stepId}`}
                          className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-[#fafaf8] opacity-60"
                        >
                          <div className="flex w-full items-center gap-3 px-6 py-4">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eceae4] text-xs font-bold text-[#9f9e9a]">
                              {chain.length + i + 1}
                            </span>
                            <h2 className="text-lg font-bold text-[#9f9e9a]">{previewStep.title}</h2>
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ── STEP 1: 요청 확인 (경매등록 RegisterConfirmStep과 동일한 표 스타일) ── */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2">
              <section className="flex flex-col overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm">
                <div className="border-b border-[#e8e8e8] bg-[#eef2fb] px-6 py-4">
                  <h2 className="text-lg font-bold">요청 정보</h2>
                </div>
                <div className="flex-1 p-6">
                  <table className="w-full overflow-hidden rounded-[10px] border border-[#d8d6cf] text-sm">
                    <tbody>
                      {[
                        ['요청 제목', title || '—'],
                        ['카테고리', selectedCategory?.catNm || '—'],
                        ['사진', images.length > 0 ? `${images.length}장 등록됨` : '없음'],
                      ].map(([k, v], i, arr) => (
                        <tr key={k}>
                          <th
                            className={`w-28 break-keep px-3 py-2.5 text-left font-semibold border-r border-[#d8d6cf] ${i === arr.length - 1 ? '' : 'border-b border-[#d8d6cf]'}`}
                            style={{ verticalAlign: 'middle', backgroundColor: '#eef2fb', color: '#5f5e5a' }}
                          >
                            {k}
                          </th>
                          <td className={`px-3 py-2.5 text-[#1d1d1f] ${i === arr.length - 1 ? '' : 'border-b border-[#d8d6cf]'}`}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* 등록한 사진 — 정사각형 큰 박스, 여러 장이면 좌우로 넘겨볼 수 있음. 없으면 빈 상자 */}
                  <div className="mt-5 flex-1">
                    <p className="mb-2 text-sm font-semibold text-[#5f5e5a]">등록한 사진</p>
                    {images.length > 0 ? (
                      (() => {
                        const photoIndex = Math.min(confirmPhotoIndex, images.length - 1);
                        const current = images[photoIndex];
                        return (
                          <div className="relative aspect-square w-full overflow-hidden rounded-[10px] border border-[#d8d6cf] bg-[#fafaf8]">
                            <img
                              src={toImageUrl(current.url)}
                              alt={`요청 사진 ${photoIndex + 1}`}
                              className="h-full w-full object-cover"
                            />
                            {images.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setConfirmPhotoIndex(i => (i - 1 + images.length) % images.length)}
                                  className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#1a1a18]/60 text-white hover:bg-[#1a1a18]/80"
                                  aria-label="이전 사진"
                                >
                                  <ChevronLeft size={18} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmPhotoIndex(i => (i + 1) % images.length)}
                                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#1a1a18]/60 text-white hover:bg-[#1a1a18]/80"
                                  aria-label="다음 사진"
                                >
                                  <ChevronRight size={18} />
                                </button>
                                <span className="absolute bottom-2 right-2 rounded-full bg-[#1a1a18]/60 px-2 py-0.5 text-xs text-white">
                                  {photoIndex + 1} / {images.length}
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center rounded-[10px] border border-dashed border-[#d8d6cf] bg-[#fafaf8]">
                        <p className="text-sm text-[#888780]">등록된 사진이 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm">
                <div className="border-b border-[#e8e8e8] bg-[#eef2fb] px-6 py-4">
                  <h2 className="text-lg font-bold">상세 내용</h2>
                </div>
                <div className="p-6">
                  <table className="w-full overflow-hidden rounded-[10px] border border-[#d8d6cf] text-sm">
                    <tbody>
                      {chain.map((stepId, i, arr) => {
                        const answerText = answers[stepId] || '';
                        const parts = answerText.includes(' / ') ? answerText.split(' / ').map(parseFieldPart) : null;
                        return (
                          <tr key={stepId}>
                            <th
                              className={`w-32 break-keep px-3 py-2.5 text-left font-semibold border-r border-[#d8d6cf] ${i === arr.length - 1 ? '' : 'border-b border-[#d8d6cf]'}`}
                              style={{ verticalAlign: 'middle', backgroundColor: '#eef2fb', color: '#5f5e5a' }}
                            >
                              {renderStepTitle(WIZARD_STEPS[stepId].title)}
                            </th>
                            <td className={`px-3 py-2.5 text-[#1d1d1f] ${i === arr.length - 1 ? '' : 'border-b border-[#d8d6cf]'}`}>
                              {parts ? (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                  {parts.map((item, j) => (
                                    <div key={j}>
                                      {item.label && <span className="block text-xs text-[#888780]">{item.label}</span>}
                                      <span>{item.value}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : answerText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <section ref={agreedRef} className="mt-5 overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white px-6 py-4 shadow-sm">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-[#5f5e5a]">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                />
                위 요청 내용을 확인하였으며, 등록 후 본문 수정이 불가능함에 동의합니다.
              </label>
            </section>
          </>
        )}

        {/* ── 하단 버튼 ── */}
        <div className="flex items-center justify-between pb-4 pt-5">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(0)}
              disabled={loading}
              className="rounded-lg border border-[#e2e1dc] bg-white px-5 py-2.5 text-sm font-semibold text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >이전</button>
          ) : <div />}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDraft}
              disabled={loading}
              className="rounded-lg border border-[#e2e1dc] bg-white px-5 py-2.5 text-sm font-semibold text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >임시저장</button>
            {step === 0 ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0048bf]"
              >다음</button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={loading}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0048bf] disabled:opacity-50"
              >
                {loading ? '등록 중...' : '요청서 공개'}
              </button>
            )}
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
