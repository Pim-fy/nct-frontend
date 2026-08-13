// src/pages/auth/FindEmailPage.jsx
// F-AUTH-014: 이메일+이름으로 아이디를 찾는다. 실패 사유(불일치·탈퇴·정지·미가입)는
// 서버가 전부 동일한 오류로 응답하므로 화면도 하나의 안내 문구만 보여준다.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { findEmail } from '@api/authApi';
import AuthPageContainer from '@components/auth/AuthPageContainer';
import AuthCard from '@components/auth/AuthCard';
import { ActionButton } from '@components/common/ui';
import { notify } from '@utils/common';

export default function FindEmailPage() {
  const [email,        setEmail]        = useState('');
  const [name,         setName]         = useState('');
  const [loading,      setLoading]      = useState(false);
  const [maskedLoginId, setMaskedLoginId] = useState(null);

  const handleSubmit = async () => {
    if (!email.trim() || !name.trim()) {
      await notify({ icon: 'warning', title: '이메일과 이름을 입력해주세요.', size: 'sm' });
      return;
    }

    setLoading(true);
    try {
      const result = await findEmail({ email, name });
      setMaskedLoginId(result?.data?.maskedLoginId ?? null);
    } catch {
      // @ai_generated: 불일치·탈퇴·정지·미가입 전부 USER_NOT_FOUND(404)로 동일하게 응답된다.
      await notify({ icon: 'error', title: '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const handleRetry = () => {
    setMaskedLoginId(null);
    setEmail('');
    setName('');
  };

  return (
    <AuthPageContainer>
      <AuthCard className="max-w-110">
        <h1 className="text-xl font-bold text-center mb-8">아이디 찾기</h1>

        {maskedLoginId === null ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">이메일 주소</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-12 px-4 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">이름</label>
              <input
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-12 px-4 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <ActionButton
              onClick={handleSubmit}
              fullWidth
              loading={loading}
              size="lg"
              className="mt-1"
            >
              {loading ? '조회 중...' : '아이디 찾기'}
            </ActionButton>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
              <p className="text-sm font-semibold text-green-700">아이디를 찾았습니다</p>
              <p className="text-xs text-green-600 mt-1">입력하신 정보로 가입된 계정입니다.</p>
            </div>
            <div className="bg-gray-50 rounded-lg py-5 text-center">
              <div className="text-xs text-gray-500 mb-1">가입된 아이디</div>
              <div className="font-mono text-base font-bold text-gray-900">{maskedLoginId}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                to="/login"
                tone="outline"
              >
                로그인하기
              </ActionButton>
              <ActionButton
                to="/reset-password"
                tone="neutral"
              >
                비밀번호 재설정
              </ActionButton>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="text-sm text-gray-400 hover:text-blue-600 transition"
            >
              다시 찾기
            </button>
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-gray-500 hover:text-blue-600 transition">
            ← 로그인으로 돌아가기
          </Link>
        </div>
      </AuthCard>
    </AuthPageContainer>
  );
}
