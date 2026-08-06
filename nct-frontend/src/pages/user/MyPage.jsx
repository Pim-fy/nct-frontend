// src/pages/user/MyPage.jsx
//
// Figma: 에누리컷_디자인시안
//   - MY 홈 탭(일반):      node-id 18:2
//   - 프로필수정 탭(일반):   node-id 28:12
//   - MY 홈(제공자모드):     node-id 57:495
// - 절대좌표(ScaledStage) 방식 → 반응형 Flex 레이아웃으로 전환.
//   사이드바: 데스크톱(lg+) 좌측 고정 컬럼 / 모바일 상단 가로 스크롤 탭.
//   콘텐츠: 우측 flex-1 영역.
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
// 전역 브레드크럼 (BJN, 260805): 마이페이지는 URL만으로 위치 표현이 안 되는 화면이라 오버라이드 사용
import { useBreadcrumbOverride } from "@components/common/breadcrumb/BreadcrumbContext";
import { HOME_ITEM, buildMyPageTrail } from "@components/common/breadcrumb/breadcrumbRoutes";
import MyPageSidebar from "@components/mypage/MyPageSidebar";
import MyPageDashboard from "@components/mypage/MyPageDashboard";
import MyPageProfileEdit from "@components/mypage/MyPageProfileEdit";
import MyPageProviderDashboard from "@components/mypage/MyPageProviderDashboard";
import ProviderEmbeddedSection from "@components/mypage/ProviderEmbeddedSection";
import ProviderReceivedReviewSection from "@components/mypage/ProviderReceivedReviewSection";
import MyPageTradeChatList from "@components/mypage/MyPageTradeChatList";
import ProviderProfilePage from "@pages/provider/ProviderProfilePage";
import TradeChat from "@pages/trade/TradeChat";
import MyBidHistoryPage from "@pages/user/MyBidHistoryPage";
import MyActiveAuctionPage from "@pages/user/MyActiveAuctionPage";
import AuctionFavoritesPage from "@pages/auction/AuctionFavoritesPage";
import TradeHistory from "@pages/trade/TradeHistory";
import TradeDetailBuyer from "@pages/trade/TradeDetailBuyer";
import TradeDetailSeller from "@pages/trade/TradeDetailSeller";
import MyProductList from "@components/product/MyProductList";
import PointWalletPage from "@pages/user/point/PointWalletPage";
import MyReportListPage from "@pages/user/report/MyReportListPage";
import ReportFormPage from "@pages/user/report/ReportFormPage";
import MyQuoteListPage from "@pages/provider/MyQuoteListPage";
import MyServiceRequestListPage from "@pages/service/MyServiceRequestListPage";
import MyServiceTradeListPage from "@pages/service/MyServiceTradeListPage";
import ReviewListPage from "@pages/user/ReviewListPage";
import { useAuth } from "@hooks/useAuth";
import { useMyProviderApplications } from "@hooks/useProviderApplications";
import { confirm } from "@utils/common";

const MYPAGE_SECTION_QUERY_VALUES = new Set([
  "active-auctions",
  "auction-bids",
  "auction-sales",
  "service-requests",
  "wishlist",
  "chat",
  "wallet",
  "profile",
  "provider-profile",
  "quote",
  "review",
  "service-trade",
  "received-review",
  "report-list",
  "report-form",
]);

const PROVIDER_ONLY_SECTION_QUERY_VALUES = new Set([
  "provider-profile",
  "quote",
  "received-review",
]);

const isAllowedSection = (section, isProvider) => (
  MYPAGE_SECTION_QUERY_VALUES.has(section)
  && (isProvider || !PROVIDER_ONLY_SECTION_QUERY_VALUES.has(section))
);

export default function MyPage({
  initialSection = "home",
  previewTrades = false,
}) {
  // isProvider: 현재 로그인 역할이 제공자(ROLE_SERVICE)인지 — 서버가 내려준 실제 역할 기준.
  // 예전에는 localStorage 가짜 플래그(providerMode.js)로 화면만 바꿨는데,
  // 백엔드 모드전환 API(F-PROV-008)와 실연동하면서 역할값 하나로 판단하도록 교체(2026-07-24).
  const { user, isProvider, switchMode, logout } = useAuth();
  const { data: myProviderApps = [] } = useMyProviderApplications({
    enabled: !!user && !isProvider,
  });
  const isProviderApproved = myProviderApps.some((app) => app.statusCode === 'PRVC0003');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get("section");
  const [activeSection, setActiveSection] = useState(
    isAllowedSection(requestedSection, isProvider)
      ? requestedSection
      : initialSection,
  );
  useEffect(() => {
    const requestedSectionAllowed = isAllowedSection(requestedSection, isProvider);
    const nextSection = requestedSectionAllowed ? requestedSection : initialSection;

    // 함수형 업데이트로 activeSection을 읽지 않아, 이 effect가 activeSection 변경 자체에는
    // 반응하지 않는다 — 사이드바 클릭처럼 이미 URL과 동기화된 내부 전환에서 불필요하게
    // 재검증이 도는 걸 막는다 (재검증은 URL/역할이 실제로 바뀔 때만 필요).
    const animationFrameId = window.requestAnimationFrame(() => {
      setActiveSection((prevSection) => (
        nextSection === prevSection ? prevSection : nextSection
      ));
      if (requestedSection && !requestedSectionAllowed) {
        setSearchParams({}, { replace: true });
      }
    });
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [initialSection, isProvider, requestedSection, setSearchParams]);

  const [selectedChatTradeId, setSelectedChatTradeId] = useState("");
  const [selectedPurchaseTradeId, setSelectedPurchaseTradeId] = useState("");
  const [selectedSalesTradeId, setSelectedSalesTradeId] = useState("");
  const [chatReturnSection, setChatReturnSection] = useState("");

  // 전역 브레드크럼 (BJN, 260805): 로컬 state로 거래 상세가 열려 있을 때만
  // "홈 > 마이페이지 > 섹션 > 거래 상세" 트레일을 직접 지정한다 (닫히면 자동 해제).
  // 섹션 목록 화면 자체는 브레드크럼 비대상이라 아무것도 지정하지 않는다.
  useBreadcrumbOverride(
    selectedPurchaseTradeId
      ? [HOME_ITEM, ...buildMyPageTrail("auction-bids"), { label: "거래 상세" }]
      : selectedSalesTradeId
        ? [HOME_ITEM, ...buildMyPageTrail("auction-sales"), { label: "거래 상세" }]
        : null,
  );

  // 전역 브레드크럼 (BJN, 260805): 브레드크럼 링크처럼 "같은 마이페이지 URL로의 재이동"도
  // 새 history 항목이 생기므로, 이동이 일어나면 열려 있던 거래 상세를 닫아 목록으로 돌아가게 한다.
  // (사이드바 클릭은 handleSelectSection에서 이미 닫고 있어 중복 실행돼도 무해)
  const { key: locationKey } = useLocation();
  useEffect(() => {
    setSelectedPurchaseTradeId("");
    setSelectedSalesTradeId("");
  }, [locationKey]);

  // 임시저장·외부 링크 등으로 이 페이지에 진입할 때 이전 페이지의 스크롤 위치가 남지 않도록 최상단으로 이동한다.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // 목록에서 상세를 열 때 이전 목록의 스크롤 위치가 남지 않도록 렌더링 뒤 본문 최상단으로 이동한다.
  const handleOpenPurchaseTradeDetail = (tradeId) => {
    setSelectedPurchaseTradeId(tradeId);
  };

  const handleOpenSalesTradeDetail = (tradeId) => {
    setSelectedSalesTradeId(tradeId);
  };

  useEffect(() => {
    if (selectedPurchaseTradeId || selectedSalesTradeId) {
      window.scrollTo(0, 0);
    }
  }, [selectedPurchaseTradeId, selectedSalesTradeId]);

  // 메뉴를 옮기면 열려 있던 마이페이지 채팅 대화를 닫는다.
  const handleSelectSection = (section) => {
    setActiveSection(section);
    if (MYPAGE_SECTION_QUERY_VALUES.has(section)) {
      setSearchParams({ section });
    } else {
      setSearchParams({});
    }
    if (section !== "chat") {
      setSelectedChatTradeId("");
      setChatReturnSection("");
    }
    if (section !== "auction-bids") {
      setSelectedPurchaseTradeId("");
    }
    if (section !== "auction-sales") {
      setSelectedSalesTradeId("");
    }
  };

  // 제공자 모드 전환 (F-PROV-008): 서버에 실제 역할 전환을 요청한다.
  // 제공자 권한 여부는 프론트가 미리 알 수 없으므로(서버 DB의 승인 상태 기준)
  // 일단 호출하고, 권한이 없어 실패하면 신청 페이지로 안내한다.
  const handleProviderSwitchRequest = async () => {
    try {
      await switchMode("SERVICE");
      setActiveSection("home");
      setSearchParams({});
    } catch {
      const ok = await confirm({
        title: "제공자 신청이 필요합니다",
        text: "제공자 전환은 제공자 신청 후 이용할 수 있어요. 신청 페이지로 이동하시겠습니까?",
        icon: "info",
        confirmButtonText: "신청하기",
        cancelButtonText: "취소",
      });
      if (ok) navigate("/provider/apply");
    }
  };

  // 일반 모드로 복귀 — 이쪽은 권한 검사가 없어 실패할 일이 거의 없다.
  const handleSwitchToGeneral = async () => {
    await switchMode("USER");
    setActiveSection("home");
    setSearchParams({});
  };

  // @ai_generated: 공통 container를 사용해 헤더와 마이페이지의 좌우 시작선을 일치시킨다.
  return (
    <div className="container py-6 lg:py-10">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start ">
        <MyPageSidebar
          mode={isProvider ? "provider" : "general"}
          activeSection={activeSection}
          onSelect={handleSelectSection}
          onRequestProviderSwitch={handleProviderSwitchRequest}
        />
        <div className="flex-1 min-w-0">
          {activeSection === "home" && !isProvider && (
            <MyPageDashboard
              user={user}
              isProviderApproved={isProviderApproved}
              onLogout={logout}
              onRequestProviderSwitch={handleProviderSwitchRequest}
              onOpenAuctionBids={() => setActiveSection("auction-bids")}
            />
          )}
          {activeSection === "home" && isProvider && (
            <MyPageProviderDashboard
              user={user}
              onLogout={logout}
              onSwitchToGeneral={handleSwitchToGeneral}
              onOpenSection={handleSelectSection}
            />
          )}
          {activeSection === "profile" && <MyPageProfileEdit user={user} />}
          {isProvider && activeSection === "provider-profile" && <ProviderProfilePage embedded />}
          {activeSection === "active-auctions" && <MyActiveAuctionPage />}
          {activeSection === "auction-bids" && (
            selectedPurchaseTradeId ? (
              <TradeDetailBuyer
                embedded
                tradeId={selectedPurchaseTradeId}
                onBack={() => setSelectedPurchaseTradeId("")}
                onOpenChat={(tradeId) => {
                  setSelectedChatTradeId(tradeId);
                  setChatReturnSection("auction-bids");
                  setActiveSection("chat");
                }}
              />
            ) : (
              <TradeHistory
                embedded
                fixedRole="BUYER"
                preview={previewTrades}
                returnSection="auction-bids"
                onOpenTradeDetail={handleOpenPurchaseTradeDetail}
              />
            )
          )}
          {activeSection === "auction-sales" && (
            selectedSalesTradeId ? (
              <TradeDetailSeller
                embedded
                tradeId={selectedSalesTradeId}
                onBack={() => setSelectedSalesTradeId("")}
                onOpenChat={(tradeId) => {
                  setSelectedChatTradeId(tradeId);
                  setChatReturnSection("auction-sales");
                  setActiveSection("chat");
                }}
              />
            ) : (
              <MyProductList embedded onOpenTradeDetail={handleOpenSalesTradeDetail} />
            )
          )}
          {activeSection === "service-requests" && <MyServiceRequestListPage embedded />}
          {activeSection === "wishlist" && <AuctionFavoritesPage embedded />}
          {activeSection === "wallet" && <PointWalletPage embedded />}
          {activeSection === "quote" && isProvider && <MyQuoteListPage embedded />}
          {!isProvider && activeSection === "review" && <ReviewListPage />}
          {activeSection === "report-list" && <MyReportListPage embedded />}
          {activeSection === "report-form" && <ReportFormPage embedded />}
          {activeSection === "service-trade" && (
            <MyServiceTradeListPage fixedRole={isProvider ? "PROVIDER" : "REQUESTER"} />
          )}
          {isProvider && activeSection === "received-review" && <ProviderReceivedReviewSection />}
          {/* 기존 경로로 진입한 경우에도 입찰 내역을 안전하게 표시한다. */}
          {activeSection === "auction-history" && <MyBidHistoryPage />}
          {/* 개발 환경에서는 거래내역과 동일한 미리보기 채팅 데이터를 사용한다. */}
          {activeSection === "chat" && (
            <TradeChat
              embedded
              preview={previewTrades}
              tradeId={selectedChatTradeId || undefined}
              showRoomList
              backLabel={chatReturnSection ? "거래 상세" : undefined}
              onBack={chatReturnSection ? () => {
                setSelectedChatTradeId("");
                setActiveSection(chatReturnSection);
                setChatReturnSection("");
              } : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
}
