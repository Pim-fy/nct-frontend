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
import { useNavigate } from "react-router-dom";
import { getMyPagePath } from "@/routes/myPageRoutes";
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
import MyProductList from "@components/product/MyProductList";
import PointWalletPage from "@pages/user/point/PointWalletPage";
import MyReportListPage from "@pages/user/report/MyReportListPage";
import ReportFormPage from "@pages/user/report/ReportFormPage";
import MyInquiryListPage from "@pages/user/inquiry/MyInquiryListPage";
import MyQuoteListPage from "@pages/provider/MyQuoteListPage";
import MyServiceRequestListPage from "@pages/service/MyServiceRequestListPage";
import MyServiceTradeListPage from "@pages/service/MyServiceTradeListPage";
import ReviewListPage from "@pages/user/ReviewListPage";
import { useAuth } from "@hooks/useAuth";
import { useMyProviderApplications } from "@hooks/useProviderApplications";
import { confirm } from "@utils/common";

const MYPAGE_SECTIONS = new Set([
  "active-auctions",
  "bid-history",
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
  "inquiry-list",
]);

const PROVIDER_ONLY_SECTIONS = new Set([
  "provider-profile",
  "quote",
  "received-review",
]);

const isAllowedSection = (section, isProvider) => (
  MYPAGE_SECTIONS.has(section)
  && (isProvider || !PROVIDER_ONLY_SECTIONS.has(section))
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
  const [activeSection, setActiveSection] = useState(
    isAllowedSection(initialSection, isProvider) ? initialSection : "home",
  );
  useEffect(() => {
    const nextSection = isAllowedSection(initialSection, isProvider)
      ? initialSection
      : "home";

    // 함수형 업데이트로 activeSection을 읽지 않아, 이 effect가 activeSection 변경 자체에는
    // 반응하지 않는다 — 사이드바 클릭처럼 이미 URL과 동기화된 내부 전환에서 불필요하게
    // 재검증이 도는 걸 막는다 (재검증은 URL/역할이 실제로 바뀔 때만 필요).
    const animationFrameId = window.requestAnimationFrame(() => {
      setActiveSection((prevSection) => (
        nextSection === prevSection ? prevSection : nextSection
      ));
    });
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [initialSection, isProvider]);

  const [selectedChatTradeId, setSelectedChatTradeId] = useState("");
  const [chatReturnSection, setChatReturnSection] = useState("");
  // 사이드바 클릭마다 증가 — 콘텐츠 영역 key로 써서, 같은 섹션을 다시 눌러도 그 섹션 컴포넌트를
  // 강제로 리마운트한다(필터·검색어·페이지 등 내부 state를 처음 진입 상태로 초기화하기 위함).
  const [sectionResetKey, setSectionResetKey] = useState(0);

  // 임시저장·외부 링크 등으로 이 페이지에 진입할 때 이전 페이지의 스크롤 위치가 남지 않도록 최상단으로 이동한다.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // 사이드바 메뉴를 누르면 항상 그 섹션의 기본(목록) 화면으로 이동한다.
  // 같은 메뉴를 다시 눌러도 상세 화면에 머물러 있지 않도록, 드릴다운 상태를 무조건 초기화한다
  // (예: 판매 내역 상세를 보다가 "상품 판매 내역"을 다시 누르면 목록으로 돌아가야 한다).
  const handleSelectSection = (section) => {
    const nextSection = MYPAGE_SECTIONS.has(section) ? section : "home";
    setActiveSection(nextSection);
    navigate(getMyPagePath(nextSection));
    setSelectedChatTradeId("");
    setChatReturnSection("");
    setSectionResetKey((key) => key + 1);
    window.scrollTo(0, 0);
  };

  // 제공자 모드 전환 (F-PROV-008): 서버에 실제 역할 전환을 요청한다.
  // 제공자 권한 여부는 프론트가 미리 알 수 없으므로(서버 DB의 승인 상태 기준)
  // 일단 호출하고, 권한이 없어 실패하면 신청 페이지로 안내한다.
  const handleProviderSwitchRequest = async () => {
    try {
      await switchMode("SERVICE");
      setActiveSection("home");
      navigate(getMyPagePath("home"));
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
    navigate(getMyPagePath("home"));
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
        <div className="flex-1 min-w-0" key={sectionResetKey}>
          {activeSection === "home" && !isProvider && (
            <MyPageDashboard
              user={user}
              isProviderApproved={isProviderApproved}
              onLogout={logout}
              onRequestProviderSwitch={handleProviderSwitchRequest}
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
          {activeSection === "bid-history" && <MyBidHistoryPage />}
          {/* 담당자 7 경로 통합: 거래 상세는 식별자가 있는 전용 URL에서 열어 새로고침·뒤로가기를 보존합니다. */}
          {activeSection === "auction-bids" && (
            <TradeHistory
              embedded
              fixedRole="BUYER"
              preview={previewTrades}
              returnSection="auction-bids"
            />
          )}
          {activeSection === "auction-sales" && (
            <MyProductList />
          )}
          {activeSection === "service-requests" && <MyServiceRequestListPage embedded />}
          {activeSection === "wishlist" && <AuctionFavoritesPage embedded />}
          {activeSection === "wallet" && <PointWalletPage embedded />}
          {activeSection === "quote" && isProvider && <MyQuoteListPage embedded />}
          {!isProvider && activeSection === "review" && <ReviewListPage />}
          {activeSection === "report-list" && <MyReportListPage embedded />}
          {activeSection === "report-form" && <ReportFormPage embedded />}
          {activeSection === "inquiry-list" && <MyInquiryListPage embedded />}
          {activeSection === "service-trade" && (
            <MyServiceTradeListPage fixedRole={isProvider ? "PROVIDER" : "REQUESTER"} />
          )}
          {isProvider && activeSection === "received-review" && <ProviderReceivedReviewSection />}
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
