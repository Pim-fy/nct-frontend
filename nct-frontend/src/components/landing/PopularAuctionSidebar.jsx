// src/components/landing/PopularAuctionSidebar.jsx
import { Link } from 'react-router-dom';

// 임시 더미 데이터 - 실제 API 연동 시 교체
const DUMMY_POPULAR = [
  { id: 1, title: '맥북 에어 M2',   price: '810,000원' },
  { id: 2, title: '아이폰 14 Pro',   price: '612,000원' },
  { id: 3, title: '미러리스 바디',   price: '430,000원' },
  { id: 4, title: '소니 헤드폰',     price: '201,000원' },
  { id: 5, title: '모니터 34인치',   price: '148,000원' },
];

/**
 * 실시간 인기 경매 사이드바
 */
const PopularAuctionSidebar = ({ items = DUMMY_POPULAR }) => {
  return (
    <aside className="bg-white rounded-2xl shadow-[0_10px_28px_rgba(0,0,0,0.12)] p-5 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900 m-0">실시간 인기 경매</h3>
        <Link
          to="/auction?sort=popular"
          className="text-xs text-gray-400 hover:text-blue-600 no-underline transition-colors"
        >
          더보기 →
        </Link>
      </div>

      {/* 목록 */}
      <div className="flex flex-col divide-y divide-gray-100">
        {items.map((item, idx) => (
          <Link
            key={item.id}
            to={`/auction/${item.id}`}
            className="
              flex items-center justify-between
              py-3 px-2
              no-underline
              rounded-lg
              transition-colors duration-150
              hover:bg-blue-50
              group
            "
          >
            {/* 순위 + 제목 */}
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="
                w-5 text-center text-sm font-bold shrink-0
                text-gray-400 group-hover:text-blue-500
              ">
                {idx + 1}
              </span>
              <span className="
                text-sm font-medium text-gray-800 truncate
                group-hover:text-blue-700
              ">
                {item.title}
              </span>
            </span>

            {/* 가격 */}
            <strong className="
              text-sm font-bold text-gray-900 shrink-0 ml-2
              group-hover:text-blue-700
            ">
              {item.price}
            </strong>
          </Link>
        ))}
      </div>
    </aside>
  );
};

export default PopularAuctionSidebar;