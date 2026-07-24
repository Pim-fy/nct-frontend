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
import MyPageTradeChatList from "@components/mypage/MyPageTradeChatList";
import TradeChat from "@pages/trade/TradeChat";
import MyBidHistoryPage from "@pages/user/MyBidHistoryPage";
import MyActiveAuctionPage from "@pages/user/MyActiveAuctionPage";
import TradeHistory from "@pages/trade/TradeHistory";
import MyProductList from "@components/product/MyProductList";
import { useAuth } from "@hooks/useAuth";
import { confirm } from "@utils/common";
import { isProviderAccount, MYPAGE_MODE_EVENT } from "@utils/providerMode";

const MYPAGE_SECTION_QUERY_VALUES = new Set([
  "active-auctions",
  "auction-bids",
  "auction-sales",
  "chat",
]);

export default function MyPage({
  initialSection = "home",
  previewTrades = false,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState("general"); // 'general' | 'provider'
  const requestedSection = searchParams.get("section");
  const [activeSection, setActiveSection] = useState(
    MYPAGE_SECTION_QUERY_VALUES.has(requestedSection)
      ? requestedSection
      : initialSection,
  );
  const [providerAccount] = useState(isProviderAccount);
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

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setActiveSection("home");
  };

  const handleProviderSwitchRequest = async () => {
    if (providerAccount) {
      switchMode("provider");
      return;
    }
    const ok = await confirm({
      title: "제공자 신청이 필요합니다",
      text: "제공자 전환은 제공자 신청 후 이용할 수 있어요. 신청 페이지로 이동하시겠습니까?",
      icon: "info",
      confirmButtonText: "신청하기",
      cancelButtonText: "취소",
    });
    if (ok) navigate("/provider/apply");
  };

  useEffect(() => {
    const handleModeRequest = (e) => switchMode(e.detail);
    window.addEventListener(MYPAGE_MODE_EVENT, handleModeRequest);
    return () => window.removeEventListener(MYPAGE_MODE_EVENT, handleModeRequest);
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6 lg:px-6 lg:py-10">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start ">
        <MyPageSidebar
          mode={mode}
          activeSection={activeSection}
          onSelect={handleSelectSection}
          onRequestProviderSwitch={handleProviderSwitchRequest}
        />
        <div className="flex-1 min-w-0">
          {activeSection === "home" && mode === "general" && (
            <MyPageDashboard
              user={user}
              onRequestProviderSwitch={handleProviderSwitchRequest}
              onOpenAuctionBids={() => setActiveSection("auction-bids")}
            />
          )}
          {activeSection === "home" && mode === "provider" && (
            <MyPageProviderDashboard user={user} onSwitchToGeneral={() => switchMode("general")} />
          )}
          {activeSection === "profile" && <MyPageProfileEdit user={user} />}
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
