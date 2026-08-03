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
import { useNavigate, useSearchParams } from "react-router-dom";
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
import SettlementListPage from "@pages/user/settlement/SettlementListPage";
import MyReportListPage from "@pages/user/report/MyReportListPage";
import ReportFormPage from "@pages/user/report/ReportFormPage";
import MyQuoteListPage from "@pages/provider/MyQuoteListPage";
import ReviewListPage from "@pages/user/ReviewListPage";
import { useAuth } from "@hooks/useAuth";
import { useMyProviderApplications } from "@hooks/useProviderApplications";
import { confirm } from "@utils/common";

const MYPAGE_SECTION_QUERY_VALUES = new Set([
  "active-auctions",
  "auction-bids",
  "auction-sales",
  "wishlist",
  "chat",
  "wallet",
  "profile",
  "quote",
  "review",
  "service-trade",
  "settlement",
  "service-chat",
  "received-review",
  "report-list",
  "report-form",
]);

const PROVIDER_ONLY_SECTION_QUERY_VALUES = new Set([
  "quote",
  "service-trade",
  "settlement",
  "service-chat",
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
    if (nextSection === activeSection) return undefined;

    const animationFrameId = window.requestAnimationFrame(() => {
      setActiveSection(nextSection);
      if (requestedSection && !requestedSectionAllowed) {
        setSearchParams({}, { replace: true });
      }
    });
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [
    activeSection,
    initialSection,
    isProvider,
    requestedSection,
    setSearchParams,
  ]);

  const [selectedChatTradeId, setSelectedChatTradeId] = useState("");
  const [selectedPurchaseTradeId, setSelectedPurchaseTradeId] = useState("");
  const [selectedSalesTradeId, setSelectedSalesTradeId] = useState("");
  const [chatReturnSection, setChatReturnSection] = useState("");

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
              onSwitchToGeneral={handleSwitchToGeneral}
              onOpenSection={handleSelectSection}
            />
          )}
          {activeSection === "profile" && (
            isProvider
              ? <ProviderProfilePage embedded />
              : <MyPageProfileEdit user={user} />
          )}
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
          {activeSection === "wishlist" && <AuctionFavoritesPage />}
          {activeSection === "wallet" && <PointWalletPage embedded />}
          {activeSection === "quote" && isProvider && <MyQuoteListPage embedded />}
          {!isProvider && activeSection === "review" && <ReviewListPage />}
          {activeSection === "report-list" && <MyReportListPage embedded />}
          {activeSection === "report-form" && <ReportFormPage embedded />}
          {isProvider && activeSection === "service-trade" && (
            <ProviderEmbeddedSection
              title="서비스 거래"
              description="진행 중이거나 완료된 서비스 거래를 확인합니다."
              emptyText="아직 표시할 서비스 거래 내역이 없습니다."
            />
          )}
          {isProvider && activeSection === "settlement" && <SettlementListPage embedded />}
          {isProvider && activeSection === "service-chat" && (
            <ProviderEmbeddedSection
              title="서비스 채팅"
              description="서비스 요청자와 나눈 채팅방을 확인합니다."
              emptyText="아직 표시할 서비스 채팅이 없습니다."
            />
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
