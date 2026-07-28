import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  getTradeChatMessages,
  getTradeChatRooms,
  sendTradeChatMessage,
} from '@api/tradeChatApi';
import {
  toTradeChatMessage,
  toTradeChatMessages,
  toTradeChatRooms,
} from '@api/tradeChatAdapter';
import { getTradeChatWebSocketUrl } from '@api/tradeChatSocket';
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

const TradeChat = ({
  embedded = false,
  onBack,
  preview = false,
  tradeId: selectedTradeId,
  showRoomList = !embedded,
}) => {
  const { tradeId: routeTradeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const tradeId = selectedTradeId ?? routeTradeId;
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const filteredRooms = useMemo(() => {
    if (roomFilter === 'ACTIVE') {
      return rooms.filter((room) => room.roomStatus === 'ACTIVE');
    }

    if (roomFilter === 'CLOSED') {
      return rooms.filter((room) => room.roomStatus === 'CLOSED');
    }

    return rooms;
  }, [roomFilter, rooms]);

  // 독립 상세 경로에서도 브라우저 이전 페이지가 아닌 마이페이지 채팅 목록으로 복귀한다.
  const returnToChatList = () => {
    if (onBack) {
      onBack();
      return;
    }

    const isPreviewPath = preview || location.pathname.startsWith('/trades/preview');
    const chatListPath = isPreviewPath
      ? '/user/mypage/preview/trades?verify=1&section=chat'
      : '/user/mypage?section=chat';

    navigate(chatListPath);
  };

  // 거래 번호에 연결된 실제 채팅방과 메시지를 함께 조회해 첫 화면을 초기화한다.
  const loadChatRooms = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      // 마이페이지의 넓은 화면에서는 목록과 대화를 함께 보여 주기 위해 전체 방을 조회한다.
      const roomParams = showRoomList ? {} : { tradeId };
      const roomResponse = await getTradeChatRooms(roomParams, { preview });
      const hiddenRoomIds = getHiddenRoomIds();
      const loadedRooms = toTradeChatRooms(roomResponse).filter(
        (room) => !hiddenRoomIds.has(room.roomId),
      );
      const selectedRoom = loadedRooms.find(
        (room) => String(room.tradeId) === String(tradeId),
      );
      const initialRoom = selectedRoom ?? loadedRooms[0] ?? null;

      if (!initialRoom) {
        setRooms([]);
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
  }, [preview, showRoomList, tradeId]);

  // 방을 선택하면 서버가 상대방 메시지를 읽음 처리한 최신 목록을 다시 받아 온다.
  const selectChatRoom = useCallback(async (roomId) => {
    try {
      const messageResponse = await getTradeChatMessages(roomId, { preview });
      const loadedMessages = toTradeChatMessages(messageResponse);

      setActiveRoomId(roomId);
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

  // 필터 변경 후 현재 방이 목록에서 제외되면, 필터의 첫 채팅방을 함께 선택한다.
  const changeRoomFilter = async (nextFilter) => {
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

    if (nextRooms.some((room) => room.roomId === activeRoomId)) {
      return;
    }

    const nextRoom = nextRooms[0] ?? null;
    setActiveRoomId(nextRoom?.roomId ?? '');

    if (!nextRoom) {
      setMessages([]);
      return;
    }

    await selectChatRoom(nextRoom.roomId);
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

    const nextRoom = remainingRooms[0] ?? null;
    setActiveRoomId(nextRoom?.roomId ?? '');

    if (!nextRoom) {
      setMessages([]);
      return;
    }

    await selectChatRoom(nextRoom.roomId);
  };

  useEffect(() => {
    const requestTimer = window.setTimeout(loadChatRooms, 0);

    return () => window.clearTimeout(requestTimer);
  }, [loadChatRooms]);

  // 실제 채팅방에서는 WebSocket을 구독해 새 메시지를 즉시 수신한다.
  // 미리보기는 서버 연결 없이 목업 데이터를 쓰므로 기존 화면 동작만 유지한다.
  useEffect(() => {
    if (!activeRoomId || preview || isActiveRoomClosed) {
      setRealtimeStatus('IDLE');
      return undefined;
    }

    let isDisposed = false;
    let reconnectTimer;
    const socket = new WebSocket(getTradeChatWebSocketUrl());
    socketRef.current = socket;
    setRealtimeStatus('CONNECTING');

    socket.onopen = () => {
      if (isDisposed) {
        return;
      }

      setRealtimeStatus('CONNECTED');
      socket.send(JSON.stringify({
        type: 'SUBSCRIBE',
        roomId: activeRoomId,
      }));
    };

    socket.onmessage = (event) => {
      try {
        const socketEvent = JSON.parse(event.data);

        if (socketEvent.type === 'CHAT_MESSAGE'
          && String(socketEvent.roomId) === String(activeRoomId)
          && socketEvent.chatMessage) {
          const newMessage = toTradeChatMessage(socketEvent.chatMessage);

          setMessages((currentMessages) => {
            const hasSameMessage = currentMessages.some(
              (message) => message.messageId === newMessage.messageId,
            );

            return hasSameMessage
              ? currentMessages
              : [...currentMessages, newMessage];
          });
          setRooms((currentRooms) => currentRooms.map((room) => (
            room.roomId === activeRoomId
              ? {
                ...room,
                lastMessage: newMessage.content,
                latestMessageAt: newMessage.sentAt,
              }
              : room
          )));
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
      socket.close();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [activeRoomId, isActiveRoomClosed, preview, reconnectSignal]);

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

  // Enter는 즉시 전송하고, Shift + Enter에서만 여러 줄 메시지를 작성할 수 있게 한다.
  // 한글 조합 중 Enter는 확정 입력에 쓰이므로 전송으로 처리하지 않는다.
  const handleMessageKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <div
      className={embedded
        ? 'trade-chat-page trade-chat-page--embedded'
        : 'trade-chat-page'}
    >
      <main className="container">
        <header className="trade-chat-page__header">
          <div>
            <h1>거래 채팅</h1>
            <p>대면 거래 당사자만 이용할 수 있는 1:1 채팅입니다.</p>
          </div>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={returnToChatList}
          >
            ← 채팅 목록
          </button>
        </header>

        {isLoading && (
          <section className="trade-chat-card trade-chat-page__state" role="status">
            채팅방을 불러오는 중입니다.
          </section>
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
              ? 'trade-chat-layout trade-chat-layout--with-room-list'
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
                          {isCompleted && (
                            <span className="trade-chat-room__closed">채팅 불가</span>
                          )}
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
                    <span className="trade-chat-status">
                      {activeRoom.roomStatus === 'ACTIVE' ? '대화 가능' : '채팅 불가'}
                    </span>
                    {!preview && !isActiveRoomClosed && (
                      <span
                        className={realtimeStatus === 'CONNECTED'
                          ? 'trade-chat-realtime trade-chat-realtime--connected'
                          : 'trade-chat-realtime'}
                      >
                        {realtimeStatus === 'CONNECTED'
                          ? '실시간 연결됨'
                          : '실시간 재연결 중'}
                      </span>
                    )}
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
                      onKeyDown={handleMessageKeyDown}
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
                  선택할 수 있는 대면 거래 채팅방이 없습니다.
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default TradeChat;
