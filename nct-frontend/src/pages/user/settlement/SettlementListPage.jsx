import { useState } from 'react';

import { useSettlementList } from '../../../hooks/useSettlement';
import SettlementSummaryCards from './components/SettlementSummaryCards';
import SettlementTable from './components/SettlementTable';

const SettlementListPage = () => {
  const [filter, setFilter] = useState('전체');
  const { data: rows = [], isLoading, isError } = useSettlementList();

  return (
    <main className="max-w-[1200px] mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 m-0">정산 관리</h1>
        <p className="text-gray-500 mt-1.5 mb-0">거래 완료 후 정산 대기, 보류, 완료 내역을 확인합니다.</p>
      </div>

      {isLoading && (
        <p className="text-sm text-gray-400 text-center py-10">정산 내역을 불러오는 중...</p>
      )}

      {isError && (
        <p className="text-sm text-red-500 text-center py-10">정산 내역을 불러오지 못했습니다.</p>
      )}

      {!isLoading && !isError && (
        <>
          <SettlementSummaryCards rows={rows} />
          <SettlementTable rows={rows} filter={filter} onFilterChange={setFilter} />
        </>
      )}
    </main>
  );
};

export default SettlementListPage;
