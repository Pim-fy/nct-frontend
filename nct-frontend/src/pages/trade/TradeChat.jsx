import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getTradeChatMessages,
  getTradeChatRooms,
  sendTradeChatMessage,
} from '@api/tradeChatApi';
import {
  toTradeChatMessage,
  toTradeChatMessages,
  toTradeChatRooms,
  filterTradeChatRoomsForCurrentRole,
} from '@api/tradeChatAdapter';
import { getTradeChatWebSocketUrl } from '@api/tradeChatSocket';
import ReportModal from '@components/common/ReportModal';
import { Skeleton } from '@components/skeleton/BaseSkeleton';
import MyPageContentHeader from '@components/mypage/MyPageContentHeader';
import { useAuth } from '@hooks/useAuth';
import { getServiceTradeDetailPath } from '@/routes/myPageRoutes';
import '@assets/css/trade-chat.css';

const MAX_MESSAGE_LENGTH = 500;
const MESSAGE_REFRESH_INTERVAL = 5_000;
const WEBSOCKET_RECONNECT_DELAY = 3_000;
const HIDDEN_ROOM_STORAGE_KEY = 'nct-hidden-trade-chat-room-ids';

// 채팅 원본은 보존하고, 사용자가 목록에서 숨긴 완료 채팅방 번호만 브라우저에 저장한다.
const getHiddenRoomIds = () => {
  try {
    const savedRoomIds = JSON.parse(
      window.localStorage.getItem(HIDDEN_ROOM_STORAGE_KEY) ?? '[]',
    );

    return new Set(savedRoomIds.map((roomId) => String(roomId)));
  } catch {
    return new Set();
  }
};

const saveHiddenRoomIds = (roomIds) => {
  window.localStorage.setItem(
    HIDDEN_ROOM_STORAGE_KEY,
    JSON.stringify([...roomIds]),
  );
};

// 채팅방이 참조하는 거래 유형에 따라 상세 route를 분기한다.
const getTradeDetailPath = (room, preview) => {
  if (!room?.tradeId) return null;

  if (room.tradeTypeCode === 'TRDC0002') {
    return preview ? null : getServiceTradeDetailPath(room.tradeId);
  }

  return preview
    ? `/trades/preview/${room.tradeId}`
    : `/trades/${room.tradeId}`;
};

const TradeChat = ({
  embedded = false,
  preview = false,
  tradeId: selectedTradeId,
  showRoomList = !embedded,
}) => {
  const { isProvider } = useAuth();
  const { tradeId: routeTradeId } = useParams();
  const tradeId = selectedTradeId ?? routeTradeId;
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState('');
  // 거래 상세에서 진입한 모바일 채팅은 대화부터, 마이페이지 채팅은 목록부터 연다.
  const [isMobileConversationOpen, setIsMobileConversationOpen] = useState(() => Boolean(tradeId));
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [error, setError] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState('IDLE');
  const [reconnectSignal, setReconnectSignal] = useState(0);
  const messageEndRef = useRef(null);
  const socketRef = useRef(null);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.roomId === activeRoomId) ?? null,
    [activeRoomId, rooms],
  );
  const activeRoomCount = rooms.filter(
    (room) => room.roomStatus === 'ACTIVE',
  ).length;
  const completedRoomCount = rooms.length - activeRoomCount;
  const isActiveRoomClosed = activeRoom?.roomStatus === 'CLOSED';
  const activeTradeDetailPath = getTradeDetailPath(activeRoom, preview);
  const subscribedRoomIds = useMemo(
    () => rooms
      .filter((room) => room.roomStatus === 'ACTIVE')
      .map((room) => room.roomId),
    [rooms],
  );
  const subscribedRoomIdsKey = subscribedRoomIds.join(',');
  const filteredRooms = useMemo(() => {
    if (roomFilter === 'ACTIVE') {
      return rooms.filter((room) => room.roomStatus === 'ACTIVE');
    }

    if (roomFilter === 'CLOSED') {
      return rooms.filter((room) => room.roomStatus === 'CLOSED');
    }

    return rooms;
  }, [roomFilter, rooms]);

  // 상세에서 연 채팅만 자동으로 열고, 마이페이지 채팅 메뉴에서는 사용자가 방을 직접 선택한다.
  const loadChatRooms = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // 마이페이지의 넓은 화면에서는 목록과 대화를 함께 보여 주기 위해 전체 방을 조회한다.
      const roomParams = showRoomList ? {} : { tradeId };
      const roomResponse = await getTradeChatRooms(roomParams, { preview });
      const hiddenRoomIds = getHiddenRoomIds();
      const loadedRooms = filterTradeChatRoomsForCurrentRole(
        toTradeChatRooms(roomResponse).filter(
          (room) => !hiddenRoomIds.has(room.roomId),
        ),
        isProvider,
      );
      const selectedRoom = loadedRooms.find(
        (room) => String(room.tradeId) === String(tradeId),
      );
      const initialRoom = selectedRoom ?? (showRoomList ? null : loadedRooms[0] ?? null);

      if (!initialRoom) {
        setRooms(loadedRooms);
        setActiveRoomId('');
        setMessages([]);
        return;
      }

      const messageResponse = await getTradeChatMessages(
        initialRoom.roomId,
        { preview },
      );
      const initialMessages = toTradeChatMessages(messageResponse);

      setRooms(loadedRooms.map((room) => {
        if (room.roomId !== initialRoom.roomId) {
          return room;
        }

        return {
          ...room,
          unreadCount: 0,
        };
      }));
      setActiveRoomId(initialRoom.roomId);
      setMessages(initialMessages);
    } catch {
      setError(
        '채팅방 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [isProvider, preview, showRoomList, tradeId]);

  // 방을 선택하면 서버가 상대방 메시지를 읽음 처리한 최신 목록을 다시 받아 온다.
  const selectChatRoom = useCallback(async (roomId) => {
    try {
      const messageResponse = await getTradeChatMessages(roomId, { preview });
      const loadedMessages = toTradeChatMessages(messageResponse);

      setActiveRoomId(roomId);
      setIsMobileConversationOpen(true);
      setMessages(loadedMessages);
      setRooms((currentRooms) => currentRooms.map((currentRoom) => {
        if (currentRoom.roomId !== roomId) {
          return currentRoom;
        }

        return {
          ...currentRoom,
          unreadCount: 0,
        };
      }));
    } catch {
      setError(
        '채팅 메시지를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    }
  }, [preview]);

  // 필터 변경은 목록만 바꾸며, 사용자가 누르기 전까지 다른 방을 자동 선택하지 않는다.
  const changeRoomFilter = (nextFilter) => {
    setRoomFilter(nextFilter);

    const nextRooms = rooms.filter((room) => {
      if (nextFilter === 'ACTIVE') {
        return room.roomStatus === 'ACTIVE';
      }

      if (nextFilter === 'CLOSED') {
        return room.roomStatus === 'CLOSED';
      }

      return true;
    });

    if (!activeRoomId || nextRooms.some((room) => room.roomId === activeRoomId)) {
      return;
    }

    setActiveRoomId('');
    setMessages([]);
    setMessageInput('');
  };

  // 완료된 거래의 대화는 서버에 남기고, 현재 사용자의 목록에서만 숨긴다.
  const hideCompletedChatRoom = async (roomId) => {
    const room = rooms.find((currentRoom) => currentRoom.roomId === roomId);

    if (!room || room.roomStatus !== 'CLOSED') {
      return;
    }

    const isConfirmed = window.confirm(
      '이 완료된 채팅을 내 목록에서 삭제할까요?\n상대방 목록과 서버의 대화 기록은 유지됩니다.',
    );

    if (!isConfirmed) {
      return;
    }

    const hiddenRoomIds = getHiddenRoomIds();
    hiddenRoomIds.add(roomId);
    saveHiddenRoomIds(hiddenRoomIds);

    const remainingRooms = rooms.filter(
      (currentRoom) => currentRoom.roomId !== roomId,
    );
    setRooms(remainingRooms);

    if (activeRoomId !== roomId) {
      return;
    }

    setActiveRoomId('');
    setMessages([]);
    setMessageInput('');
  };

  useEffect(() => {
    const requestTimer = window.setTimeout(loadChatRooms, 0);

    return () => window.clearTimeout(requestTimer);
  }, [loadChatRooms]);

  // 목록에 있는 모든 진행 중 방을 함께 구독해, 열지 않은 방의 미확인 수도 즉시 갱신한다.
  // 미리보기는 서버 연결 없이 목업 데이터를 쓰므로 기존 화면 동작만 유지한다.
  useEffect(() => {
    if (preview || subscribedRoomIdsKey === '') {
      const idleStatusTimer = window.setTimeout(() => {
        setRealtimeStatus('IDLE');
      }, 0);

      return () => window.clearTimeout(idleStatusTimer);
    }

    let isDisposed = false;
    let reconnectTimer;
    const socket = new WebSocket(getTradeChatWebSocketUrl());
    socketRef.current = socket;
    const connectingStatusTimer = window.setTimeout(() => {
      if (!isDisposed) {
        setRealtimeStatus('CONNECTING');
      }
    }, 0);

    socket.onopen = () => {
      if (isDisposed) {
        return;
      }

      window.clearTimeout(connectingStatusTimer);
      setRealtimeStatus('CONNECTED');
      subscribedRoomIdsKey.split(',').forEach((roomId) => {
        socket.send(JSON.stringify({
          type: 'SUBSCRIBE',
          roomId,
        }));
      });
    };

    socket.onmessage = (event) => {
      try {
        const socketEvent = JSON.parse(event.data);

        if (socketEvent.type === 'CHAT_MESSAGE' && socketEvent.chatMessage) {
          const newMessage = toTradeChatMessage(socketEvent.chatMessage);
          const isSelectedRoom = String(socketEvent.roomId) === String(activeRoomId);

          if (isSelectedRoom) {
            setMessages((currentMessages) => {
              const hasSameMessage = currentMessages.some(
                (message) => message.messageId === newMessage.messageId,
              );

              return hasSameMessage
                ? currentMessages
                : [...currentMessages, newMessage];
            });
          }

          setRooms((currentRooms) => currentRooms.map((room) => {
            if (String(room.roomId) !== String(socketEvent.roomId)) {
              return room;
            }

            return {
                ...room,
                lastMessage: newMessage.content,
                latestMessageAt: newMessage.sentAt,
                unreadCount: isSelectedRoom || newMessage.senderType === 'ME'
                  ? room.unreadCount
                  : room.unreadCount + 1,
              };
          }));
        }

        if (socketEvent.type === 'ERROR') {
          setError(socketEvent.message ?? '채팅 요청을 처리하지 못했습니다.');
        }
      } catch {
        setError('실시간 채팅 메시지를 처리하지 못했습니다.');
      }
    };

    socket.onclose = () => {
      if (isDisposed) {
        return;
      }

      setRealtimeStatus('DISCONNECTED');
      reconnectTimer = window.setTimeout(() => {
        setReconnectSignal((current) => current + 1);
      }, WEBSOCKET_RECONNECT_DELAY);
    };

    socket.onerror = () => {
      // onclose에서 재연결과 REST 폴백을 함께 처리한다.
    };

    return () => {
      isDisposed = true;
      window.clearTimeout(reconnectTimer);
      window.clearTimeout(connectingStatusTimer);
      socket.close();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [activeRoomId, preview, reconnectSignal, subscribedRoomIdsKey]);

  // WebSocket 연결이 끊긴 경우에만 기존 REST 조회로 임시 수신을 보완한다.
  useEffect(() => {
    if (activeRoomId === ''
      || preview
      || isActiveRoomClosed
      || realtimeStatus !== 'DISCONNECTED') {
      return undefined;
    }

    const refreshTimer = window.setInterval(async () => {
      try {
        const response = await getTradeChatMessages(activeRoomId, { preview });
        const refreshedMessages = toTradeChatMessages(response);

        setMessages((currentMessages) => {
          const isSameMessages = currentMessages.length === refreshedMessages.length
            && currentMessages.every((message, index) => (
              message.messageId === refreshedMessages[index]?.messageId
              && message.isRead === refreshedMessages[index]?.isRead
            ));

          return isSameMessages ? currentMessages : refreshedMessages;
        });
      } catch {
        // 일시적인 조회 실패는 현재 대화를 유지하고 다음 주기에 재시도한다.
      }
    }, MESSAGE_REFRESH_INTERVAL);

    return () => window.clearInterval(refreshTimer);
  }, [activeRoomId, isActiveRoomClosed, preview, realtimeStatus]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [messages]);

  // WebSocket이 연결돼 있으면 서버 브로드캐스트 이벤트로만 화면을 갱신한다.
  // 연결 재시도 중에는 기존 REST API를 임시 경로로 사용해 메시지 유실을 막는다.
  const sendMessage = async (event) => {
    event.preventDefault();

    const content = messageInput.trim();

    if (!content || !activeRoom) {
      return;
    }

    if (activeRoom.roomStatus === 'CLOSED') {
      setError('완료된 거래의 채팅방은 기존 대화만 열람할 수 있습니다.');
      return;
    }

    if (!window.crypto?.randomUUID) {
      setError('메시지 요청을 준비하지 못했습니다. 다시 시도해 주세요.');
      return;
    }

    setError('');

    const payload = {
      content,
      detectionKey: window.crypto.randomUUID(),
    };
    const socket = socketRef.current;

    if (!preview && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'SEND_MESSAGE',
        roomId: activeRoom.roomId,
        ...payload,
      }));
      setMessageInput('');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await sendTradeChatMessage(
        activeRoom.roomId,
        payload,
        { preview },
      );
      const newMessage = toTradeChatMessage(response);

      setMessages((currentMessages) => [...currentMessages, newMessage]);
      setRooms((currentRooms) => currentRooms.map((room) => {
        if (room.roomId !== activeRoom.roomId) {
          return room;
        }

        return {
          ...room,
          lastMessage: newMessage.content,
          latestMessageAt: newMessage.sentAt,
        };
      }));
      setMessageInput('');
    } catch {
      setError('메시지 전송에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 마이페이지의 목록 복귀는 같은 2열 화면에서 우측 선택만 해제한다.
  const clearSelectedChatRoom = () => {
    setActiveRoomId('');
    setMessages([]);
    setMessageInput('');
    setIsMobileConversationOpen(false);
  };

  return (
    <div
      className={embedded
        ? 'trade-chat-page trade-chat-page--embedded'
        : 'trade-chat-page'}
    >
      <main className="container">
        {embedded ? (
          <MyPageContentHeader title="채팅" />
        ) : (
          <header className="trade-chat-page__header">
            <div>
              <h1>거래 채팅</h1>
              <p>거래 당사자만 이용할 수 있는 1:1 채팅입니다.</p>
            </div>
          </header>
        )}

        {isLoading && (
          <div className="trade-chat-layout trade-chat-layout--with-room-list">
            <aside className="trade-chat-card trade-chat-rooms">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton height={56} key={index} style={{ marginBottom: 8 }} />
              ))}
            </aside>
            <section className="trade-chat-card">
              <Skeleton count={4} height={40} style={{ marginBottom: 12, maxWidth: '70%' }} />
            </section>
          </div>
        )}

        {!isLoading && error && (
          <section className="trade-chat-card trade-chat-page__state" role="alert">
            <p>{error}</p>
            <button className="btn btn-outline" type="button" onClick={loadChatRooms}>
              다시 시도
            </button>
          </section>
        )}

        {!isLoading && !error && (
          <div
            className={showRoomList
              ? `trade-chat-layout trade-chat-layout--with-room-list${isMobileConversationOpen ? ' trade-chat-layout--mobile-conversation' : ''}`
              : 'trade-chat-layout trade-chat-layout--conversation-only'}
          >
            {showRoomList && (
              <aside
                className="trade-chat-card trade-chat-rooms"
                aria-label="채팅방 목록"
              >
                <div className="trade-chat-rooms__header">
                  <h2>채팅방</h2>
                  <div className="trade-chat-rooms__counts">
                    <button
                      aria-pressed={roomFilter === 'ALL'}
                      className={roomFilter === 'ALL'
                        ? 'trade-chat-room-filter trade-chat-room-filter--active'
                        : 'trade-chat-room-filter'}
                      type="button"
                      onClick={() => changeRoomFilter('ALL')}
                    >
                      전체 {rooms.length}
                    </button>
                    <button
                      aria-pressed={roomFilter === 'ACTIVE'}
                      className={roomFilter === 'ACTIVE'
                        ? 'trade-chat-room-filter trade-chat-room-filter--active'
                        : 'trade-chat-room-filter'}
                      type="button"
                      onClick={() => changeRoomFilter('ACTIVE')}
                    >
                      진행중 {activeRoomCount}
                    </button>
                    <button
                      aria-pressed={roomFilter === 'CLOSED'}
                      className={roomFilter === 'CLOSED'
                        ? 'trade-chat-room-filter trade-chat-room-filter--completed'
                        : 'trade-chat-room-filter trade-chat-room-filter--closed'}
                      type="button"
                      onClick={() => changeRoomFilter('CLOSED')}
                    >
                      완료 {completedRoomCount}
                    </button>
                  </div>
                </div>
                <div className="trade-chat-rooms__list">
                  {filteredRooms.map((room) => {
                    const isActive = room.roomId === activeRoomId;
                    const isCompleted = room.roomStatus === 'CLOSED';

                    return (
                      <div
                        className={isCompleted
                          ? 'trade-chat-room-wrap trade-chat-room-wrap--completed'
                          : 'trade-chat-room-wrap'}
                        key={room.roomId}
                      >
                        <button
                          className={isActive
                            ? 'trade-chat-room trade-chat-room--active'
                            : 'trade-chat-room'}
                          type="button"
                          onClick={() => selectChatRoom(room.roomId)}
                        >
                          <span className="trade-chat-room__topline">
                            <strong>{room.counterpartNickname}</strong>
                            <time>{room.latestMessageAt}</time>
                          </span>
                          <span className="trade-chat-room__product">
                            {room.productName}
                          </span>
                          <span className="trade-chat-room__preview">
                            {room.lastMessage}
                          </span>
                          <span
                            className={isCompleted
                              ? 'trade-chat-room__closed'
                              : 'trade-chat-room__available'}
                          >
                            {isCompleted ? '채팅 불가' : '대화 가능'}
                          </span>
                          {room.unreadCount > 0 && (
                            <span className="trade-chat-room__unread">
                              새 메시지 {room.unreadCount}개
                            </span>
                          )}
                        </button>
                        {isCompleted && (
                          <button
                            className="trade-chat-room__delete"
                            type="button"
                            onClick={() => hideCompletedChatRoom(room.roomId)}
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {rooms.length === 0 && (
                    <p className="trade-chat-rooms__empty">
                      표시할 거래 채팅이 없습니다.
                    </p>
                  )}
                  {rooms.length > 0 && filteredRooms.length === 0 && (
                    <p className="trade-chat-rooms__empty">
                      {roomFilter === 'ACTIVE'
                        ? '진행 중인 거래 채팅이 없습니다.'
                        : '완료된 거래 채팅이 없습니다.'}
                    </p>
                  )}
                </div>
              </aside>
            )}

            <section className="trade-chat-card trade-chat-conversation">
              {activeRoom ? (
                <>
                  <header className="trade-chat-conversation__header">
                    <div>
                      <h2>{activeRoom.counterpartNickname}</h2>
                      <p>{activeRoom.productName}</p>
                    </div>
                    <div className="trade-chat-conversation__actions">
                      <span
                        className={activeRoom.roomStatus === 'ACTIVE'
                          ? 'trade-chat-status'
                          : 'trade-chat-status trade-chat-status--closed'}
                      >
                        {activeRoom.roomStatus === 'ACTIVE' ? '대화 가능' : '채팅 불가'}
                      </span>
                      {activeTradeDetailPath && (
                        <Link
                          className="btn btn-ghost trade-chat-conversation__trade-detail"
                          to={activeTradeDetailPath}
                        >
                          거래 상세
                        </Link>
                      )}
                      <button
                        className="btn btn-ghost trade-chat-conversation__report"
                        type="button"
                        onClick={() => setIsReportOpen(true)}
                      >
                        신고하기
                      </button>
                      {showRoomList && (
                        <button
                          className="btn btn-ghost trade-chat-conversation__close trade-chat-conversation__close--desktop"
                          type="button"
                          onClick={clearSelectedChatRoom}
                        >
                          닫기
                        </button>
                      )}
                      {showRoomList && (
                        <button
                          className="btn btn-ghost trade-chat-conversation__close trade-chat-conversation__close--mobile"
                          type="button"
                          aria-label="채팅 목록으로"
                          onClick={clearSelectedChatRoom}
                        >
                          목록
                        </button>
                      )}
                    </div>
                  </header>

                  <div className="trade-chat-notice">
                    {activeRoom.roomStatus === 'CLOSED'
                      ? '거래가 완료되어 채팅은 불가능합니다. 기존 대화만 확인할 수 있습니다.'
                      : '연락처와 계좌번호 등 민감정보는 서버에서 자동 마스킹됩니다.'}
                  </div>

                  <div className="trade-chat-messages" aria-live="polite">
                    {messages.map((message) => {
                      const isMine = message.senderType === 'ME';

                      return (
                        <div
                          className={isMine
                            ? 'trade-chat-message trade-chat-message--mine'
                            : 'trade-chat-message'}
                          key={message.messageId}
                        >
                          <p>{message.content}</p>
                          <time>{message.sentAt}</time>
                        </div>
                      );
                    })}
                    <div ref={messageEndRef} />
                  </div>

                  <form className="trade-chat-composer" onSubmit={sendMessage}>
                    <label className="sr-only" htmlFor="trade-chat-message">
                      메시지 입력
                    </label>
                    <textarea
                      id="trade-chat-message"
                      maxLength={MAX_MESSAGE_LENGTH}
                      value={messageInput}
                      onChange={(event) => setMessageInput(event.target.value)}
                      placeholder={isActiveRoomClosed
                        ? '완료된 거래의 채팅 기록입니다.'
                        : '메시지를 입력하세요.'}
                      disabled={isSubmitting || isActiveRoomClosed}
                    />
                    <div className="trade-chat-composer__footer">
                      <span>{messageInput.length}/{MAX_MESSAGE_LENGTH}</span>
                      {!isActiveRoomClosed && (
                        <button
                          className="btn btn-primary"
                          type="submit"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? '전송 중...' : '전송'}
                        </button>
                      )}
                    </div>
                  </form>
                </>
              ) : (
                <div className="trade-chat-conversation__empty">
                  {rooms.length > 0
                    ? '좌측 목록에서 채팅방을 선택해 주세요.'
                    : '선택할 수 있는 거래 채팅방이 없습니다.'}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      {activeRoom && (
        <ReportModal
          open={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          targetName={activeRoom.counterpartNickname}
          targetType="trade"
          referenceSn={activeRoom.tradeId}
          reportedUserSn={activeRoom.counterpartUserId}
          contextLabel={`채팅 상대: ${activeRoom.counterpartNickname}`}
        />
      )}
    </div>
  );
};

export default TradeChat;
