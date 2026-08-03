import { useEffect, useRef, useState } from 'react';
import DaumPostcode from 'react-daum-postcode';
import { ArrowLeft, MapPin, Search, X } from 'lucide-react';

const FIELD_CLASS = 'h-11 w-full rounded-[5px] border border-[#d9d9d9] bg-white px-3 text-body-md text-[#333] outline-none transition-colors focus:border-primary disabled:bg-[#f6f6f6] disabled:text-[#888]';

const AuctionDeliveryAddressModal = ({
  profile,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}) => {
  const [view, setView] = useState('form');
  const [form, setForm] = useState({
    zip: profile?.zip || '',
    address: profile?.address || '',
    addressDetail: profile?.addressDetail || '',
  });
  const [validationMessage, setValidationMessage] = useState('');
  const detailInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSaving, onClose]);

  const handleAddressComplete = (data) => {
    const address = data.roadAddress || data.jibunAddress || '';
    const zip = data.zonecode || '';
    if (!address || !zip) return;

    setForm((current) => ({ ...current, address, zip }));
    setValidationMessage('');
    setView('form');
    window.requestAnimationFrame(() => detailInputRef.current?.focus());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.zip.trim() || !form.address.trim()) {
      setValidationMessage('주소 검색을 통해 배송지를 선택해 주세요.');
      return;
    }

    setValidationMessage('');
    try {
      await onSave({
        zip: form.zip.trim(),
        address: form.address.trim(),
        addressDetail: form.addressDetail.trim(),
      });
    } catch {
      // 저장 오류는 서버 응답 메시지를 부모에서 전달해 모달 안에 표시한다.
    }
  };

  const closeFromBackdrop = (event) => {
    if (event.target === event.currentTarget && !isSaving) onClose();
  };

  return (
    <div
      aria-labelledby="auction-delivery-address-title"
      aria-modal="true"
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={closeFromBackdrop}
      role="dialog"
    >
      <section
        className="flex max-h-[90dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-lg bg-white shadow-[0_18px_54px_rgba(0,0,0,0.22)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-[#ececec] px-5">
          <div className="flex min-w-0 items-center gap-3">
            {view === 'search' ? (
              <button
                aria-label="배송지 입력으로 돌아가기"
                className="grid size-9 shrink-0 place-items-center rounded-full border-0 bg-transparent text-[#444] hover:bg-[#f3f3f3]"
                onClick={() => setView('form')}
                title="뒤로"
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={20} />
              </button>
            ) : (
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf2ff] text-primary">
                <MapPin aria-hidden="true" size={20} />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="m-0 text-body-lg font-bold text-[#1d1d1f]" id="auction-delivery-address-title">
                {view === 'search' ? '주소 검색' : '배송지 등록'}
              </h2>
              {view === 'form' && (
                <p className="m-0 mt-0.5 text-body-sm text-[#666]">배송 거래에 사용할 주소를 입력해 주세요.</p>
              )}
            </div>
          </div>
          <button
            aria-label="배송지 등록 닫기"
            className="grid size-9 shrink-0 place-items-center rounded-full border-0 bg-transparent text-[#666] hover:bg-[#f3f3f3]"
            disabled={isSaving}
            onClick={onClose}
            title="닫기"
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </header>

        {view === 'search' ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <DaumPostcode autoClose={false} onComplete={handleAddressComplete} style={{ height: 470 }} />
          </div>
        ) : (
          <form className="grid gap-5 overflow-y-auto p-5" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label className="text-body-md font-bold text-[#333]" htmlFor="auction-delivery-address">
                주소 <span className="text-[#d93025]">*</span>
              </label>
              <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-2 max-sm:grid-cols-1">
                <input
                  className={FIELD_CLASS}
                  disabled={!form.address}
                  id="auction-delivery-address"
                  placeholder="주소 검색을 눌러주세요."
                  readOnly
                  value={form.address}
                />
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[5px] border border-[#333] bg-white px-3 text-body-md font-bold text-[#333] hover:bg-[#f6f6f6]"
                  onClick={() => setView('search')}
                  type="button"
                >
                  <Search aria-hidden="true" size={18} />
                  주소 검색
                </button>
              </div>
              <p className="m-0 min-h-5 text-body-sm text-[#777]">
                {form.zip ? `우편번호 ${form.zip}` : '우편번호와 기본주소는 필수입니다.'}
              </p>
            </div>

            <div className="grid gap-2">
              <label className="text-body-md font-bold text-[#333]" htmlFor="auction-delivery-address-detail">
                상세주소 <span className="font-normal text-[#888]">(선택)</span>
              </label>
              <input
                className={FIELD_CLASS}
                disabled={!form.address}
                id="auction-delivery-address-detail"
                onChange={(event) => setForm((current) => ({
                  ...current,
                  addressDetail: event.target.value,
                }))}
                placeholder={form.address ? '동·호수 등 상세주소' : '주소 검색 후 입력할 수 있습니다.'}
                ref={detailInputRef}
                value={form.addressDetail}
              />
            </div>

            <p
              aria-hidden={!(validationMessage || errorMessage)}
              aria-live="polite"
              className={`m-0 min-h-[42px] rounded-[5px] px-3 py-2.5 text-body-sm text-[#c5221f] transition-opacity ${
                validationMessage || errorMessage
                  ? 'visible bg-[#fff1f0] opacity-100'
                  : 'invisible opacity-0'
              }`}
              role={validationMessage || errorMessage ? 'alert' : undefined}
            >
              {validationMessage || errorMessage || '\u00a0'}
            </p>

            <button
              className="h-12 w-full rounded-[5px] border border-primary bg-primary text-body-md font-bold text-white hover:bg-[#0058df] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? '저장 중...' : '배송지 저장'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};

export default AuctionDeliveryAddressModal;
