import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAdminNotice,
  deleteAdminNotice,
  fetchAdminNotice,
  fetchAdminNoticeOptions,
  fetchAdminNotices,
  hideAdminNotice,
  updateAdminNotice,
} from '@api/adminNoticeApi';
import { noticeQueryKeys } from '@hooks/usePublicNotices';

export const adminNoticeQueryKeys = {
  all: ['admin-notices'],
  options: () => [...adminNoticeQueryKeys.all, 'options'],
  list: (filters) => [...adminNoticeQueryKeys.all, 'list', filters],
  detail: (noticeId) => [...adminNoticeQueryKeys.all, 'detail', noticeId],
};

export const useAdminNoticeOptions = () => useQuery({
  queryKey: adminNoticeQueryKeys.options(),
  queryFn: fetchAdminNoticeOptions,
});

export const useAdminNoticeList = (filters) => useQuery({
  queryKey: adminNoticeQueryKeys.list(filters),
  queryFn: () => fetchAdminNotices(filters),
});

export const useAdminNoticeDetail = (noticeId) => useQuery({
  queryKey: adminNoticeQueryKeys.detail(noticeId),
  queryFn: () => fetchAdminNotice(noticeId),
  enabled: Number.isSafeInteger(noticeId) && noticeId > 0,
});

const useNoticeMutation = (mutationFn) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (notice) => {
      queryClient.invalidateQueries({ queryKey: adminNoticeQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: noticeQueryKeys.all });
      if (notice?.noticeId) {
        queryClient.setQueryData(adminNoticeQueryKeys.detail(notice.noticeId), notice);
      }
    },
  });
};

export const useCreateAdminNotice = () => useNoticeMutation(createAdminNotice);
export const useUpdateAdminNotice = () => useNoticeMutation(updateAdminNotice);
export const useHideAdminNotice = () => useNoticeMutation(hideAdminNotice);
export const useDeleteAdminNotice = () => useNoticeMutation(deleteAdminNotice);
