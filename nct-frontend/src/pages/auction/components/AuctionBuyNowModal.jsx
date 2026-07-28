import { X } from 'lucide-react';
import { formatPrice } from '../utils/auctionFormatters';

const AuctionBuyNowModal = ({
  isOpen,
  auction,
  selectedTradeName,
  holdAgreed,
  requiresHoldConsent,
  isPending,
  isBuyNowAvailable,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-x-0 top-[82px] bottom-0 z-[180] flex items-center justify-center bg-[#1d1d1f]/55 p-7"
      id="buyNowModal"
    >
      <div
        className="max-h-[calc(100vh_-_72px)] w-full max-w-[620px] overflow-auto rounded-lg bg-white shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="buyNowModalTitle"
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#e8e8e8] px-6 pt-[22px] pb-4">
          <h2 className="m-0 text-xl font-bold" id="buyNowModalTitle">즉시구매 확인</h2>
          <button
            className="inline-flex size-[38px] cursor-pointer items-center justify-center rounded-full border border-[#dadada] bg-white text-[#1d1d1f]"
            type="button"
            aria-label="즉시구매 확인 닫기"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-4 px-6 pt-[22px] pb-6 text-[#666]">
          <p className="m-0">선택한 조건으로 즉시구매를 진행하시겠습니까?</p>
          <ul className="m-0 grid list-none gap-2.5 p-0">
            <li className="grid grid-cols-[112px_1fr] gap-3 border-b border-[#e8e8e8] py-2.5 max-sm:grid-cols-[96px_1fr]">
              <strong className="text-[#1d1d1f]">상품명</strong><span>{auction.title}</span>
            </li>
            <li className="grid grid-cols-[112px_1fr] gap-3 border-b border-[#e8e8e8] py-2.5 max-sm:grid-cols-[96px_1fr]">
              <strong className="text-[#1d1d1f]">즉시구매가</strong><span>{formatPrice(auction.instantBuyPrice)}</span>
            </li>
            <li className="grid grid-cols-[112px_1fr] gap-3 border-b border-[#e8e8e8] py-2.5 max-sm:grid-cols-[96px_1fr]">
              <strong className="text-[#1d1d1f]">거래 방식</strong><span>{selectedTradeName}</span>
            </li>
            {requiresHoldConsent && (
              <li className="grid grid-cols-[112px_1fr] gap-3 py-2.5 max-sm:grid-cols-[96px_1fr]">
                <strong className="text-[#1d1d1f]">포인트 홀딩</strong><span>{holdAgreed ? '동의 완료' : '동의 필요'}</span>
              </li>
            )}
          </ul>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              className="min-h-[46px] cursor-pointer rounded-lg border border-primary bg-white text-[15px] font-bold text-primary"
              type="button"
              onClick={onClose}
            >
              취소
            </button>
            <button
              className="min-h-[46px] cursor-pointer rounded-lg border border-primary bg-primary text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-55"
              id="buyNowConfirmBtn"
              type="button"
              disabled={!isBuyNowAvailable || isPending}
              onClick={onConfirm}
            >
              {!isBuyNowAvailable ? '구매 불가' : (isPending ? '처리 중' : '확정')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionBuyNowModal;
