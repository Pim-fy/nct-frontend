import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Send } from 'lucide-react';
import { fetchActiveManualAbuseReportReferences } from '@api/abuseReportApi';
import { fetchProductInquiries, postProductInquiry } from '@api/productApi';
import Pagination from '@components/common/Pagination';
import { Skeleton } from '@components/skeleton/BaseSkeleton';

const INQUIRY_TYPE_CODE = 'PRDC0006';
const ANSWER_TYPE_CODE = 'PRDC0007';
const PRODUCT_COMMENT_REFERENCE_TYPE = 'REFC0012';
const MAX_INQUIRY_LENGTH = 500;
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
  enabled = true,
  onLoginRequired,
  onToast,
}) => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [page, setPage] = useState(1);
  const queryKey = useMemo(() => ['productInquiries', productId], [productId]);

  const inquiryQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetchProductInquiries(productId);
      return response?.data ?? [];
    },
    enabled: Boolean(enabled && productId),
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
  const inquiryReferenceSns = useMemo(
    () => inquiries.map((inquiry) => inquiry.prdCmtSn).filter(Boolean),
    [inquiries],
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
    enabled: Boolean(enabled && inquiryQuery.isSuccess && inquiryReferenceSns.length > 0),
  });

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
  const isReportStatusWaiting = inquiryQuery.isSuccess
    && inquiryReferenceSns.length > 0
    && activeReportStatusQuery.isPending;
  const isWaiting = !enabled || inquiryQuery.isLoading || isReportStatusWaiting;

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

  return (
    <section
      className="scroll-mt-[208px] border-b border-[#e2e5ea] py-10 md:scroll-mt-[82px] md:py-14"
      id={sectionId}
      aria-labelledby="auction-inquiry-title"
    >
      <div className="mb-5 flex items-start justify-between gap-6 max-sm:gap-3">
        <div>
          <h2 className="m-0 text-h2 font-bold text-[#1d1d1f]" id="auction-inquiry-title">
            상품 문의
          </h2>
          <p className="mt-[7px] mb-0 text-body-sm text-[#666] md:text-body-md">
            상품과 거래 조건에 대해 판매자에게 문의할 수 있습니다.
          </p>
        </div>
        <strong className="text-body-md whitespace-nowrap text-primary-dark">{inquiries.length}건</strong>
      </div>

      <form className="rounded-lg border border-[#e8e8e8] bg-[#f7f8fa] p-[18px] max-sm:p-3.5" onSubmit={handleSubmit}>
        <label className="mb-2.5 block text-body-md font-bold text-[#1d1d1f]" htmlFor="auction-inquiry-content">
          {isOwnAuction ? '구매자 문의는 판매자 상품 관리에서 답변할 수 있습니다.' : '판매자에게 문의하기'}
        </label>
        <textarea
          className="min-h-28 w-full resize-y rounded-lg border border-[#dadada] bg-white px-3.5 py-[13px] text-body-sm text-[#1d1d1f] outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_#e5efff] disabled:cursor-not-allowed disabled:bg-[#eeeeef] disabled:text-[#8a8a8a] md:text-body-md"
          id="auction-inquiry-content"
          value={content}
          maxLength={MAX_INQUIRY_LENGTH}
          disabled={isOwnAuction || inquiryMutation.isPending}
          placeholder={isOwnAuction ? '본인 상품에는 문의를 등록할 수 없습니다.' : '문의 내용을 입력해 주세요.'}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="mt-2.5 flex min-h-10 items-center justify-end gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
          <span className="text-[13px] leading-[1.5] tabular-nums text-[#666]">{content.length}/{MAX_INQUIRY_LENGTH}</span>
          <button
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-[7px] rounded-lg border border-primary bg-primary px-4 text-body-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-55 max-sm:w-full"
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
        {isWaiting && (
          <>
            {Array.from({ length: INQUIRIES_PER_PAGE }).map((_, index) => (
              <Skeleton height={148} key={index} style={{ borderRadius: 8 }} />
            ))}
          </>
        )}

        {inquiryQuery.isError && (
          <div className="grid min-h-24 place-items-center content-center gap-2.5 border-y border-[#e8e8e8] text-center text-body-sm text-[#666]">
            <p className="m-0">문의 목록을 불러오지 못했습니다.</p>
            <button
              className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-[7px] rounded-lg border border-primary bg-white px-4 text-body-sm font-bold text-primary-dark"
              type="button"
              onClick={() => inquiryQuery.refetch()}
            >
              <RotateCcw size={15} aria-hidden="true" />
              다시 불러오기
            </button>
          </div>
        )}

        {!isWaiting && !inquiryQuery.isError && inquiries.length === 0 && (
          <p className="m-0 grid min-h-24 place-items-center border-y border-[#e8e8e8] text-center text-body-sm text-[#666]">
            등록된 문의가 없습니다.
          </p>
        )}

        {!isWaiting && !inquiryQuery.isError && inquiries.length > 0 && pagedInquiries.map((inquiry) => {
          const hasActiveReport = activeReportedReferenceSns.has(String(inquiry.prdCmtSn));

          return (
          <article className="min-h-[148px] rounded-lg border border-[#e8e8e8] bg-white p-[18px]" key={inquiry.prdCmtSn}>
            <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
              <strong className="text-body-sm text-[#1d1d1f]">
                {inquiry.usrNm || '구매자'}
                {hasActiveReport && (
                  <>
                    {' - '}
                    <span className="text-[#c5221f]">신고 접수된 문의</span>
                  </>
                )}
              </strong>
              <time className="text-caption whitespace-nowrap text-[#666]" dateTime={inquiry.prdCmtRegDt}>
                {formatRegisteredAt(inquiry.prdCmtRegDt)}
              </time>
            </div>
            <p className="mt-3 mb-0 whitespace-pre-wrap text-body-sm text-[#353535] [overflow-wrap:anywhere] md:text-body-md">
              {inquiry.prdCmtCn}
            </p>

            {inquiry.answer ? (
              <div className="mt-4 border-l-[3px] border-[#18a36b] bg-[#f2faf6] px-4 py-3.5">
                <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
                  <strong className="text-body-sm text-[#0b7049]">판매자 답변</strong>
                  <time className="text-caption whitespace-nowrap text-[#666]" dateTime={inquiry.answer.prdCmtRegDt}>
                    {formatRegisteredAt(inquiry.answer.prdCmtRegDt)}
                  </time>
                </div>
                <p className="mt-3 mb-0 whitespace-pre-wrap text-body-sm text-[#353535] [overflow-wrap:anywhere] md:text-body-md">
                  {inquiry.answer.prdCmtCn}
                </p>
              </div>
            ) : (
              <span className="mt-3.5 inline-flex text-[13px] leading-[1.5] font-bold text-[#666]">답변 대기</span>
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
          showSinglePage
        />
      </div>

    </section>
  );
};

export default AuctionInquirySection;
