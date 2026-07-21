// src/components/common/ConfirmModal.jsx
// 임시 공통 컴포넌트 — window.confirm() 대체 모달 (추후 디자인 시스템 기준으로 교체)
const ConfirmModal = ({ open, message, onConfirm, onCancel }) => (
  <div
    className={`modal ${open ? 'open' : ''}`}
    onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
  >
    <div className="modal-box">
      <p style={{ marginBottom: 20 }}>{message}</p>
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-ghost" onClick={onCancel}>취소</button>
        <button className="btn btn-danger" onClick={onConfirm}>확인</button>
      </div>
    </div>
  </div>
);
export default ConfirmModal;
