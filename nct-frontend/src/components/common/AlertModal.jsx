// src/components/common/AlertModal.jsx
// window.alert() 대체 — 화면 중앙에 뜨는 확인 전용(버튼 1개) 모달. ConfirmModal과 같은 .modal/.modal-box 스타일 사용.
const AlertModal = ({ open, message, onClose, confirmLabel = '확인' }) => (
  <div className={`modal ${open ? 'open' : ''}`}>
    <div className="modal-box">
      <p style={{ marginBottom: 20, fontSize: 17, whiteSpace: 'pre-line', textAlign: 'center', wordBreak: 'keep-all' }}>{message}</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={onClose}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);
export default AlertModal;
