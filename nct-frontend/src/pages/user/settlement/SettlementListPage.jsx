// src/pages/user/settlement/SettlementListPage.jsx
import { useState } from 'react';

import SettlementSummaryCards from './components/SettlementSummaryCards';
import SettlementTable from './components/SettlementTable';
import { useSettlementList } from '../../../hooks/useSettlement';

/**
 * 정산 관리 (제공자용, 목업 18_settlement.html, F-STL-01)
 * - GET /api/settlement 연동 (useSettlement 훅)
 * - 정산 요청·계좌 정보 편집 등은 백엔드에 대응 기능이 아직 없어 조회 전용으로 구현
 */
const SettlementListPage = () => {
  const [filter, setFilter] = useState('전체');
  const { data: rows = [], isLoading } = useSettlementList();

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 m-0">정산 관리</h1>
        <p className="text-gray-500 mt-1.5 mb-0">거래 완료 후 정산 대기, 보류, 완료 내역을 확인합니다.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400 text-center py-10">정산 내역을 불러오는 중...</p>
      ) : (
        <>
          <SettlementSummaryCards rows={rows} />
          <SettlementTable rows={rows} filter={filter} onFilterChange={setFilter} />
        </>
      )}
    </div>
  );
};

export default SettlementListPage;
