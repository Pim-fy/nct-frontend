// src/pages/user/MyPage.jsx
//
// Figma: 에누리컷_디자인시안
//   - MY 홈 탭(일반):      node-id 18:2
//   - 프로필수정 탭(일반):   node-id 28:12
//   - MY 홈(제공자모드):     node-id 57:495
// - 절대좌표(ScaledStage) 방식 → 반응형 Flex 레이아웃으로 전환.
//   사이드바: 데스크톱(lg+) 좌측 고정 컬럼 / 모바일 상단 가로 스크롤 탭.
//   콘텐츠: 우측 flex-1 영역.
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MyPageSidebar from "@components/mypage/MyPageSidebar";
import MyPageDashboard from "@components/mypage/MyPageDashboard";
import MyPageProfileEdit from "@components/mypage/MyPageProfileEdit";
import MyPageProviderDashboard from "@components/mypage/MyPageProviderDashboard";
import ProviderEmbeddedSection from "@components/mypage/ProviderEmbeddedSection";
import MyPageTradeChatList from "@components/mypage/MyPageTradeChatList";
import ProviderProfilePage from "@pages/provider/ProviderProfilePage";
import TradeChat from "@pages/trade/TradeChat";
import MyBidHistoryPage from "@pages/user/MyBidHistoryPage";
import MyActiveAuctionPage from "@pages/user/MyActiveAuctionPage";
import TradeHistory from "@pages/trade/TradeHistory";
import MyProductList from "@components/product/MyProductList";
import PointWalletPage from "@pages/user/point/PointWalletPage";
import SettlementListPage from "@pages/user/settlement/SettlementListPage";
import MyReportListPage from "@pages/user/report/MyReportListPage";
import { useAuth } from "@hooks/useAuth";
import { useMyProviderApplications } from "@hooks/useProviderApplications";
import { confirm } from "@utils/common";

const MYPAGE_SECTION_QUERY_VALUES = new Set([
  "active-auctions",
  "auction-bids",
  "auction-sales",
  "chat",
  "wallet",
  "profile",
  "quote",
  "service-trade",
  "settlement",
  "service-chat",
  "approval-category",
]);

export default function MyPage({
  initialSection = "home",
  previewTrades = false,
}) {
  // isProvider: 현재 로그인 역할이 제공자(ROLE_SERVICE)인지 — 서버가 내려준 실제 역할 기준.
  // 예전에는 localStorage 가짜 플래그(providerMode.js)로 화면만 바꿨는데,
  // 백엔드 모드전환 API(F-PROV-008)와 실연동하면서 역할값 하나로 판단하도록 교체(2026-07-24).
  const { user, isProvider, switchMode } = useAuth();
  const { data: myProviderApps = [] } = useMyProviderApplications({
    enabled: !!user && !isProvider,
  });
  const isProviderApproved = myProviderApps.some((app) => app.statusCode === 'PRVC0003');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get("section");
  const [activeSection, setActiveSection] = useState(
    MYPAGE_SECTION_QUERY_VALUES.has(requestedSection)
      ? requestedSection
      : initialSection,
  );
  const [selectedChatTradeId, setSelectedChatTradeId] = useState("");

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

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 lg:px-6 lg:py-10">
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
          {isProvider && activeSection === "quote" && (
            <ProviderEmbeddedSection
              title="견적"
              description="제출한 견적과 현재 처리 상태를 확인합니다."
              emptyText="아직 표시할 견적 내역이 없습니다."
            />
          )}
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
          {isProvider && activeSection === "approval-category" && (
            <ProviderEmbeddedSection
              title="승인 카테고리"
              description="견적을 제출할 수 있도록 승인된 서비스 분야를 확인합니다."
              emptyText="표시할 승인 카테고리가 없습니다."
            />
          )}
          {activeSection === "active-auctions" && <MyActiveAuctionPage />}
          {activeSection === "auction-bids" && (
            <TradeHistory
              embedded
              fixedRole="BUYER"
              preview={previewTrades}
              returnSection="auction-bids"
            />
          )}
          {activeSection === "auction-sales" && <MyProductList />}
          {activeSection === "wallet" && <PointWalletPage embedded />}
          {/* 기존 경로로 진입한 경우에도 입찰 내역을 안전하게 표시한다. */}
          {activeSection === "auction-history" && <MyBidHistoryPage />}
          {/* 개발 환경에서는 거래내역과 동일한 미리보기 채팅 데이터를 사용한다. */}
          {activeSection === "chat" && (
            selectedChatTradeId ? (
              <TradeChat
                embedded
                preview={previewTrades}
                tradeId={selectedChatTradeId}
                showRoomList
                onBack={() => setSelectedChatTradeId("")}
              />
            ) : (
              <MyPageTradeChatList
              preview={previewTrades}
                onOpenChatRoom={setSelectedChatTradeId}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
