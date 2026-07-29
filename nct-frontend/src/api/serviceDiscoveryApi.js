import api from './axios';
import { PROVIDER_PREVIEW } from '@pages/service/servicePreviewData';
import {
  fetchPublicPortfolios as fetchProviderPortfolios,
  fetchPublicProviderProfile as fetchProviderProfile,
} from '@api/providerProfileApi';

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string'
        ? item
        : firstDefined(item?.categoryName, item?.catNm, item?.name)))
      .filter(Boolean)
      .map(String);
  }
  if (!value) return [];
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
};

const normalizeRequest = (item) => ({
  id: firstDefined(item.svcReqSn, item.serviceRequestId, item.id),
  title: firstDefined(item.svcReqTtl, item.title, ''),
  description: firstDefined(item.svcReqCn, item.description, item.summary, ''),
  categoryName: firstDefined(item.catNm, item.categoryName, item.category, ''),
  regionName: firstDefined(item.regionName, item.region, item.availableArea, ''),
  budgetAmount: toNumber(firstDefined(item.svcReqBdgtAmt, item.budgetAmount, item.budget)),
  budgetLabel: firstDefined(item.budgetLabel, ''),
  statusCode: firstDefined(item.svcReqStatusCd, item.statusCode, ''),
  statusName: firstDefined(item.svcReqStatusNm, item.statusName, item.status, ''),
  quoteCount: firstDefined(item.quoteCount, item.quotationCount),
  registeredAt: firstDefined(item.svcReqRegDt, item.registeredAt, item.createdAt),
});

const normalizeProvider = (item) => ({
  id: firstDefined(item.providerUserSn, item.usrSn, item.providerId, item.id),
  name: firstDefined(item.providerName, item.usrNm, item.name, ''),
  introduction: firstDefined(item.prvPrfIntroCn, item.introduction, item.intro, ''),
  availableArea: firstDefined(item.prvPrfAreaNm, item.availableArea, item.region, ''),
  categoryNames: toStringArray(firstDefined(item.categoryNames, item.categories)),
  rating: firstDefined(item.reviewAverageScore, item.averageRating, item.rating),
  reviewCount: firstDefined(item.reviewCount, 0),
  completedCount: firstDefined(item.completedCount, item.tradeCount),
  verified: Boolean(firstDefined(item.verified, item.approved, false)),
});

const normalizeDiscoveryResult = (payload, view, requestedPage, requestedSize) => {
  const source = payload ?? {};
  const pageSource = source.page && typeof source.page === 'object' ? source.page : source;
  const rawItems = firstDefined(
    source.items,
    source.list,
    source.content,
    pageSource.content,
    source.results,
    [],
  );
  const total = toNumber(firstDefined(
    source.total,
    source.totalCount,
    source.totalElements,
    pageSource.totalElements,
    rawItems.length,
  ));
  const totalPages = Math.max(0, toNumber(firstDefined(
    source.totalPages,
    pageSource.totalPages,
    Math.ceil(total / requestedSize),
  )));
  const rawResponsePage = toNumber(
    firstDefined(source.pageNumber, pageSource.number, source.page),
    view === 'providers' ? requestedPage - 1 : requestedPage,
  );
  const responsePage = view === 'providers' ? rawResponsePage + 1 : rawResponsePage;
  const counts = source.counts ?? {};

  return {
    items: rawItems.map(view === 'providers' ? normalizeProvider : normalizeRequest),
    total,
    totalPages,
    page: responsePage,
    size: toNumber(firstDefined(source.size, pageSource.size), requestedSize),
    counts: {
      requests: firstDefined(counts.requests, source.requestCount, view === 'requests' ? total : null),
      providers: firstDefined(counts.providers, source.providerCount, view === 'providers' ? total : null),
    },
    view,
  };
};

export const fetchServiceDiscovery = async ({
  view = 'requests',
  keyword = '',
  categorySn = '',
  region = '',
  minBudget = 0,
  maxBudget = 0,
  sort = '',
  page = 1,
  size = 12,
}) => {
  const isProviderView = view === 'providers';
  const viewSpecificParams = isProviderView
    ? {
        region: region.trim() || undefined,
      }
    : {
        minBudget: minBudget || undefined,
        maxBudget: maxBudget || undefined,
      };
  const resource = isProviderView
    ? '/service-discovery/providers'
    : '/service-requests';
  const response = await api.get(resource, {
    params: {
      keyword: keyword.trim() || undefined,
      categorySn: categorySn || undefined,
      ...viewSpecificParams,
      sort: sort || undefined,
      page: isProviderView ? Math.max(0, page - 1) : Math.max(1, page),
      size,
    },
    skipAuthRefresh: true,
    skipServerErrorRedirect: true,
  });
  return normalizeDiscoveryResult(response.data.data, view, page, size);
};

export const fetchPublicProviderProfile = async (providerId) => {
  const previewProvider = PROVIDER_PREVIEW.find((item) => item.id === Number(providerId));
  let profile;
  let portfolios;
  try {
    [profile, portfolios] = await Promise.all([
      fetchProviderProfile(Number(providerId)),
      fetchProviderPortfolios(Number(providerId)),
    ]);
  } catch (error) {
    const status = error?.response?.status ?? error?.status;
    if (status === 404 && previewProvider) {
      return { ...previewProvider, preview: true };
    }
    throw error;
  }
  return {
    id: profile.userSn,
    ownerUserId: profile.userSn,
    name: profile.displayName || `제공자 ${profile.userSn}`,
    profileImageUrl: profile.profileImageUrl,
    verified: true,
    rating: Number(profile.reviewAverageScore ?? 0),
    reviewCount: Number(profile.reviewCount ?? 0),
    completedCount: null,
    responseRate: null,
    categories: profile.categories ?? [],
    regions: profile.availableArea ? [profile.availableArea] : [],
    intro: profile.introduction || '등록된 소개가 없습니다.',
    reviews: [],
    portfolios: (portfolios ?? []).map((portfolio) => {
      const representative = portfolio.files?.find((file) => file.representative)
        ?? portfolio.files?.[0];
      return {
        id: portfolio.portfolioSn,
        title: portfolio.title,
        category: null,
        description: portfolio.content || '등록된 설명이 없습니다.',
        imageUrl: representative?.url ?? null,
        images: portfolio.files ?? [],
      };
    }),
    preview: false,
  };
};

/**
 * 실제 신고 저장 API는 담당자5 계약 수신 전이므로 성공으로 가장하지 않습니다.
 * 입력 경계만 동일하게 유지하고 명시적인 연결 대기 결과를 돌려줍니다.
 */
export const submitProviderReport = async () => ({
  saved: false,
  status: 'PENDING_INTEGRATION',
  message: '신고 저장 API 연결 대기 중입니다. 입력한 내용은 저장되지 않았습니다.',
});
