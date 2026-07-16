// src/pages/user/point/components/PointChargeWidgetModal.jsx
// Claude Code 작성 (BJN, 2026-07-16)
// 포인트 충전 - 결제위젯(widgets()) 방식 모달 (F-PAY-011)
// 충전 방식은 결제위젯 단일 (사용자 결정, 2026-07-16 — 결제창 방식 제거)
// 금액 선택 후 "다음"을 누르면 토스 결제수단 위젯이 모달 안에 그대로 렌더링된다
// 주의: 결제위젯 전용 클라이언트 키(test_gck_...)가 필요하다 — 결제창용 키(test_ck_...)로는 동작하지 않음
import { useEffect, useRef, useState } from 'react';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';

import { requestPointCharge } from '../../../../api/pointApi';

const QUICK_AMOUNTS = [100000, 300000, 500000];

const PointChargeWidgetModal = ({ onClose }) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('amount'); // 'amount' | 'widget'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const orderRef = useRef(null); // { orderId, amount, orderName, clientKey }
  const widgetsRef = useRef(null);

  // 위젯 스크립트가 언마운트 후에도 DOM을 계속 참조하지 않도록 정리
  useEffect(() => () => { widgetsRef.current = null; }, []);

  // 모달이 떠 있는 동안 뒤 페이지 스크롤을 잠근다 — 위젯 목록이 길어져도
  // 휠/드래그가 배경으로 새지 않고 모달 안쪽(overflow-y-auto)에서만 스크롤되게
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  // step이 'widget'으로 바뀌어 DOM에 #toss-payment-methods/#toss-agreement가 실제로
  // 커밋된 뒤에만 렌더링을 호출한다 — setStep 직후 곧바로 호출하면 아직 없는 요소를
  // 찾다 실패한다 (React 상태 갱신은 비동기이므로 커밋 시점이 다르다)
  useEffect(() => {
    if (step !== 'widget' || !widgetsRef.current) return;
    const widgets = widgetsRef.current;
    setLoading(true);
    widgets.setAmount({ currency: 'KRW', value: orderRef.current.amount })
      .then(() => Promise.all([
        widgets.renderPaymentMethods({ selector: '#toss-payment-methods', variantKey: 'DEFAULT' }),
        widgets.renderAgreement({ selector: '#toss-agreement', variantKey: 'AGREEMENT' }),
      ]))
      .catch((err) => {
        setError(err?.message ?? '결제수단 렌더링에 실패했습니다.');
        setStep('amount');
      })
      .finally(() => setLoading(false));
  }, [step]);

  const proceedToWidget = async (chosenAmount) => {
    const amt = Number(chosenAmount);
    if (!Number.isInteger(amt) || amt <= 0) {
      setError('충전 금액은 1P 이상의 정수만 가능합니다.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // 서버가 먼저 신뢰 기준 금액을 기록하고 위젯용(gck) 클라이언트 키를 내려준다 (QSC-PG-01)
      const res = await requestPointCharge(amt);
      orderRef.current = res.data;

      const tossPayments = await loadTossPayments(res.data.clientKey);
      widgetsRef.current = tossPayments.widgets({ customerKey: ANONYMOUS });

      setStep('widget'); // 커밋 후 위 useEffect가 실제 렌더링을 이어받는다
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? '결제 준비 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const submitPayment = async () => {
    if (!widgetsRef.current || !orderRef.current) return;
    setLoading(true);
    try {
      await widgetsRef.current.requestPayment({
        orderId: orderRef.current.orderId,
        orderName: orderRef.current.orderName,
        successUrl: `${window.location.origin}/user/point?charge=success`,
        failUrl: `${window.location.origin}/user/point?charge=fail`,
      });
      // 성공 시 리다이렉트되므로 이 아래로는 정상 흐름에서 내려오지 않는다
    } catch (err) {
      if (err?.code !== 'USER_CANCEL') {
        setError(err?.message ?? '결제 요청에 실패했습니다.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={onClose}>
      <div
        className="w-full max-w-[560px] max-h-[85vh] overflow-y-auto overscroll-contain bg-white rounded-2xl p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 m-0">포인트 충전</h3>
          <button
            type="button"
            className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
        )}

        {step === 'amount' && (
          <>
            <div className="flex gap-2 mb-4">
              {QUICK_AMOUNTS.map((quick) => (
                <button
                  key={quick}
                  type="button"
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  onClick={() => setAmount(String(quick))}
                >
                  {quick.toLocaleString()} P
                </button>
              ))}
            </div>
            <input
              type="number"
              min="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none mb-4"
              placeholder="충전할 포인트 입력"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-50"
                disabled={loading}
                onClick={() => proceedToWidget(amount)}
              >
                {loading ? '결제수단 준비 중...' : '다음'}
              </button>
            </div>
          </>
        )}

        {step === 'widget' && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              {orderRef.current?.amount.toLocaleString()}P 충전 · 결제수단을 선택해 주세요
            </p>
            <div id="toss-payment-methods" className="mb-3" />
            <div id="toss-agreement" className="mb-4" />
            <div className="flex justify-end">
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-50"
                disabled={loading}
                onClick={submitPayment}
              >
                {loading ? '처리 중...' : '결제하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PointChargeWidgetModal;
