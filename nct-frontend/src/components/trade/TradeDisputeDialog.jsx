import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CircleAlert,
  Paperclip,
  X,
} from 'lucide-react';
import { fetchReferenceCodes } from '@api/referenceApi';
import { deleteImage, uploadTradeDisputeEvidence } from '@api/fileApi';
import { submitTradeDispute } from '@api/tradeApi';

const TRADE_DISPUTE_TYPE_GROUP_CODE = 'TRDG04';
const MAX_EVIDENCE_FILES = 5;
const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;
const EVIDENCE_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp']);
const ELIGIBLE_TRADE_STATUSES = new Set([
  'IN_PROGRESS',
  'DELIVERING',
  'CONFIRM_PENDING',
  'WAITING_CONFIRMATION',
]);
const MATERIAL_DISPUTE_TYPE_LABELS = {
  TRDC0011: '직거래 미도착·연락 두절',
  TRDC0012: '배송 분실·파손·오배송',
  TRDC0014: '포인트·환불·정산 문제',
  TRDC0015: '기타 상품 거래 문제',
};
const MATERIAL_DISPUTE_TYPES_BY_METHOD = {
  DELIVERY: new Set(['TRDC0012', 'TRDC0014', 'TRDC0015']),
  OFFLINE: new Set(['TRDC0011', 'TRDC0014', 'TRDC0015']),
};
const ALL_MATERIAL_DISPUTE_TYPES = new Set(Object.keys(MATERIAL_DISPUTE_TYPE_LABELS));

const getAllowedDisputeTypes = (tradeMethod) => (
  MATERIAL_DISPUTE_TYPES_BY_METHOD[tradeMethod] ?? ALL_MATERIAL_DISPUTE_TYPES
);

const fileKey = (file) => `${file.name}:${file.size}:${file.lastModified}`;

/**
 * 담당자 7 · REQ-AUC-027/F-SVC-012: 상품 거래 당사자가 서비스 거래와 같은 수준으로
 * 거래 문제 유형·내용·증빙을 접수하고, 성공 시 완료·정산 보류 상태를 안내합니다.
 */
export default function TradeDisputeDialog({
  disabled = false,
  onSubmitted = null,
  tradeId,
  tradeMethod,
  tradeStatus,
}) {
  const fieldId = useId();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const openerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [disputeTypeCode, setDisputeTypeCode] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const canSubmitDispute = !disabled && ELIGIBLE_TRADE_STATUSES.has(tradeStatus);
  const allowedTypeCodes = getAllowedDisputeTypes(tradeMethod);
  const disputeTypesQuery = useQuery({
    queryKey: ['reference-codes', TRADE_DISPUTE_TYPE_GROUP_CODE],
    queryFn: () => fetchReferenceCodes(TRADE_DISPUTE_TYPE_GROUP_CODE),
    enabled: isOpen && canSubmitDispute,
    select: (codes) => codes
      .filter((code) => code.code && allowedTypeCodes.has(code.code))
      .map((code) => ({
        code: code.code,
        label: MATERIAL_DISPUTE_TYPE_LABELS[code.code],
      })),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
  const disputeTypes = disputeTypesQuery.data ?? [];
  const hasDisputeTypes = disputeTypes.length > 0;
  const typePlaceholder = disputeTypesQuery.isLoading
    ? '거래 문제 유형을 불러오는 중입니다.'
    : disputeTypesQuery.isError
      ? '거래 문제 유형을 불러오지 못했습니다.'
      : hasDisputeTypes
        ? '유형을 선택해 주세요.'
        : '등록된 거래 문제 유형이 없습니다.';
  const typeInputId = `${fieldId}-type`;
  const contentInputId = `${fieldId}-content`;
  const fileInputId = `${fieldId}-files`;

  useEffect(() => {
    if (!isOpen) return undefined;

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(focusFrame);
      openerRef.current?.focus();
    };
  }, [isOpen]);

  const openDialog = (event) => {
    openerRef.current = event.currentTarget;
    setDisputeTypeCode('');
    setContent('');
    setFiles([]);
    setError('');
    setIsSubmitted(false);
    setIsOpen(true);
  };

  const closeDialog = () => {
    if (isSubmitting) return;
    setIsOpen(false);
  };

  const handleDialogKeyDown = (event) => {
    if (event.key === 'Escape') {
      if (!isSubmitting) closeDialog();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusableElements = Array.from(dialogRef.current?.querySelectorAll(
      'button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ) ?? []);
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const handleFilesChange = (event) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > MAX_EVIDENCE_FILES) {
      setError(`증빙 자료는 최대 ${MAX_EVIDENCE_FILES}개까지 첨부할 수 있습니다.`);
      return;
    }

    const invalidFile = selectedFiles.find((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      return !EVIDENCE_EXTENSIONS.has(extension)
        || file.size <= 0
        || file.size > MAX_EVIDENCE_FILE_SIZE;
    });
    if (invalidFile) {
      setError('PDF, JPG, PNG, WEBP 형식의 10MB 이하 파일만 첨부할 수 있습니다.');
      return;
    }

    const selectedKeys = new Set(files.map(fileKey));
    const hasDuplicate = selectedFiles.some((file) => {
      const key = fileKey(file);
      if (selectedKeys.has(key)) return true;
      selectedKeys.add(key);
      return false;
    });
    if (hasDuplicate) {
      setError('이미 선택한 증빙 파일이 포함되어 있습니다.');
      return;
    }

    setError('');
    setFiles((current) => [...current, ...selectedFiles]);
  };

  const removeFile = (fileToRemove) => {
    if (isSubmitting) return;
    setFiles((current) => current.filter((file) => file !== fileToRemove));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedContent = content.trim();

    if (!canSubmitDispute) {
      setError('현재 거래 상태에서는 거래 문제를 접수할 수 없습니다.');
      return;
    }
    if (!hasDisputeTypes) {
      setError('거래 문제 유형 목록을 확인한 뒤 접수할 수 있습니다.');
      return;
    }
    if (!disputeTypeCode) {
      setError('거래 문제 유형을 선택해 주세요.');
      return;
    }
    if (!normalizedContent) {
      setError('거래 문제 내용을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    const uploadedFileSns = [];
    let disputeSubmissionStarted = false;

    try {
      for (const file of files) {
        const uploadResponse = await uploadTradeDisputeEvidence(file);
        const uploadedFile = uploadResponse.data ?? uploadResponse;
        if (!uploadedFile.flSn) {
          throw new Error('업로드한 증빙 파일 번호를 확인하지 못했습니다.');
        }
        uploadedFileSns.push(uploadedFile.flSn);
      }

      disputeSubmissionStarted = true;
      await submitTradeDispute(tradeId, {
        disputeTypeCode,
        content: normalizedContent,
        fileSns: uploadedFileSns,
      });
      setFiles([]);
      setIsSubmitted(true);
      try {
        await onSubmitted?.();
      } catch {
        // 접수는 이미 성공했으므로 상세 재조회 실패를 접수 실패로 표시하지 않습니다.
      }
    } catch (submitError) {
      const responseStatus = submitError.response?.status;
      const isConfirmedClientRejection = responseStatus >= 400 && responseStatus < 500;
      if ((!disputeSubmissionStarted || isConfirmedClientRejection)
        && uploadedFileSns.length > 0) {
        await Promise.allSettled(uploadedFileSns.map((fileSn) => deleteImage(fileSn)));
      }
      setError(
        submitError.response?.data?.message
          ?? '거래 문제를 접수하지 못했습니다. 다시 시도해 주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {canSubmitDispute && (
        <div className="trade-dispute-action">
          <button
            className="btn trade-dispute-action__button"
            type="button"
            onClick={openDialog}
          >
            <CircleAlert aria-hidden="true" size={17} />
            거래 문제 접수
          </button>
          <p>
            <CircleAlert aria-hidden="true" size={14} />
            문제 접수 시 거래 완료와 정산이 보류됩니다.
          </p>
        </div>
      )}

      {isOpen && (
        <div className="trade-modal" role="presentation" onMouseDown={closeDialog}>
          <section
            className="trade-modal__content trade-dispute-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${fieldId}-title`}
            onKeyDown={handleDialogKeyDown}
            onMouseDown={(event) => event.stopPropagation()}
            ref={dialogRef}
          >
            <header className="trade-modal__header trade-dispute-dialog__header">
              <div>
                <p>상품 거래</p>
                <h2 id={`${fieldId}-title`}>거래 문제 접수</h2>
              </div>
              <button
                className="trade-modal__close"
                type="button"
                onClick={closeDialog}
                aria-label="거래 문제 접수 창 닫기"
                ref={closeButtonRef}
              >
                ×
              </button>
            </header>

            {isSubmitted ? (
              <div className="trade-dispute-dialog__result" role="status">
                <strong>거래 문제가 접수되었습니다.</strong>
                <p>거래와 관련 정산은 보류되며, 관리자 처리 결과를 안내해 드립니다.</p>
                <button className="btn btn-primary" type="button" onClick={closeDialog}>
                  확인
                </button>
              </div>
            ) : (
              <form className="trade-dispute-form" onSubmit={handleSubmit}>
                <p className="trade-dispute-form__notice">
                  거래 문제를 접수하면 완료 처리와 정산이 보류됩니다.
                </p>

                <label htmlFor={typeInputId}>거래 문제 유형</label>
                <select
                  id={typeInputId}
                  value={disputeTypeCode}
                  onChange={(event) => setDisputeTypeCode(event.target.value)}
                  disabled={disputeTypesQuery.isLoading
                    || disputeTypesQuery.isError
                    || !hasDisputeTypes
                    || isSubmitting}
                >
                  <option value="">{typePlaceholder}</option>
                  {disputeTypes.map((type) => (
                    <option key={type.code} value={type.code}>{type.label}</option>
                  ))}
                </select>
                {disputeTypesQuery.isError && (
                  <div className="trade-dispute-form__reference-error">
                    <p>거래 문제 유형을 불러오지 못했습니다.</p>
                    <button type="button" onClick={() => disputeTypesQuery.refetch()}>
                      다시 불러오기
                    </button>
                  </div>
                )}
                {!disputeTypesQuery.isLoading
                  && !disputeTypesQuery.isError
                  && !hasDisputeTypes && (
                    <p className="trade-dispute-form__help">
                      현재 선택할 수 있는 거래 문제 유형이 없습니다.
                    </p>
                )}

                <label htmlFor={contentInputId}>상세 내용</label>
                <textarea
                  id={contentInputId}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={4000}
                  placeholder="문제 상황과 요청 사항을 구체적으로 입력해 주세요."
                  disabled={isSubmitting}
                />
                <p className="trade-dispute-form__count">{content.length}/4,000</p>

                <label htmlFor={fileInputId}>증빙 자료 (선택)</label>
                <label className="trade-dispute-file-picker" htmlFor={fileInputId}>
                  <Paperclip aria-hidden="true" size={18} />
                  <span>파일 선택</span>
                  <small>PDF, JPG, PNG, WEBP · 파일당 10MB · 최대 5개</small>
                </label>
                <input
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="trade-dispute-file-input"
                  disabled={isSubmitting || files.length >= MAX_EVIDENCE_FILES}
                  id={fileInputId}
                  multiple
                  onChange={handleFilesChange}
                  type="file"
                />
                {files.length > 0 && (
                  <ul className="trade-dispute-file-list" aria-label="선택한 증빙 자료">
                    {files.map((file) => (
                      <li key={fileKey(file)}>
                        <span title={file.name}>{file.name}</span>
                        <small>
                          {Math.max(1, Math.ceil(file.size / 1024)).toLocaleString('ko-KR')}KB
                        </small>
                        <button
                          aria-label={`${file.name} 첨부 취소`}
                          disabled={isSubmitting}
                          onClick={() => removeFile(file)}
                          type="button"
                        >
                          <X aria-hidden="true" size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {error && <p className="trade-dispute-form__error" role="alert">{error}</p>}

                <div className="trade-dispute-form__actions">
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={closeDialog}
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                  <button
                    className="btn btn-danger"
                    type="submit"
                    disabled={!canSubmitDispute
                      || isSubmitting
                      || disputeTypesQuery.isLoading
                      || disputeTypesQuery.isError
                      || !hasDisputeTypes}
                  >
                    {isSubmitting ? '접수 중...' : '거래 문제 접수'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  );
}
