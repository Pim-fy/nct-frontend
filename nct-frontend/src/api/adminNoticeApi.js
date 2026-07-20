// F-OPS-023 관리자 공지 API를 한곳에 모읍니다.
// 사용자 공개 조회 API와 분리되어 있어, 관리자 화면을 바꿔도 공개 공지 계약은 영향을 받지 않습니다.
import api from './axios';

export const fetchAdminNoticeOptions = () =>
  api.get('/admin/notices/options').then((response) => response.data.data);

export const fetchAdminNotices = ({ typeCode, statusCode, keyword, page, size = 20 }) =>
  api.get('/admin/notices', {
    params: {
      ...(typeCode ? { typeCode } : {}),
      ...(statusCode ? { statusCode } : {}),
      ...(keyword ? { keyword } : {}),
      page,
      size,
    },
  }).then((response) => response.data.data);

export const fetchAdminNotice = (noticeId) =>
  api.get(`/admin/notices/${noticeId}`).then((response) => response.data.data);

export const createAdminNotice = (payload) =>
  api.post('/admin/notices', payload).then((response) => response.data.data);

export const updateAdminNotice = ({ noticeId, payload }) =>
  api.put(`/admin/notices/${noticeId}`, payload).then((response) => response.data.data);

export const hideAdminNotice = ({ noticeId, changeReason }) =>
  api.patch(`/admin/notices/${noticeId}/hide`, { changeReason })
    .then((response) => response.data.data);

export const deleteAdminNotice = ({ noticeId, changeReason }) =>
  api.delete(`/admin/notices/${noticeId}`, { data: { changeReason } });
