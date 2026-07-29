// src/components/product/ProductImageUpload.jsx
// 상품 이미지 업로드 섹션 — 드래그앤드롭·파일 선택·대표이미지 표시
// Props: images([{ id, flSn, url, file }]), onChange(setter), maxImages(최대 장수)
// ProductRegisterPage에서 사용
//
// 선택 시점엔 서버로 업로드하지 않는다 — 로컬 blob: URL로만 미리보기하고, 실제 업로드는
// ProductRegisterPage.handleSubmit이 임시저장·상품등록 클릭 시 일괄 처리한다
// (F-AUC-002: 저장 버튼을 눌러야만 DB에 반영). flSn이 없는 항목(file만 있는 항목)이 미업로드 상태.
import { useRef, useState } from 'react';
import { toImageUrl } from '@api/fileApi';

export default function ProductImageUpload({ images, onChange, maxImages = 5 }) {
  const [pickMode, setPickMode] = useState(false); // 대표이미지 지정 모드 — 활성화 중 사진 클릭 시 대표로 변경
  const fileInputRef = useRef(null);

  // 선택한 사진을 배열 맨 앞으로 이동 — index 0이 대표이미지(백엔드 전송 시 flSnList의 첫 항목)
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

  // 아직 업로드 전(blob: 미리보기)이면 서버에 남길 게 없어 그냥 목록에서만 제거.
  // 이미 저장된(수정 모드) 이미지는 flSnList에서 빠지는 것으로 다음 저장 시 자연히 정리된다.
  const removeImage = (id) => {
    onChange(prev => {
      const target = prev.find(img => img.id === id);
      if (target?.file) URL.revokeObjectURL(target.url);
      return prev.filter(img => img.id !== id);
    });
  };

  return (
    <div
      className="card"
      style={{ borderStyle: 'dashed', minHeight: 220, display: 'flex', flexDirection: 'column' }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleFilesSelected(e.dataTransfer.files); }}
    >
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <strong>상품 사진 <span style={{ color: '#c0392b' }}>*</span></strong>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            {pickMode ? '대표로 지정할 사진을 선택하세요' : `드래그앤드롭 또는 파일 선택 · 최대 ${maxImages}장 (${images.length}/${maxImages})`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setPickMode(v => !v)}
            disabled={images.length === 0}
            className="btn btn-ghost"
            style={pickMode ? { background: '#0064ff', color: '#fff', borderColor: '#0064ff' } : undefined}
          >
            대표이미지로 지정
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= maxImages}
            className="btn btn-ghost"
          >
            사진등록
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

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${maxImages}, 1fr)`, gridAutoRows: '1fr', gap: 8, marginTop: 12, flex: 1 }}>
        {images.map((img, i) => (
          <div
            key={img.id}
            onClick={() => pickMode && setAsRepresentative(img.id)}
            style={{ position: 'relative', cursor: pickMode && i !== 0 ? 'pointer' : 'default' }}
          >
            <img
              src={toImageUrl(img.url)}
              alt={`상품 사진 ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: i === 0 ? '2px solid #0064ff' : pickMode ? '2px dashed #0064ff' : '1px solid #eee' }}
            />
            {i === 0 && (
              <span className="badge badge-blue" style={{ position: 'absolute', top: 4, left: 4, fontSize: 13 }}>대표</span>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
              title="삭제"
              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#111', color: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: '20px', padding: 0 }}
            >
              ×
            </button>
          </div>
        ))}
        {Array.from({ length: maxImages - images.length }, (_, i) => (
          <div
            key={`empty-${i}`}
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%', height: '100%', borderRadius: 8, border: '1px dashed #d8d6cf', background: '#fafaf8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 24, color: '#c7c5bd' }}>+</span>
          </div>
        ))}
      </div>
    </div>
  );
}
