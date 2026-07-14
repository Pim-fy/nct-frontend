// src/pages/user/point/PointWalletPage.jsx
import { useState } from 'react';
import Swal from 'sweetalert2';

import PointSummaryCards from './components/PointSummaryCards';
import PointLedgerTable from './components/PointLedgerTable';
import PointAmountModal from './components/PointAmountModal';
import { usePointBalance, usePointLedger } from '../../../hooks/usePoint';

// 데이터 도착 전(로딩 중) 카드가 깨지지 않도록 쓰는 0값 기본 잔액
const EMPTY_BALANCE = { available: 0, hold: 0, settleable: 0 };

/**
 * 포인트 지갑 (목업 17_point_wallet.html, F-PAY-038/039)
 * - GET /api/point/balance, /api/point/ledger 연동 (usePoint 훅)
 * - 응답 필드명이 화면 컴포넌트와 동일해서 변환 없이 그대로 넘긴다
 * - 충전(F-PAY-100)·환전(F-PAY-101) 실처리는 DEC-117/118 확정 전 미구현 ("준비 중" 안내만)
 */
const PointWalletPage = () => {
  const [openModal, setOpenModal] = useState(null); // null | 'charge' | 'exchange'

  // 서버 조회 — 로그인(쿠키) 필요. 미로그인 401이면 axios 인터셉터가 /login으로 보낸다
  const { data: balance = EMPTY_BALANCE, isLoading: balanceLoading } = usePointBalance();
  const { data: ledger = [], isLoading: ledgerLoading } = usePointLedger();

  const notReady = (decision) => {
    setOpenModal(null);
    Swal.fire({
      icon: 'info',
      title: '준비 중입니다',
      text: `해당 기능은 정책 확정(${decision}) 후 제공됩니다.`,
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
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-5 py-2.5 transition-colors"
            onClick={() => setOpenModal('charge')}
          >
            충전
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

      {openModal === 'charge' && (
        <PointAmountModal
          title="포인트 충전"
          submitLabel="충전"
          onSubmit={() => notReady('DEC-117')}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === 'exchange' && (
        <PointAmountModal
          title="환전 신청"
          submitLabel="환전"
          infoRow={{ label: '환전 가능 포인트', value: `${balance.settleable.toLocaleString()} P` }}
          onSubmit={() => notReady('DEC-118')}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
};

export default PointWalletPage;
