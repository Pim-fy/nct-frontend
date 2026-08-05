// src/components/service/ServiceRequestImageUpload.jsx
// 전문가 견적 요청서 첨부사진 — 드래그앤드롭·파일 선택·대표이미지 지정
// Props: images([{ id, flSn, url, file }]), onChange(setter), maxImages(최대 장수)
// ServiceRequestFormPage에서 사용. index 0이 대표이미지 — 목록(MyServiceRequestListPage)
// 썸네일로 쓰인다. 지정 방식은 ProductImageUpload와 동일(지정 모드 켜고 사진 클릭 시 맨 앞으로 이동).
import { useRef, useState } from 'react';
import { toImageUrl } from '@api/fileApi';

export default function ServiceRequestImageUpload({ images, onChange, maxImages = 5 }) {
  const [pickMode, setPickMode] = useState(false); // 대표이미지 지정 모드 — 활성화 중 사진 클릭 시 대표로 변경
  const fileInputRef = useRef(null);

  // 선택한 사진을 배열 맨 앞으로 이동 — index 0이 대표이미지(백엔드 전송 시 정렬순번 0번)
  const setAsRepresentative = (id) => {
    onChange(prev => {
      const idx = prev.findIndex(img => img.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return next;
    });
    setPickMode(false);
  };

  const handleFilesSelected = (fileList) => {
    const files = Array.from(fileList).slice(0, maxImages - images.length);
    if (files.length === 0) return;

    const newItems = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      flSn: null,
    }));
    onChange(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (id) => {
    onChange(prev => {
      const target = prev.find(img => img.id === id);
      if (target?.file) URL.revokeObjectURL(target.url);
      return prev.filter(img => img.id !== id);
    });
  };

  return (
    <div
      className="rounded-xl border border-dashed border-[#e2e1dc] bg-[#fafaf8] p-4"
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleFilesSelected(e.dataTransfer.files); }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#888780]">
          {pickMode ? '대표로 지정할 사진을 선택하세요' : `드래그앤드롭 또는 파일 선택 · 최대 ${maxImages}장 (${images.length}/${maxImages})`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPickMode(v => !v)}
            disabled={images.length === 0}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
              pickMode ? 'border-primary bg-primary text-white' : 'border-[#e2e1dc] bg-white text-[#5f5e5a] hover:border-primary hover:text-primary'
            }`}
          >
            대표이미지로 지정
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= maxImages}
            className="rounded-lg border border-[#e2e1dc] bg-white px-3 py-1.5 text-sm text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            사진 추가
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          hidden
          onChange={e => handleFilesSelected(e.target.files)}
        />
      </div>

      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${maxImages}, 1fr)` }}>
        {images.map((img, i) => (
          <div
            key={img.id}
            className="relative"
            onClick={() => pickMode && setAsRepresentative(img.id)}
            style={{ cursor: pickMode && i !== 0 ? 'pointer' : 'default' }}
          >
            <img
              src={toImageUrl(img.url)}
              alt={`요청 사진 ${i + 1}`}
              className={`aspect-square w-full rounded-lg object-cover ${
                i === 0 ? 'border-2 border-primary' : pickMode ? 'border-2 border-dashed border-primary' : 'border border-[#e2e1dc]'
              }`}
            />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-white">대표</span>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
              title="삭제"
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#1a1a18] text-xs leading-none text-white"
            >
              ×
            </button>
          </div>
        ))}
        {Array.from({ length: maxImages - images.length }, (_, i) => (
          <div
            key={`empty-${i}`}
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-[#d8d6cf] bg-white"
          >
            <span className="text-xl text-[#c7c5bd]">+</span>
          </div>
        ))}
      </div>
    </div>
  );
}
