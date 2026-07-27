// 담당자 7 · F-PROV-002/003/007/012~014 UI 연결 검수용 브라우저 데모 저장소입니다.
// 실제 PROVIDER_APPLY API가 준비되면 이 파일 전체를 API/hook으로 교체합니다.
// sessionStorage만 사용하므로 실제 권한·DB·파일에는 영향을 주지 않습니다.
const STORAGE_KEY = 'nct-provider-application-preview-v2';
const MY_APPLICATION_IDS_KEY = 'nct-provider-application-preview-my-ids';

const DEFAULT_APPLIES = [
  { id: 'PRV-2607-001', name: '최민수', category: '이사', type: '신규', date: '2026-07-17', status: '심사 대기', tone: 'warning', area: '서울·경기', files: 3, documentTypes: ['자격증', '경력증빙', '본인확인'], reason: '' },
  { id: 'PRV-2607-002', name: '이슬기', category: '청소', type: '추가', date: '2026-07-16', status: '승인됨', tone: 'success', area: '서울', files: 2, documentTypes: ['경력증빙', '본인확인'], reason: '' },
  { id: 'PRV-2607-003', name: '박준호', category: '설치·수리', type: '갱신', date: '2026-07-15', status: '반려됨', tone: 'danger', area: '부산·경남', files: 3, documentTypes: ['자격증', '경력증빙', '본인확인'], reason: '제출 서류의 식별 정보가 부족합니다.' },
];

const canUseStorage = () => typeof window !== 'undefined' && window.sessionStorage;
const read = () => {
  if (!canUseStorage()) return DEFAULT_APPLIES;
  try { return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY)) ?? DEFAULT_APPLIES; } catch { return DEFAULT_APPLIES; }
};
const write = (items) => canUseStorage() && window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const readMyIds = () => {
  if (!canUseStorage()) return [];
  try { return JSON.parse(window.sessionStorage.getItem(MY_APPLICATION_IDS_KEY)) ?? []; } catch { return []; }
};

export const getProviderApplicationPreviews = () => read();
export const getMyProviderApplicationPreviews = () => {
  const ids = new Set(readMyIds());
  return read().filter((item) => ids.has(item.id));
};
// 기존 상태 카드가 사용하는 최신 1건 호환 함수입니다. 새 화면은 목록 함수를 사용합니다.
export const getMyProviderApplicationPreview = () => getMyProviderApplicationPreviews()[0] ?? null;
export const submitProviderApplicationPreview = ({ categories }) => {
  const date = new Date().toLocaleDateString('sv-SE');
  const batchId = `PRV-BATCH-${Date.now().toString().slice(-6)}`;
  const type = readMyIds().length ? '추가' : '신규';
  const items = categories.map((category, index) => ({
    id: `PRV-DEMO-${Date.now().toString().slice(-6)}-${index + 1}`,
    batchId,
    name: '내 제공자 신청',
    category,
    type,
    date,
    status: '심사 대기',
    tone: 'warning',
    area: '서비스 가능 지역 미입력',
    files: 3,
    documentTypes: ['자격증', '경력증빙', '본인확인'],
    reason: '',
  }));
  write([...items, ...read()]);
  canUseStorage() && window.sessionStorage.setItem(MY_APPLICATION_IDS_KEY, JSON.stringify([...items.map((item) => item.id), ...readMyIds()]));
  return items;
};
export const decideProviderApplicationPreview = ({ id, decision, reason }) => {
  const status = decision === 'approve' ? '승인됨' : '반려됨';
  const tone = decision === 'approve' ? 'success' : 'danger';
  const next = read().map((item) => item.id === id ? { ...item, status, tone, reason: decision === 'reject' ? reason.trim() : '' } : item);
  write(next);
  return next.find((item) => item.id === id);
};
