import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminCategories, saveAdminCategory } from '@api/adminCategoryApi';

const keys = { all: ['admin-categories'], list: (domain) => ['admin-categories', domain] };

export const useAdminCategories = (domainCode) => useQuery({
  queryKey: keys.list(domainCode),
  queryFn: () => fetchAdminCategories(domainCode),
});

export const useSaveAdminCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAdminCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
};
