// src/layouts/user/footers/MainFooter.jsx
import { Link } from 'react-router-dom';
import BrandLogo from '@components/common/BrandLogo';
import '@assets/css/footer.css';

const MainFooter = () => {
  return (
    <footer className="site-footer">
      <div className="container row" style={{ justifyContent: 'space-between' }}>
        <Link aria-label="에누리컷 홈" className="site-footer__brand" to="/">
          <BrandLogo className="brand-logo--footer" />
        </Link>
        <div className="row small">
          <Link to="/guide">서비스 소개</Link>
          <Link to="/terms">이용약관</Link>
          <Link to="/privacy">개인정보처리방침</Link>
          <Link to="/customersupport/notice">공지사항</Link>
          <Link to="/customersupport/faq">자주하는 질문</Link>
        </div>
        <span className="small">© 2026 에누리컷. All rights reserved.</span>
      </div>
    </footer>
  );
};

export default MainFooter;
