const tradePreviewItems = [
  {
    tradeId: 1001,
    userRole: 'BUYER',
    productName: '빈티지 원목 수납장',
    price: 128000,
    counterpartNickname: '따뜻한집',
    counterpartRating: 4.8,
    createdAt: '2026-07-17',
    tradeStatus: 'DELIVERING',
    tradeMethod: 'DELIVERY',
    deliveryAddress: '서울특별시 마포구 월드컵로 00',
    deliveryMessage: '부재 시 문 앞에 놓아 주세요.',
    carrier: 'CJ대한통운',
    trackingNumber: '123456789012',
    autoCompleteAt: '2026-07-22',
  },
  {
    tradeId: 1002,
    userRole: 'SELLER',
    productName: '블루투스 턴테이블',
    price: 215000,
    counterpartNickname: '음악산책',
    counterpartRating: 4.9,
    createdAt: '2026-07-16',
    tradeStatus: 'IN_PROGRESS',
    tradeMethod: 'DELIVERY',
    deliveryAddress: '경기도 성남시 분당구 판교로 00',
    recipientName: '김구매',
    recipientPhone: '010-1234-5678',
    addressDetail: '101동 1001호',
    deliveryRequest: '배송 전 연락 부탁드립니다.',
    autoCompleteAt: '2026-07-21',
  },
  {
    tradeId: 1003,
    userRole: 'BUYER',
    productName: 'LP 레코드 3장 세트',
    price: 45000,
    counterpartNickname: '레코드방',
    counterpartRating: 4.7,
    createdAt: '2026-07-14',
    tradeStatus: 'COMPLETED',
    tradeMethod: 'OFFLINE',
    autoCompleteAt: '2026-07-14',
  },
  {
    tradeId: 1004,
    userRole: 'SELLER',
    productName: '미드센추리 스탠드 조명',
    price: 78000,
    counterpartNickname: '초록방',
    counterpartRating: 4.6,
    createdAt: '2026-07-17',
    tradeStatus: 'IN_PROGRESS',
    tradeMethod: 'OFFLINE',
    autoCompleteAt: '2026-07-23',
  },
  {
    tradeId: 1005,
    userRole: 'BUYER',
    productName: '원목 접이식 테이블',
    price: 96000,
    counterpartNickname: '느린생활',
    counterpartRating: 4.9,
    createdAt: '2026-07-17',
    tradeStatus: 'IN_PROGRESS',
    tradeMethod: 'OFFLINE',
    meetingDate: '2026-07-20',
    meetingTime: '14:00',
    meetingPlace: '서울 마포구 합정역 8번 출구 앞',
    meetingMemo: '도착하면 거래 채팅 대신 전화로 알려 주세요.',
    autoCompleteAt: '2026-07-25',
  },
];

const tradeChatPreviewRooms = [
  {
    roomId: 'trade-chat-1004',
    tradeId: 1004,
    counterpartNickname: '초록방',
    productName: '미드센추리 스탠드 조명',
    roomStatus: 'ACTIVE',
    lastMessage: '오후 2시쯤 도착할 예정입니다.',
    latestMessageAt: '14:08',
    unreadCount: 1,
    messages: [
      {
        messageId: 'message-1004-1',
        senderType: 'COUNTERPART',
        content: '안녕하세요. 거래 장소는 합정역 8번 출구 앞이 괜찮을까요?',
        sentAt: '13:52',
        isRead: true,
      },
      {
        messageId: 'message-1004-2',
        senderType: 'ME',
        content: '네, 괜찮습니다. 오후 2시에 뵐게요.',
        sentAt: '13:56',
        isRead: true,
      },
      {
        messageId: 'message-1004-3',
        senderType: 'COUNTERPART',
        content: '오후 2시쯤 도착할 예정입니다.',
        sentAt: '14:08',
        isRead: false,
      },
    ],
  },
  {
    roomId: 'trade-chat-1005',
    tradeId: 1005,
    counterpartNickname: '느린생활',
    productName: '원목 접이식 테이블',
    roomStatus: 'ACTIVE',
    lastMessage: '도착하면 알려 주세요.',
    latestMessageAt: '어제',
    unreadCount: 0,
    messages: [
      {
        messageId: 'message-1005-1',
        senderType: 'ME',
        content: '일정 확인했습니다. 도착하면 알려 주세요.',
        sentAt: '18:04',
        isRead: true,
      },
      {
        messageId: 'message-1005-2',
        senderType: 'COUNTERPART',
        content: '네, 출발 전에 한 번 더 연락드리겠습니다.',
        sentAt: '18:06',
        isRead: true,
      },
    ],
  },
];

// 개발 환경에서 목록·상세 화면을 검토할 수 있도록
// 거래 API 응답 형태를 제공한다.
export const getTradePreviewList = () => tradePreviewItems;

// 존재하지 않는 URL을 조용히 정상 처리하지 않도록
// 거래 번호를 함께 검증한다.
export const getTradePreviewDetail = (tradeId) => {
  const trade = tradePreviewItems.find(
    (item) => String(item.tradeId) === String(tradeId),
  );

  if (!trade) {
    throw new Error('등록되지 않은 개발용 거래 번호입니다.');
  }

  return trade;
};

// 채팅 목록은 메시지 본문을 제외한다.
// 목록 조회와 방 입장 조회를 분리한다.
export const getTradePreviewChatRooms = () => (
  tradeChatPreviewRooms.map((room) => ({
    roomId: room.roomId,
    tradeId: room.tradeId,
    counterpartNickname: room.counterpartNickname,
    productName: room.productName,
    roomStatus: room.roomStatus,
    lastMessage: room.lastMessage,
    latestMessageAt: room.latestMessageAt,
    unreadCount: room.unreadCount,
  }))
);

// 존재하지 않는 채팅방 번호는 조용히 빈 화면으로 처리하지 않는다.
export const getTradePreviewChatMessages = (roomId) => {
  const room = tradeChatPreviewRooms.find(
    (item) => item.roomId === roomId,
  );

  if (!room) {
    throw new Error('등록되지 않은 개발용 채팅방입니다.');
  }

  return {
    ...room,
    messages: [...room.messages],
  };
};
