import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
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
import '@assets/css/trade-chat.css';

const MAX_MESSAGE_LENGTH = 500;

const TradeChat = () => {
  const { tradeId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeRoom = useMemo(
    () => rooms.find((room) => room.roomId === activeRoomId) ?? null,
    [activeRoomId, rooms],
  );

  // 거래 번호에 연결된 실제 채팅방과 메시지를 함께 조회해 첫 화면을 초기화한다.
  const loadChatRooms = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const roomResponse = await getTradeChatRooms({
        tradeId,
      });
      const loadedRooms = toTradeChatRooms(roomResponse);
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

      const messageResponse = await getTradeChatMessages(initialRoom.roomId);
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
  }, [tradeId]);

  // 방을 선택하면 서버가 상대방 메시지를 읽음 처리한 최신 목록을 다시 받아 온다.
  const selectChatRoom = useCallback(async (roomId) => {
    try {
      const messageResponse = await getTradeChatMessages(roomId);
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
  }, []);

  useEffect(() => {
    const requestTimer = window.setTimeout(loadChatRooms, 0);

    return () => window.clearTimeout(requestTimer);
  }, [loadChatRooms]);

  // 전송 성공 응답만 메시지 목록에 반영해 화면과 저장된 메시지가 어긋나지 않게 한다.
  const sendMessage = async (event) => {
    event.preventDefault();

    const content = messageInput.trim();

    if (!content || !activeRoom) {
      return;
    }

    if (activeRoom.roomStatus === 'CLOSED') {
      setError('종료된 채팅방에서는 메시지를 전송할 수 없습니다.');
      return;
    }

    if (!window.crypto?.randomUUID) {
      setError('메시지 요청을 준비하지 못했습니다. 다시 시도해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await sendTradeChatMessage(activeRoom.roomId, {
        content,
        detectionKey: window.crypto.randomUUID(),
      });
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
                      disabled={isSubmitting || activeRoom.roomStatus === 'CLOSED'}
                    />
                    <div className="trade-chat-composer__footer">
                      <span>{messageInput.length}/{MAX_MESSAGE_LENGTH}</span>
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={isSubmitting || activeRoom.roomStatus === 'CLOSED'}
                      >
                        {isSubmitting ? '전송 중...' : '전송'}
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
