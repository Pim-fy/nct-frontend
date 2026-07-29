import { useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchPublicProviderProfile,
  fetchServiceDiscovery,
  submitProviderReport,
} from '@api/serviceDiscoveryApi';

export const serviceDiscoveryQueryKeys = {
  all: ['service-discovery'],
  search: (filters) => [...serviceDiscoveryQueryKeys.all, 'search', filters],
  provider: (providerId) => [...serviceDiscoveryQueryKeys.all, 'provider', providerId],
};

export const useServiceDiscovery = (filters, options = {}) => {
  const { enabled = true, ...queryOptions } = options;
  return useQuery({
    queryKey: serviceDiscoveryQueryKeys.search(filters),
    queryFn: () => fetchServiceDiscovery(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
    ...queryOptions,
    enabled,
  });
};

export const usePublicProviderProfile = (providerId) => useQuery({
  queryKey: serviceDiscoveryQueryKeys.provider(providerId),
  queryFn: () => fetchPublicProviderProfile(providerId),
  enabled: Number.isSafeInteger(providerId) && providerId > 0,
});

export const useProviderReport = () => useMutation({
  mutationFn: submitProviderReport,
});
