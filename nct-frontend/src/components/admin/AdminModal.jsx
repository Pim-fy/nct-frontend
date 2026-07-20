import { useEffect } from 'react';
import { X } from 'lucide-react';
import './AdminModal.css';

/** 담당자 7: 관리자 목록의 상세·심사 내용을 페이지 이동 없이 표시하는 공통 모달입니다. */
const AdminModal = ({ children, onClose, title }) => {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return <div className="admin-modal" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section aria-label={title} aria-modal="true" className="admin-modal__panel" role="dialog">
      <header><h2>{title}</h2><button aria-label="닫기" onClick={onClose} type="button"><X /></button></header>
      {children}
    </section>
  </div>;
};

export default AdminModal;
