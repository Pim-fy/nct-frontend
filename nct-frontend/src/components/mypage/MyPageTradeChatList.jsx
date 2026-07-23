import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ChevronRight, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTradeChatRooms } from '@api/tradeChatApi';
import { toTradeChatRooms } from '@api/tradeChatAdapter';

/** 마이페이지에서 로그인 사용자의 진행 중인 물건 거래 채팅방만 보여준다. */
const MyPageTradeChatList = ({
  preview = false,
  onOpenChatRoom,
}) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const activeRooms = useMemo(
    () => rooms.filter((room) => room.roomStatus === 'ACTIVE'),
    [rooms],
  );

  // 별도 채팅 목록 API를 만들지 않고 기존 본인 채팅방 조회 계약을 재사용한다.
  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getTradeChatRooms({}, { preview });

      setRooms(toTradeChatRooms(response));
    } catch {
      setError('채팅 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [preview]);

  useEffect(() => {
    const requestTimer = window.setTimeout(loadRooms, 0);

    return () => window.clearTimeout(requestTimer);
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

  return (
    <section className="rounded-[16px] border border-[#e5e7eb] bg-white p-5 sm:p-7">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[12px] font-bold tracking-[0.08em] text-[#0064ff]">
            MY CHATS
          </p>
          <h1 className="text-[24px] font-bold text-[#1f2937]">거래 채팅</h1>
          <p className="mt-1 text-[14px] text-[#6b7280]">
            진행 중인 직거래 채팅을 확인할 수 있습니다.
          </p>
        </div>
        <span className="rounded-full bg-[#e8f0ff] px-3 py-1 text-[13px] font-bold text-[#0064ff]">
          {activeRooms.length}개 진행 중
        </span>
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
            onClick={loadRooms}
          >
            다시 시도
          </button>
        </div>
      )}

      {!isLoading && !error && activeRooms.length === 0 && (
        <div className="rounded-[12px] border border-dashed border-[#d1d5db] px-5 py-12 text-center">
          <MessageCircle className="mx-auto mb-3 text-[#9ca3af]" size={28} />
          <strong className="text-[15px] text-[#374151]">
            진행 중인 거래 채팅이 없습니다.
          </strong>
          <p className="mt-2 text-[14px] text-[#6b7280]">
            직거래 일정이 저장되면 이곳에서 채팅을 시작할 수 있습니다.
          </p>
        </div>
      )}

      {!isLoading && !error && activeRooms.length > 0 && (
        <div className="space-y-2">
          {activeRooms.map((room) => (
            <button
              className="flex w-full items-center gap-4 rounded-[12px] border border-[#e5e7eb] p-4 text-left transition-colors hover:border-[#9fc2ff] hover:bg-[#f7faff]"
              key={room.roomId}
              type="button"
              onClick={() => openChatRoom(room.tradeId)}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-[#0064ff]">
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
                <span className="mt-1 block truncate text-[13px] text-[#6b7280]">
                  {room.productName} · {room.lastMessage}
                </span>
              </span>
              {room.unreadCount > 0 && (
                <span className="rounded-full bg-[#0064ff] px-2 py-1 text-[12px] font-bold text-white">
                  {room.unreadCount}
                </span>
              )}
              <ChevronRight className="shrink-0 text-[#9ca3af]" size={18} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default MyPageTradeChatList;
