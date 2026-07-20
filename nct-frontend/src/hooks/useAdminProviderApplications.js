import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveProviderApplication,
  fetchAdminProviderApplications,
  rejectProviderApplication,
} from '@api/providerApplicationApi';

export const adminProviderApplicationKeys = {
  all: ['admin-provider-applications'],
  list: (statusCode) => [...adminProviderApplicationKeys.all, 'list', statusCode || 'all'],
};

export const useAdminProviderApplications = (statusCode) => useQuery({
  queryKey: adminProviderApplicationKeys.list(statusCode),
  queryFn: () => fetchAdminProviderApplications({ statusCode }),
});

const useProviderDecision = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminProviderApplicationKeys.all }),
  });
};

export const useApproveProviderApplication = () => useProviderDecision(approveProviderApplication);
export const useRejectProviderApplication = () => useProviderDecision(rejectProviderApplication);
