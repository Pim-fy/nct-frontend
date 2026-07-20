// src/components/common/Toast.jsx
// Toast는 전역 함수로 사용 (SweetAlert2 권장)
// 간단한 인라인 토스트 컴포넌트
import { useState, useEffect } from 'react';
const Toast = ({ message, duration = 1800, onClose }) => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); onClose?.(); }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', left: '50%', bottom: '28px', transform: 'translateX(-50%)', background: '#1a1a18', color: '#fff', padding: '10px 16px', borderRadius: '8px', zIndex: 300, fontSize: '14px' }}>
      {message}
    </div>
  );
};
export default Toast;
