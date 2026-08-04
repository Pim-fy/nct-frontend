// POL-COM-004에 따라 서버 저장 없이 제공하는 MVP 정적 이용가이드입니다.
// 문구가 정식 확정되면 이 데이터만 교체하고 화면 컴포넌트는 그대로 재사용합니다.
export const GUIDE_FLOWS = [
  {
    id: 'product-registration',
    order: 1,
    journey: 'auction',
    title: '상품 등록',
    summary: '상품 정보, 거래 방식, 경매 조건을 입력하고 등록 전 확인합니다.',
    flowTitle: '상품 등록 흐름',
    flowCopy: '상품 사진과 설명, 거래 방식, 경매 기간을 입력한 뒤 최종 확인을 거쳐 등록합니다.',
    preview: { type: 'product-register' },
  },
  {
    id: 'service-request',
    order: 2,
    journey: 'service',
    title: '서비스 요청',
    summary: '카테고리와 작업 내용을 작성하면 제공자가 견적을 제출합니다.',
    flowTitle: '서비스 요청 흐름',
    flowCopy: '서비스 요청을 공개하고 견적을 비교한 뒤 한 명의 제공자를 선택해 거래를 시작합니다.',
    preview: { type: 'service-request' },
  },
  {
    id: 'auction-bid',
    order: 3,
    journey: 'auction',
    title: '입찰·낙찰',
    summary: '입찰 시 포인트가 홀딩되고 낙찰 후 거래 상세로 이동합니다.',
    flowTitle: '입찰·낙찰 흐름',
    flowCopy: '입찰 가능 금액과 보유 포인트를 확인하고, 낙찰되면 생성된 거래에서 다음 절차를 진행합니다.',
    preview: { type: 'auction-detail' },
  },
  {
    id: 'trade-completion',
    order: 4,
    journey: 'common',
    title: '거래 완료',
    summary: '배송·직거래 또는 서비스 완료 확인 후 리뷰를 작성합니다.',
    flowTitle: '거래 완료 흐름',
    flowCopy: '거래 상태와 완료 기한을 확인하고, 양측 확인 또는 정책상 자동 완료 뒤 리뷰를 작성합니다.',
    preview: { type: 'trade-history' },
  },
  {
    id: 'point-settlement',
    order: 5,
    journey: 'common',
    title: '포인트·환전',
    summary: '충전, 홀딩, 반환, 환전 가능 포인트를 원장 기준으로 확인합니다.',
    flowTitle: '포인트·환전 흐름',
    flowCopy: '충전과 홀딩·반환 내역을 지갑에서 확인하고, 정산 가능한 포인트만 환전을 요청합니다.',
    preview: { type: 'point-wallet' },
  },
];

// 관리자는 아래 순서와 가상 예시 화면을 함께 확인합니다.
// 예시는 실제 회원·거래 데이터를 사용하지 않으며 이용 흐름을 설명하는 용도로만 제공합니다.
export const GUIDE_JOURNEYS = [
  {
    id: 'auction',
    eyebrow: '',
    title: '경매 이용 순서',
    description: '상품 등록부터 입찰·낙찰, 거래 완료, 포인트 확인까지 이어지는 흐름입니다.',
    flowIds: ['product-registration', 'auction-bid', 'trade-completion', 'point-settlement'],
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
    flowIds: ['service-request', 'trade-completion', 'point-settlement'],
    ctaLabel: '견적 요청하기',
    ctaRoute: '/service-requests/new',
    previewType: 'service-request',
    secondaryPreviewType: 'point-wallet',
  },
];
