import { FileText, Paperclip, Upload, X } from 'lucide-react';
import { useRef } from 'react';
import { ActionButton } from '@components/common/ui';

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const formatSize = (bytes) => {
  if (!Number.isFinite(bytes)) return '-';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

/** 담당자 7 · F-COM-018: 일반 신고 폼과 상황별 신고 모달이 공유하는 첨부 선택기입니다. */
export default function ReportAttachmentPicker({ files, onChange, error, onError, compact = false }) {
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const candidates = Array.from(fileList ?? []);
    if (files.length + candidates.length > MAX_FILES) {
      onError(`첨부파일은 최대 ${MAX_FILES}개까지 선택할 수 있습니다.`);
      return;
    }
    const invalidType = candidates.find((file) => !ACCEPTED_TYPES.has(file.type));
    if (invalidType) {
      onError('JPG, PNG, WEBP 이미지 또는 PDF 파일만 첨부할 수 있습니다.');
      return;
    }
    const oversized = candidates.find((file) => file.size > MAX_FILE_BYTES);
    if (oversized) {
      onError('파일당 10MB 이하만 첨부할 수 있습니다.');
      return;
    }
    onError('');
    onChange([...files, ...candidates]);
  };

  const removeFile = (index) => {
    onError('');
    onChange(files.filter((_, fileIndex) => fileIndex !== index));
  };

  return (
    <section
      className={compact ? '' : 'bg-white rounded-[8px] border border-[#e8e9ec] p-5'}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        addFiles(event.dataTransfer.files);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 flex items-center gap-2 text-[15px] font-bold text-[#1a1a18]">
            <Paperclip size={17} aria-hidden="true" />
            첨부파일
          </p>
          <p className="mt-1 mb-0 text-[13px] text-[#777]">
            이미지·PDF, 파일당 10MB, 최대 5개 ({files.length}/5)
          </p>
        </div>
        <ActionButton
          aria-label="신고 첨부파일 선택"
          className="shrink-0"
          disabled={files.length >= MAX_FILES}
          onClick={() => inputRef.current?.click()}
          size="sm"
          tone="outline"
        >
          <Upload size={15} aria-hidden="true" />
          파일 선택
        </ActionButton>
      </div>
      <input
        ref={inputRef}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        hidden
        multiple
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = '';
        }}
        type="file"
      />

      {files.length > 0 && (
        <ul className="mt-3 mb-0 space-y-2 p-0 list-none">
          {files.map((file, index) => (
            <li
              className="flex min-w-0 items-center gap-2 rounded-[6px] bg-[#f7f8fa] px-3 py-2"
              key={`${file.name}-${file.size}-${index}`}
            >
              <FileText className="shrink-0 text-[#0064ff]" size={16} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-[13px] text-[#333]">{file.name}</span>
              <span className="shrink-0 text-[12px] text-[#888]">{formatSize(file.size)}</span>
              <button
                aria-label={`${file.name} 첨부 삭제`}
                className="inline-flex size-7 shrink-0 items-center justify-center text-[#666] hover:text-[#111]"
                onClick={() => removeFile(index)}
                title="첨부 삭제"
                type="button"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 mb-0 text-[13px] text-red-500">{error}</p>}
    </section>
  );
}
