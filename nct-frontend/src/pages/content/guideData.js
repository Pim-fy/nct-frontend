// POL-COM-004에 따라 서버 저장 없이 제공하는 MVP 정적 이용가이드입니다.
// 문구가 정식 확정되면 이 데이터만 교체하고 카드·모달 컴포넌트는 그대로 재사용합니다.
export const GUIDE_FLOWS = [
  {
    id: 'product-registration',
    order: 1,
    journey: 'auction',
    title: '상품 등록',
    summary: '상품 정보, 거래 방식, 경매 조건을 입력하고 등록 전 확인합니다.',
    flowTitle: '상품 등록 흐름',
    flowCopy: '상품 사진과 설명, 거래 방식, 경매 기간을 입력한 뒤 최종 확인을 거쳐 등록합니다.',
    targetLabel: '상품 등록 화면',
    targetRoute: '/product/register',
    targetOwner: '담당자 2 상품 등록 화면 연결',
  },
  {
    id: 'service-request',
    order: 2,
    journey: 'service',
    title: '서비스 요청',
    summary: '카테고리와 작업 내용을 작성하면 제공자가 견적을 제출합니다.',
    flowTitle: '서비스 요청 흐름',
    flowCopy: '서비스 요청을 공개하고 견적을 비교한 뒤 한 명의 제공자를 선택해 거래를 시작합니다.',
    targetLabel: '서비스 탐색 화면',
    targetRoute: '/service',
    targetOwner: '담당자 7 임시 화면',
  },
  {
    id: 'auction-bid',
    order: 3,
    journey: 'auction',
    title: '입찰·낙찰',
    summary: '입찰 시 포인트가 홀딩되고 낙찰 후 거래 상세로 이동합니다.',
    flowTitle: '입찰·낙찰 흐름',
    flowCopy: '입찰 가능 금액과 보유 포인트를 확인하고, 낙찰되면 생성된 거래에서 다음 절차를 진행합니다.',
    targetLabel: '경매 상세 화면',
    targetRoute: null,
    targetOwner: '담당자 5 연결 대기',
  },
  {
    id: 'trade-completion',
    order: 4,
    journey: 'common',
    title: '거래 완료',
    summary: '배송·직거래 또는 서비스 완료 확인 후 리뷰를 작성합니다.',
    flowTitle: '거래 완료 흐름',
    flowCopy: '거래 상태와 완료 기한을 확인하고, 양측 확인 또는 정책상 자동 완료 뒤 리뷰를 작성합니다.',
    targetLabel: '거래 상세 화면',
    targetRoute: null,
    targetOwner: '담당자 4 연결 대기',
  },
  {
    id: 'point-settlement',
    order: 5,
    journey: 'common',
    title: '포인트·환전',
    summary: '충전, 홀딩, 반환, 환전 가능 포인트를 원장 기준으로 확인합니다.',
    flowTitle: '포인트·환전 흐름',
    flowCopy: '충전과 홀딩·반환 내역을 지갑에서 확인하고, 정산 가능한 포인트만 환전을 요청합니다.',
    targetLabel: '포인트 지갑 화면',
    targetRoute: '/user/mypage?section=wallet',
    targetOwner: '담당자 6 포인트 지갑 화면 연결',
  },
];

// 관리자는 아래 순서를 보며 경매·서비스 이용 흐름과 실제 담당 화면의 연결 상태를 확인합니다.
// 다른 담당자의 route가 확정되면 GUIDE_FLOWS의 targetRoute만 채우면 됩니다.
export const GUIDE_JOURNEYS = [
  {
    id: 'auction',
    title: '경매 이용 순서',
    description: '상품 등록부터 입찰·낙찰, 거래 완료, 포인트 확인까지 이어지는 흐름입니다.',
    flowIds: ['product-registration', 'auction-bid', 'trade-completion', 'point-settlement'],
  },
  {
    id: 'service',
    title: '서비스 요청 이용 순서',
    description: '서비스 탐색·요청부터 거래 완료와 정산 확인까지 이어지는 흐름입니다.',
    flowIds: ['service-request', 'trade-completion', 'point-settlement'],
  },
];
