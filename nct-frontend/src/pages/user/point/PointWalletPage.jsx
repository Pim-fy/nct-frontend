// src/pages/user/point/PointWalletPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';

import PointSummaryCards from './components/PointSummaryCards';
import PointLedgerTable from './components/PointLedgerTable';
import PointChargeOrderTable from './components/PointChargeOrderTable';
import PointExchangeOrderTable from './components/PointExchangeOrderTable';
import PointAmountModal from './components/PointAmountModal';
import PointChargeWidgetModal from './components/PointChargeWidgetModal';
import { usePointBalance, usePointLedger, usePointChargeOrders, usePointExchangeOrders } from '../../../hooks/usePoint';
import { confirmPointCharge, requestPointExchange, convertPoint } from '../../../api/pointApi';

// 데이터 도착 전(로딩 중) 카드가 깨지지 않도록 쓰는 0값 기본 잔액
const EMPTY_BALANCE = { available: 0, hold: 0, settleable: 0, total: 0, exchangeable: 0 };

/** axios 오류에서 백엔드 ApiResponse의 message를 꺼낸다 (없으면 일반 안내) */
const errorMessage = (err) =>
  err?.response?.data?.message ?? '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

/**
 * 환전/전환 제출 설정 — 두 기능은 "검증 → 모달 닫기 → API 호출 → 포인트 캐시 갱신 → 결과 안내"
 * 구조가 완전히 같고 API와 문구만 달라서, 흐름은 submitAmount 하나로 쓰고 차이만 여기 모았다
 * (환전 F-PAY-012: 신청 즉시 차감·관리자 수동 지급 / 전환 F-PAY-010: 분쟁 없을 때만 서버가 허용)
 */
const SUBMIT_ACTIONS = {
  exchange: {
    api: requestPointExchange,
    invalidText: '환전 금액은 1P 이상의 정수만 가능합니다.',
    successTitle: '환전 신청 완료',
    successText: '신청 금액이 차감되었고, 등록하신 계좌로 며칠 내 지급될 예정입니다.',
    failTitle: '환전 신청 실패',
  },
  convert: {
    api: convertPoint,
    invalidText: '전환 금액은 1P 이상의 정수만 가능합니다.',
    successTitle: '전환 완료',
    successText: '정산 가능 포인트가 사용 가능 포인트로 전환되었습니다.',
    failTitle: '전환 실패',
  },
};

/**
 * 포인트 지갑 (목업 17_point_wallet.html, F-PAY-006/007/011)
 * - GET /api/point/balance, /api/point/ledger, /api/point/charge/orders 연동 (usePoint 훅)
 * - 충전(F-PAY-011): 토스페이먼츠 결제위젯 방식 단일 (사용자 결정, 2026-07-16 — 결제창 방식 제거)
 *   서버 주문 생성 → 모달 안에 결제수단 UI 렌더링 → 리다이렉트 → 서버 승인(confirm) 순서로,
 *   금액은 항상 서버 기록만 신뢰한다 (프론트는 금액을 승인 요청에 싣지 않는다)
 * - 결제 리다이렉트는 별도 라우트 없이 이 페이지의 쿼리 파라미터(?charge=...)로 받는다
 *   (공용 AppRoutes.jsx는 담당자1 소유라 라우트 추가 없이 처리)
 * - 환전(F-PAY-012): 방식 확정(D-026, 2026-07-17)에 따라 실연동 — 신청 즉시 서버가 차감하고
 *   실제 입금은 관리자 수동 처리라 "며칠 내 지급 예정" 안내만 나간다. 계좌는 서버가
 *   회원의 등록 계좌를 직접 읽는다 (프론트는 금액만 보냄)
 * - embedded=true면 마이페이지 사이드바 안에 끼워 넣어지는 것이라, 자체 최대너비·여백 없이
 *   내용만 렌더한다(마이페이지 쪽 컨테이너 여백을 그대로 쓴다). 단독 라우트(/user/point)로
 *   접근할 때만 자체 컨테이너를 갖는다 (2026-07-24, 팀전달_마이페이지_포인트지갑사이드바_수정요청)
 */
const PointWalletPage = ({ embedded = false } = {}) => {
  const [openModal, setOpenModal] = useState(null); // null | 'charge' | 'exchange' | 'convert'

  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  // React StrictMode의 이펙트 2회 실행으로 승인(confirm)이 중복 호출되는 것을 막는 가드
  const confirmHandled = useRef(false);

  // 서버 조회 — 로그인(쿠키) 필요. 미로그인 401이면 axios 인터셉터가 /login으로 보낸다
  const { data: balance = EMPTY_BALANCE, isLoading: balanceLoading } = usePointBalance();
  const { data: ledger = [], isLoading: ledgerLoading } = usePointLedger();
  const { data: chargeOrders = [], isLoading: ordersLoading } = usePointChargeOrders();
  const { data: exchangeOrders = [], isLoading: exchangeLoading } = usePointExchangeOrders();

  // 결제 리다이렉트 처리 — 성공이면 서버 승인 호출, 실패면 사유 안내
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

  /**
   * 환전/전환 공통 제출 처리 — 어느 쪽인지(kind)에 따라 SUBMIT_ACTIONS의 API·문구만 갈아끼운다.
   * 서버가 검증(계좌·잔액·분쟁)을 전부 하므로 프론트는 정수 확인만 하고 사유는 서버 응답을 그대로 안내
   */
  const submitAmount = (kind) => (amount) => {
    const action = SUBMIT_ACTIONS[kind];
    if (!Number.isInteger(amount) || amount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: '금액을 확인해 주세요',
        text: action.invalidText,
        confirmButtonColor: '#0064ff',
      });
      return;
    }
    setOpenModal(null);
    action.api(amount)
      .then(() => {
        // 잔액·원장·내역이 전부 바뀌므로 포인트 캐시 전체 갱신
        queryClient.invalidateQueries({ queryKey: ['point'] });
        Swal.fire({
          icon: 'success',
          title: action.successTitle,
          text: action.successText,
          confirmButtonColor: '#0064ff',
        });
      })
      .catch((err) => {
        // 계좌 미등록·잔액 부족·분쟁 진행 중 등 서버가 알려준 사유를 그대로 안내
        Swal.fire({
          icon: 'error',
          title: action.failTitle,
          text: errorMessage(err),
          confirmButtonColor: '#0064ff',
        });
      });
  };

  return (
    <div
      className={embedded ? undefined : 'container'}
      style={embedded ? undefined : { paddingTop: '25px', paddingBottom: '25px' }}
    >
      {/* 페이지 타이틀 + 액션 */}
      <div className="flex items-end justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 m-0">포인트 지갑</h1>
        <div className="flex gap-2">
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors"
            onClick={() => setOpenModal('charge')}
          >
            충전
          </button>
          <button
            type="button"
            className="border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg px-5 py-2.5 transition-colors"
            onClick={() => setOpenModal('convert')}
          >
            전환
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
      {exchangeLoading ? (
        <p className="text-sm text-gray-400 text-center py-10">환전 내역을 불러오는 중...</p>
      ) : (
        <PointExchangeOrderTable rows={exchangeOrders} />
      )}

      {openModal === 'charge' && (
        <PointChargeWidgetModal
          infoRow={{ label: '사용가능 포인트', value: `${(balance.available ?? 0).toLocaleString()} P` }}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === 'exchange' && (
        <PointAmountModal
          title="환전 신청"
          submitLabel="환전"
          infoRow={{ label: '환전 가능 포인트', value: `${balance.exchangeable.toLocaleString()} P` }}
          onSubmit={submitAmount('exchange')}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === 'convert' && (
        <PointAmountModal
          title="포인트 전환"
          submitLabel="전환"
          infoRow={{ label: '전환 가능 포인트', value: `${balance.settleable.toLocaleString()} P` }}
          onSubmit={submitAmount('convert')}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
};

export default PointWalletPage;
