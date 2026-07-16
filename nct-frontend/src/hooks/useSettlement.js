import { useQuery } from '@tanstack/react-query';

import { getSettlementList } from '../api/settlementApi';

export const useSettlementList = () => useQuery({
  queryKey: ['settlement', 'list'],
  queryFn: getSettlementList,
});
