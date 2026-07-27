import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@utils/common';
import { useMyProviderProfile, useUpdateMyProviderProfile } from '@hooks/useProviderProfile';

const fieldClass = 'w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm text-[#404040] focus:border-[#0064ff] focus:outline-none';

/** 담당자 7 · F-PROV-004: 승인된 제공자가 소개와 가능 지역을 직접 관리하는 화면이다. */
export default function ProviderProfilePage() {
  const navigate = useNavigate();
  const profileQuery = useMyProviderProfile();

  if (profileQuery.isLoading) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-[#666]">프로필을 불러오는 중입니다.</div>;
  if (profileQuery.isError) return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <p className="text-[#d9363e]">제공자 프로필을 불러올 수 없습니다.</p>
      <button type="button" className="btn btn-outline mt-4" onClick={() => profileQuery.refetch()}>다시 시도</button>
    </div>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#252525]">제공자 프로필 관리</h1>
          <p className="mt-1 text-sm text-[#666]">공개 프로필에 표시할 소개와 가능 지역을 관리합니다.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/user/mypage')}>마이페이지</button>
      </div>
      <ProviderProfileForm key={profileQuery.data.userSn} profile={profileQuery.data} />
    </main>
  );
}

function ProviderProfileForm({ profile }) {
  const updateMutation = useUpdateMyProviderProfile();
  const [form, setForm] = useState({
    introduction: profile.introduction ?? '',
    availableArea: profile.availableArea ?? '',
  });
  const submit = async (event) => {
    event.preventDefault();
    try {
      await updateMutation.mutateAsync(form);
      toast({ icon: 'success', title: '제공자 프로필을 저장했습니다.' });
    } catch (error) {
      toast({ icon: 'error', title: error?.response?.data?.message ?? '프로필 저장에 실패했습니다.' });
    }
  };

  return (
      <form className="rounded-xl border border-[#e5e5e5] bg-white p-6" onSubmit={submit}>
        <label className="mb-2 block text-sm font-bold text-[#404040]" htmlFor="provider-area">가능 지역</label>
        <input id="provider-area" className={fieldClass} maxLength={200} value={form.availableArea}
          onChange={(event) => setForm((current) => ({ ...current, availableArea: event.target.value }))}
          placeholder="예: 서울 전 지역, 경기 성남시" />
        <label className="mb-2 mt-6 block text-sm font-bold text-[#404040]" htmlFor="provider-introduction">소개</label>
        <textarea id="provider-introduction" className={`${fieldClass} min-h-44 resize-y`} maxLength={4000} value={form.introduction}
          onChange={(event) => setForm((current) => ({ ...current, introduction: event.target.value }))}
          placeholder="제공 가능한 서비스와 경력을 소개해 주세요." />
        <p className="mt-1 text-right text-xs text-[#888]">{form.introduction.length}/4000</p>
        <div className="mt-6 flex justify-end"><button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>{updateMutation.isPending ? '저장 중' : '저장'}</button></div>
      </form>
  );
}
