import ImageAttachmentPicker from '@components/common/ImageAttachmentPicker';

/** 담당자 7 · F-AUC-002: 상품 이미지 입력을 공통 5칸 첨부 UI로 제공합니다. */
export default function ProductImageUpload({ images, onChange, maxImages = 5 }) {
  return (
    <ImageAttachmentPicker
      images={images}
      inputAriaLabel="상품 사진 선택"
      maxImages={maxImages}
      onChange={onChange}
      required
      title="상품 사진"
    />
  );
}
