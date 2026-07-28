import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@utils/common';
import { useMyProviderProfile, useUpdateMyProviderProfile } from '@hooks/useProviderProfile';

const fieldClass = 'w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm text-[#404040] focus:border-[#0064ff] focus:outline-none';

/** 담당자 7 · F-PROV-004: 승인된 제공자가 소개와 가능 지역을 직접 관리하는 화면이다. */
export default function ProviderProfilePage({ embedded = false } = {}) {
  const navigate = useNavigate();
  const profileQuery = useMyProviderProfile();
  const statusClass = embedded
    ? 'w-full py-12 text-center'
    : 'mx-auto max-w-3xl px-4 py-12 text-center';

  if (profileQuery.isLoading) return <div className={`${statusClass} text-[#666]`}>프로필을 불러오는 중입니다.</div>;
  if (profileQuery.isError) return (
    <div className={statusClass}>
      <p className="text-[#d9363e]">제공자 프로필을 불러올 수 없습니다.</p>
      <button type="button" className="btn btn-outline mt-4" onClick={() => profileQuery.refetch()}>다시 시도</button>
    </div>
  );

  return (
    <main className={embedded ? "w-full" : "mx-auto max-w-3xl px-4 py-8"}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#252525]">제공자 프로필 관리</h1>
          <p className="mt-1 text-sm text-[#666]">공개 프로필에 표시할 소개와 가능 지역을 관리합니다.</p>
        </div>
        {!embedded && (
          <button type="button" className="btn btn-outline" onClick={() => navigate('/user/mypage')}>대시보드</button>
        )}
      </div>
      <div className="space-y-6">
        <ProviderProfileForm key={profileQuery.data.userSn} profile={profileQuery.data} />
        <PortfolioRegistrationSection />
      </div>
    </main>
  );
}

/**
 * 담당자 7 · F-PROV-005: 포트폴리오 등록 화면 경계다.
 * 파일 저장·PORTFOLIO/PORTFOLIO_FILE API는 담당자 6의 파일 참조 보호 계약을 받은 뒤 연결한다.
 * 그 전에는 입력값을 브라우저에 저장하지 않고, 이미지 선택은 등록 전 미리보기로만 제공한다.
 */
function PortfolioRegistrationSection() {
  const fileInputRef = useRef(null);
  const imagesRef = useRef([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => () => {
    imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
  }, []);

  const selectImages = (event) => {
    const files = Array.from(event.target.files ?? []);
    const invalidFile = files.find((file) => !file.type.startsWith('image/'));

    if (invalidFile) {
      toast({ icon: 'error', title: '이미지 파일만 선택할 수 있습니다.' });
      event.target.value = '';
      return;
    }

    setImages((current) => [
      ...current,
      ...files.map((file) => ({
        id: `${file.name}-${file.lastModified}-${file.size}`,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    event.target.value = '';
  };

  const removeImage = (targetId) => {
    setImages((current) => {
      const target = current.find((image) => image.id === targetId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((image) => image.id !== targetId);
    });
  };

  return (
    <section className="rounded-xl border border-[#e5e5e5] bg-white p-6" aria-labelledby="portfolio-registration-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="portfolio-registration-title" className="text-lg font-bold text-[#252525]">포트폴리오 등록</h2>
          <p className="mt-1 text-sm text-[#666]">작업 사례 이미지와 설명을 준비해 공개 프로필에 보여줄 수 있습니다.</p>
        </div>
        <span className="w-fit rounded-full bg-[#f2f5fb] px-3 py-1 text-xs font-medium text-[#53627a]">저장 API 연결 대기</span>
      </div>

      <div className="mt-5 rounded-lg border border-[#dce6f8] bg-[#f7faff] px-4 py-3 text-sm leading-6 text-[#53627a]">
        현재는 등록 전 입력 화면입니다. 파일 저장·삭제 API가 연결되면 작성한 항목을 실제 포트폴리오로 등록할 수 있습니다.
      </div>

      <div className="mt-6 grid gap-5">
        <div>
          <label className="mb-2 block text-sm font-bold text-[#404040]" htmlFor="portfolio-title">포트폴리오 제목</label>
          <input
            id="portfolio-title"
            className={fieldClass}
            maxLength={100}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 원룸 이사 및 정리 서비스"
            value={title}
          />
          <p className="mt-1 text-right text-xs text-[#888]">{title.length}/100</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#404040]" htmlFor="portfolio-description">작업 설명</label>
          <textarea
            id="portfolio-description"
            className={`${fieldClass} min-h-32 resize-y`}
            maxLength={1000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="어떤 작업을 했는지, 제공 가능한 범위를 알려 주세요."
            value={description}
          />
          <p className="mt-1 text-right text-xs text-[#888]">{description.length}/1000</p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="text-sm font-bold text-[#404040]" htmlFor="portfolio-images">작업 이미지</label>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>이미지 선택</button>
          </div>
          <input
            ref={fileInputRef}
            id="portfolio-images"
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            onChange={selectImages}
          />

          {images.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#c9d3e3] bg-[#fafcff] px-4 py-10 text-center text-sm text-[#777]">
              등록할 작업 이미지를 선택해 미리볼 수 있습니다.
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="선택한 작업 이미지">
              {images.map((image) => (
                <li key={image.id} className="relative overflow-hidden rounded-lg border border-[#d9d9d9] bg-[#f6f6f6]">
                  <img src={image.previewUrl} alt={image.name} className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-2 top-2 rounded bg-white/95 px-2 py-1 text-xs font-medium text-[#444] shadow-sm"
                    onClick={() => removeImage(image.id)}
                  >
                    삭제
                  </button>
                  <p className="truncate px-2 py-2 text-xs text-[#555]">{image.name}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button type="button" className="btn btn-primary" disabled title="파일 저장 API 연결 후 사용할 수 있습니다.">
          포트폴리오 등록
        </button>
      </div>
    </section>
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
