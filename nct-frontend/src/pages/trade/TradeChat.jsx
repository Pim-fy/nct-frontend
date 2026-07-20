import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import {
  getTradePreviewChatMessages,
  getTradePreviewChatRooms,
} from '@/mocks/tradePreviewData';
import { isTradePreviewEnabled } from '@api/tradeApi';
import '@assets/css/trade-chat.css';

const MAX_MESSAGE_LENGTH = 500;

const TradeChat = () => {
  const { tradeId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const activeRoom = useMemo(
    () => rooms.find((room) => room.roomId === activeRoomId) ?? null,
    [activeRoomId, rooms],
  );

  // 개발 미리보기에서만 거래 채팅방 목록을 불러온다.
  // 목록과 방 선택, 메시지 전송 흐름을 점검하는 용도다.
  const loadChatRooms = useCallback(async () => {
    setIsLoading(true);
    setError('');

    if (!isTradePreviewEnabled) {
      setIsLoading(false);
      return;
    }

    try {
      const loadedRooms = getTradePreviewChatRooms();
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

      const initialMessages = getTradePreviewChatMessages(initialRoom.roomId);

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
      setMessages(initialMessages.messages);
    } catch {
      setError(
        '채팅방 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [tradeId]);

  // 선택한 채팅방의 메시지를 조회한다.
  // 확인하지 않은 메시지는 읽음으로 표시한다.
  const selectChatRoom = useCallback((roomId) => {
    try {
      const room = getTradePreviewChatMessages(roomId);

      setActiveRoomId(roomId);
      setMessages(room.messages);
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
  }, []);

  useEffect(() => {
    const requestTimer = window.setTimeout(loadChatRooms, 0);

    return () => window.clearTimeout(requestTimer);
  }, [loadChatRooms]);

  // 개발 미리보기에서는 전송한 메시지를 현재 채팅방에 즉시 추가한다.
  const sendMessage = (event) => {
    event.preventDefault();

    const content = messageInput.trim();

    if (!content || !activeRoom) {
      return;
    }

    if (activeRoom.roomStatus === 'CLOSED') {
      setError('종료된 채팅방에서는 메시지를 전송할 수 없습니다.');
      return;
    }

    const newMessage = {
      messageId: `local-message-${Date.now()}`,
      senderType: 'ME',
      content,
      sentAt: new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date()),
      isRead: false,
    };

    setMessages((currentMessages) => [...currentMessages, newMessage]);
    setRooms((currentRooms) => currentRooms.map((room) => {
      if (room.roomId !== activeRoom.roomId) {
        return room;
      }

      return {
        ...room,
        lastMessage: content,
        latestMessageAt: newMessage.sentAt,
      };
    }));
    setMessageInput('');
    setError('');
  };

  if (!isTradePreviewEnabled) {
    return (
      <div className="trade-chat-page">
        <main className="container trade-chat-page__state">
          <section className="trade-chat-card">
            <h1>거래 채팅</h1>
            <p>
              채팅방·메시지 API 계약이 확정된 뒤
              실제 거래 채팅을 연결합니다.
            </p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="trade-chat-page">
      <main className="container">
        <header className="trade-chat-page__header">
          <div>
            <h1>거래 채팅</h1>
            <p>대면 거래 당사자만 이용할 수 있는 1:1 채팅입니다.</p>
          </div>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => window.history.back()}
          >
            ← 이전으로
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
          <div className="trade-chat-layout">
            <aside className="trade-chat-card trade-chat-rooms" aria-label="채팅방 목록">
              <div className="trade-chat-rooms__header">
                <h2>채팅방</h2>
                <span>{rooms.length}</span>
              </div>
              <div className="trade-chat-rooms__list">
                {rooms.map((room) => {
                  const isActive = room.roomId === activeRoomId;

                  return (
                    <button
                      className={isActive
                        ? 'trade-chat-room trade-chat-room--active'
                        : 'trade-chat-room'}
                      key={room.roomId}
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
                      {room.unreadCount > 0 && (
                        <span className="trade-chat-room__unread">
                          새 메시지 {room.unreadCount}개
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="trade-chat-card trade-chat-conversation">
              {activeRoom ? (
                <>
                  <header className="trade-chat-conversation__header">
                    <div>
                      <h2>{activeRoom.counterpartNickname}</h2>
                      <p>{activeRoom.productName}</p>
                    </div>
                    <span className="trade-chat-status">
                      {activeRoom.roomStatus === 'ACTIVE' ? '대화 가능' : '대화 종료'}
                    </span>
                  </header>

                  <div className="trade-chat-notice">
                    연락처와 계좌번호 등 민감정보는
                    서버에서 자동 마스킹됩니다.
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
                      placeholder="메시지를 입력하세요."
                      disabled={activeRoom.roomStatus === 'CLOSED'}
                    />
                    <div className="trade-chat-composer__footer">
                      <span>{messageInput.length}/{MAX_MESSAGE_LENGTH}</span>
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={activeRoom.roomStatus === 'CLOSED'}
                      >
                        전송
                      </button>
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
