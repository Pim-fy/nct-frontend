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
import MyPageSidebar from "@components/mypage/MyPageSidebar";
import MyPageDashboard from "@components/mypage/MyPageDashboard";
import MyPageProfileEdit from "@components/mypage/MyPageProfileEdit";
import MyPageProviderDashboard from "@components/mypage/MyPageProviderDashboard";
import MyBidHistoryPage from "@pages/user/MyBidHistoryPage";
import MyProductList from "@components/product/MyProductList";
import { useAuth } from "@hooks/useAuth";
import { confirm } from "@utils/common";
import { isProviderAccount, MYPAGE_MODE_EVENT } from "@utils/providerMode";

export default function MyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("general"); // 'general' | 'provider'
  const [activeSection, setActiveSection] = useState("home");
  const [providerAccount] = useState(isProviderAccount);

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
          onSelect={setActiveSection}
          onRequestProviderSwitch={handleProviderSwitchRequest}
        />
        <div className="flex-1 min-w-0">
          {activeSection === "home" && mode === "general" && (
            <MyPageDashboard user={user} onRequestProviderSwitch={handleProviderSwitchRequest} />
          )}
          {activeSection === "home" && mode === "provider" && (
            <MyPageProviderDashboard user={user} onSwitchToGeneral={() => switchMode("general")} />
          )}
          {activeSection === "profile" && <MyPageProfileEdit user={user} />}
          {activeSection === "auction-bids" && <MyBidHistoryPage />}
          {activeSection === "auction-sales" && <MyProductList />}
        </div>
      </div>
    </div>
  );
}
