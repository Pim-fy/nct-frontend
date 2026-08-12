// 담당자 7 · F-COM-014: 단계 제목·설명은 /api/guides에서 받고, 여기에는 화면 표현 메타데이터만 둡니다.
import { SERVICE_REQUEST_CREATE_PATH } from '@/routes/serviceRequestRoutes';

export const GUIDE_FLOW_PRESENTATION = {
  'product-register': { journey: 'auction', preview: { type: 'product-register' } },
  'service-request': { journey: 'service', preview: { type: 'service-request' } },
  'quote-selection': { journey: 'service', preview: { type: 'quote-selection' } },
  bid: { journey: 'auction', preview: { type: 'auction-detail' } },
  'trade-completion': { journey: 'common', preview: { type: 'trade-detail' } },
  'point-exchange': { journey: 'common', preview: { type: 'point-wallet' } },
};

// 예시는 실제 회원·거래 데이터를 사용하지 않으며 이용 흐름을 설명하는 용도로만 제공합니다.
export const GUIDE_JOURNEYS = [
  {
    id: 'auction',
    eyebrow: '',
    title: '경매 이용 순서',
    description: '상품 등록부터 입찰·낙찰, 거래 완료, 포인트 확인까지 이어지는 흐름입니다.',
    flowIds: ['product-register', 'bid', 'trade-completion', 'point-exchange'],
    ctaLabel: '경매 둘러보기',
    ctaRoute: '/auction',
    previewType: 'auction-detail',
    secondaryPreviewType: 'product-register',
  },
  {
    id: 'service',
    eyebrow: '',
    title: '서비스 요청 이용 순서',
    description: '견적 요청 작성부터 거래 완료와 정산 확인까지 이어지는 흐름입니다.',
    flowIds: ['service-request', 'quote-selection', 'trade-completion', 'point-exchange'],
    ctaLabel: '견적 요청하기',
    ctaRoute: SERVICE_REQUEST_CREATE_PATH,
    previewType: 'service-request',
    secondaryPreviewType: 'point-wallet',
  },
];
