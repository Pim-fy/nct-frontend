import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyReports, submitCustomerReport } from '../api/abuseReportApi';

/** 내 신고 목록 — data: PageResponse { content, totalCount, page, size, hasNext } */
export function useMyReports({ status = null, page = 1, size = 5 } = {}) {
  return useQuery({
    queryKey: ['abuse-reports', 'my', { status, page, size }],
    queryFn: () => getMyReports({ status: status || undefined, page, size }),
    select: (res) => res.data,
    keepPreviousData: true,
  });
}

/** 신고 접수 — mutateAsync({ reportTypeCode, reportedUserSn?, referenceTypeCode?, referenceSn?, targetName?, title, content }) */
export function useSubmitCustomerReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitCustomerReport,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['abuse-reports', 'my'] }),
  });
}
