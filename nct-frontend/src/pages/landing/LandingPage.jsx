// src/pages/landing/LandingPage.jsx
//
// LandingPage는 컨텐츠 조합만 담당합니다.
// - 헤더/푸터: @layouts/user/headers/Header, @layouts/user/footers/Footer
//   (LandingLayout에서 이미 렌더링됨 — 이 페이지에서는 다루지 않음)
// - 컨텐츠 컴포넌트: @components/landing 이하에서 가져옴

import NoticeStrip  from '@components/landing/NoticeStrip';
import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { fetchAuctions } from '@api/auctionApi';
import {
  toLandingAuctionItem,
  toLandingPopularAuction,
} from '@utils/landingCuration';

import HeroSection        from '@components/landing/sections/HeroSection';
import ServiceMenuSection from '@components/landing/sections/ServiceMenuSection';
import AuctionSection     from '@components/landing/sections/AuctionSection';
import MobileLandingSections from '@components/landing/sections/MobileLandingSections';

const LandingPage = () => {
  const { isProvider } = useAuth();

  // 훅은 조건과 무관하게 항상 호출 (Rules of Hooks)
  const latestAuctionQuery = useQuery({
    queryKey: ['landing-curation', 'auctions', 'latest'],
    queryFn: () => fetchAuctions({
      status: 'AUCC0002',
      sort: 'latest',
      page: 1,
      size: 8,
    }),
    staleTime: 30 * 1000,
    enabled: !isProvider,
  });
  const closingAuctionQuery = useQuery({
    queryKey: ['landing-curation', 'auctions', 'closing'],
    queryFn: () => fetchAuctions({
      status: 'AUCC0002',
      sort: 'deadline',
      endingSoonOnly: true,
      page: 1,
      size: 8,
    }),
    staleTime: 30 * 1000,
    enabled: !isProvider,
  });
  const popularAuctionQuery = useQuery({
    queryKey: ['landing-curation', 'auctions', 'popular'],
    queryFn: () => fetchAuctions({ status: 'AUCC0002', sort: 'popular', page: 1, size: 10 }),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    enabled: !isProvider,
  });
  const latestAuctions = useMemo(
    () => (latestAuctionQuery.data?.items || []).map(toLandingAuctionItem),
    [latestAuctionQuery.data?.items],
  );
  const closingAuctions = useMemo(
    () => (closingAuctionQuery.data?.items || []).map(toLandingAuctionItem),
    [closingAuctionQuery.data?.items],
  );
  const popularAuctions = useMemo(
    () => (popularAuctionQuery.data?.items || []).map(toLandingPopularAuction),
    [popularAuctionQuery.data?.items],
  );
  // 모든 훅 호출 완료 후 제공자 리다이렉트
  if (isProvider) {
    return <Navigate to="/user/mypage" replace />;
  }

  return (
    <>
      {/* 1. 상단 공지 띠 */}
      <NoticeStrip
        badge="점검"
        text="서비스 점검 안내 · 6월 22일 02:00~04:00 포인트 충전 및 환전 메뉴 점검"
        link="/customersupport/notice"
      />

      {/* 2. 히어로 (데스크톱, lg 이상) — 반응형 레이아웃, ScaledStage 미사용 */}
      <div className="hidden lg:block">
        <HeroSection
          hotItems={popularAuctions}
          hotItemsError={popularAuctionQuery.isError}
          hotItemsLoading={popularAuctionQuery.isLoading}
        />
      </div>

      {/* 3~4. 서비스 요청 진입+HOT ITEM / 신규·마감 임박 경매 (데스크톱, lg 이상) */}
      <div className="hidden lg:block">
        <ServiceMenuSection
          hotItems={popularAuctions}
          isError={popularAuctionQuery.isError}
          isLoading={popularAuctionQuery.isLoading}
        />
        <AuctionSection
          closingItems={closingAuctions}
          closingError={closingAuctionQuery.isError}
          closingLoading={closingAuctionQuery.isLoading}
          newItems={latestAuctions}
          newError={latestAuctionQuery.isError}
          newLoading={latestAuctionQuery.isLoading}
        />
      </div>

      {/* 태블릿/모바일 전용 반응형 레이아웃 */}
      <div className="lg:hidden">
        <MobileLandingSections
          closingAuctionItems={closingAuctions}
          closingAuctionError={closingAuctionQuery.isError}
          closingAuctionLoading={closingAuctionQuery.isLoading}
          hotItems={popularAuctions}
          isHotAuctionError={popularAuctionQuery.isError}
          isHotAuctionLoading={popularAuctionQuery.isLoading}
          newAuctionItems={latestAuctions}
          newAuctionError={latestAuctionQuery.isError}
          newAuctionLoading={latestAuctionQuery.isLoading}
        />
      </div>

    </>
  );
};

export default LandingPage;
