// src/components/landing/NoticeStrip.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import micIcon from '@assets/img/micIcon.png';
import '@assets/css/landing.css';

/**
 * 상단 공지 띠 배너
 * - 닫기 버튼으로 숨길 수 있음
 * - 세션 스토리지에 닫은 상태 저장
 */
const NoticeStrip = ({
  badge = '중요',
  text = '서비스 점검 안내',
  link = '/customersupport/notice',
}) => {
  const [hidden, setHidden] = useState(() => {
    return sessionStorage.getItem('noticeStripHidden') === 'true';
  });

  const handleClose = () => {
    setHidden(true);
    sessionStorage.setItem('noticeStripHidden', 'true');
  };

  if (hidden) return null;

  return (
    <div className="home-notice-strip">
      <div className="container">
        <div className="home-notice-strip-inner">
          <Link to={link}>
            <img src={micIcon} alt="" width={16} height={16} />
            [{badge}] {text}
          </Link>
          <button
            className="home-notice-close"
            type="button"
            aria-label="공지 닫기"
            onClick={handleClose}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeStrip;
