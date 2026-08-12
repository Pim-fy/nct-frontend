import { X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReportAttachmentPicker from '@components/common/ReportAttachmentPicker';
import { isCustomerReportTypeCode } from '@/constants/abuseReportTypes';
import { useAbuseReportTypes, useSubmitCustomerReport } from '@hooks/useAbuseReport';
import { getMyPagePath } from '@routes/myPageRoutes';
import { toast } from '@utils/common';

const REF_TYPE_CODE_MAP = {
  direct: 'REFC0001',
  provider: 'REFC0001',
  auction: 'REFC0003',
  trade: 'REFC0005',
  service: 'REFC0007',
};

export default function ReportModal(props) {
  if (!props.open) return null;
  return <ReportModalContent {...props} />;
}

/** 담당자 7 · F-COM-015/018: 실제 화면 대상 ID를 고정해 접수하는 공통 신고 모달입니다. */
function ReportModalContent({
  onClose,
  targetName: initialTargetName = '',
  targetLabel = '신고 대상',
  targetLocked = false,
  hideTitle = false,
  targetType = 'direct',
  referenceSn,
  reportedUserSn,
  reportTypeLabel = '',
  contextLabel = '',
  redirectAfterSubmit = true,
}) {
  const formId = useId();
  const navigate = useNavigate();
  const reportTypesQuery = useAbuseReportTypes();
  const submitMutation = useSubmitCustomerReport();
  const hasFixedTarget = reportedUserSn != null || referenceSn != null;
  const isTargetLocked = targetLocked || hasFixedTarget;
  const [form, setForm] = useState({
    reportTypeCode: '',
    targetName: initialTargetName,
    title: '',
    content: '',
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const reportTypes = (reportTypesQuery.data ?? []).filter((item) => (
    item.code && item.name && isCustomerReportTypeCode(item.code)
  ));
  const hasAvailableReportTypes = reportTypes.length > 0;
  const prefilledTypeCode = reportTypeLabel
    ? reportTypes.find((item) => item.name === reportTypeLabel)?.code ?? ''
    : '';
  const selectedReportTypeCode = form.reportTypeCode || prefilledTypeCode;
  const selectedType = reportTypes.find((item) => item.code === selectedReportTypeCode);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape' && !submitMutation.isPending) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, submitMutation.isPending]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const setValue = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '', _server: '' }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!selectedReportTypeCode) nextErrors.reportTypeCode = '신고 유형을 선택해 주세요.';
    if (!hasFixedTarget && !form.targetName.trim()) nextErrors.targetName = '신고 대상을 입력해 주세요.';
    if (!hideTitle && !form.title.trim()) nextErrors.title = '제목을 입력해 주세요.';
    if (!form.content.trim()) nextErrors.content = '신고 내용을 입력해 주세요.';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const referenceTypeCode = REF_TYPE_CODE_MAP[targetType] ?? null;
    const resolvedReferenceSn = targetType === 'direct' ? reportedUserSn : referenceSn;
    const automaticTitle = `[${selectedType?.name ?? '신고'}] ${form.targetName.trim() || contextLabel || '지정 대상'}`;
    try {
      await submitMutation.mutateAsync({
        reportTypeCode: selectedReportTypeCode,
        reportedUserSn: reportedUserSn ?? null,
        referenceTypeCode,
        referenceSn: referenceTypeCode ? resolvedReferenceSn ?? null : null,
        targetName: form.targetName.trim() || contextLabel || null,
        title: hideTitle ? automaticTitle.slice(0, 100) : form.title.trim(),
        content: form.content.trim(),
        files,
      });
      toast({ icon: 'success', title: '신고가 접수되었습니다.' });
      onClose();
      if (redirectAfterSubmit) {
        navigate(getMyPagePath('report-list'));
      }
    } catch (error) {
      const message = error?.response?.status === 409
        ? '같은 대상과 유형의 신고가 이미 접수되어 있습니다.'
        : error?.response?.data?.message
          ?? '신고 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      setErrors((current) => ({ ...current, _server: message }));
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)]">
        <header className="flex shrink-0 items-center justify-between bg-[#0064ff] px-6 py-4">
          <h2 className="m-0 text-[20px] font-bold text-white">신고하기</h2>
          <button
            aria-label="닫기"
            className="inline-flex size-8 items-center justify-center text-white hover:bg-white/15"
            disabled={submitMutation.isPending}
            onClick={onClose}
            type="button"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form className="flex-1 space-y-5 overflow-y-auto px-6 py-5" id={formId} noValidate onSubmit={submit}>
          {contextLabel && (
            <div className="rounded-[6px] bg-[#f5f6f8] px-4 py-3">
              <p className="m-0 text-[13px] text-[#777]">신고 대상</p>
              <p className="mt-1 mb-0 text-[16px] font-bold text-[#1a1a18]">{contextLabel}</p>
            </div>
          )}

          <div>
            <p className="mb-2 text-[15px] font-bold text-[#1a1a18]">신고 유형 <span className="text-red-500">*</span></p>
            {reportTypesQuery.isLoading && <p className="text-[13px] text-[#777]">신고 유형을 불러오는 중입니다.</p>}
            {reportTypesQuery.isError && (
              <button className="btn btn-outline btn-sm" onClick={() => reportTypesQuery.refetch()} type="button">유형 다시 불러오기</button>
            )}
            {!reportTypesQuery.isLoading && !reportTypesQuery.isError && !hasAvailableReportTypes && (
              <div className="flex items-center gap-2">
                <p className="m-0 text-[13px] text-red-500" role="alert">
                  사용 가능한 신고 유형이 없습니다.
                </p>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => reportTypesQuery.refetch()}
                  type="button"
                >
                  다시 불러오기
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {reportTypes.map((type) => (
                <button
                  className={`h-9 rounded-[6px] border px-4 text-[14px] font-medium ${selectedReportTypeCode === type.code ? 'border-[#0064ff] bg-[#0064ff] text-white' : 'border-[#dfe3e8] bg-white text-[#333]'}`}
                  key={type.code}
                  onClick={() => setValue('reportTypeCode', type.code)}
                  type="button"
                >
                  {type.name}
                </button>
              ))}
            </div>
            {errors.reportTypeCode && <p className="mt-1 text-[13px] text-red-500">{errors.reportTypeCode}</p>}
          </div>

          <div>
            <label className="mb-2 block text-[15px] font-bold text-[#1a1a18]" htmlFor={`${formId}-target`}>
              {targetLabel} <span className="text-red-500">*</span>
            </label>
            <input
              className={`h-11 w-full rounded-[6px] border px-4 text-[15px] outline-none ${isTargetLocked ? 'cursor-not-allowed border-[#dfe3e8] bg-[#f5f6f8] text-[#555]' : 'border-[#dfe3e8] focus:border-[#0064ff]'}`}
              disabled={isTargetLocked}
              id={`${formId}-target`}
              onChange={isTargetLocked ? undefined : (event) => setValue('targetName', event.target.value)}
              placeholder={hasFixedTarget ? '신고 대상이 지정되었습니다.' : '신고 대상을 입력해 주세요.'}
              value={form.targetName}
            />
            {errors.targetName && <p className="mt-1 text-[13px] text-red-500">{errors.targetName}</p>}
          </div>

          {!hideTitle && (
            <div>
              <label className="mb-2 block text-[15px] font-bold text-[#1a1a18]" htmlFor={`${formId}-title`}>제목 <span className="text-red-500">*</span></label>
              <input
                className="h-11 w-full rounded-[6px] border border-[#dfe3e8] px-4 text-[15px] outline-none focus:border-[#0064ff]"
                id={`${formId}-title`}
                maxLength={100}
                onChange={(event) => setValue('title', event.target.value)}
                value={form.title}
              />
              {errors.title && <p className="mt-1 text-[13px] text-red-500">{errors.title}</p>}
            </div>
          )}

          <div>
            <label className="mb-2 block text-[15px] font-bold text-[#1a1a18]" htmlFor={`${formId}-content`}>신고 내용 <span className="text-red-500">*</span></label>
            <textarea
              className="w-full resize-none rounded-[6px] border border-[#dfe3e8] px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-[#0064ff]"
              id={`${formId}-content`}
              maxLength={4000}
              onChange={(event) => setValue('content', event.target.value)}
              rows={6}
              value={form.content}
            />
            <div className="mt-1 flex justify-between gap-3">
              {errors.content ? <p className="text-[13px] text-red-500">{errors.content}</p> : <span />}
              <span className="text-[12px] text-[#999]">{form.content.length.toLocaleString()} / 4,000</span>
            </div>
          </div>

          <ReportAttachmentPicker
            compact
            error={errors.files}
            files={files}
            onChange={setFiles}
            onError={(message) => setErrors((current) => ({ ...current, files: message }))}
          />
          {errors._server && <p className="text-[13px] text-red-500" role="alert">{errors._server}</p>}
        </form>

        <footer className="flex shrink-0 gap-3 border-t border-[#e8e9ec] px-6 py-4">
          <button className="btn btn-outline flex-1" disabled={submitMutation.isPending} onClick={onClose} type="button">취소</button>
          <button
            className="btn btn-danger flex-1"
            disabled={submitMutation.isPending || reportTypesQuery.isLoading || reportTypesQuery.isError || !hasAvailableReportTypes}
            form={formId}
            type="submit"
          >
            {submitMutation.isPending ? '신고 중…' : '신고하기'}
          </button>
        </footer>
      </div>
    </div>
  );
}
