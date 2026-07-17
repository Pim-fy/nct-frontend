// src/components/landing/CategoryStrip.jsx
import { Link } from 'react-router-dom';
import '@assets/css/landing.css';

const CATEGORIES = [
  { label: '전자기기',   icon: '💻', href: '/auction?category=전자기기' },
  { label: '생활·가구', icon: '🛋️', href: '/auction?category=생활·가구' },
  { label: '패션·의류', icon: '⌚', href: '/auction?category=패션·의류' },
  { label: '도서·음반', icon: '📚', href: '/auction?category=도서·음반' },
  { label: '취미',       icon: '🎸', href: '/auction?category=취미' },
  { label: '스포츠',     icon: '🏕️', href: '/auction?category=스포츠·레저' },
  { label: '유아·아동', icon: '🧸', href: '/auction?category=유아·아동' },
  { label: '뷰티',       icon: '✨', href: '/auction?category=뷰티·미용' },
  { label: '식품',       icon: '🍽️', href: '/auction?category=식품' },
  { label: '기타',       icon: '📦', href: '/auction?category=기타' },
];

/**
 * 경매 카테고리 아이콘 네비게이션
 */
const CategoryStrip = () => {
  return (
    <nav className="category-strip" aria-label="경매 카테고리">
      {CATEGORIES.map((cat) => (
        <Link key={cat.label} className="category-tile" to={cat.href}>
          <span className="category-icon">{cat.icon}</span>
          <span>{cat.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default CategoryStrip;
