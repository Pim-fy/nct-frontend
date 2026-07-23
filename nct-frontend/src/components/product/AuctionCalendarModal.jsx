// src/components/product/AuctionCalendarModal.jsx
// 경매 종료 시간 직접 설정 모달 — 시작·종료 datetime-local 입력
// Props: open, durationDays, onClose, onApply(startStr, endStr)
import { useEffect, useState } from 'react';

const toLocalDt = (d) => {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AuctionCalendarModal({ open, durationDays, onClose, onApply }) {
  const [modalStart, setModalStart] = useState('');
  const [modalEnd, setModalEnd] = useState('');

  // 모달이 열릴 때마다 현재 시각 기준으로 기본값 초기화
  useEffect(() => {
    if (!open) return;
    const now = new Date();
    now.setSeconds(0, 0);
    setModalStart(toLocalDt(now));
    const defaultEnd = new Date(now);
    defaultEnd.setDate(defaultEnd.getDate() + durationDays);
    setModalEnd(toLocalDt(defaultEnd));
  }, [open, durationDays]);

  if (!open) return null;

  return (
    <div
      className="modal open"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box">
        <h3>경매 종료 시간 설정</h3>
        <div className="grid-2">
          <div className="field">
            <label>시작 시간</label>
            <input
              className="input"
              type="datetime-local"
              value={modalStart}
              onChange={e => setModalStart(e.target.value)}
            />
          </div>
          <div className="field">
            <label>종료 시간</label>
            <input
              className="input"
              type="datetime-local"
              value={modalEnd}
              onChange={e => setModalEnd(e.target.value)}
            />
          </div>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} className="btn btn-ghost">취소</button>
          <button type="button" onClick={() => onApply(modalStart, modalEnd)} className="btn btn-primary">적용</button>
        </div>
      </div>
    </div>
  );
}
