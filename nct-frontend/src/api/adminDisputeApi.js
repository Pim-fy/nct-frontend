import api from './axios';
import { ADMIN_PAGE_SIZE } from '@/constants/adminPagination';

/** 담당자 7 · F-OPS-005/006: 관리자 거래 분쟁 조회·판정 계약입니다. */
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

/** 담당자 7 · F-OPS-005: 권한·감사 검증을 거친 분쟁 증빙 원문을 Blob으로 받습니다. */
export const getAdminDisputeEvidenceBlob = (disputeSn, fileSn, reason) =>
  api.post(`/admin/disputes/${disputeSn}/files/${fileSn}/download`, { reason }, {
    responseType: 'blob',
  });

export const decideAdminDispute = (disputeSn, payload) =>
  api.post(`/admin/disputes/${disputeSn}/decision`, payload)
    .then((response) => response.data.data);
