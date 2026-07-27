import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw, Send } from 'lucide-react';
import { fetchProductInquiries, postProductInquiry } from '@api/productApi';

const INQUIRY_TYPE_CODE = 'PRDC0006';
const ANSWER_TYPE_CODE = 'PRDC0007';
const MAX_INQUIRY_LENGTH = 500;

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
  const queryKey = useMemo(() => ['productInquiries', productId], [productId]);

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

  const inquiries = useMemo(
    () => groupInquiryRows(inquiryQuery.data),
    [inquiryQuery.data],
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

        {!inquiryQuery.isLoading && !inquiryQuery.isError && inquiries.map((inquiry) => (
          <article className="rounded-lg border border-[#e8e8e8] bg-white p-[18px]" key={inquiry.prdCmtSn}>
            <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
              <strong className="text-sm text-[#1d1d1f]">{inquiry.usrNm || '구매자'}</strong>
              <time className="text-xs whitespace-nowrap text-[#666]" dateTime={inquiry.prdCmtRegDt}>
                {formatRegisteredAt(inquiry.prdCmtRegDt)}
              </time>
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
        ))}
      </div>
    </section>
  );
};

export default AuctionInquirySection;
