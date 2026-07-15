// src/pages/landing/LandingPage.jsx
//
// LandingPage는 컨텐츠 조합만 담당합니다.
// - 헤더/푸터: @layouts/user/headers/LandingHeader, @layouts/user/footers/MainFooter
//   (LandingLayout에서 이미 렌더링됨 — 이 페이지에서는 다루지 않음)
// - 컨텐츠 컴포넌트: @components/landing 이하에서 가져옴

import NoticeStrip  from '@components/landing/NoticeStrip';
import QuickActions from '@components/landing/QuickActions';

import ScaledStage        from '@components/landing/sections/ScaledStage';
import HeroSection        from '@components/landing/sections/HeroSection';
import ServiceMenuSection from '@components/landing/sections/ServiceMenuSection';
import AuctionSection     from '@components/landing/sections/AuctionSection';
import NewServiceSection  from '@components/landing/sections/NewServiceSection';

// ──────────────────────────────────────────
// LandingPage
// ──────────────────────────────────────────
const LandingPage = () => {
  return (
    <>
      {/* 1. 상단 공지 띠 (닫기/세션 저장 기능 포함) */}
      <NoticeStrip
        badge="점검"
        text="서비스 점검 안내 · 6월 22일 02:00~04:00 포인트 충전 및 환전 메뉴 점검"
        link="/customersupport/notice"
      />

      {/* 2~5. 히어로 / 서비스메뉴+HOT ITEM / 신규·마감임박 경매 / 신규 서비스요청 */}
      <ScaledStage>
        <HeroSection />
        <ServiceMenuSection />
        <AuctionSection />
        <NewServiceSection />
      </ScaledStage>

      {/* 6. 플로팅 퀵 액션 (로그인 게이트 로직 포함) */}
      <QuickActions />
    </>
  );
};

export default LandingPage;
