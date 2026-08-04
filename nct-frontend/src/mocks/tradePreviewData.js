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
    // 실제 상태 코드는 진행 중(TRDC0003)이며, 일정 유무로 판매자 행동을 구분한다.
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
  {
    // 구매자가 완료 확인을 요청해 판매자 확인을 기다리는 배송 거래다.
    tradeId: 1006,
    userRole: 'BUYER',
    productName: '수제 가죽 카드지갑',
    price: 39000,
    counterpartNickname: '가죽공방',
    counterpartRating: 4.8,
    createdAt: '2026-07-15',
    tradeStatus: 'CONFIRM_PENDING',
    tradeMethod: 'DELIVERY',
    deliveryAddress: '서울특별시 영등포구 여의대로 00',
    deliveryMessage: '경비실에 맡겨 주세요.',
    carrier: '우체국택배',
    trackingNumber: '6890123456789',
    autoCompleteAt: '2026-07-27',
  },
  {
    // 관리자 취소 승인이 끝난 판매자 거래 상태를 확인하는 샘플이다.
    tradeId: 1007,
    userRole: 'SELLER',
    productName: '캔버스 토트백',
    price: 52000,
    counterpartNickname: '주말산책',
    counterpartRating: 4.5,
    createdAt: '2026-07-12',
    tradeStatus: 'CANCELED',
    tradeMethod: 'DELIVERY',
    deliveryAddress: '서울특별시 성동구 뚝섬로 00',
    recipientName: '이구매',
    recipientPhone: '010-9876-5432',
    addressDetail: '202동 305호',
    deliveryRequest: '취소 승인으로 거래가 종료되었습니다.',
  },
  {
    // 분쟁·확인 대기 등으로 거래가 보류된 상태를 목록에서 검증하는 샘플이다.
    tradeId: 1008,
    userRole: 'BUYER',
    productName: '빈티지 필름 카메라',
    price: 168000,
    counterpartNickname: '필름기록소',
    counterpartRating: 4.7,
    createdAt: '2026-07-11',
    tradeStatus: 'ON_HOLD',
    tradeMethod: 'OFFLINE',
    meetingDate: '2026-07-19',
    meetingTime: '11:30',
    meetingPlace: '서울 종로구 안국역 2번 출구 앞',
    meetingMemo: '거래 문제 확인 중인 건입니다.',
  },
];

const tradeChatPreviewRooms = [
  {
    roomId: 'service-trade-chat-1',
    tradeId: 1,
    counterpartNickname: '정민 제공자',
    productName: '이사 전 청소 서비스를 요청합니다',
    roomStatus: 'ACTIVE',
    lastMessage: '내일 오후 2시에 방문드리겠습니다.',
    latestMessageAt: '14:10',
    unreadCount: 1,
    messages: [
      {
        messageId: 'service-message-1',
        senderType: 'COUNTERPART',
        content: '내일 오후 2시에 방문드리겠습니다.',
        sentAt: '14:10',
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

// 개발 환경에서도 탭·상태·검색 필터를 실제 목록 API처럼 검증할 수 있게 처리한다.
export const getTradePreviewList = (params = {}) => {
  const { keyword, role, status } = params;
  const normalizeSearchText = (value) => String(value ?? '')
    .toLowerCase()
    .replaceAll(/\s+/g, '');
  const normalizedKeyword = normalizeSearchText(keyword);

  return tradePreviewItems.filter((item) => {
    const matchesRole = !role || item.userRole === role;
    // 완료 확인 요청 직후(CONFIRM_PENDING)도 목록 필터에서는 대기 상태로 묶는다.
    const matchesStatus = !status
      || item.tradeStatus === status
      || (
        status === 'WAITING_CONFIRMATION'
        && item.tradeStatus === 'CONFIRM_PENDING'
      );
    const searchTarget = [
      item.tradeId,
      item.productName,
      item.counterpartNickname,
    ].join(' ');
    const matchesKeyword = !normalizedKeyword
      || normalizeSearchText(searchTarget).includes(normalizedKeyword);

    return matchesRole && matchesStatus && matchesKeyword;
  });
};

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

// 미리보기에서 저장한 결과도 다시 목록·상세를 열었을 때 유지한다.
// 브라우저를 새로 고치면 모듈 데이터가 초기화되므로 실제 서버 데이터에는 영향이 없다.
export const updateTradePreviewDetail = (tradeId, changes) => {
  const trade = tradePreviewItems.find(
    (item) => String(item.tradeId) === String(tradeId),
  );

  if (!trade) {
    throw new Error('등록되지 않은 개발용 거래 번호입니다.');
  }

  Object.assign(trade, changes);

  const isOfflineScheduleSaved = trade.tradeMethod === 'OFFLINE'
    && trade.meetingDate
    && trade.meetingTime
    && trade.meetingPlace;
  const isOfflineScheduleUpdated = isOfflineScheduleSaved
    && [
      'meetingDate',
      'meetingTime',
      'meetingPlace',
      'meetingAddress',
    ].some((field) => Object.hasOwn(changes, field));

  // 일정 저장 성공 시에만 직거래 채팅방을 만든다.
  // 백엔드 saveMyOfflineSchedule()도 같은 순서와 트랜잭션으로 처리한다.
  if (isOfflineScheduleSaved && !tradeChatPreviewRooms.some(
    (room) => String(room.tradeId) === String(tradeId),
  )) {
    tradeChatPreviewRooms.push({
      roomId: `trade-chat-${tradeId}`,
      tradeId: trade.tradeId,
      counterpartNickname: trade.counterpartNickname,
      productName: trade.productName,
      roomStatus: 'ACTIVE',
      lastMessage: '직거래 일정이 확정되었습니다.',
      latestMessageAt: '방금',
      unreadCount: 0,
      messages: [
        {
          messageId: `message-${tradeId}-1`,
          senderType: 'SYSTEM',
          content: `${trade.meetingDate} ${trade.meetingTime} · ${trade.meetingPlace} 일정이 확정되었습니다.`,
          sentAt: '방금',
          isRead: true,
        },
      ],
    });
  }

  if (isOfflineScheduleUpdated) {
    // 일정이 확정되면 미리보기 거래를 직거래 진행 상태로 전환한다.
    trade.tradeStatus = 'IN_PROGRESS';
  }

  if (trade.tradeStatus === 'COMPLETED') {
    const chatRoom = tradeChatPreviewRooms.find(
      (room) => String(room.tradeId) === String(tradeId),
    );

    // 실제 서버의 거래 완료 처리처럼 미리보기 채팅방도 읽기 전용으로 닫는다.
    if (chatRoom) {
      chatRoom.roomStatus = 'CLOSED';
    }
  }

  return { ...trade };
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
