import {
  PROVIDER_PREVIEW,
  SERVICE_REQUEST_PREVIEW,
} from '@pages/service/servicePreviewData';

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
  const provider = PROVIDER_PREVIEW.find((item) => item.id === Number(providerId));
  if (!provider) {
    const error = new Error('제공자 프로필을 찾을 수 없습니다.');
    error.status = 404;
    throw error;
  }
  return { ...provider, preview: true };
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
