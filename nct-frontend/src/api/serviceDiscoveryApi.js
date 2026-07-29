import {
  PROVIDER_PREVIEW,
  SERVICE_REQUEST_PREVIEW,
} from '@pages/service/servicePreviewData';
import api from '@api/axios';
import {
  fetchPublicPortfolios as fetchProviderPortfolios,
  fetchPublicProviderProfile as fetchProviderProfile,
} from '@api/providerProfileApi';

/**
 * 담당자 7 · F-COM-002: 제공자 검색은 공개 서비스 탐색 API를 사용합니다.
 * 서비스 요청 검색은 소유 도메인의 공개 검색 계약이 들어올 때 이 파일에서 교체합니다.
 */

const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

const isWithinBudget = (itemMin, itemMax, requestedMin, requestedMax) => {
  if (requestedMin && itemMax < requestedMin) return false;
  if (requestedMax && itemMin > requestedMax) return false;
  return true;
};

const sortRequests = (items, sort) => [...items].sort((left, right) => {
  if (sort === 'budget-high') return right.budgetMax - left.budgetMax;
  if (sort === 'quotes-low') return left.quoteCount - right.quoteCount;
  if (sort === 'latest') return right.createdOrder - left.createdOrder;
  return left.deadlineOrder - right.deadlineOrder;
});

const normalizeProvider = (provider) => ({
  id: provider.providerUserSn,
  ownerUserId: provider.providerUserSn,
  name: provider.providerName || `제공자 ${provider.providerUserSn}`,
  verified: true,
  rating: Number(provider.reviewAverageScore ?? 0),
  reviewCount: Number(provider.reviewCount ?? 0),
  completedCount: null,
  responseRate: null,
  categories: (provider.categories ?? [])
    .map((category) => category.categoryName)
    .filter(Boolean),
  regions: provider.availableArea ? [provider.availableArea] : [],
  intro: provider.introduction || '등록된 소개가 없습니다.',
});

const fetchProviders = async ({
  keyword,
  categorySn,
  region,
  sort,
  page,
}) => {
  const response = await api.get('/service-discovery/providers', {
    params: {
      keyword: keyword.trim() || undefined,
      categorySn: categorySn || undefined,
      region: region || undefined,
      sort: sort === 'reviews' ? 'reviews' : 'rating',
      page,
      size: 12,
    },
  });
  const pageResponse = response.data.data;

  return {
    items: (pageResponse.content ?? []).map(normalizeProvider),
    total: Number(pageResponse.totalCount ?? 0),
    page: Number(pageResponse.page ?? 0),
    size: Number(pageResponse.size ?? 12),
    totalPages: Math.ceil(
      Number(pageResponse.totalCount ?? 0) / Number(pageResponse.size ?? 12),
    ),
    hasNext: Boolean(pageResponse.hasNext),
  };
};

export const fetchServiceDiscovery = async ({
  view = 'requests',
  keyword = '',
  category = '',
  categorySn = null,
  region = '',
  minBudget = 0,
  maxBudget = 0,
  sort = '',
  page = 0,
}) => {
  if (view === 'providers') {
    const providers = await fetchProviders({
      keyword,
      categorySn,
      region,
      sort,
      page,
    });

    return {
      ...providers,
      counts: {
        providers: providers.total,
        requests: null,
      },
      preview: false,
      view,
    };
  }

  const normalizedKeyword = normalizeText(keyword);
  const requests = SERVICE_REQUEST_PREVIEW.filter((request) => {
    const searchable = normalizeText([
      request.title,
      request.summary,
      request.category,
      request.region,
    ].join(' '));
    return (!normalizedKeyword || searchable.includes(normalizedKeyword))
      && (!category || request.category === category)
      && (!region || request.region === region)
      && isWithinBudget(request.budgetMin, request.budgetMax, minBudget, maxBudget);
  });

  const counts = { providers: null, requests: requests.length };

  return {
    items: sortRequests(requests, sort),
    total: requests.length,
    counts,
    preview: true,
    view: 'requests',
  };
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
