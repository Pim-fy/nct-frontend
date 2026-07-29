import { NavLink, Outlet, useLocation } from 'react-router-dom';
import './CustomerSupportLayout.css';

const CUSTOMER_SUPPORT_MENU = [
  {
    label: '공지사항',
    to: '/customersupport/notice',
    isActive: (pathname) => pathname.startsWith('/customersupport/notice'),
  },
  {
    label: '이용가이드',
    to: '/guide',
    isActive: (pathname) => pathname === '/guide',
  },
  {
    label: 'FAQ',
    to: '/customersupport/faq',
    isActive: (pathname) => pathname === '/customersupport/faq',
  },
];

/**
 * 담당자 7 · F-COM-013/F-COM-014
 * 공지사항·이용가이드·FAQ에서 마이페이지와 같은 좌측 메뉴 규격을 공유한다.
 */
const CustomerSupportLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className="customer-support-layout">
      <nav className="customer-support-sidebar" aria-label="고객센터 메뉴">
        <h1>고객센터</h1>

        <div className="customer-support-sidebar__mobile">
          {CUSTOMER_SUPPORT_MENU.map((item) => (
            <NavLink
              className={item.isActive(pathname) ? 'is-active' : undefined}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="customer-support-sidebar__desktop">
          {CUSTOMER_SUPPORT_MENU.map((item) => (
            <NavLink
              className={item.isActive(pathname) ? 'is-active' : undefined}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="customer-support-layout__content">
        <Outlet />
      </div>
    </div>
  );
};

export default CustomerSupportLayout;
