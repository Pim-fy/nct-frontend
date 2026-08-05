import api from './axios';

/** 담당자 7 · F-OPS-007: 관리자 신고 전체·상태별 목록, 상세, 처리 계약입니다. */
export const getAdminReports = ({ statusCode, keyword, page, size = 20 }) =>
  api.get('/admin/reports/search', {
    params: {
      ...(statusCode ? { statusCode } : {}),
      ...(keyword ? { keyword } : {}),
      page,
      size,
    },
  }).then((response) => response.data.data);

export const getAdminReport = (reportSn) =>
  api.get(`/admin/reports/${reportSn}`).then((response) => response.data.data);

export const decideAdminReport = ({ reportSn, decision, reason }) =>
  api.post(`/admin/reports/${reportSn}/decision`, { decision, reason })
    .then((response) => response.data);
