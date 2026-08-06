// src/components/common/ImageLightbox.jsx
// 사진 클릭 시 전체화면으로 확대해서 보는 공용 뷰어 — 어느 페이지에서든 재사용 가능
//
// 사용법:
//   import ImageLightbox from '@components/common/ImageLightbox';
//   const [lightboxIndex, setLightboxIndex] = useState(null); // null이면 닫힘, 숫자면 그 인덱스로 열림
//
//   <img onClick={() => setLightboxIndex(i)} ... />
//   <ImageLightbox
//     images={images.map(img => toImageUrl(img.url))}  // 이미 해석된 src 문자열 배열
//     initialIndex={lightboxIndex ?? 0}
//     open={lightboxIndex !== null}
//     onClose={() => setLightboxIndex(null)}
//   />
import { useEffect, useState } from 'react';

export default function ImageLightbox({ images, initialIndex = 0, open, onClose }) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setIndex(i => (i + 1) % images.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, images, onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open || !images || images.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/85 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white hover:bg-white/20"
      >
        ×
      </button>

      {images.length > 1 && (
        <button
          type="button"
          onClick={() => setIndex(i => (i - 1 + images.length) % images.length)}
          aria-label="이전 사진"
          className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:left-6"
        >
          ‹
        </button>
      )}

      <img
        src={images[index]}
        alt={`사진 ${index + 1}`}
        className="max-h-[85vh] max-w-full rounded-lg object-contain"
      />

      {images.length > 1 && (
        <button
          type="button"
          onClick={() => setIndex(i => (i + 1) % images.length)}
          aria-label="다음 사진"
          className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 sm:right-6"
        >
          ›
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
