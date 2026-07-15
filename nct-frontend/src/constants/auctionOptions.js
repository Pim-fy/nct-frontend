export const AUCTION_CATEGORIES = [
  '전자기기',
  '생활·가구',
  '패션·의류',
  '도서·음반',
  '취미',
  '스포츠·레저',
  '유아·아동',
  '뷰티·미용',
  '식품',
  '기타',
];

export const AUCTION_STATUSES = [
  { value: 'active', label: '진행중' },
  { value: 'endingSoon', label: '종료임박' },
  { value: 'new', label: '방금시작됨' },
];

export const TRADE_METHODS = [
  { value: 'all', label: '전체' },
  { value: 'delivery', label: '배송' },
  { value: 'direct', label: '직거래' },
];

export const SORT_OPTIONS = [
  { value: 'deadline', label: '마감임박순' },
  { value: 'priceAsc', label: '최저가순' },
  { value: 'bidsDesc', label: '입찰수많은순' },
  { value: 'latest', label: '최신순' },
];
