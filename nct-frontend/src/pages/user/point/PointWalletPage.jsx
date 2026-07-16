// src/pages/user/point/PointWalletPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import Swal from 'sweetalert2';

import PointSummaryCards from './components/PointSummaryCards';
import PointLedgerTable from './components/PointLedgerTable';
import PointChargeOrderTable from './components/PointChargeOrderTable';
import PointAmountModal from './components/PointAmountModal';
import PointChargeWidgetModal from './components/PointChargeWidgetModal';
import { usePointBalance, usePointLedger, usePointChargeOrders } from '../../../hooks/usePoint';
import { requestPointCharge, confirmPointCharge } from '../../../api/pointApi';

// 데이터 도착 전(로딩 중) 카드가 깨지지 않도록 쓰는 0값 기본 잔액
const EMPTY_BALANCE = { available: 0, hold: 0, settleable: 0 };

/** axios 오류에서 백엔드 ApiResponse의 message를 꺼낸다 (없으면 일반 안내) */
const errorMessage = (err) =>
  err?.response?.data?.message ?? '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

/**
 * 포인트 지갑 (목업 17_point_wallet.html, F-PAY-006/007/011)
 * - GET /api/point/balance, /api/point/ledger, /api/point/charge/orders 연동 (usePoint 훅)
 * - 충전(F-PAY-011): 토스페이먼츠 두 방식을 나란히 제공 (사용자 결정, 2026-07-16)
 *   ① 충전       — 결제창 방식(POL-PAY-006): 서버 주문 생성 → 별창 결제창 → 리다이렉트 → 승인
 *   ② 충전(위젯) — 결제위젯 방식: 서버 주문 생성 → 모달 안에 결제수단 UI 렌더링 → 승인
 *   두 방식 모두 금액은 항상 서버 기록만 신뢰한다 (프론트는 금액을 승인 요청에 싣지 않는다)
 * - 결제창 리다이렉트는 별도 라우트 없이 이 페이지의 쿼리 파라미터(?charge=...)로 받는다
 *   (공용 AppRoutes.jsx는 담당자1 소유라 라우트 추가 없이 처리)
 * - 환전(F-PAY-012)은 지급·승인 방식 미결정(2단계 결정 항목)이라 "준비 중" 안내 유지
 */
const PointWalletPage = () => {
  const [openModal, setOpenModal] = useState(null); // null | 'charge' | 'exchange'
  const [charging, setCharging] = useState(false); // 주문 생성~결제창 이동 사이 중복 클릭 방지

  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  // React StrictMode의 이펙트 2회 실행으로 승인(confirm)이 중복 호출되는 것을 막는 가드
  const confirmHandled = useRef(false);

  // 서버 조회 — 로그인(쿠키) 필요. 미로그인 401이면 axios 인터셉터가 /login으로 보낸다
  const { data: balance = EMPTY_BALANCE, isLoading: balanceLoading } = usePointBalance();
  const { data: ledger = [], isLoading: ledgerLoading } = usePointLedger();
  const { data: chargeOrders = [], isLoading: ordersLoading } = usePointChargeOrders();

  // 결제창 리다이렉트 처리 — 성공이면 서버 승인 호출, 실패면 사유 안내
  useEffect(() => {
    const chargeResult = searchParams.get('charge');
    if (!chargeResult || confirmHandled.current) return;
    confirmHandled.current = true;

    const clearParams = () => setSearchParams({}, { replace: true });

    if (chargeResult === 'success') {
      // 토스가 successUrl에 붙여 준 paymentKey/orderId로 서버 승인을 요청한다.
      // amount 파라미터는 위변조 가능성이 있어 서버에 보내지 않는다 — 서버가 사전 기록과 대조.
      confirmPointCharge({
        orderId: searchParams.get('orderId'),
        paymentKey: searchParams.get('paymentKey'),
      })
        .then(() => {
          // 잔액·원장·충전내역 모두 바뀌었으니 포인트 캐시 전체 갱신
          queryClient.invalidateQueries({ queryKey: ['point'] });
          Swal.fire({
            icon: 'success',
            title: '충전 완료',
            text: '포인트 충전이 완료되었습니다.',
            confirmButtonColor: '#0064ff',
          });
        })
        .catch((err) => {
          queryClient.invalidateQueries({ queryKey: ['point'] });
          Swal.fire({
            icon: 'error',
            title: '충전 승인 실패',
            text: errorMessage(err),
            confirmButtonColor: '#0064ff',
          });
        })
        .finally(clearParams);
    } else {
      // 실패 리다이렉트 — 토스가 붙여 준 실패 메시지를 그대로 안내 (주문은 대기 상태로 남는다)
      Swal.fire({
        icon: 'error',
        title: '결제 실패',
        text: searchParams.get('message') ?? '결제가 완료되지 않았습니다.',
        confirmButtonColor: '#0064ff',
      });
      clearParams();
    }
  }, [searchParams, setSearchParams, queryClient]);

  /** 충전 제출 — 서버 주문 생성 후 토스 결제창 호출 */
  const handleCharge = async (amount) => {
    if (!Number.isInteger(amount) || amount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: '금액을 확인해 주세요',
        text: '충전 금액은 1P 이상의 정수만 가능합니다.',
        confirmButtonColor: '#0064ff',
      });
      return;
    }
    if (charging) return;
    setCharging(true);

    try {
      // 1) 서버가 신뢰 기준 금액을 먼저 기록하고 주문번호를 발급 (QSC-PG-01)
      const res = await requestPointCharge(amount);
      const { orderId, amount: orderAmount, orderName, clientKey } = res.data;

      // 2) 발급받은 주문 정보로 토스 결제창 호출 — 성공/실패 모두 이 페이지로 리다이렉트
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: orderAmount },
        orderId,
        orderName,
        successUrl: `${window.location.origin}/user/point?charge=success`,
        failUrl: `${window.location.origin}/user/point?charge=fail`,
      });
      // requestPayment는 리다이렉트되므로 정상 흐름에서는 이 아래로 내려오지 않는다
    } catch (err) {
      if (err?.code === 'USER_CANCEL') {
        // 사용자가 결제창을 닫은 경우 — 오류가 아니므로 조용히 안내만
        Swal.fire({
          icon: 'info',
          title: '결제 취소',
          text: '결제를 취소했습니다.',
          confirmButtonColor: '#0064ff',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: '충전 요청 실패',
          text: err?.message && !err?.response ? err.message : errorMessage(err),
          confirmButtonColor: '#0064ff',
        });
      }
      // 결제창까지 갔다가 취소·실패한 주문은 대기 상태로 남고 충전 내역에서 확인 가능
      queryClient.invalidateQueries({ queryKey: ['point', 'chargeOrders'] });
    } finally {
      setCharging(false);
      setOpenModal(null);
    }
  };

  /** 환전 — 지급·승인 방식 미결정(2단계 착수 전 결정 항목)이라 실처리 미구현 */
  const notReady = () => {
    setOpenModal(null);
    Swal.fire({
      icon: 'info',
      title: '준비 중입니다',
      text: '환전은 지급·승인 방식 확정(F-PAY-012) 후 제공됩니다.',
      confirmButtonColor: '#0064ff',
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">
      {/* 페이지 타이틀 + 액션 */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 m-0">포인트 지갑</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-50"
            disabled={charging}
            onClick={() => setOpenModal('charge')}
          >
            충전
          </button>
          <button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors"
            onClick={() => setOpenModal('chargeWidget')}
          >
            충전(위젯)
          </button>
          <button
            type="button"
            className="border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg px-5 py-2.5 transition-colors"
            onClick={() => setOpenModal('exchange')}
          >
            환전
          </button>
        </div>
      </div>

      <PointSummaryCards balance={balance} />
      {ledgerLoading || balanceLoading ? (
        <p className="text-sm text-gray-400 text-center py-10">포인트 내역을 불러오는 중...</p>
      ) : (
        <PointLedgerTable rows={ledger} />
      )}
      {ordersLoading ? (
        <p className="text-sm text-gray-400 text-center py-10">충전 내역을 불러오는 중...</p>
      ) : (
        <PointChargeOrderTable rows={chargeOrders} />
      )}

      {openModal === 'charge' && (
        <PointAmountModal
          title="포인트 충전"
          submitLabel="충전"
          onSubmit={handleCharge}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === 'chargeWidget' && (
        <PointChargeWidgetModal onClose={() => setOpenModal(null)} />
      )}
      {openModal === 'exchange' && (
        <PointAmountModal
          title="환전 신청"
          submitLabel="환전"
          infoRow={{ label: '환전 가능 포인트', value: `${balance.settleable.toLocaleString()} P` }}
          onSubmit={notReady}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
};

export default PointWalletPage;
