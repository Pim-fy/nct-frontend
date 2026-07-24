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
    <section className="auction-inquiry-section" aria-labelledby="auction-inquiry-title">
      <div className="auction-inquiry-heading">
        <div>
          <h2 id="auction-inquiry-title">상품 문의</h2>
          <p>상품과 거래 조건에 대해 판매자에게 문의할 수 있습니다.</p>
        </div>
        <strong>{inquiries.length}건</strong>
      </div>

      <form className="auction-inquiry-composer" onSubmit={handleSubmit}>
        <label htmlFor="auction-inquiry-content">
          {isOwnAuction ? '구매자 문의는 판매자 상품 관리에서 답변할 수 있습니다.' : '판매자에게 문의하기'}
        </label>
        <textarea
          id="auction-inquiry-content"
          value={content}
          maxLength={MAX_INQUIRY_LENGTH}
          disabled={isOwnAuction || inquiryMutation.isPending}
          placeholder={isOwnAuction ? '본인 상품에는 문의를 등록할 수 없습니다.' : '문의 내용을 입력해 주세요.'}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="auction-inquiry-composer-footer">
          <span>{content.length}/{MAX_INQUIRY_LENGTH}</span>
          <button
            className="auction-inquiry-submit"
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

      <div className="auction-inquiry-list" aria-live="polite">
        {inquiryQuery.isLoading && (
          <p className="auction-inquiry-state">문의 목록을 불러오는 중입니다.</p>
        )}

        {inquiryQuery.isError && (
          <div className="auction-inquiry-state auction-inquiry-error">
            <p>문의 목록을 불러오지 못했습니다.</p>
            <button type="button" onClick={() => inquiryQuery.refetch()}>
              <RotateCcw size={15} aria-hidden="true" />
              다시 불러오기
            </button>
          </div>
        )}

        {!inquiryQuery.isLoading && !inquiryQuery.isError && inquiries.length === 0 && (
          <p className="auction-inquiry-state">등록된 문의가 없습니다.</p>
        )}

        {!inquiryQuery.isLoading && !inquiryQuery.isError && inquiries.map((inquiry) => (
          <article className="auction-inquiry-item" key={inquiry.prdCmtSn}>
            <div className="auction-inquiry-meta">
              <strong>{inquiry.usrNm || '구매자'}</strong>
              <time dateTime={inquiry.prdCmtRegDt}>
                {formatRegisteredAt(inquiry.prdCmtRegDt)}
              </time>
            </div>
            <p>{inquiry.prdCmtCn}</p>

            {inquiry.answer ? (
              <div className="auction-inquiry-answer">
                <div className="auction-inquiry-meta">
                  <strong>판매자 답변</strong>
                  <time dateTime={inquiry.answer.prdCmtRegDt}>
                    {formatRegisteredAt(inquiry.answer.prdCmtRegDt)}
                  </time>
                </div>
                <p>{inquiry.answer.prdCmtCn}</p>
              </div>
            ) : (
              <span className="auction-inquiry-waiting">답변 대기</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default AuctionInquirySection;
