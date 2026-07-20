// src/pages/user/MyPage.jsx
//
// Figma: 에누리컷_디자인시안
//   - MY 홈 탭(일반):      node-id 18:2
//   - 프로필수정 탭(일반):   node-id 28:12
//   - MY 홈(제공자모드):     node-id 57:495
// - 이 페이지는 UserLayout(<MainHeader />/<MainFooter />) 안에서 렌더링되므로
//   Figma 프레임의 HEADER/FOOTER 구간은 그대로 옮기지 않고, LEFTMENU + CONTENTS 구간만 구현한다.
// - 두 탭(MY 홈/프로필수정)은 Figma에서는 별도 프레임이지만, 실제로는 같은 사이드바를 공유하는
//   한 페이지의 섹션 전환이라 라우트를 나누지 않고 내부 state로 전환한다(ReviewListPage의 탭 전환과 동일 패턴).
// - "일반 ↔ 제공자" 모드 전환도 마찬가지로 실제 회원 역할 전환 API가 아직 없어(F-USR 담당자 영역),
//   @utils/providerMode 의 로컬 저장소 플래그로만 구현했다. 실제 API가 붙으면 그 유틸을 지우고
//   useAuth()의 user.role 등으로 대체한다.
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ScaledStage from "@components/landing/sections/ScaledStage";
import MyPageSidebar from "@components/mypage/MyPageSidebar";
import MyPageDashboard from "@components/mypage/MyPageDashboard";
import MyPageProfileEdit from "@components/mypage/MyPageProfileEdit";
import MyPageProviderDashboard from "@components/mypage/MyPageProviderDashboard";
import MyBidHistoryPage from "@pages/user/MyBidHistoryPage";
import { useAuth } from "@hooks/useAuth";
import { confirm } from "@utils/common";
import { isProviderAccount, MYPAGE_MODE_EVENT } from "@utils/providerMode";

const TOP_CROP = 82;
const HOME_CANVAS_HEIGHT = 1312;          // node 18:2 FOOTER top(1121) + height(191)
const PROFILE_CANVAS_HEIGHT = 1092;       // node 28:12 FOOTER top(901) + height(191)
const PROVIDER_HOME_CANVAS_HEIGHT = 2056; // node 57:495 FOOTER top(1865) + height(191)
const AUCTION_CANVAS_HEIGHT = 1600;       // 경매 거래내역 — 페이지네이션 목록 기준 넉넉하게

export default function MyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("general"); // 'general' | 'provider'
  const [activeSection, setActiveSection] = useState("home");
  const [providerAccount] = useState(isProviderAccount);

  // 모드를 바꾸면 두 모드 다 "MY 홈"부터 보여준다 (프로필 탭 상태를 다음 모드로 들고 가지 않음).
  const switchMode = (nextMode) => {
    setMode(nextMode);
    setActiveSection("home");
  };

  // LEFTMENU/상단 "제공자 전환" 버튼 공용 핸들러.
  // - 이미 제공자 권한이 있는 계정(@utils/providerMode 로컬 플래그)이면 바로 제공자모드로 전환한다.
  // - 아니면 신청 안내 팝업을 띄우고, 확인 시 제공자 신청 페이지로 보낸다.
  //   (실제 신청 승인 API가 없어 이 플래그는 콘솔에서 직접 켜야 한다: localStorage.setItem('isProviderAccount','true'))
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

  // SiteHeader(마이페이지 팝업)는 다른 컴포넌트 트리라 이 페이지의 state를 직접 바꿀 수 없어,
  // 커스텀 이벤트로 모드 전환을 요청한다 (이미 /user/mypage에 있는 상태에서 헤더 버튼을 눌러도 반영되도록).
  useEffect(() => {
    const handleModeRequest = (e) => switchMode(e.detail);
    window.addEventListener(MYPAGE_MODE_EVENT, handleModeRequest);
    return () => window.removeEventListener(MYPAGE_MODE_EVENT, handleModeRequest);
  }, []);

  const canvasHeight =
    activeSection === "profile"
      ? PROFILE_CANVAS_HEIGHT
      : activeSection === "auction-history"
        ? AUCTION_CANVAS_HEIGHT
        : mode === "provider"
          ? PROVIDER_HOME_CANVAS_HEIGHT
          : HOME_CANVAS_HEIGHT;

  return (
    <ScaledStage canvasHeight={canvasHeight} topCrop={TOP_CROP}>
      <MyPageSidebar
        mode={mode}
        activeSection={activeSection}
        onSelect={setActiveSection}
        onRequestProviderSwitch={handleProviderSwitchRequest}
      />

      {activeSection === "home" && mode === "general" && (
        <MyPageDashboard user={user} onRequestProviderSwitch={handleProviderSwitchRequest} />
      )}
      {activeSection === "home" && mode === "provider" && (
        <MyPageProviderDashboard user={user} onSwitchToGeneral={() => switchMode("general")} />
      )}
      {activeSection === "profile" && <MyPageProfileEdit user={user} />}
      {activeSection === "auction-history" && (
        <div style={{ position: "absolute", left: 430, top: 137, width: 1440 }}>
          <MyBidHistoryPage />
        </div>
      )}
      {/* 우측 플로팅 퀵메뉴는 SiteHeader(<QuickActions />)가 모든 페이지 공용으로 렌더링한다.
          예전엔 이 페이지 안에 ScaledStage 절대좌표로 직접 그렸는데, 탭/모드에 따라 캔버스 높이가
          바뀌다 보니 스케일이 달라져 위치가 어긋나 보였다(메인페이지는 고정 캔버스라 문제가 없었음). */}
    </ScaledStage>
  );
}
