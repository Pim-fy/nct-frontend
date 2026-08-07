import api from './axios';
import { ADMIN_PAGE_SIZE } from '@/constants/adminPagination';

/** 담당자 7 · F-OPS-005/REQ-OPS-005: 관리자 거래 분쟁 목록·상세 읽기 계약입니다. */
export const getAdminDisputes = ({
  disputeStatusCode,
  disputeTypeCode,
  keyword,
  page,
  size = ADMIN_PAGE_SIZE,
}) => api.get('/admin/disputes', {
  params: {
    ...(disputeStatusCode ? { disputeStatusCode } : {}),
    ...(disputeTypeCode ? { disputeTypeCode } : {}),
    ...(keyword ? { keyword } : {}),
    page,
    size,
  },
}).then((response) => response.data.data);

export const getAdminDispute = (disputeSn) =>
  api.get(`/admin/disputes/${disputeSn}`).then((response) => response.data.data);
