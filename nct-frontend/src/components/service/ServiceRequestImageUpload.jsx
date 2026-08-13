import ImageAttachmentPicker from '@components/common/ImageAttachmentPicker';

/** 담당자 7 · F-SVC-001: 견적 요청 이미지를 공통 5칸 첨부 UI로 제공합니다. */
export default function ServiceRequestImageUpload({ images, onChange, maxImages = 5 }) {
  return (
    <ImageAttachmentPicker
      compact
      description="사진을 첨부하면 더 정확한 견적을 받을 수 있어요."
      images={images}
      inputAriaLabel="견적 요청 사진 선택"
      maxImages={maxImages}
      onChange={onChange}
      title="요청 사진"
    />
  );
}
