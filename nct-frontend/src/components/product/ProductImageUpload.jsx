// src/components/product/ProductImageUpload.jsx
// 상품 이미지 업로드 섹션 — 드래그앤드롭·파일 선택·대표이미지 표시
// Props: images([{ flSn, url }]), onChange(setter), maxImages(최대 장수)
// ProductRegisterPage에서 사용
import { useRef, useState } from 'react';
import { deleteImage, toImageUrl, uploadImage } from '@api/fileApi';

export default function ProductImageUpload({ images, onChange, maxImages = 5 }) {
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

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
      style={{ borderStyle: 'dashed' }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleFilesSelected(e.dataTransfer.files); }}
    >
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <strong>상품 사진</strong>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            드래그앤드롭 또는 파일 선택 · 최대 {maxImages}장 ({images.length}/{maxImages})
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={imageUploading || images.length >= maxImages}
          className="btn btn-ghost"
        >
          {imageUploading ? '업로드 중...' : '파일 선택'}
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

      {error && (
        <p style={{ color: 'var(--color-danger, #e53e3e)', fontSize: 13, marginTop: 8 }}>{error}</p>
      )}

      {images.length > 0 && (
        <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {images.map((img, i) => (
            <div key={img.flSn} style={{ position: 'relative' }}>
              <img
                src={toImageUrl(img.url)}
                alt={`상품 사진 ${i + 1}`}
                style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 8, border: i === 0 ? '2px solid #0064ff' : '1px solid #eee' }}
              />
              {i === 0 && (
                <span className="badge badge-blue" style={{ position: 'absolute', top: 4, left: 4, fontSize: 11 }}>대표</span>
              )}
              <button
                type="button"
                onClick={() => removeImage(img.flSn)}
                title="삭제"
                style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#111', color: '#fff', cursor: 'pointer', fontSize: 12, lineHeight: '20px', padding: 0 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
