import './MockupAdminParts.css';

// 관리자 목업의 제목 영역을 여러 화면에서 확인하기 위한 임시 부품입니다.
// 정식 공통 PageHeader가 들어오면 사용하는 페이지의 import만 교체합니다.
const MockupAdminPageHeader = ({ title, action }) => (
  <section className="mockup-admin-page-header">
    <div>
      <h1>{title}</h1>
    </div>
    {action && <div className="mockup-admin-page-header__action">{action}</div>}
  </section>
);

export default MockupAdminPageHeader;
