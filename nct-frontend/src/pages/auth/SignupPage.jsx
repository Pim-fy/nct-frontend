// src/pages/auth/SignupPage.jsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Toast from '@components/common/Toast';

const CARD_SHADOW = 'shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)]';
const STEP_LABELS = ['기본정보', '약관동의', '이메일 인증', '완료'];
const CODE_TIMER_SECONDS = 180;

const INPUT_CLASS =
  'min-h-10 w-full rounded-lg border border-[#e2e1dc] px-3 outline-none focus:border-primary';
const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark';
const BTN_GHOST =
  'inline-flex items-center justify-center rounded-lg border border-[#e2e1dc] bg-transparent px-5 py-2.5 text-sm font-medium text-[#5f5e5a] hover:border-primary hover:text-primary';
const BTN_OUTLINE =
  'inline-flex items-center justify-center rounded-lg border border-primary px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary-light';

const formatTimer = (sec) => {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
};

const Field = ({ label, children }) => (
  <div className="grid gap-1.5">
    <label className="text-sm text-[#5f5e5a]">{label}</label>
    {children}
  </div>
);

const AgreementRow = ({ label, checked, onChange, onView }) => (
  <div
    className={`flex items-center justify-between gap-4 rounded-2xl border border-[#f0efec] bg-white p-4 ${CARD_SHADOW}`}
  >
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
    <button type="button" onClick={onView} className={BTN_GHOST}>
      보기
    </button>
  </div>
);

const AgreementModal = ({ title, children, onClose, onConfirm }) => (
  <div
    className="fixed inset-0 z-200 flex items-center justify-center bg-black/[0.36] p-6"
    onClick={onClose}
  >
    <div
      className="w-full max-w-140 rounded-2xl bg-white p-5.5 shadow-[0_20px_80px_rgba(0,0,0,0.25)]"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="mt-0">{title}</h3>
      {children}
      <div className="mt-4.5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={BTN_GHOST}>
          닫기
        </button>
        <button type="button" onClick={onConfirm} className={BTN_PRIMARY}>
          확인
        </button>
      </div>
    </div>
  </div>
);

const SignupPage = () => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    userId: '',
    nickname: '',
    password: '',
    passwordConfirm: '',
    email: '',
    phone: '',
  });
  const [agreements, setAgreements] = useState({ terms: false, privacy: false, marketing: false });
  const [openModal, setOpenModal] = useState(null); // 'terms' | 'privacy' | 'marketing' | null
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [remaining, setRemaining] = useState(0);
  const [toast, setToast] = useState('');
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const updateField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const agreeAll = agreements.terms && agreements.privacy && agreements.marketing;

  const handleAgreeAll = (checked) =>
    setAgreements({ terms: checked, privacy: checked, marketing: checked });

  const handleAgreeChange = (key) => (e) =>
    setAgreements((prev) => ({ ...prev, [key]: e.target.checked }));

  const handleSendCode = () => {
    setCodeSent(true);
    setToast('인증코드를 발송했습니다');
    setRemaining(CODE_TIMER_SECONDS);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyCode = () => setToast('인증되었습니다');

  const closeModal = () => setOpenModal(null);
  const confirmModal = () => {
    setToast('확인 처리되었습니다');
    setOpenModal(null);
  };

  const goPrev = () => setStep((prev) => Math.max(prev - 1, 0));
  const goNext = () => setStep((prev) => Math.min(prev + 1, STEP_LABELS.length - 1));

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1a1a18]">
      {/* 상단 바 */}
      <header className="flex h-15 items-center border-b border-[#f0efec] bg-white px-6">
        <Link to="/" className="text-xl font-bold text-primary no-underline">
          Ksteam
        </Link>
        <span className="ml-4 text-sm text-[#5f5e5a]">회원가입</span>
      </header>

      <main className="mx-auto w-[90%] max-w-[1800px] flex-1 py-7">
        <div className="mb-4.5 mt-7">
          <h1 className="m-0 text-[28px]">회원가입</h1>
        </div>

        <section className={`rounded-2xl border border-[#f0efec] bg-white p-5 ${CARD_SHADOW}`}>
          {/* 진행 단계 */}
          <div className="mb-8 flex">
            {STEP_LABELS.map((label, i) => (
              <div
                key={label}
                className={`flex-1 border-b-[3px] p-3 text-center text-sm font-medium ${
                  i === step
                    ? 'border-primary font-bold text-primary'
                    : i < step
                    ? 'border-primary-light text-[#5f5e5a]'
                    : 'border-[#f0efec] text-[#888780]'
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Step 0: 기본정보 */}
          {step === 0 && (
            <div className="mx-auto grid max-w-120 gap-3.5">
              <Field label="아이디">
                <input
                  className={INPUT_CLASS}
                  placeholder="영문+숫자 6~20자"
                  value={form.userId}
                  onChange={updateField('userId')}
                />
              </Field>
              <Field label="닉네임">
                <input
                  className={INPUT_CLASS}
                  placeholder="초록구매자"
                  value={form.nickname}
                  onChange={updateField('nickname')}
                />
              </Field>
              <Field label="비밀번호">
                <input
                  type="password"
                  className={INPUT_CLASS}
                  value={form.password}
                  onChange={updateField('password')}
                />
              </Field>
              <Field label="비밀번호 확인">
                <input
                  type="password"
                  className={INPUT_CLASS}
                  value={form.passwordConfirm}
                  onChange={updateField('passwordConfirm')}
                />
              </Field>
              <Field label="이메일">
                <input
                  type="email"
                  className={INPUT_CLASS}
                  placeholder="ks***@***.com"
                  value={form.email}
                  onChange={updateField('email')}
                />
              </Field>
              <Field label="전화번호(선택)">
                <input
                  type="tel"
                  className={INPUT_CLASS}
                  placeholder="010-****-5678"
                  value={form.phone}
                  onChange={updateField('phone')}
                />
              </Field>
            </div>
          )}

          {/* Step 1: 약관동의 */}
          {step === 1 && (
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agreeAll}
                  onChange={(e) => handleAgreeAll(e.target.checked)}
                />
                전체 동의
              </label>
              <div className="mt-3.5 grid gap-3">
                <AgreementRow
                  label="서비스이용약관(필수)"
                  checked={agreements.terms}
                  onChange={handleAgreeChange('terms')}
                  onView={() => setOpenModal('terms')}
                />
                <AgreementRow
                  label="개인정보처리방침(필수)"
                  checked={agreements.privacy}
                  onChange={handleAgreeChange('privacy')}
                  onView={() => setOpenModal('privacy')}
                />
                <AgreementRow
                  label="마케팅 정보 수신(선택)"
                  checked={agreements.marketing}
                  onChange={handleAgreeChange('marketing')}
                  onView={() => setOpenModal('marketing')}
                />
              </div>
            </div>
          )}

          {/* Step 2: 이메일 인증 */}
          {step === 2 && (
            <div>
              <div className="grid grid-cols-2 gap-6">
                <button type="button" onClick={handleSendCode} className={BTN_OUTLINE}>
                  인증코드 발송
                </button>
                <input
                  className={INPUT_CLASS}
                  placeholder="6자리 코드"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              {codeSent && (
                <p className="font-mono text-sm text-[#5f5e5a]">{formatTimer(remaining)}</p>
              )}
              <button type="button" onClick={handleVerifyCode} className={BTN_PRIMARY}>
                확인
              </button>
            </div>
          )}

          {/* Step 3: 완료 */}
          {step === 3 && (
            <div className="text-center">
              <h2>가입이 완료되었습니다</h2>
              <p className="text-[#5f5e5a]">
                이메일 인증 완료 후 제공자 권한 신청을 시작할 수 있습니다.
              </p>
              <Link to="/login" className={`${BTN_PRIMARY} no-underline`}>
                로그인 하기
              </Link>
            </div>
          )}

          {step < 3 && (
            <div className="mt-6 flex justify-between">
              <button type="button" onClick={goPrev} className={BTN_GHOST}>
                이전
              </button>
              <button type="button" onClick={goNext} className={BTN_PRIMARY}>
                다음
              </button>
            </div>
          )}
        </section>
      </main>

      {/* 약관 모달 */}
      {openModal === 'terms' && (
        <AgreementModal title="서비스이용약관" onClose={closeModal} onConfirm={confirmModal}>
          <p className="text-[#5f5e5a]">
            경매 입찰, 서비스 견적 선택, 거래 완료 확인은 단계별 동의를 기록합니다.
          </p>
        </AgreementModal>
      )}
      {openModal === 'privacy' && (
        <AgreementModal title="개인정보처리방침" onClose={closeModal} onConfirm={confirmModal} />
      )}
      {openModal === 'marketing' && (
        <AgreementModal title="마케팅 정보 수신" onClose={closeModal} onConfirm={confirmModal}>
          <p className="text-[#5f5e5a]">
            선택 동의이며 언제든 마이페이지에서 해제할 수 있습니다.
          </p>
        </AgreementModal>
      )}

      {/* 푸터 */}
      <footer className="mt-auto border-t-40 border-white bg-[#1a1a18] px-4 py-7 text-[#d3d1c7]">
        <div className="mx-auto flex w-[90%] max-w-[1800px] flex-wrap items-center justify-between gap-3">
          <strong className="text-white">Ksteam</strong>
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            <a href="#" className="hover:text-white">서비스 소개</a>
            <a href="#" className="hover:text-white">이용약관</a>
            <a href="#" className="hover:text-white">개인정보처리방침</a>
            <a href="#" className="hover:text-white">문의</a>
          </div>
          <span className="text-[13px]">© 2026 Ksteam UI Mockup</span>
        </div>
      </footer>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
};

export default SignupPage;
