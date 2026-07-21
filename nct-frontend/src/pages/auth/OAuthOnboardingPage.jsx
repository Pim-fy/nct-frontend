// src/pages/auth/OAuthOnboardingPage.jsx
// @ai_generated: 작업단위5(F-AUTH-004 온보딩, ISS-009/POL-AUTH-015)
// 소셜 최초 가입은 여기서 약관 동의 + 닉네임 확정을 마쳐야 완결된다(콜백 시점엔 계정이 아직 없음).
// 약관 원문(SIGNUP_TERMS)은 SignupPage.jsx와 동일 파일을 그대로 재사용해 문구 드리프트를 막는다.
// AgreementRow/AgreementModal 자체는 SignupPage.jsx의 복잡한 폼 상태(중복확인·이메일인증 등)와
// 얽혀 있어 안전하게 분리 추출하기보다, 이 화면(체크박스 3개+모달)에 맞는 가벼운 버전을 새로 둔다.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useConfig } from '@hooks/useConfig';
import { completeOauthOnboarding, getOauthOnboardingPending } from '@api/authApi';
import { SIGNUP_TERMS } from './signupTerms';

const AGREEMENT_ITEMS = [
  { key: 'terms', code: 'AGRC0001', label: '서비스이용약관', required: true },
  { key: 'privacy', code: 'AGRC0002', label: '개인정보처리방침', required: true },
  { key: 'marketing', code: 'AGRC0003', label: '마케팅 정보 수신', required: false },
];

const PROVIDER_LABELS = { kakao: '카카오', naver: '네이버', google: '구글' };

const AgreementRow = ({ agreement, checked, onChange, onOpen }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3.5 py-3">
    <label className="flex min-w-0 items-center gap-2 text-sm text-gray-900">
      <input checked={checked} onChange={onChange} type="checkbox" />
      <span>
        {agreement.label}
        {agreement.required ? '(필수)' : '(선택)'}
      </span>
    </label>
    <button
      type="button"
      onClick={onOpen}
      className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 transition hover:bg-gray-50"
    >
      보기
    </button>
  </div>
);

const AgreementModal = ({ agreement, onClose }) => {
  const terms = SIGNUP_TERMS[agreement.code];

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-6" role="dialog">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="m-0 text-xl">{terms?.title ?? agreement.label}</h2>
        {terms ? (
          <>
            <p className="mt-1 text-xs text-gray-400">시행일자 {terms.effectiveDate}</p>
            <p className="mt-4 text-sm leading-6 text-gray-600">{terms.summary}</p>
            <div className="mt-4 grid gap-4 overflow-y-auto pr-1">
              {terms.articles.map((article) => (
                <section key={article.heading}>
                  <h3 className="m-0 text-sm font-semibold text-gray-900">{article.heading}</h3>
                  <p className="mt-1.5 whitespace-pre-line text-xs leading-6 text-gray-600">{article.body}</p>
                </section>
              ))}
            </div>
          </>
        ) : null}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

const OAuthOnboardingPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setConfig } = useConfig();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [provider, setProvider] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [agreements, setAgreements] = useState({ terms: false, privacy: false, marketing: false });
  const [openAgreement, setOpenAgreement] = useState(null);
  const [agreementMessage, setAgreementMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const response = await getOauthOnboardingPending();
        setProvider(response?.data?.provider ?? '');
        setNickname(response?.data?.nickname ?? '');
      } catch {
        setLoadError('온보딩 정보를 찾을 수 없습니다. 소셜 로그인을 다시 시도해주세요.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allAgreed = AGREEMENT_ITEMS.every((agreement) => agreements[agreement.key]);
  const requiredAgreed = agreements.terms && agreements.privacy;
  const selectedAgreement = AGREEMENT_ITEMS.find((agreement) => agreement.key === openAgreement);

  const handleAgreementChange = (key) => (event) => {
    setAgreements((previous) => ({ ...previous, [key]: event.target.checked }));
    setAgreementMessage('');
    setSubmitMessage('');
  };

  const handleAllAgreements = (event) => {
    const checked = event.target.checked;
    setAgreements({ terms: checked, privacy: checked, marketing: checked });
    setAgreementMessage('');
    setSubmitMessage('');
  };

  const handleSubmit = async () => {
    setSubmitMessage('');
    setAgreementMessage('');

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }
    if (trimmedNickname.length > 100) {
      setNicknameError('닉네임은 100자 이하로 입력해주세요.');
      return;
    }
    setNicknameError('');

    if (!requiredAgreed) {
      setAgreementMessage('서비스이용약관과 개인정보처리방침에 모두 동의해야 가입할 수 있습니다.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await completeOauthOnboarding({
        nickname: trimmedNickname,
        agreements: AGREEMENT_ITEMS.map((agreement) => ({
          agreementTypeCode: agreement.code,
          agreed: agreements[agreement.key],
        })),
      });

      const userData = response?.data;
      localStorage.setItem('isLogin', 'true');
      setConfig('user', userData);
      queryClient.setQueryData(['auth', 'user'], userData);

      const from = sessionStorage.getItem('loginRedirectFrom');
      sessionStorage.removeItem('loginRedirectFrom');
      navigate(userData?.role === 'ROLE_ADMIN' ? '/admin' : (from || '/'), { replace: true });
    } catch (error) {
      const message = error.response?.data?.message ?? '가입 처리 중 오류가 발생했습니다. 다시 시도해주세요.';
      if (message.includes('닉네임')) {
        setNicknameError(message);
      }
      setSubmitMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">불러오는 중입니다...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-100 bg-white rounded-2xl shadow-lg px-8 py-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center text-2xl mb-4">⚠️</div>
          <h2 className="text-base font-bold mb-2">온보딩 정보 없음</h2>
          <p className="text-sm text-gray-500 mb-8">{loadError}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg px-8 py-10">
        <h1 className="m-0 text-xl font-bold text-gray-900">
          {PROVIDER_LABELS[provider] ?? '소셜'} 계정으로 가입을 완료합니다
        </h1>
        <p className="mt-2 text-sm text-gray-500">닉네임을 확인하고 약관에 동의하면 가입이 완료됩니다.</p>

        <div className="mt-7">
          <label className="text-sm font-medium text-gray-700">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(event) => { setNickname(event.target.value); setNicknameError(''); }}
            className="mt-1.5 w-full h-12 px-4 rounded-lg border border-gray-300 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {nicknameError ? <p className="mt-1.5 text-xs text-red-600">{nicknameError}</p> : null}
        </div>

        <div className="mt-7">
          <h2 className="m-0 text-base font-semibold text-gray-900">약관 동의</h2>
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-900">
            <input checked={allAgreed} onChange={handleAllAgreements} type="checkbox" />
            전체 동의
          </label>
          <div className="mt-3 grid gap-2">
            {AGREEMENT_ITEMS.map((agreement) => (
              <AgreementRow
                agreement={agreement}
                checked={agreements[agreement.key]}
                key={agreement.key}
                onChange={handleAgreementChange(agreement.key)}
                onOpen={() => setOpenAgreement(agreement.key)}
              />
            ))}
          </div>
          {agreementMessage ? <p className="mt-2 text-xs text-red-600">{agreementMessage}</p> : null}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-8 w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-base font-bold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? '가입 처리 중...' : '가입 완료'}
        </button>
        {submitMessage ? <p className="mt-2 text-xs text-red-600">{submitMessage}</p> : null}
      </div>

      {selectedAgreement ? <AgreementModal agreement={selectedAgreement} onClose={() => setOpenAgreement(null)} /> : null}
    </div>
  );
};

export default OAuthOnboardingPage;
