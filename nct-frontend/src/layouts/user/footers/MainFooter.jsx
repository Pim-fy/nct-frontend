// src/layouts/user/footers/MainFooter.jsx
import { Link } from 'react-router-dom';

/**
 * 사이트 공통 푸터 (LandingLayout, UserLayout에서 공용으로 사용)
 * Figma 디자인(jdFyM2rlNnaVPqeqUTwap3, node 201:405 "FOOTER")을 기반으로 제작.
 */

const FOOTER_LINKS = [
  { label: '서비스소개', href: '/guide' },
  { label: '이용약관', href: '/terms' },
  { label: '개인정보처리방침', href: '/privacy' },
];

const MainFooter = () => {
  return (
    <footer className="bg-[#293341] text-[rgba(255,255,255,0.8)] mt-auto pb-[60px] md:pb-0">
      <div className="container py-9">
        <div className="flex flex-wrap items-start justify-between gap-8 pt-7 pb-7">
          {/* 좌측: 로고 + 링크 */}
          <div className="flex flex-col gap-4">
            <span className="text-[20px] font-black tracking-[-2px] text-white">에누리컷</span>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] tracking-[-0.75px]">
              {FOOTER_LINKS.map((link) => (
                <Link key={link.label} to={link.href} className="text-white/80 hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </nav>

            <p className="text-[15px] leading-[1.6] tracking-[-0.75px] text-white/50 max-w-[720px]">
              에누리컷은 통신판매중개자로서 통신판매의 당사자가 아니며 개별 판매자가 제공하는 서비스에 대한 이행,
              계약사항 등과 관련한 의무와 책임은 거래당사자에게 있습니다.
            </p>
          </div>

          {/* 우측: 고객센터 */}
          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            <a href="tel:070-1234-5678" className="text-[28px] md:text-[40px] font-bold tracking-[-2px] text-white hover:text-primary-light transition-colors">
              070.1234.5678
            </a>
            <p className="text-[15px] tracking-[-0.75px] text-white/50 text-left md:text-right">
              평일 10:00 - 18:00
              <br />
              (점심시간 12:00 - 13:00 제외 · 주말/공휴일 제외)
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
