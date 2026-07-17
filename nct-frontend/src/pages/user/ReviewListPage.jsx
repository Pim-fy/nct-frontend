// src/pages/user/ReviewListPage.jsx
//
// Figma: 에누리컷_디자인시안 / 21_review_list (node-id 42:289)
// - 이 페이지는 UserLayout(<MainHeader />/<MainFooter />) 안에서 렌더링되므로
//   Figma 프레임의 HEADER/FOOTER 구간은 그대로 옮기지 않고, CONTENTS 구간만 구현한다.
// - 절대좌표(1920px 고정) 포팅 + ScaledStage 로 스케일링하는 방식은
//   @components/landing/sections 의 기존 포팅 방식을 그대로 따른 것이다.
import React, { useState } from "react";
import ScaledStage from "@components/landing/sections/ScaledStage";
import ReviewableItemCard from "@components/review/ReviewableItemCard";
import { assets } from "@components/review/assets";

// Figma 프레임 기준: 헤더 0~82, 컨텐츠, 푸터 1033~1224 (여기서는 자체 헤더/푸터를 쓰므로 그 구간만 스케일링)
const CANVAS_HEIGHT = 1033;
const TOP_CROP = 82;

// TODO: 백엔드 리뷰 도메인이 아직 없어(현재 auth/member 모듈만 구현됨) 정적 데이터로 구성했다.
// reviewApi.getReviews() 가 "작성가능/작성완료" 구분을 지원하게 되면 이 배열을 API 응답으로 교체한다.
const WRITABLE_ITEMS = [
  {
    id: 1,
    top: 256,
    thumbnail: assets.reviewItem1,
    title: "피씨오브플레이어 컴퓨터 게이밍 조립컴퓨터",
    dealType: "goods",
    partyLabel: "판매자",
    partyName: "이**",
    completedDate: "2026-06-18",
  },
  {
    id: 2,
    top: 491,
    thumbnail: assets.reviewItem2,
    title: "발받침 포함 각도 조절 가능 게이밍의자 회전 컴포트 컴퓨터 의자 승강 가능한 사무실 의자",
    dealType: "goods",
    partyLabel: "판매자",
    partyName: "이**",
    completedDate: "2026-06-18",
  },
  {
    id: 3,
    top: 726,
    thumbnail: assets.reviewItem3,
    title: "성수동 원룸 이사 운반",
    dealType: "service",
    partyLabel: "제공자",
    partyName: "이**",
    completedDate: "2026-06-18",
  },
];

// Figma 프레임에는 "내가작성한 리뷰"가 비활성 탭이라 실제 디자인이 export되지 않았다.
// 실제 화면 디자인이 나오면 이 배열과 카드 액션 라벨을 그 디자인에 맞춰 교체해야 한다.
const WRITTEN_ITEMS = [];

const TABS = [
  { key: "writable", label: "작성가능한 리뷰", count: WRITABLE_ITEMS.length, left: 174, underline: { left: 173, width: 148 } },
  { key: "written",  label: "내가작성한 리뷰", count: WRITTEN_ITEMS.length,  left: 348, underline: { left: 348, width: 170 } },
];

export default function ReviewListPage() {
  const [activeTab, setActiveTab] = useState("writable");
  const activeTabMeta = TABS.find((tab) => tab.key === activeTab);
  const items = activeTab === "writable" ? WRITABLE_ITEMS : WRITTEN_ITEMS;

  const handleWriteReview = (item) => {
    // TODO: 리뷰 작성 폼(21_review_write) 라우트로 연결
    console.log("리뷰 작성 대상:", item);
  };

  return (
    <ScaledStage canvasHeight={CANVAS_HEIGHT} topCrop={TOP_CROP}>
      <p className="absolute font-['Noto_Sans_KR:Bold'] font-bold left-[173px] text-[25px] text-black top-[137px] whitespace-nowrap">
        리뷰작성
      </p>

      {/* 탭 */}
      <div className="absolute contents left-[173px] top-[202px]" data-name="tab">
        <div
          className="absolute bg-[#0064ff] h-[2px] transition-[left,width] duration-150"
          style={{ left: activeTabMeta.underline.left, width: activeTabMeta.underline.width, top: 236 }}
        />
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="absolute bg-transparent border-none cursor-pointer p-0 flex items-center gap-2"
              style={{ left: tab.left, top: 200 }}
            >
              <span
                className={`font-['Noto_Sans_KR:Bold'] font-bold text-[18px] whitespace-nowrap ${
                  isActive ? "text-[#0064ff]" : "text-[#4e4e4e]"
                }`}
              >
                {tab.label}
              </span>
              <span
                className="font-['Noto_Sans_KR:Bold'] font-bold text-[14px] text-white rounded-[5px] flex items-center justify-center"
                style={{ minWidth: 20, height: 20, padding: "0 4px", background: isActive ? "#0064ff" : "#4e4e4e" }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 항목 리스트 */}
      {items.length === 0 ? (
        <p className="absolute left-[173px] top-[300px] text-[#888] text-[15px]">
          아직 작성한 리뷰가 없습니다.
        </p>
      ) : (
        items.map((item) => (
          <ReviewableItemCard
            key={item.id}
            top={item.top}
            thumbnail={item.thumbnail}
            title={item.title}
            dealType={item.dealType}
            partyLabel={item.partyLabel}
            partyName={item.partyName}
            completedDate={item.completedDate}
            actionLabel={activeTab === "writable" ? "리뷰 등록" : "리뷰 보기"}
            onAction={() => handleWriteReview(item)}
          />
        ))
      )}
    </ScaledStage>
  );
}
