import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ChevronRight,
  MessageCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTradeChatRooms } from '@api/tradeChatApi';
import { toTradeChatRooms } from '@api/tradeChatAdapter';

const HIDDEN_ROOM_STORAGE_KEY = 'nct-hidden-trade-chat-room-ids';

// 서버 대화 기록을 지우지 않고, 사용자가 목록에서 숨긴 완료 방만 브라우저에 기록한다.
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

/** 마이페이지에서 진행 중·완료된 물건 거래 채팅방을 함께 보여준다. */
const MyPageTradeChatList = ({
  preview = false,
  onOpenChatRoom,
}) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const activeRooms = useMemo(
    () => rooms.filter((room) => room.roomStatus === 'ACTIVE'),
    [rooms],
  );
  const completedRooms = useMemo(
    () => rooms.filter((room) => room.roomStatus === 'CLOSED'),
    [rooms],
  );
  const filteredRooms = useMemo(() => {
    if (roomFilter === 'ACTIVE') {
      return activeRooms;
    }

    if (roomFilter === 'CLOSED') {
      return completedRooms;
    }

    return rooms;
  }, [activeRooms, completedRooms, roomFilter, rooms]);

  // 별도 목록 API 없이 기존 본인 채팅방 조회 계약을 재사용한다.
  const loadRooms = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
      setError('');
    }

    try {
      const response = await getTradeChatRooms({}, { preview });
      const hiddenRoomIds = getHiddenRoomIds();

      setRooms(toTradeChatRooms(response).filter(
        (room) => !hiddenRoomIds.has(room.roomId),
      ));
    } catch {
      if (showLoading) {
        setError('채팅 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [preview]);

  useEffect(() => {
    const requestTimer = window.setTimeout(() => loadRooms(true), 0);

    // 실시간 소켓 계약 전에는 목록을 가볍게 다시 조회해 새 메시지·안 읽은 수를 갱신한다.
    const refreshTimer = window.setInterval(() => loadRooms(), 10_000);

    return () => {
      window.clearTimeout(requestTimer);
      window.clearInterval(refreshTimer);
    };
  }, [loadRooms]);

  const openChatRoom = (tradeId) => {
    if (onOpenChatRoom) {
      onOpenChatRoom(tradeId);
      return;
    }

    const chatPath = preview
      ? `/trades/preview/${tradeId}/chat`
      : `/trades/${tradeId}/chat`;

    navigate(chatPath);
  };

  // 완료 채팅만 개인 목록에서 숨긴다. 상대방 목록과 서버의 메시지는 그대로 보존된다.
  const hideCompletedChatRoom = (roomId) => {
    const isConfirmed = window.confirm(
      '이 완료된 채팅을 내 목록에서 삭제할까요?\n상대방 목록과 서버의 대화 기록은 유지됩니다.',
    );

    if (!isConfirmed) {
      return;
    }

    const hiddenRoomIds = getHiddenRoomIds();
    hiddenRoomIds.add(roomId);
    saveHiddenRoomIds(hiddenRoomIds);
    setRooms((currentRooms) => currentRooms.filter(
      (room) => room.roomId !== roomId,
    ));
  };

  return (
    <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 sm:p-7">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[12px] font-bold tracking-[0.08em] text-[#0064ff]">
            MY CHATS
          </p>
          <h1 className="text-[24px] font-bold text-[#1f2937]">거래 채팅</h1>
          <p className="mt-1 text-[14px] text-[#6b7280]">
            진행 중이거나 완료된 직거래 채팅 기록을 확인할 수 있습니다.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex flex-wrap justify-end gap-1.5">
            <button
              aria-pressed={roomFilter === 'ALL'}
              className={roomFilter === 'ALL'
                ? 'rounded-full bg-[#0064ff] px-3 py-1 text-[13px] font-bold text-white'
                : 'rounded-full bg-[#f1f3f7] px-3 py-1 text-[13px] font-bold text-[#64748b]'}
              type="button"
              onClick={() => setRoomFilter('ALL')}
            >
              전체 {rooms.length}개
            </button>
            <button
              aria-pressed={roomFilter === 'ACTIVE'}
              className={roomFilter === 'ACTIVE'
                ? 'rounded-full bg-[#0064ff] px-3 py-1 text-[13px] font-bold text-white'
                : 'rounded-full bg-[#e8f0ff] px-3 py-1 text-[13px] font-bold text-[#0064ff]'}
              type="button"
              onClick={() => setRoomFilter('ACTIVE')}
            >
              {activeRooms.length}개 진행 중
            </button>
            <button
              aria-pressed={roomFilter === 'CLOSED'}
              className={roomFilter === 'CLOSED'
                ? 'rounded-full bg-[#64748b] px-3 py-1 text-[13px] font-bold text-white'
                : 'rounded-full bg-[#f1f3f7] px-3 py-1 text-[13px] font-bold text-[#64748b]'}
              type="button"
              onClick={() => setRoomFilter('CLOSED')}
            >
              {completedRooms.length}개 완료
            </button>
          </div>
          <button
            aria-label="채팅 목록 새로고침"
            className="flex size-9 items-center justify-center rounded-full border border-[#dbe4f0] text-[#4b5563] transition-colors hover:border-[#9fc2ff] hover:bg-[#f7faff]"
            type="button"
            onClick={() => loadRooms(true)}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="rounded-[12px] bg-[#f8fafc] px-5 py-10 text-center text-[14px] text-[#6b7280]">
          채팅 목록을 불러오는 중입니다.
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-[12px] border border-[#fecaca] bg-[#fff7f7] px-5 py-6 text-center">
          <p className="text-[14px] text-[#b91c1c]">{error}</p>
          <button
            className="mt-3 rounded-[8px] border border-[#0064ff] px-3 py-2 text-[13px] font-bold text-[#0064ff]"
            type="button"
            onClick={() => loadRooms(true)}
          >
            다시 시도
          </button>
        </div>
      )}

      {!isLoading && !error && rooms.length === 0 && (
        <div className="rounded-[12px] border border-dashed border-[#d1d5db] px-5 py-12 text-center">
          <MessageCircle className="mx-auto mb-3 text-[#9ca3af]" size={28} />
          <strong className="text-[15px] text-[#374151]">
            거래 채팅이 없습니다.
          </strong>
          <p className="mt-2 text-[14px] text-[#6b7280]">
            직거래 일정이 저장되면 이곳에서 채팅을 시작할 수 있습니다.
          </p>
        </div>
      )}

      {!isLoading && !error && rooms.length > 0 && filteredRooms.length === 0 && (
        <div className="rounded-[12px] border border-dashed border-[#d1d5db] px-5 py-12 text-center">
          <MessageCircle className="mx-auto mb-3 text-[#9ca3af]" size={28} />
          <strong className="text-[15px] text-[#374151]">
            {roomFilter === 'ACTIVE'
              ? '진행 중인 거래 채팅이 없습니다.'
              : '완료된 거래 채팅이 없습니다.'}
          </strong>
        </div>
      )}

      {!isLoading && !error && filteredRooms.length > 0 && (
        <div className="space-y-2">
          {filteredRooms.map((room) => {
            const isCompleted = room.roomStatus === 'CLOSED';

            return (
            <div
              className={isCompleted
                ? 'flex items-center gap-2 rounded-[12px] border border-[#e5e7eb] bg-[#fafbfc] p-2'
                : 'flex items-center gap-2 rounded-[12px] border border-[#e5e7eb] p-2'}
              key={room.roomId}
            >
              <button
                className="flex min-w-0 flex-1 items-center gap-4 rounded-[10px] p-2 text-left transition-colors hover:bg-[#f7faff]"
                type="button"
                onClick={() => openChatRoom(room.tradeId)}
              >
                <span className={isCompleted
                  ? 'flex size-11 shrink-0 items-center justify-center rounded-full bg-[#f1f3f7] text-[#64748b]'
                  : 'flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-[#0064ff]'}
                >
                  <MessageCircle size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <strong className="truncate text-[15px] text-[#1f2937]">
                      {room.counterpartNickname}
                    </strong>
                    <time className="shrink-0 text-[12px] text-[#9ca3af]">
                      {room.latestMessageAt}
                    </time>
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    {isCompleted && (
                      <span className="rounded-full bg-[#eef0f4] px-2 py-0.5 text-[11px] font-bold text-[#64748b]">
                        채팅 불가
                      </span>
                    )}
                    <span className="block truncate text-[13px] text-[#6b7280]">
                      {room.productName} · {room.lastMessage}
                    </span>
                  </span>
                </span>
                {room.unreadCount > 0 && (
                  <span className="rounded-full bg-[#0064ff] px-2 py-1 text-[12px] font-bold text-white">
                    {room.unreadCount}
                  </span>
                )}
                <ChevronRight className="shrink-0 text-[#9ca3af]" size={18} />
              </button>
              {isCompleted && (
                <button
                  aria-label={`${room.productName} 완료 채팅 목록에서 삭제`}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-[#9ca3af] transition-colors hover:bg-[#eef0f4] hover:text-[#64748b]"
                  type="button"
                  onClick={() => hideCompletedChatRoom(room.roomId)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MyPageTradeChatList;
