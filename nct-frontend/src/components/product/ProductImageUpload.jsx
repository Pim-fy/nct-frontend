// src/components/product/ProductImageUpload.jsx
// 상품 이미지 업로드 섹션 — 드래그앤드롭·파일 선택·대표이미지 표시
// Props: images([{ flSn, url }]), onChange(setter), maxImages(최대 장수)
// ProductRegisterPage에서 사용
import { useRef, useState } from 'react';
import { deleteImage, toImageUrl, uploadImage } from '@api/fileApi';

export default function ProductImageUpload({ images, onChange, maxImages = 5 }) {
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState('');
  const [pickMode, setPickMode] = useState(false); // 대표이미지 지정 모드 — 활성화 중 사진 클릭 시 대표로 변경
  const fileInputRef = useRef(null);

  // 선택한 사진을 배열 맨 앞으로 이동 — index 0이 대표이미지(백엔드 전송 시 flSnList의 첫 항목)
  const setAsRepresentative = (flSn) => {
    onChange(prev => {
      const idx = prev.findIndex(img => img.flSn === flSn);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return next;
    });
    setPickMode(false);
  };

  const handleFilesSelected = async (fileList) => {
    const files = Array.from(fileList).slice(0, maxImages - images.length);
    if (files.length === 0) return;

    setImageUploading(true);
    setError('');
    try {
      for (const file of files) {
        // service='product': 백엔드가 /home/nct/attachment/product/{날짜}/ 폴더로 분류 저장
        const res = await uploadImage(file, 'product');
        onChange(prev => [...prev, { flSn: res.data.flSn, url: res.data.url }]);
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || '이미지 업로드에 실패했습니다.');
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 화면에서 빼고, 서버의 고아 파일(FILES 행 + 디스크)도 정리한다.
  // 삭제 API 실패해도 화면 제거는 그대로 진행하고 흔적만 콘솔에 남긴다.
  const removeImage = (flSn) => {
    onChange(prev => prev.filter(img => img.flSn !== flSn));
    deleteImage(flSn).catch(err => {
      console.warn('첨부 파일 서버 삭제 실패 (화면 제거는 진행됨) - flSn:', flSn, err.response?.data?.message || err.message);
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
          <strong>상품 사진</strong>
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
            disabled={imageUploading || images.length >= maxImages}
            className="btn btn-ghost"
          >
            {imageUploading ? '업로드 중...' : '사진등록'}
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

      {error && (
        <p style={{ color: 'var(--color-danger, #e53e3e)', fontSize: 15, marginTop: 8 }}>{error}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${maxImages}, 1fr)`, gridAutoRows: '1fr', gap: 8, marginTop: 12, flex: 1 }}>
        {images.map((img, i) => (
          <div
            key={img.flSn}
            onClick={() => pickMode && setAsRepresentative(img.flSn)}
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
              onClick={(e) => { e.stopPropagation(); removeImage(img.flSn); }}
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
            onClick={() => !imageUploading && fileInputRef.current?.click()}
            style={{ width: '100%', height: '100%', borderRadius: 8, border: '1px dashed #d8d6cf', background: '#fafaf8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: imageUploading ? 'default' : 'pointer' }}
          >
            <span style={{ fontSize: 24, color: '#c7c5bd' }}>+</span>
          </div>
        ))}
      </div>
    </div>
  );
}
