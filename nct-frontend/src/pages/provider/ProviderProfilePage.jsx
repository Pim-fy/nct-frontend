import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteImage, toImageUrl, uploadImage } from '@api/fileApi';
import { toast } from '@utils/common';
import {
  useCreatePortfolio,
  useDeletePortfolio,
  useMyPortfolios,
  useMyProviderProfile,
  useUpdateMyProviderProfile,
  useUpdatePortfolio,
} from '@hooks/useProviderProfile';
import MyPageContentHeader from '@components/mypage/MyPageContentHeader';
import FormSkeleton from '@components/skeleton/FormSkeleton';
import './providerProfilePage.css';

const fieldClass = 'w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm text-[#404040] focus:border-[#0064ff] focus:outline-none';

/** 담당자 7 · F-PROV-004: 승인된 제공자가 소개와 가능 지역을 직접 관리하는 화면이다. */
export default function ProviderProfilePage({ embedded = false } = {}) {
  const navigate = useNavigate();
  const profileQuery = useMyProviderProfile();
  const statusClass = embedded
    ? 'w-full py-12 text-center'
    : 'mx-auto max-w-3xl px-4 py-12 text-center';

  if (profileQuery.isLoading) return (
    <main className={`provider-profile-editor ${embedded ? 'w-full py-8' : 'mx-auto max-w-3xl px-4 py-8'}`}>
      {embedded && <MyPageContentHeader title="프로필" />}
      <FormSkeleton fields={6} />
    </main>
  );
  if (profileQuery.isError) return (
    <main className={`provider-profile-editor ${embedded ? 'w-full' : 'mx-auto max-w-3xl px-4 py-8'}`}>
      {embedded && <MyPageContentHeader title="프로필" />}
      <div className={statusClass}>
        <p className="text-[#d9363e]">제공자 프로필을 불러올 수 없습니다.</p>
        <button type="button" className="btn btn-outline mt-4" onClick={() => profileQuery.refetch()}>다시 시도</button>
      </div>
    </main>
  );

  return (
    <main className={`provider-profile-editor ${embedded ? 'w-full' : 'mx-auto max-w-3xl px-4 py-8'}`}>
      {embedded ? (
        <MyPageContentHeader title="프로필" />
      ) : (
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#252525]">제공자 프로필 관리</h1>
            <p className="mt-1 text-sm text-[#666]">공개 프로필에 표시할 소개와 가능 지역을 관리합니다.</p>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/user/mypage')}>대시보드</button>
        </div>
      )}
      <div className={embedded ? 'provider-profile-editor__split' : 'space-y-6'}>
        <ProviderProfileForm key={profileQuery.data.userSn} profile={profileQuery.data} />
        <PortfolioRegistrationSection />
      </div>
    </main>
  );
}

/**
 * 담당자 7 · F-PROV-005: 파일 업로드 계약을 소비해 포트폴리오 등록·수정·삭제를 제공한다.
 * 새 파일 업로드와 포트폴리오 저장 사이에 실패하면 방금 올린 고아 파일을 정리한다.
 */
function PortfolioRegistrationSection() {
  const fileInputRef = useRef(null);
  const imagesRef = useRef([]);
  const portfoliosQuery = useMyPortfolios();
  const createMutation = useCreatePortfolio();
  const updateMutation = useUpdatePortfolio();
  const deleteMutation = useDeletePortfolio();
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => () => {
    imagesRef.current.forEach((image) => {
      if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    });
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
        file,
        flSn: null,
        url: null,
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

  const clearEditor = () => {
    imagesRef.current.forEach((image) => {
      if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    });
    setEditingPortfolio(null);
    setTitle('');
    setDescription('');
    setImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const editPortfolio = (portfolio) => {
    imagesRef.current.forEach((image) => {
      if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    });
    setEditingPortfolio(portfolio);
    setTitle(portfolio.title ?? '');
    setDescription(portfolio.content ?? '');
    setImages((portfolio.files ?? []).map((file) => ({
      id: `file-${file.fileSn}`,
      name: `포트폴리오 이미지 ${file.sortOrder + 1}`,
      file: null,
      flSn: file.fileSn,
      url: file.url,
      previewUrl: null,
    })));
  };

  const submitPortfolio = async () => {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      toast({ icon: 'error', title: '포트폴리오 제목을 입력해 주세요.' });
      return;
    }
    if (images.length === 0) {
      toast({ icon: 'error', title: '대표로 사용할 작업 이미지를 한 장 이상 선택해 주세요.' });
      return;
    }

    setIsSubmitting(true);
    const uploadedFiles = [];
    try {
      for (const image of images.filter((item) => item.file)) {
        const response = await uploadImage(image.file, 'portfolio');
        uploadedFiles.push({ id: image.id, flSn: response.data.flSn });
      }

      const uploadedById = new Map(uploadedFiles.map((file) => [file.id, file.flSn]));
      const fileIds = images.map((image) => image.flSn ?? uploadedById.get(image.id));
      const payload = {
        title: normalizedTitle,
        content: description.trim() || null,
        fileIds,
      };

      if (editingPortfolio) {
        await updateMutation.mutateAsync({
          portfolioSn: editingPortfolio.portfolioSn,
          ...payload,
        });
        const retainedIds = new Set(fileIds);
        const removedIds = (editingPortfolio.files ?? [])
          .map((file) => file.fileSn)
          .filter((fileSn) => !retainedIds.has(fileSn));
        await Promise.allSettled(removedIds.map((fileSn) => deleteImage(fileSn)));
        toast({ icon: 'success', title: '포트폴리오를 수정했습니다.' });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ icon: 'success', title: '포트폴리오를 등록했습니다.' });
      }
      clearEditor();
    } catch (error) {
      await Promise.allSettled(uploadedFiles.map((file) => deleteImage(file.flSn)));
      toast({
        icon: 'error',
        title: error?.response?.data?.message ?? '포트폴리오 저장에 실패했습니다.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removePortfolio = async (portfolio) => {
    if (!window.confirm(`'${portfolio.title}' 포트폴리오를 삭제할까요?`)) return;
    try {
      await deleteMutation.mutateAsync(portfolio.portfolioSn);
      await Promise.allSettled((portfolio.files ?? []).map((file) => deleteImage(file.fileSn)));
      if (editingPortfolio?.portfolioSn === portfolio.portfolioSn) clearEditor();
      toast({ icon: 'success', title: '포트폴리오를 삭제했습니다.' });
    } catch (error) {
      toast({
        icon: 'error',
        title: error?.response?.data?.message ?? '포트폴리오 삭제에 실패했습니다.',
      });
    }
  };

  return (
    <section className="provider-profile-editor__card space-y-5 rounded-xl border border-[#e5e5e5] bg-white p-6" aria-labelledby="portfolio-registration-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="portfolio-registration-title" className="text-lg font-bold text-[#252525]">포트폴리오 관리</h2>
          <p className="mt-1 text-sm text-[#666]">첫 번째 작업 이미지가 공개 프로필의 대표 이미지로 표시됩니다.</p>
        </div>
        {editingPortfolio && (
          <button type="button" className="btn btn-outline btn-sm" onClick={clearEditor}>새 항목 등록</button>
        )}
      </div>

      <div className="grid gap-5">
        <h3 className="font-bold text-[#303030]">{editingPortfolio ? '포트폴리오 수정' : '새 포트폴리오 등록'}</h3>
        <div>
          <label className="mb-2 block text-sm font-bold text-[#404040]" htmlFor="portfolio-title">포트폴리오 제목</label>
          <input
            id="portfolio-title"
            className={fieldClass}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="예: 원룸 이사 및 정리 서비스"
            value={title}
          />
          <p className="mt-1 text-right text-xs text-[#888]">{title.length}/200</p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#404040]" htmlFor="portfolio-description">작업 설명</label>
          <textarea
            id="portfolio-description"
            className={`${fieldClass} min-h-32 resize-y`}
            maxLength={4000}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="어떤 작업을 했는지, 제공 가능한 범위를 알려 주세요."
            value={description}
          />
          <p className="mt-1 text-right text-xs text-[#888]">{description.length}/4000</p>
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
                  <img src={image.previewUrl ?? toImageUrl(image.url)} alt={image.name} className="aspect-square w-full object-cover" />
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

      <div className="flex justify-end">
        <button type="button" className="btn btn-primary" disabled={isSubmitting} onClick={submitPortfolio}>
          {isSubmitting ? '저장 중' : editingPortfolio ? '수정 저장' : '포트폴리오 등록'}
        </button>
      </div>

      <div className="grid gap-4 border-t border-[#ececec] pt-5">
        <h3 className="font-bold text-[#303030]">등록한 포트폴리오 관리</h3>
        {portfoliosQuery.isLoading && <p className="text-sm text-[#666]">등록한 포트폴리오를 불러오는 중입니다.</p>}
        {portfoliosQuery.isError && (
          <div className="rounded-lg border border-[#f1c5c8] bg-[#fff8f8] px-4 py-3 text-sm text-[#c62828]">
            포트폴리오 목록을 불러오지 못했습니다.
            <button type="button" className="ml-2 underline" onClick={() => portfoliosQuery.refetch()}>다시 시도</button>
          </div>
        )}
        {portfoliosQuery.data?.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2" aria-label="등록한 포트폴리오">
            {portfoliosQuery.data.map((portfolio) => {
              const representative = portfolio.files?.find((file) => file.representative)
                ?? portfolio.files?.[0];
              return (
                <li key={portfolio.portfolioSn} className="overflow-hidden rounded-lg border border-[#dfe3ea]">
                  {representative?.url && (
                    <img
                      src={toImageUrl(representative.url)}
                      alt=""
                      className="aspect-[16/9] w-full object-cover"
                    />
                  )}
                  <div className="p-4">
                    <strong className="block truncate text-sm text-[#252525]">{portfolio.title}</strong>
                    <p className="mt-2 line-clamp-2 min-h-10 text-sm text-[#666]">
                      {portfolio.content || '등록된 설명이 없습니다.'}
                    </p>
                    <div className="mt-4 flex justify-end gap-2">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => editPortfolio(portfolio)}>수정</button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm text-[#d9363e]"
                        disabled={deleteMutation.isPending}
                        onClick={() => removePortfolio(portfolio)}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
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
      <form className="provider-profile-editor__card provider-profile-editor__form rounded-xl border border-[#e5e5e5] bg-white p-6" onSubmit={submit}>
        <div className="provider-profile-editor__section-heading">
          <h2>기본 프로필</h2>
          <p>고객에게 공개되는 활동 지역과 서비스 소개를 관리합니다.</p>
        </div>
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
