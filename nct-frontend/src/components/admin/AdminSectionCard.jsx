import './AdminSectionCard.css';

/**
 * 담당자 7: 담당자 3의 마이페이지 목록 패널에서 가져온 카드 규칙입니다.
 * 내 관리자 목록 화면에서만 먼저 사용하며, 정식 공통 카드가 확정되면 이 컴포넌트를 교체합니다.
 */
const AdminSectionCard = ({ action, children, className = '', description, title }) => <section className={`admin-section-card ${className}`}>
  {(title || description || action) && <header className="admin-section-card__header"><div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>{action && <div className="admin-section-card__action">{action}</div>}</header>}
  {children}
</section>;

export default AdminSectionCard;
