// src/pages/user/notification/components/NotificationDetailModal.jsx
import { Link, useLocation } from 'react-router-dom';

// 참조유형공통코드(REFG01) → 이동할 화면 경로. 페이지가 없는 참조 유형(입찰·견적·거래문제 등)은
// null을 돌려주고, 이 경우 모달에 "이동" 버튼 없이 내용만 보여준다 (사용자 결정, 2026-07-28).
const resolveLink = (item) => {
  if (!item.refTypeCd || item.refSn == null) return null;
  switch (item.refTypeCd) {
    case 'REFC0003': // 경매
      return `/auction/${item.refSn}`;
    case 'REFC0005': // 거래 — 제공자 대상 알림(audienceCd=NTFC0016)은 판매자 화면으로 보낸다
      return item.audienceCd === 'NTFC0016' ? `/trades/${item.refSn}/seller` : `/trades/${item.refSn}`;
    case 'REFC0007': // 서비스 요청
      return `/service-requests/${item.refSn}`;
    case 'REFC0011': // 공지사항
      return `/customersupport/notice/${item.refSn}`;
    default:
      return null;
  }
};

/**
 * 알림 클릭 시 뜨는 상세 팝업 — 목록에서는 제목만 보이던 알림의 본문(content)을 보여준다.
 * 이동할 화면이 있는 알림(경매·거래·서비스·공지)은 내용을 확인한 뒤 눌러서 이동할 수 있는
 * 버튼을 같이 보여준다 — 클릭 즉시 이동이 아니라 내용을 먼저 보고 선택하게 하기 위함 (사용자 결정).
 * item이 null이면 렌더링하지 않는다 (선택된 알림 없음 = 닫힌 상태).
 */
const NotificationDetailModal = ({ item, onClose }) => {
  // 전역 브레드크럼 (BJN, 260805): 알림함에서 이동했음을 상세 화면 브레드크럼에 반영하기 위해 현재 경로를 전달
  const location = useLocation();
  if (!item) return null;

  const link = resolveLink(item);

  return (
    <div
      className="user-modal-overlay flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] bg-white rounded-2xl p-6 shadow-[0_20px_80px_rgba(0,0,0,0.25)]"
        aria-labelledby="notification-detail-modal-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
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
        <h3 className="text-lg font-bold text-gray-900 m-0 mb-2" id="notification-detail-modal-title">{item.title}</h3>
        <p className="text-xs text-gray-400 mb-4">{item.time}</p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed m-0">
          {item.content}
        </p>
        {link && (
          <div className="flex justify-end mt-4">
            <Link
              to={link}
              state={{ from: location.pathname + location.search }}
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors no-underline"
            >
              이동
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDetailModal;
