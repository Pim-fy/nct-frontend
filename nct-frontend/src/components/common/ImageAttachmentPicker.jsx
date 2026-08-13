import AttachmentPicker from '@components/common/AttachmentPicker';
import { toImageUrl } from '@api/fileApi';

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** 담당자 7 · 공통 이미지 첨부 계약: 첫 항목을 대표 이미지로 사용하도록 순서를 관리합니다. */
export default function ImageAttachmentPicker({
  compact = false,
  description = '드래그앤드롭 또는 파일 선택 · JPG·PNG·WEBP',
  error,
  images,
  inputAriaLabel = '이미지 선택',
  maxImages = 5,
  onChange,
  onError,
  required = false,
  title = '사진 첨부',
}) {
  const changeImages = (nextItems) => {
    onChange((current) => {
      const existingIds = new Set(current.map((image) => image.id));
      const retainedIds = new Set(nextItems.filter((item) => item.id).map((item) => item.id));

      current.forEach((image) => {
        if (image.file && image.url && !retainedIds.has(image.id)) URL.revokeObjectURL(image.url);
      });

      return nextItems.map((item) => {
        if (item.id && existingIds.has(item.id)) return item;
        return {
          id: crypto.randomUUID(),
          file: item,
          flSn: null,
          name: item.name,
          size: item.size,
          type: item.type,
          url: URL.createObjectURL(item),
        };
      });
    });
  };

  const setRepresentative = (index) => {
    onChange((current) => {
      if (index <= 0 || index >= current.length) return current;
      const next = [...current];
      const [selected] = next.splice(index, 1);
      next.unshift(selected);
      return next;
    });
  };

  return (
    <AttachmentPicker
      accept="image/jpeg,image/png,image/webp"
      acceptedTypes={IMAGE_TYPES}
      compact={compact}
      description={description}
      error={error}
      files={images}
      getPreviewUrl={(image) => toImageUrl(image.url)}
      inputAriaLabel={inputAriaLabel}
      maxFiles={maxImages}
      onChange={changeImages}
      onError={onError}
      onSetRepresentative={setRepresentative}
      required={required}
      selectButtonLabel="사진등록"
      title={title}
      typeErrorMessage="JPG, PNG, WEBP 이미지 파일만 첨부할 수 있습니다."
    />
  );
}
