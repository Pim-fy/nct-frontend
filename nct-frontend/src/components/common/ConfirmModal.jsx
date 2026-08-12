// src/components/common/ConfirmModal.jsx
// 임시 공통 컴포넌트 — window.confirm() 대체 모달 (추후 디자인 시스템 기준으로 교체)
const ConfirmModal = ({ open, message, subMessage, onConfirm, onCancel, confirmLabel = '확인' }) => (
  <div className={`modal ${open ? 'open' : ''}`}>
    <div className="modal-box">
      <p style={{ marginBottom: subMessage ? 10 : 20, fontSize: 17 }}>{message}</p>
      {subMessage && (
        <p style={{ marginBottom: 20, fontSize: 14, color: '#5f5e5a', lineHeight: 1.6 }}>{subMessage}</p>
      )}
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>취소</button>
        <button className="btn btn-danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </div>
  </div>
);
export default ConfirmModal;
