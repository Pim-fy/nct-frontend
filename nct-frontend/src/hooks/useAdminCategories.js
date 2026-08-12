import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminCategories,
  moveAdminCategory,
  reorderAdminCategories,
  saveAdminCategory,
} from '@api/adminCategoryApi';

const keys = { all: ['admin-categories'], list: (domain) => ['admin-categories', domain] };

export const useAdminCategories = (domainCode) => useQuery({
  queryKey: keys.list(domainCode),
  queryFn: () => fetchAdminCategories(domainCode),
});

export const useSaveAdminCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveAdminCategory,
    onSuccess: (category, { categorySn }) => {
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
      if (!categorySn) return;
      queryClient.setQueryData(
        ['admin-service-request-form', String(categorySn)],
        (current) => (current ? {
          ...current,
          categoryName: category.name,
          categoryActive: category.active,
        } : current),
      );
    },
  });
};

export const useMoveAdminCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moveAdminCategory,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.all }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] }),
      ]);
    },
  });
};

export const useReorderAdminCategories = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderAdminCategories,
    onSuccess: (categories, { domainCode }) => {
      queryClient.setQueryData(keys.list(domainCode), categories);
      queryClient.invalidateQueries({ queryKey: keys.all });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
    },
  });
};
