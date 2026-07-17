// src/pages/user/MyPage.jsx
//
// Figma: 에누리컷_디자인시안
//   - MY 홈 탭:     node-id 18:2
//   - 프로필수정 탭: node-id 28:12
// - 이 페이지는 UserLayout(<MainHeader />/<MainFooter />) 안에서 렌더링되므로
//   Figma 프레임의 HEADER/FOOTER 구간은 그대로 옮기지 않고, LEFTMENU + CONTENTS 구간만 구현한다.
// - 두 탭(MY 홈/프로필수정)은 Figma에서는 별도 프레임이지만, 실제로는 같은 사이드바를 공유하는
//   한 페이지의 섹션 전환이라 라우트를 나누지 않고 내부 state로 전환한다(ReviewListPage의 탭 전환과 동일 패턴).
import React, { useState } from "react";
import { Gavel, MessageSquarePlus } from "lucide-react";
import ScaledStage from "@components/landing/sections/ScaledStage";
import MyPageSidebar from "@components/mypage/MyPageSidebar";
import MyPageDashboard from "@components/mypage/MyPageDashboard";
import MyPageProfileEdit from "@components/mypage/MyPageProfileEdit";
import { useAuth } from "@hooks/useAuth";
import { toast } from "@utils/common";

const TOP_CROP = 82;
const HOME_CANVAS_HEIGHT = 1312;    // node 18:2 FOOTER top(1121) + height(191)
const PROFILE_CANVAS_HEIGHT = 1092; // node 28:12 FOOTER top(901) + height(191)

export default function MyPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("home");

  const canvasHeight = activeSection === "profile" ? PROFILE_CANVAS_HEIGHT : HOME_CANVAS_HEIGHT;

  return (
    <ScaledStage canvasHeight={canvasHeight} topCrop={TOP_CROP}>
      <MyPageSidebar activeSection={activeSection} onSelect={setActiveSection} />

      {activeSection === "home" && <MyPageDashboard user={user} />}
      {activeSection === "profile" && <MyPageProfileEdit user={user} />}

      {/* 플로팅 퀵메뉴 (Figma node 18:395 - 경매등록/서비스요청) */}
      <div className="absolute left-[1805px] top-[901px] flex flex-col gap-4" data-name="quickmenu">
        <button
          type="button"
          onClick={() => toast({ icon: "info", title: "경매등록 기능은 준비 중입니다." })}
          className="size-[85px] rounded-full bg-[#0064ff] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.2)] border-none cursor-pointer text-white flex flex-col items-center justify-center gap-1 font-['Noto_Sans_KR:Bold'] font-bold text-[14px] tracking-[-1.12px] hover:brightness-110 transition"
        >
          <Gavel size={17} />
          <span className="leading-tight text-center">경매<br />등록</span>
        </button>
        <button
          type="button"
          onClick={() => toast({ icon: "info", title: "서비스요청 기능은 준비 중입니다." })}
          className="size-[85px] rounded-full bg-[#776bf8] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.2)] border-none cursor-pointer text-white flex flex-col items-center justify-center gap-1 font-['Noto_Sans_KR:Bold'] font-bold text-[14px] tracking-[-1.12px] hover:brightness-110 transition"
        >
          <MessageSquarePlus size={17} />
          <span className="leading-tight text-center">서비스<br />요청</span>
        </button>
      </div>
    </ScaledStage>
  );
}
