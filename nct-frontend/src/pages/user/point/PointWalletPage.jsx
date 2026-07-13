// src/pages/user/point/PointWalletPage.jsx
import { useState } from 'react';
import Swal from 'sweetalert2';

import PointSummaryCards from './components/PointSummaryCards';
import PointLedgerTable from './components/PointLedgerTable';
import PointAmountModal from './components/PointAmountModal';

// 임시 더미 데이터 - 실제 API 연동 시 교체 (GET /api/point/balance, /api/point/ledger)
const DUMMY_BALANCE = {
  available: 300000,
  hold: 200000,
  settleable: 100000,
};

const DUMMY_LEDGER = [
  { id: 7, date: '2026-07-12 14:00', type: '충전',       category: '사용가능', amount: 100000,  balanceAfter: 300000, ref: null,      reason: '포인트 충전' },
  { id: 6, date: '2026-07-11 10:21', type: '홀딩',       category: '사용가능', amount: -100000, balanceAfter: 200000, ref: '입찰-1024', reason: '입찰 홀딩' },
  { id: 5, date: '2026-07-11 10:21', type: '홀딩',       category: '홀딩',     amount: 100000,  balanceAfter: 200000, ref: '입찰-1024', reason: '입찰 홀딩' },
  { id: 4, date: '2026-07-10 18:44', type: '반환',       category: '사용가능', amount: 100000,  balanceAfter: 300000, ref: '입찰-1019', reason: '상위 입찰 발생 반환' },
  { id: 3, date: '2026-07-09 09:12', type: '보관금전환', category: '홀딩',     amount: -200000, balanceAfter: 100000, ref: '거래-88',   reason: '낙찰 확정 거래대금 전환' },
  { id: 2, date: '2026-07-08 16:30', type: '정산',       category: '정산가능', amount: 100000,  balanceAfter: 100000, ref: '거래-72',   reason: '정산 완료' },
  { id: 1, date: '2026-07-07 11:05', type: '보정',       category: '사용가능', amount: 50000,   balanceAfter: 200000, ref: '관리-3',    reason: '관리자 보정' },
];

/**
 * 포인트 지갑 (목업 17_point_wallet.html, F-PAY-038/039)
 * 충전(F-PAY-100)·환전(F-PAY-101) 실처리는 DEC-117/118 확정 전 미구현
 */
const PointWalletPage = () => {
  const [openModal, setOpenModal] = useState(null); // null | 'charge' | 'exchange'

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

      <PointSummaryCards balance={DUMMY_BALANCE} />
      <PointLedgerTable rows={DUMMY_LEDGER} />

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
          infoRow={{ label: '환전 가능 포인트', value: `${DUMMY_BALANCE.settleable.toLocaleString()} P` }}
          onSubmit={() => notReady('DEC-118')}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  );
};

export default PointWalletPage;
