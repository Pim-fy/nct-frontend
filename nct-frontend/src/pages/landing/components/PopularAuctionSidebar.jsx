// src/pages/landing/components/PopularAuctionSidebar.jsx
import { Link } from 'react-router-dom';
import '@assets/css/landing.css';

// 임시 더미 데이터 - 실제 API 연동 시 교체
const DUMMY_POPULAR = [
  { id: 1, title: '맥북 에어 M2',        price: '810,000원' },
  { id: 2, title: '아이폰 14 Pro',        price: '612,000원' },
  { id: 3, title: '미러리스 바디',        price: '430,000원' },
  { id: 4, title: '소니 헤드폰',          price: '201,000원' },
  { id: 5, title: '모니터 34인치',        price: '148,000원' },
];

/**
 * 실시간 인기 경매 사이드바
 */
const PopularAuctionSidebar = ({ items = DUMMY_POPULAR }) => {
  return (
    <aside className="card home-popular">
      <div className="home-popular-head">
        <h3>실시간 인기 경매</h3>
        <Link className="more-link" to="/auction">더보기 →</Link>
      </div>
      <div className="list small">
        {items.map((item, idx) => (
          <Link
            key={item.id}
            className="list-row"
            to={`/auction/${item.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <span>{idx + 1}. {item.title}</span>
            <strong>{item.price}</strong>
          </Link>
        ))}
      </div>
    </aside>
  );
};

export default PopularAuctionSidebar;
