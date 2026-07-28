// src/pages/user/notification/components/NotificationDetailModal.jsx

/**
 * 알림 클릭 시 뜨는 상세 팝업 — 목록에서는 제목만 보이던 알림의 본문(content)을 보여준다.
 * item이 null이면 렌더링하지 않는다 (선택된 알림 없음 = 닫힌 상태).
 */
const NotificationDetailModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div
      className="fixed inset-x-0 top-[82px] bottom-0 z-[180] flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-2xl p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="inline-block px-2 py-0.5 rounded-lg bg-gray-100 text-xs text-gray-500">
            {item.type}
          </span>
          <button
            type="button"
            className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
        <h3 className="text-lg font-bold text-gray-900 m-0 mb-2">{item.title}</h3>
        <p className="text-xs text-gray-400 mb-4">{item.time}</p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed m-0">
          {item.content}
        </p>
      </div>
    </div>
  );
};

export default NotificationDetailModal;
