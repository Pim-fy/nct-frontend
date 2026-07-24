// 상품(PRODUCT) 관련 공통 상수 — ProductRegisterPage / MyProductListPage / ProductDetailSellerPage 공유
// F-AUC-005 거래 상태(TRDC) 라벨·배지 — 정민재(4) 연계
export const TRADE_STATUS_LABEL = {
  TRDC0003: '거래 진행중',
  TRDC0004: '배송중',
  TRDC0005: '구매자 확인 대기',
  TRDC0006: '거래 완료',
  TRDC0007: '거래 보류/분쟁',
  TRDC0008: '거래 취소',
};


export const TRADE_LABEL = {
  TRDC0009: '배송만',
  TRDC0010: '직거래만',
  TRDC0020: '둘 다 가능',
};

export const STATUS_LABEL = {
  PRDC0001: '임시저장',
  PRDC0002: '경매 진행중',
  PRDC0003: '종료',
  PRDC0004: '삭제',
};

export const STATUS_BADGE = {
  PRDC0001: 'badge-gray',
  PRDC0002: 'badge-success',
  PRDC0003: 'badge-gray',
  PRDC0004: 'badge-danger',
};
