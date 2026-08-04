const BADGE_COLORS = {
  'badge-primary': '#0064ff',
  'badge-success': '#0064ff',
  'badge-warning': '#FFC526',
  'badge-danger': '#EF4444',
  'badge-gray': '#9CA3AF',
  'badge-orange': '#f5a524',
  'badge-outline-orange': '#f5a524',
  'badge-outline-gray': '#9CA3AF',
  'badge-teal': '#0d9488',
  'badge-urgent': '#FFC526',
  'badge-blue': '#1a56a4',
  'badge-goods': '#5f5e5a',
};

export default function MyPageStatusBadge({ children, className = 'badge-outline-gray' }) {
  const color = BADGE_COLORS[className] ?? BADGE_COLORS['badge-outline-gray'];

  return (
    <span
      className={`badge ${className}`}
      style={{
        background: 'transparent',
        color,
        border: `1.5px solid ${color}`,
        boxSizing: 'border-box',
        height: 24,
        padding: '0 10px',
        borderRadius: 30,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '20px',
      }}
    >
      {children}
    </span>
  );
}
