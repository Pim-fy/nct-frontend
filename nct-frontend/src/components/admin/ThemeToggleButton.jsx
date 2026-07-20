// src/components/admin/ThemeToggleButton.jsx
import { useAdminTheme } from '@context/AdminThemeContext';
const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useAdminTheme();
  return (
    <button className="btn btn-ghost" onClick={toggleTheme} style={{ fontSize: '18px', padding: '6px 10px' }}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};
export default ThemeToggleButton;
