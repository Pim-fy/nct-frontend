// src/components/landing/NoticeStrip.jsx
import { Link } from 'react-router-dom';
import micIcon from '@assets/img/micIcon.png';
import '@assets/css/landing.css';

/**
 * 상단 공지 띠 배너
 * main.png 시안에는 닫기(X) 버튼이 없어 항상 노출된다.
 * (닫은 뒤 사라지는 UX가 필요하면 스크롤 시 헤더 중앙에 뜨는 롤링 티커(SiteHeader)로 대체된다.)
 */
const NoticeStrip = ({
  badge = '중요',
  text = '서비스 점검 안내',
  link = '/customersupport/notice',
}) => {
  return (
    <div className="home-notice-strip">
      <div className="container">
        <div className="home-notice-strip-inner">
          <Link to={link}>
            <img src={micIcon} alt="" width={16} height={16} />
            [{badge}] {text}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NoticeStrip;
