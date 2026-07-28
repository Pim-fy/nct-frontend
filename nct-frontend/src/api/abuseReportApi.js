import api from './axios';

export const createManualAbuseReport = (data) =>
  api.post('/abuse-reports', data).then((response) => response.data);

export const fetchMyManualAbuseReportReferences = (referenceTypeCode) =>
  api.get('/abuse-reports/me/references', {
    params: { referenceTypeCode },
  }).then((response) => response.data);

export const fetchActiveManualAbuseReportReferences = (
  referenceTypeCode,
  referenceSns,
) => api.get('/abuse-reports/references/statuses', {
  params: {
    referenceTypeCode,
    referenceSns: referenceSns.join(','),
  },
}).then((response) => response.data);
