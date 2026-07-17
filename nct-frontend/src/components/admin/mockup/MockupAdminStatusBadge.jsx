import './MockupAdminParts.css';

// develop의 공통 badge 색상 규칙을 감싸는 목업용 어댑터입니다.
const toneClass = {
  danger: 'badge-danger',
  warning: 'badge-warning',
  success: 'badge-success',
  info: 'badge-blue',
  neutral: 'badge-gray',
};

const MockupAdminStatusBadge = ({ children, tone = 'neutral' }) => (
  <span className={`badge mockup-admin-status-badge ${toneClass[tone] ?? toneClass.neutral}`}>
    {children}
  </span>
);

export default MockupAdminStatusBadge;
