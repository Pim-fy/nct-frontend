import {
  PROVIDER_PREVIEW,
  SERVICE_REQUEST_PREVIEW,
} from '@pages/service/servicePreviewData';
import {
  fetchPublicPortfolios as fetchProviderPortfolios,
  fetchPublicProviderProfile as fetchProviderProfile,
} from '@api/providerProfileApi';

/**
 * 담당자1·2의 실제 서비스 요청/제공자 API가 오기 전 사용하는 교체 지점입니다.
 * 페이지와 UI 컴포넌트는 이 파일만 호출하므로, 실제 연동 시 함수 내부를 Axios 호출로 바꾸면 됩니다.
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

const sortProviders = (items, sort) => [...items].sort((left, right) => {
  if (sort === 'reviews') return right.reviewCount - left.reviewCount;
  if (sort === 'completed') return right.completedCount - left.completedCount;
  return right.rating - left.rating;
});

export const fetchServiceDiscovery = async ({
  view = 'requests',
  keyword = '',
  category = '',
  region = '',
  minBudget = 0,
  maxBudget = 0,
  sort = '',
}) => {
  const normalizedKeyword = normalizeText(keyword);
  const providers = PROVIDER_PREVIEW.filter((provider) => {
    const searchable = normalizeText([
      provider.name,
      provider.intro,
      ...provider.categories,
      ...provider.regions,
    ].join(' '));
    return (!normalizedKeyword || searchable.includes(normalizedKeyword))
      && (!category || provider.categories.includes(category))
      && (!region || provider.regions.includes(region))
      && isWithinBudget(provider.minBudget, provider.minBudget, minBudget, maxBudget);
  });

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

  const counts = { providers: providers.length, requests: requests.length };

  if (view === 'providers') {
    return {
      items: sortProviders(providers, sort),
      total: providers.length,
      counts,
      preview: true,
      view,
    };
  }

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
