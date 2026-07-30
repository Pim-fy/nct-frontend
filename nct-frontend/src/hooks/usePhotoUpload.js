// src/hooks/usePhotoUpload.js
import { useEffect, useRef, useState } from 'react';

/**
 * 사진 첨부(선택→미리보기→해제) 상태 관리 훅.
 * @param {number} maxPhotos     - 최대 첨부 가능 장수
 * @param {number} existingCount - 이미 서버에 저장된 사진 수(수정 화면처럼 기존 사진과 합산해 제한해야 할 때)
 */
export const usePhotoUpload = (maxPhotos, existingCount = 0) => {
  const [photos, setPhotos] = useState([]); // [{ file, previewUrl }]
  const fileInputRef = useRef(null);
  const photosRef = useRef(photos);

  // 렌더 중이 아니라 커밋 이후에 ref를 최신 photos로 동기화한다(react-hooks/refs 규칙 준수).
  useEffect(() => {
    photosRef.current = photos;
  });

  // 미리보기 URL은 컴포넌트가 사라질 때 반드시 해제해야 메모리 누수가 없다.
  // ref로 최신 photos를 추적 — effect가 [] 의존성으로 한 번만 생성되므로, 클로저가 마운트 시점의
  // photos(빈 배열)를 그대로 캡처하지 않도록 방지한다.
  useEffect(() => () => {
    photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
  }, []);

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files ?? []);
    const remainingSlots = maxPhotos - existingCount - photos.length;
    if (remainingSlots <= 0) return;

    const nextPhotos = files.slice(0, remainingSlots).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...nextPhotos]);
    // 같은 파일을 다시 선택할 수 있도록 입력값을 초기화
    e.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  return { photos, fileInputRef, handleFilesSelected, handleRemovePhoto };
};
