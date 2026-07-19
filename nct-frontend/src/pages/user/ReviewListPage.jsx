// src/pages/user/ReviewListPage.jsx
//
// Figma: 에누리컷_디자인시안
//   - 작성가능한 리뷰 탭: node-id 42:289
//   - 작성한 리뷰 탭:     node-id 56:138
// - 이 페이지는 UserLayout(<MainHeader />/<MainFooter />) 안에서 렌더링되므로
//   Figma 프레임의 HEADER/FOOTER 구간은 그대로 옮기지 않고, CONTENTS 구간만 구현한다.
// - 절대좌표(1920px 고정) 포팅 + ScaledStage 로 스케일링하는 방식은
//   @components/landing/sections 의 기존 포팅 방식을 그대로 따른 것이다.
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ScaledStage from "@components/landing/sections/ScaledStage";
import ReviewableItemCard from "@components/review/ReviewableItemCard";
import WrittenReviewItemCard from "@components/review/WrittenReviewItemCard";
import Pagination from "@components/common/Pagination";
import { assets } from "@components/review/assets";
import { confirm, toast } from "@utils/common";

// 탭마다 Figma 프레임 전체 높이가 달라서(항목 개수가 다름) 탭별로 다른 값을 쓴다.
// 헤더 0~82 는 공통이며, 자체 헤더를 쓰므로 그만큼만 잘라낸다(topCrop).
const TOP_CROP = 82;
const WRITABLE_CANVAS_HEIGHT = 1033; // node 42:289 FOOTER top(951) + height(82, 헤더 포함 좌표계 보정)
const WRITTEN_CANVAS_HEIGHT = 2977;  // node 56:138 FOOTER top(2786) + height(191)

const ITEM_ROW_HEIGHT = 235; // Figma 항목 간 간격 (491-256, 726-491, ... 모두 235로 일정)
const FIRST_ITEM_TOP = 256;
const PAGE_SIZE = 10; // 작성한 리뷰 탭 - Figma 페이지네이션이 5페이지/12건 기준 10건/페이지로 설계됨

// TODO: 백엔드 리뷰 목록 조회 API(reviewApi.getReviews)가 아직 이 화면에 연동되지 않아 정적 데이터로 구성했다.
// 실제 연동되면 이 배열들을 API 응답으로 교체한다.
const WRITABLE_ITEMS_SEED = [
  {
    id: 1,
    thumbnail: assets.reviewItem1,
    title: "피씨오브플레이어 컴퓨터 게이밍 조립컴퓨터",
    dealType: "goods",
    partyLabel: "판매자",
    partyName: "이**",
    completedDate: "2026-06-18",
  },
  {
    id: 2,
    thumbnail: assets.reviewItem2,
    title: "발받침 포함 각도 조절 가능 게이밍의자 회전 컴포트 컴퓨터 의자 승강 가능한 사무실 의자",
    dealType: "goods",
    partyLabel: "판매자",
    partyName: "이**",
    completedDate: "2026-06-18",
  },
  {
    id: 3,
    thumbnail: assets.reviewItem3,
    title: "성수동 원룸 이사 운반",
    dealType: "service",
    partyLabel: "제공자",
    partyName: "이**",
    completedDate: "2026-06-18",
  },
];

// Figma는 위 3건을 반복해서 12건짜리 리스트(5페이지 페이지네이션)를 보여준다 - 실제 서비스에서는
// 서로 다른 리뷰 12건이 오겠지만, 지금은 그 반복 패턴 그대로 정적 데이터를 만들었다.
const WRITTEN_ITEMS_BASE = [
  { thumbnail: assets.reviewItem1, title: "피씨오브플레이어 컴퓨터 게이밍 조립컴퓨터", dealType: "goods", rating: 4, content: "빠른 배송과 친절한 응대가 좋았습니다." },
  { thumbnail: assets.reviewItem2, title: "발받침 포함 각도 조절 가능 게이밍의자 회전 컴포트 컴퓨터 의자 승강 가능한 사무실 의자", dealType: "goods", rating: 4, content: "빠른 배송과 친절한 응대가 좋았습니다." },
  { thumbnail: assets.reviewItem3, title: "성수동 원룸 이사 운반", dealType: "service", rating: 4, content: "시간 약속을 잘 지켜주셨습니다." },
];
const WRITTEN_ITEMS_ALL = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  ...WRITTEN_ITEMS_BASE[i % WRITTEN_ITEMS_BASE.length],
}));

export default function ReviewListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("writable");
  const [writableItems, setWritableItems] = useState(WRITABLE_ITEMS_SEED);
  const [writtenItems, setWrittenItems] = useState(WRITTEN_ITEMS_ALL);
  const [page, setPage] = useState(1);

  // ReviewWritePage/ReviewEditPage 에서 navigate(..., { state: { newReview / updatedReview } })로
  // 넘겨준 값을 반영한다 - 리뷰 목록 GET API가 없어 이 화면 state만으로 "방금 등록/수정한 리뷰"를 보여준다.
  useEffect(() => {
    const { newReview, updatedReview } = location.state ?? {};
    if (newReview) {
      setWritableItems((prev) => prev.filter((i) => i.id !== newReview.id));
      setWrittenItems((prev) => [newReview, ...prev.filter((i) => i.id !== newReview.id)]);
      setActiveTab("written");
      setPage(1);
      toast({ icon: "success", title: "작성한 리뷰 목록에 추가되었습니다." });
    } else if (updatedReview) {
      setWrittenItems((prev) => prev.map((i) => (i.id === updatedReview.id ? { ...i, ...updatedReview } : i)));
      setActiveTab("written");
    }
    // 새로고침/뒤로가기 시 같은 state로 중복 반영되지 않도록 history state를 비운다.
    if (newReview || updatedReview) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = [
    { key: "writable", label: "작성가능한 리뷰", count: writableItems.length, left: 174, underline: { left: 173, width: 148 } },
    { key: "written",  label: "내가작성한 리뷰", count: writtenItems.length,   left: 348, underline: { left: 348, width: 170 } },
  ];
  const activeTabMeta = tabs.find((tab) => tab.key === activeTab);

  const totalPages = Math.max(1, Math.ceil(writtenItems.length / PAGE_SIZE));
  const pagedWrittenItems = useMemo(
    () => writtenItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [writtenItems, page],
  );

  const handleTabChange = (key) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleWriteReview = (item) => {
    // ReviewWritePage 는 목록에서 넘겨준 item(location.state)을 그대로 사용한다.
    // (아직 "id로 리뷰 대상 단건 조회" API가 없어, 새로고침 시에는 대상 정보를 다시 찾을 수 없다 -
    //  ReviewWritePage 쪽에서 이 경우 안내 화면을 보여주도록 처리해뒀다.)
    navigate(`/user/reviews/write/${item.id}`, { state: { item } });
  };

  const handleEditReview = (item) => {
    // ReviewEditPage 도 마찬가지로 목록에서 넘겨준 item(현재 rating/content 포함)을 그대로 쓴다.
    navigate(`/user/reviews/edit/${item.id}`, { state: { item } });
  };

  const handleDeleteReview = async (item) => {
    const ok = await confirm({ title: "리뷰를 삭제하시겠습니까?", text: "삭제한 리뷰는 복구할 수 없습니다." });
    if (!ok) return;
    // TODO: DELETE /api/reviews/{id} 연동 전까지는 화면 목록에서만 제거한다.
    setWrittenItems((prev) => prev.filter((i) => i.id !== item.id));
    if (pagedWrittenItems.length === 1 && page > 1) setPage(page - 1);
    toast({ icon: "success", title: "리뷰가 삭제되었습니다." });
  };

  // 썸네일/제목 클릭 시 리뷰 대상(경매 상품/서비스) 페이지로 이동.
  // TODO: 경매(F-AUC)/서비스(F-SVC) 상세 페이지 라우트가 아직 없어(담당자5/서비스 담당자 영역),
  //       라우트가 생기면 이 경로만 실제 상세 페이지로 바꿔주면 된다.
  const handleViewTarget = (item) => {
    navigate(item.dealType === "service" ? `/services/${item.id}` : `/auction/${item.id}`);
  };

  const canvasHeight = activeTab === "writable" ? WRITABLE_CANVAS_HEIGHT : WRITTEN_CANVAS_HEIGHT;

  return (
    <ScaledStage canvasHeight={canvasHeight} topCrop={TOP_CROP}>
      <p className="absolute font-['Noto_Sans_KR:Bold'] font-bold left-[173px] text-[25px] text-black top-[137px] whitespace-nowrap">
        리뷰작성
      </p>

      {/* 탭 */}
      <div className="absolute contents left-[173px] top-[202px]" data-name="tab">
        <div
          className="absolute bg-[#0064ff] h-[2px] transition-[left,width] duration-150"
          style={{ left: activeTabMeta.underline.left, width: activeTabMeta.underline.width, top: 236 }}
        />
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
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

      {/* 작성가능한 리뷰 */}
      {activeTab === "writable" && (
        writableItems.length === 0 ? (
          <p className="absolute left-[173px] top-[300px] text-[#888] text-[15px]">
            아직 작성 가능한 리뷰가 없습니다.
          </p>
        ) : (
          writableItems.map((item, index) => (
            <ReviewableItemCard
              key={item.id}
              top={FIRST_ITEM_TOP + index * ITEM_ROW_HEIGHT}
              thumbnail={item.thumbnail}
              title={item.title}
              dealType={item.dealType}
              partyLabel={item.partyLabel}
              partyName={item.partyName}
              completedDate={item.completedDate}
              actionLabel="리뷰 등록"
              onAction={() => handleWriteReview(item)}
              onViewTarget={() => handleViewTarget(item)}
            />
          ))
        )
      )}

      {/* 작성한 리뷰 */}
      {activeTab === "written" && (
        writtenItems.length === 0 ? (
          <p className="absolute left-[173px] top-[300px] text-[#888] text-[15px]">
            아직 작성한 리뷰가 없습니다.
          </p>
        ) : (
          <>
            {pagedWrittenItems.map((item, index) => (
              <WrittenReviewItemCard
                key={item.id}
                top={FIRST_ITEM_TOP + index * ITEM_ROW_HEIGHT}
                thumbnail={item.thumbnail}
                title={item.title}
                dealType={item.dealType}
                rating={item.rating}
                content={item.content}
                onEdit={() => handleEditReview(item)}
                onDelete={() => handleDeleteReview(item)}
                onViewTarget={() => handleViewTarget(item)}
              />
            ))}
            <div className="absolute left-0 w-full" style={{ top: FIRST_ITEM_TOP + PAGE_SIZE * ITEM_ROW_HEIGHT + 65 }}>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )
      )}
    </ScaledStage>
  );
}
