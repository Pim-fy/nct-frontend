import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '@components/admin/PageMeta';
import { ContentPageHeader, ContentPageShell } from '@components/content/ContentUi';
import { getMyProviderApplicationPreviews, submitProviderApplicationPreview } from './providerApplicationPreview';
import './providerApplyPage.css';
import './providerApplicationMulti.css';

const CATEGORIES = ['이사', '청소', '레슨', '설치·수리', '인테리어'];
const DOCUMENTS = ['자격증', '경력증빙', '본인확인'];

/** 담당자 7 · F-PROV-002/003/007/012~014: 여러 카테고리를 한 화면에서 신청하되 심사·서류는 카테고리별 신청 건으로 분리하는 데모입니다. */
const ProviderApplyPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [error, setError] = useState('');
  const applications = getMyProviderApplicationPreviews();
  const states = useMemo(() => Object.fromEntries([...applications].reverse().map((item) => [item.category, item.status])), [applications]);
  const unavailable = (category) => ['심사 대기', '승인됨'].includes(states[category]);
  const toggleCategory = (category) => {
    if (unavailable(category)) return;
    setError('');
    setSelectedCategories((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category]);
  };
  const next = () => {
    if (step === 0 && !selectedCategories.length) return setError('신청할 카테고리를 한 개 이상 선택해 주세요.');
    if (step < 2) return setStep(step + 1);
    submitProviderApplicationPreview({ categories: selectedCategories });
    navigate('/user/mypage');
  };

  return <ContentPageShell className="provider-apply-page">
    <PageMeta title="제공자 권한 신청" />
    <ContentPageHeader eyebrow="담당자 7 · F-PROV-002/003/007" title="제공자 권한 신청" description="여러 카테고리를 함께 선택할 수 있으며, 제출 뒤에는 카테고리별로 따로 심사됩니다." />
    <section className="provider-status-preview"><span>내 카테고리별 신청 현황</span><h2>{applications.length ? `${applications.length}건` : '미신청'}</h2><p>{applications.length ? '심사 결과와 반려 사유는 카테고리별로 확인할 수 있습니다.' : '첫 제공 카테고리를 선택해 신청해 주세요.'}</p>{applications.length > 0 && <dl>{applications.map((item) => <div key={item.id}><dt>{item.category}</dt><dd>{item.status}{item.reason && ` · ${item.reason}`}</dd></div>)}</dl>}</section>
    <section className="provider-apply-card">
      <div className="provider-apply-notice"><strong>복수 카테고리 신청</strong><span>선택한 카테고리는 각각 별도 신청번호·서류 묶음으로 관리자에게 전달됩니다.</span></div>
      <div className="provider-apply-steps">{['카테고리 선택', '정산 정보', '카테고리별 증빙 서류'].map((item, index) => <span className={index === step ? 'active' : index < step ? 'done' : ''} key={item}>{item}</span>)}</div>
      {step === 0 && <div className="provider-apply-category-grid">{CATEGORIES.map((category) => <button className={selectedCategories.includes(category) ? 'active' : ''} disabled={unavailable(category)} key={category} onClick={() => toggleCategory(category)} type="button">{category}<small>{states[category] ?? '신청 가능'}</small></button>)}</div>}
      {step === 1 && <p className="provider-apply-demo-note">정산 계좌 입력 단계입니다. 실제 계좌 검증 계약 연결 전에는 안내만 제공합니다.</p>}
      {step === 2 && <div className="provider-apply-files">{selectedCategories.map((category) => <div className="provider-apply-file-group" key={category}><strong>{category} 신청 서류</strong>{DOCUMENTS.map((document) => <p key={document}>{document} · 파일 계약 연결 대기</p>)}</div>)}</div>}
      {error && <p className="provider-apply-error">{error}</p>}
      <div className="provider-apply-actions"><button className="btn btn-outline" disabled={step === 0} onClick={() => setStep(step - 1)} type="button">이전</button><button className="btn btn-primary" onClick={next} type="button">{step === 2 ? `${selectedCategories.length}개 카테고리 신청하기` : '다음'}</button></div>
    </section>
  </ContentPageShell>;
};
export default ProviderApplyPage;
