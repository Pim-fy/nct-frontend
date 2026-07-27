// src/pages/user/notification/components/NotificationItem.jsx

/**
 * 알림 한 건 — 미읽음이면 파란 배경 + 좌측 강조선 (목업 20_notification.html)
 * 클릭하면 읽음 처리와 함께 상세 팝업(NotificationDetailModal)이 뜬다.
 */
const NotificationItem = ({ item, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={`w-full text-left border rounded-2xl p-4 transition-colors flex items-start justify-between gap-3
        ${item.read
          ? 'bg-white border-gray-100 hover:bg-gray-50'
          : 'bg-blue-50 border-blue-100 border-l-4 border-l-blue-700 hover:bg-blue-100'}`}
    >
      <div className="min-w-0">
        <strong className="block text-sm text-gray-900">
          [{item.type}] {item.title}
        </strong>
        <p className="text-xs text-gray-500 mt-1.5 mb-0 flex items-center gap-2">
          {item.time}
          {item.ref && (
            <span className="inline-block px-2 py-0.5 rounded-lg bg-gray-100 text-gray-500">
              {item.ref}
            </span>
          )}
        </p>
      </div>
      {item.read && (
        <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-0.5 text-xs text-gray-500">읽음</span>
      )}
    </button>
  );
};

export default NotificationItem;
