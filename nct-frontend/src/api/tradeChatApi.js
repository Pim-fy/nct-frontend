import api from './axios';
import { shouldUseTradePreview } from './tradeApi';
import {
  getTradePreviewChatMessages,
  getTradePreviewChatRooms,
} from '../mocks/tradePreviewData';

const CHAT_ROOM_ENDPOINT = '/chat-rooms';

/** 로그인한 물건·서비스 거래 당사자의 채팅방을 조회한다. */
export const getTradeChatRooms = async (params = {}, options = {}) => {
  if (options.preview || shouldUseTradePreview()) {
    return getTradePreviewChatRooms(params);
  }

  const response = await api.get(CHAT_ROOM_ENDPOINT, {
    params,
  });

  return response.data;
};

/** 채팅방 입장과 함께 상대방이 보낸 미확인 메시지를 읽음으로 처리한다. */
export const getTradeChatMessages = async (roomId, options = {}) => {
  if (options.preview || shouldUseTradePreview()) {
    return getTradePreviewChatMessages(roomId);
  }

  const response = await api.get(`${CHAT_ROOM_ENDPOINT}/${roomId}/messages`);

  return response.data;
};

/** 활성 채팅방에 메시지를 전송하고, 서버가 마스킹한 저장 결과를 반환한다. */
export const sendTradeChatMessage = async (roomId, payload, options = {}) => {
  if (options.preview || shouldUseTradePreview()) {
    return {
      messageId: `local-message-${Date.now()}`,
      senderType: 'ME',
      content: payload.content,
      sentAt: new Date().toISOString(),
      read: false,
    };
  }

  const response = await api.post(
    `${CHAT_ROOM_ENDPOINT}/${roomId}/messages`,
    payload,
  );

  return response.data;
};
