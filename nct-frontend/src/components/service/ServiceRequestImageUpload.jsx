// src/components/service/ServiceRequestImageUpload.jsx
// 전문가 견적 요청서 첨부사진 — 드래그앤드롭·파일 선택으로 로컬 미리보기만 담당
// Props: images([{ id, flSn, url, file }]), onChange(setter), maxImages(최대 장수)
// ServiceRequestFormPage에서 사용
//
// SERVICE_REQUEST_FILE 연결 테이블·업로드 API가 아직 정본요청 전이라, 지금은 로컬
// blob: 미리보기까지만 동작한다. 대표이미지·정렬순서 개념 없이 단순 다중 첨부(ProductImageUpload와
// 다른 점). API 확정되면 제출 시점에 uploadImage → SERVICE_REQUEST_FILE 연결 호출만 추가하면 된다.
import { useRef } from 'react';
import { toImageUrl } from '@api/fileApi';

export default function ServiceRequestImageUpload({ images, onChange, maxImages = 5 }) {
  const fileInputRef = useRef(null);

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
          드래그앤드롭 또는 파일 선택 · 최대 {maxImages}장 ({images.length}/{maxImages})
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages}
          className="rounded-lg border border-[#e2e1dc] bg-white px-3 py-1.5 text-sm text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          사진 추가
        </button>
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
          <div key={img.id} className="relative">
            <img
              src={toImageUrl(img.url)}
              alt={`요청 사진 ${i + 1}`}
              className="aspect-square w-full rounded-lg border border-[#e2e1dc] object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(img.id)}
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
