import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag, RotateCcw, Send, X } from 'lucide-react';
import {
  createManualAbuseReport,
  fetchActiveManualAbuseReportReferences,
  fetchMyManualAbuseReportReferences,
} from '@api/abuseReportApi';
import { fetchProductInquiries, postProductInquiry } from '@api/productApi';
import Pagination from '@components/common/Pagination';

const INQUIRY_TYPE_CODE = 'PRDC0006';
const ANSWER_TYPE_CODE = 'PRDC0007';
const PRODUCT_COMMENT_REFERENCE_TYPE = 'REFC0012';
const MAX_INQUIRY_LENGTH = 500;
const MAX_REPORT_LENGTH = 4000;
const INQUIRIES_PER_PAGE = 4;

const formatRegisteredAt = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const groupInquiryRows = (rows) => {
  const safeRows = Array.isArray(rows) ? rows : [];
  const answersByParent = new Map(
    safeRows
      .filter((row) => row.prdCmtTypeCd === ANSWER_TYPE_CODE && row.prdCmtParentSn != null)
      .map((row) => [String(row.prdCmtParentSn), row]),
  );

  return safeRows
    .filter((row) => row.prdCmtTypeCd === INQUIRY_TYPE_CODE)
    .map((inquiry) => ({
      ...inquiry,
      answer: answersByParent.get(String(inquiry.prdCmtSn)) ?? null,
    }));
};

const AuctionInquirySection = ({
  sectionId,
  productId,
  isAuthenticated,
  isOwnAuction,
  onLoginRequired,
  onToast,
}) => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [page, setPage] = useState(1);
  const [reportTarget, setReportTarget] = useState(null);
  const [reportContent, setReportContent] = useState('');
  const queryKey = useMemo(() => ['productInquiries', productId], [productId]);
  const myReportStatusQueryKey = useMemo(
    () => ['myAbuseReportReferences', PRODUCT_COMMENT_REFERENCE_TYPE],
    [],
  );

  const inquiryQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetchProductInquiries(productId);
      return response?.data ?? [];
    },
    enabled: Boolean(productId),
  });

  const inquiryMutation = useMutation({
    mutationFn: (inquiryContent) => postProductInquiry(productId, { cn: inquiryContent }),
    onSuccess: async () => {
      setContent('');
      await queryClient.invalidateQueries({ queryKey });
      onToast('문의가 등록되었습니다');
    },
    onError: (error) => {
      onToast(error?.response?.data?.message || '문의 등록에 실패했습니다');
    },
  });

  const myReportStatusQuery = useQuery({
    queryKey: myReportStatusQueryKey,
    queryFn: async () => {
      const response = await fetchMyManualAbuseReportReferences(
        PRODUCT_COMMENT_REFERENCE_TYPE,
      );
      return response?.data ?? [];
    },
    enabled: Boolean(isAuthenticated && isOwnAuction),
  });

  const inquiries = useMemo(
    () => groupInquiryRows(inquiryQuery.data),
    [inquiryQuery.data],
  );
  const totalPages = Math.ceil(inquiries.length / INQUIRIES_PER_PAGE);
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  const pagedInquiries = useMemo(() => {
    const startIndex = (currentPage - 1) * INQUIRIES_PER_PAGE;
    return inquiries.slice(startIndex, startIndex + INQUIRIES_PER_PAGE);
  }, [currentPage, inquiries]);
  const inquirySlots = useMemo(
    () => Array.from(
      { length: INQUIRIES_PER_PAGE },
      (_, index) => pagedInquiries[index] ?? null,
    ),
    [pagedInquiries],
  );
  const inquiryReferenceSns = useMemo(
    () => pagedInquiries.map((inquiry) => inquiry.prdCmtSn).filter(Boolean),
    [pagedInquiries],
  );
  const activeReportStatusQueryKey = useMemo(
    () => [
      'activeAbuseReportReferences',
      PRODUCT_COMMENT_REFERENCE_TYPE,
      inquiryReferenceSns.join(','),
    ],
    [inquiryReferenceSns],
  );
  const activeReportStatusQuery = useQuery({
    queryKey: activeReportStatusQueryKey,
    queryFn: async () => {
      const response = await fetchActiveManualAbuseReportReferences(
        PRODUCT_COMMENT_REFERENCE_TYPE,
        inquiryReferenceSns,
      );
      return response?.data ?? [];
    },
    enabled: inquiryReferenceSns.length > 0,
  });

  const reportMutation = useMutation({
    mutationFn: createManualAbuseReport,
    onSuccess: (response, variables) => {
      const nextReportStatus = {
        reportSn: response?.data?.reportSn ?? null,
        referenceSn: variables.referenceSn,
        statusCode: 'ABRC0005',
      };
      queryClient.setQueryData(myReportStatusQueryKey, (previous) => {
        const reports = Array.isArray(previous) ? previous : [];
        if (reports.some((report) => String(report.referenceSn) === String(variables.referenceSn))) {
          return reports;
        }
        return [...reports, nextReportStatus];
      });
      queryClient.setQueryData(activeReportStatusQueryKey, (previous) => {
        const reports = Array.isArray(previous) ? previous : [];
        if (reports.some((report) => String(report.referenceSn) === String(variables.referenceSn))) {
          return reports;
        }
        return [...reports, nextReportStatus];
      });
      setReportTarget(null);
      setReportContent('');
      onToast('신고가 접수되었습니다');
    },
    onError: (error) => {
      onToast(error?.response?.data?.message || '신고 접수에 실패했습니다');
    },
  });

  const reportedReferenceSns = useMemo(
    () => new Set(
      (Array.isArray(myReportStatusQuery.data) ? myReportStatusQuery.data : [])
        .map((report) => String(report.referenceSn)),
    ),
    [myReportStatusQuery.data],
  );
  const activeReportedReferenceSns = useMemo(
    () => new Set(
      (Array.isArray(activeReportStatusQuery.data) ? activeReportStatusQuery.data : [])
        .map((report) => String(report.referenceSn)),
    ),
    [activeReportStatusQuery.data],
  );
  const trimmedContent = content.trim();
  const isSubmitDisabled = isOwnAuction
    || inquiryMutation.isPending
    || (isAuthenticated && !trimmedContent);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      onLoginRequired();
      return;
    }
    if (isOwnAuction) {
      onToast('본인이 등록한 상품에는 문의할 수 없습니다');
      return;
    }
    if (!trimmedContent) {
      onToast('문의 내용을 입력해 주세요');
      return;
    }

    inquiryMutation.mutate(trimmedContent);
  };

  const openReportModal = (inquiry) => {
    setReportTarget(inquiry);
    setReportContent('');
  };

  const closeReportModal = () => {
    if (reportMutation.isPending) return;
    setReportTarget(null);
    setReportContent('');
  };

  const handleReportSubmit = (event) => {
    event.preventDefault();
    if (!reportTarget) return;

    reportMutation.mutate({
      reportedUserSn: reportTarget.usrSn,
      referenceTypeCode: PRODUCT_COMMENT_REFERENCE_TYPE,
      referenceSn: reportTarget.prdCmtSn,
      content: reportContent.trim() || null,
    });
  };

  return (
    <section
      className="scroll-mt-[136px] border-b border-[#e2e5ea] py-10 md:scroll-mt-[82px] md:py-14"
      id={sectionId}
      aria-labelledby="auction-inquiry-title"
    >
      <div className="mb-5 flex items-start justify-between gap-6 max-sm:gap-3">
        <div>
          <h2 className="m-0 text-[22px] leading-[1.35] font-bold text-[#1d1d1f] max-sm:text-xl" id="auction-inquiry-title">
            상품 문의
          </h2>
          <p className="mt-[7px] mb-0 text-sm text-[#666]">
            상품과 거래 조건에 대해 판매자에게 문의할 수 있습니다.
          </p>
        </div>
        <strong className="text-base whitespace-nowrap text-primary-dark">{inquiries.length}건</strong>
      </div>

      <form className="rounded-lg border border-[#e8e8e8] bg-[#f7f8fa] p-[18px] max-sm:p-3.5" onSubmit={handleSubmit}>
        <label className="mb-2.5 block text-[15px] font-bold text-[#1d1d1f]" htmlFor="auction-inquiry-content">
          {isOwnAuction ? '구매자 문의는 판매자 상품 관리에서 답변할 수 있습니다.' : '판매자에게 문의하기'}
        </label>
        <textarea
          className="min-h-28 w-full resize-y rounded-lg border border-[#dadada] bg-white px-3.5 py-[13px] leading-relaxed text-[#1d1d1f] outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_#e5efff] disabled:cursor-not-allowed disabled:bg-[#eeeeef] disabled:text-[#8a8a8a]"
          id="auction-inquiry-content"
          value={content}
          maxLength={MAX_INQUIRY_LENGTH}
          disabled={isOwnAuction || inquiryMutation.isPending}
          placeholder={isOwnAuction ? '본인 상품에는 문의를 등록할 수 없습니다.' : '문의 내용을 입력해 주세요.'}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="mt-2.5 flex min-h-10 items-center justify-end gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
          <span className="text-[13px] tabular-nums text-[#666]">{content.length}/{MAX_INQUIRY_LENGTH}</span>
          <button
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-[7px] rounded-lg border border-primary bg-primary px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-55 max-sm:w-full"
            type="submit"
            disabled={isSubmitDisabled}
            aria-busy={inquiryMutation.isPending}
          >
            <Send size={16} aria-hidden="true" />
            {inquiryMutation.isPending
              ? '등록 중'
              : (isAuthenticated ? '문의 등록' : '로그인 후 문의하기')}
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-3" aria-live="polite">
        {inquiryQuery.isLoading && (
          <p className="m-0 grid min-h-24 place-items-center border-y border-[#e8e8e8] text-center text-sm text-[#666]">
            문의 목록을 불러오는 중입니다.
          </p>
        )}

        {inquiryQuery.isError && (
          <div className="grid min-h-24 place-items-center content-center gap-2.5 border-y border-[#e8e8e8] text-center text-sm text-[#666]">
            <p className="m-0">문의 목록을 불러오지 못했습니다.</p>
            <button
              className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-[7px] rounded-lg border border-primary bg-white px-4 text-sm font-bold text-primary-dark"
              type="button"
              onClick={() => inquiryQuery.refetch()}
            >
              <RotateCcw size={15} aria-hidden="true" />
              다시 불러오기
            </button>
          </div>
        )}

        {!inquiryQuery.isLoading && !inquiryQuery.isError && inquiries.length === 0 && (
          <p className="m-0 grid min-h-24 place-items-center border-y border-[#e8e8e8] text-center text-sm text-[#666]">
            등록된 문의가 없습니다.
          </p>
        )}

        {!inquiryQuery.isLoading && !inquiryQuery.isError && inquiries.length > 0 && inquirySlots.map((inquiry, slotIndex) => {
          if (!inquiry) {
            return (
              <div
                className="invisible min-h-[148px]"
                key={`empty-inquiry-${currentPage}-${slotIndex}`}
                aria-hidden="true"
              />
            );
          }

          const isReported = reportedReferenceSns.has(String(inquiry.prdCmtSn));
          const hasActiveReport = activeReportedReferenceSns.has(String(inquiry.prdCmtSn));
          const isReportButtonDisabled = reportMutation.isPending
            || myReportStatusQuery.isLoading
            || myReportStatusQuery.isError
            || isReported
            || hasActiveReport;

          return (
          <article className="min-h-[148px] rounded-lg border border-[#e8e8e8] bg-white p-[18px]" key={inquiry.prdCmtSn}>
            <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
              <strong className="text-sm text-[#1d1d1f]">
                {inquiry.usrNm || '구매자'}
                {hasActiveReport && (
                  <>
                    {' - '}
                    <span className="text-[#c5221f]">신고 접수된 문의</span>
                  </>
                )}
              </strong>
              <div className="flex items-center gap-3">
                <time className="text-xs whitespace-nowrap text-[#666]" dateTime={inquiry.prdCmtRegDt}>
                  {formatRegisteredAt(inquiry.prdCmtRegDt)}
                </time>
                {isAuthenticated && isOwnAuction && (
                  <button
                    className="inline-flex min-h-8 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[#d8d8d8] bg-white px-2.5 text-xs font-bold text-[#b42318] hover:border-[#b42318] disabled:cursor-not-allowed disabled:border-[#e1e1e1] disabled:bg-[#f4f4f4] disabled:text-[#888]"
                    type="button"
                    disabled={isReportButtonDisabled}
                    onClick={() => openReportModal(inquiry)}
                  >
                    <Flag size={14} aria-hidden="true" />
                    {isReported || hasActiveReport
                      ? '신고 접수됨'
                      : (myReportStatusQuery.isError ? '상태 확인 실패' : '신고')}
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 mb-0 whitespace-pre-wrap text-[15px] leading-[1.65] text-[#353535] [overflow-wrap:anywhere]">
              {inquiry.prdCmtCn}
            </p>

            {inquiry.answer ? (
              <div className="mt-4 border-l-[3px] border-[#18a36b] bg-[#f2faf6] px-4 py-3.5">
                <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
                  <strong className="text-sm text-[#0b7049]">판매자 답변</strong>
                  <time className="text-xs whitespace-nowrap text-[#666]" dateTime={inquiry.answer.prdCmtRegDt}>
                    {formatRegisteredAt(inquiry.answer.prdCmtRegDt)}
                  </time>
                </div>
                <p className="mt-3 mb-0 whitespace-pre-wrap text-[15px] leading-[1.65] text-[#353535] [overflow-wrap:anywhere]">
                  {inquiry.answer.prdCmtCn}
                </p>
              </div>
            ) : (
              <span className="mt-3.5 inline-flex text-[13px] font-bold text-[#666]">답변 대기</span>
            )}
          </article>
          );
        })}
      </div>

      <div className="[&_button]:transition-colors [&_button:not(:disabled)]:cursor-pointer [&_button:not(:disabled):hover]:border-primary [&_button:not(:disabled):hover]:bg-[#f2f7ff] [&_button:not(:disabled):hover]:text-primary-dark">
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {reportTarget && (
        <div
          className="fixed inset-x-0 top-[82px] bottom-0 z-[180] flex items-center justify-center bg-black/45 p-5"
          onClick={closeReportModal}
        >
          <form
            className="w-full max-w-[520px] rounded-lg bg-white p-6 shadow-[0_20px_70px_rgba(0,0,0,0.24)] max-sm:p-5"
            aria-labelledby="auction-inquiry-report-title"
            aria-modal="true"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleReportSubmit}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="m-0 text-xl font-bold text-[#1d1d1f]" id="auction-inquiry-report-title">
                  문의 신고
                </h3>
                <p className="mt-1.5 mb-0 text-sm text-[#666]">
                  {reportTarget.usrNm || '구매자'}님의 문의
                </p>
              </div>
              <button
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-[#dadada] bg-white text-[#555] disabled:cursor-wait disabled:opacity-55"
                type="button"
                aria-label="신고 창 닫기"
                disabled={reportMutation.isPending}
                onClick={closeReportModal}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <label className="mb-2 block text-sm font-bold text-[#1d1d1f]" htmlFor="auction-inquiry-report-content">
              신고 사유 <span className="font-normal text-[#777]">(선택)</span>
            </label>
            <textarea
              className="min-h-36 w-full resize-y rounded-lg border border-[#dadada] px-3.5 py-3 text-sm leading-relaxed text-[#1d1d1f] outline-none focus:border-primary focus:shadow-[0_0_0_3px_#e5efff] disabled:bg-[#f2f2f2]"
              id="auction-inquiry-report-content"
              value={reportContent}
              maxLength={MAX_REPORT_LENGTH}
              disabled={reportMutation.isPending}
              placeholder="신고 사유를 입력해 주세요."
              onChange={(event) => setReportContent(event.target.value)}
            />
            <div className="mt-2 text-right text-xs tabular-nums text-[#777]">
              {reportContent.length}/{MAX_REPORT_LENGTH}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                className="min-h-11 cursor-pointer rounded-lg border border-[#dadada] bg-white text-sm font-bold text-[#555] disabled:cursor-wait disabled:opacity-55"
                type="button"
                disabled={reportMutation.isPending}
                onClick={closeReportModal}
              >
                취소
              </button>
              <button
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#b42318] bg-[#b42318] text-sm font-bold text-white disabled:cursor-wait disabled:opacity-55"
                type="submit"
                disabled={reportMutation.isPending}
                aria-busy={reportMutation.isPending}
              >
                <Flag size={16} aria-hidden="true" />
                {reportMutation.isPending ? '접수 중' : '신고 접수'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default AuctionInquirySection;
