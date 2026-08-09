import api from './axios';
import { ADMIN_PAGE_SIZE } from '@/constants/adminPagination';

const unwrapData = (response) => response?.data?.data ?? response?.data ?? null;

const normalizeUserPage = (payload, requestedPage, requestedSize) => {
  const source = payload ?? {};
  const content = Array.isArray(source.content) ? source.content : [];
  const totalCount = Number(source.totalCount ?? 0);
  const page = Number(source.page ?? requestedPage);
  const size = Number(source.size ?? requestedSize);

  return {
    content,
    totalCount,
    page,
    size,
    hasNext: source.hasNext ?? page * size < totalCount,
  };
};

const normalizeAdminPage = (payload, requestedPage, requestedSize) => {
  const source = payload ?? {};
  const items = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.content)
      ? source.content
      : [];
  const totalItems = Number(source.totalItems ?? source.totalCount ?? 0);
  const page = Number(source.page ?? requestedPage);
  const size = Number(source.size ?? requestedSize);

  return {
    items,
    page,
    size,
    totalItems,
    totalPages: Number(source.totalPages ?? Math.ceil(totalItems / Math.max(size, 1))),
  };
};

/** 담당자 7 · 관리자 대상 1:1 문의: 사용자와 관리자 화면의 API 응답 형태를 이 파일에서만 정규화합니다. */
export const createCustomerInquiry = (data) =>
  api.post('/customer-inquiries', data, { skipServerErrorRedirect: true })
    .then(unwrapData);

export const getMyCustomerInquiries = ({ statusCode, page = 1, size = 5 }) =>
  api.get('/customer-inquiries/me', {
    params: {
      ...(statusCode ? { statusCode } : {}),
      page,
      size,
    },
    skipServerErrorRedirect: true,
  }).then((response) => normalizeUserPage(unwrapData(response), page, size));

export const getMyCustomerInquiry = (inquirySn) =>
  api.get(`/customer-inquiries/me/${inquirySn}`, { skipServerErrorRedirect: true })
    .then(unwrapData);

export const getAdminCustomerInquiries = ({
  statusCode,
  inquiryTypeCode,
  keyword,
  page = 1,
  size = ADMIN_PAGE_SIZE,
}) => api.get('/admin/customer-inquiries', {
  params: {
    ...(statusCode ? { statusCode } : {}),
    ...(inquiryTypeCode ? { inquiryTypeCode } : {}),
    ...(keyword ? { keyword } : {}),
    page,
    size,
  },
}).then((response) => normalizeAdminPage(unwrapData(response), page, size));

export const getAdminCustomerInquiry = (inquirySn) =>
  api.get(`/admin/customer-inquiries/${inquirySn}`)
    .then(unwrapData);

export const startAdminCustomerInquiry = ({ inquirySn, requestId }) =>
  api.post(`/admin/customer-inquiries/${inquirySn}/start-processing`, { requestId })
    .then(unwrapData);

export const answerAdminCustomerInquiry = ({ inquirySn, answer, detectionKey }) =>
  api.post(`/admin/customer-inquiries/${inquirySn}/answer`, { answer, detectionKey })
    .then(unwrapData);
