// src/pages/user/ReviewListPage.jsx
//
// Figma: 에누리컷_디자인시안
//   - 작성가능한 리뷰 탭: node-id 42:289
//   - 작성한 리뷰 탭:     node-id 56:138
// - 이 페이지는 UserLayout(<MainHeader />/<MainFooter />) 안에서 렌더링되므로
//   Figma 프레임의 HEADER/FOOTER 구간은 그대로 옮기지 않고, CONTENTS 구간만 구현한다.
// - 절대좌표(1920px 고정) 포팅 + ScaledStage 로 스케일링하는 방식은
//   @components/landing/sections 의 기존 포팅 방식을 그대로 따른 것이다.
// - GET /api/reviews/writable, /me 연동 완료 (useReview.js). 생성/수정은 각각 ReviewWritePage/
//   ReviewEditPage에서 처리하고, 이 화면으로 돌아올 때 TanStack Query 캐시를 무효화해 다시 불러온다
//   (그 전엔 GET API가 없어 location.state로 방금 등록/수정한 항목만 화면에 끼워 넣었었다).
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ScaledStage from "@components/landing/sections/ScaledStage";
import ReviewableItemCard from "@components/review/ReviewableItemCard";
import WrittenReviewItemCard from "@components/review/WrittenReviewItemCard";
import Pagination from "@components/common/Pagination";
import { useWritableReviews, useMyReviews } from "@hooks/useReview";
import { deleteReview } from "@api/reviewApi";
import { toImageUrl } from "@api/fileApi";
import { confirm, toast } from "@utils/common";

// 탭마다 Figma 프레임 전체 높이가 달라서(항목 개수가 다름) 탭별로 다른 값을 쓴다.
// 헤더 0~82 는 공통이며, 자체 헤더를 쓰므로 그만큼만 잘라낸다(topCrop).
const TOP_CROP = 82;
const MIN_CANVAS_HEIGHT = 500; // 항목이 0건이어도 "없습니다" 안내가 잘리지 않을 최소 높이

const ITEM_ROW_HEIGHT = 235; // Figma 항목 간 간격 (491-256, 726-491, ... 모두 235로 일정)
const FIRST_ITEM_TOP = 256;
const PAGE_SIZE = 10; // 작성한 리뷰 탭 - Figma 페이지네이션이 5페이지/12건 기준 10건/페이지로 설계됨

const DEV_WRITABLE = import.meta.env.DEV ? [
  { id: 1, thumbnail: null, title: "다이슨 V11 무선청소기", dealType: "goods",   partyLabel: "판매자", partyName: "이**",  completedDate: "2026-07-01" },
  { id: 2, thumbnail: null, title: "성수동 원룸 이사 운반", dealType: "service", partyLabel: "제공자", partyName: "김**",  completedDate: "2026-07-10" },
  { id: 3, thumbnail: null, title: "PD 4포트 100W 멀티 충전기", dealType: "goods", partyLabel: "판매자", partyName: "박**", completedDate: "2026-07-15" },
] : [];

const DEV_WRITTEN = import.meta.env.DEV ? [
  { id: 10, thumbnail: null, title: "카본 패턴 게이밍 책상", dealType: "goods",   rating: 5, content: "배송도 빠르고 상태가 정말 좋았어요. 판매자분도 친절하셨습니다.", photos: [] },
  { id: 11, thumbnail: null, title: "성수동 원룸 청소 서비스", dealType: "service", rating: 4, content: "꼼꼼하게 청소해주셨는데 시간이 조금 늦게 끝났어요.", photos: [] },
] : [];

export default function ReviewListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("writable");
  const [page, setPage] = useState(1);

  const writableQuery = useWritableReviews();
  const myReviewsQuery = useMyReviews();

  // WritableTradeItem.thumbnail은 지금은 항상 null이지만(PRODUCT_IMAGE 연동 전), 나중에 값이
  // 채워지면 다른 파일 응답과 동일하게 백엔드 상대 경로(/uploads/...)로 올 것이므로 미리 변환해둔다.
  const writableItems = useMemo(() => {
    const real = (writableQuery.data ?? []).map((item) => ({ ...item, thumbnail: toImageUrl(item.thumbnail) }));
    return real.length > 0 ? real : DEV_WRITABLE;
  }, [writableQuery.data]);
  // WrittenReviewItemCard는 단일 thumbnail을 기대하는데, GET /reviews/me는 여러 장(photos)을
  // 다형성 첨부(FILE_ATTACH)로 내려준다 - 대표 이미지로 첫 장만 쓴다.
  const writtenItems = useMemo(() => {
    const real = (myReviewsQuery.data ?? []).map((item) => ({ ...item, thumbnail: toImageUrl(item.photos?.[0]) }));
    return real.length > 0 ? real : DEV_WRITTEN;
  }, [myReviewsQuery.data]);

  const isLoading = activeTab === "writable" ? writableQuery.isLoading : myReviewsQuery.isLoading;
  const isError = activeTab === "writable" ? writableQuery.isError : myReviewsQuery.isError;
  const refetchCurrent = activeTab === "writable" ? writableQuery.refetch : myReviewsQuery.refetch;

  // ReviewWritePage/ReviewEditPage에서 navigate(..., { state: { justWrote / justUpdated } })로
  // 넘겨준 신호를 받아 "작성한 리뷰" 탭으로 전환하고 토스트를 띄운다. 실제 목록은 useMyReviews가
  // 다시 불러온다(아래 두 페이지가 성공 시 ['reviews'] 쿼리를 무효화해뒀다).
  useEffect(() => {
    const { justWrote, justUpdated } = location.state ?? {};
    if (justWrote) {
      setActiveTab("written");
      setPage(1);
      toast({ icon: "success", title: "작성한 리뷰 목록에 추가되었습니다." });
    } else if (justUpdated) {
      setActiveTab("written");
      toast({ icon: "success", title: "리뷰가 수정되었습니다." });
    }
    if (justWrote || justUpdated) {
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
    try {
      await deleteReview(item.id);
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      if (pagedWrittenItems.length === 1 && page > 1) setPage(page - 1);
      toast({ icon: "success", title: "리뷰가 삭제되었습니다." });
    } catch (err) {
      const message = err.response?.data?.message;
      toast({ icon: "error", title: message || "리뷰 삭제에 실패했습니다. 잠시 후 다시 시도해주세요." });
    }
  };

  // 썸네일/제목 클릭 시 리뷰 대상(경매 상품/서비스) 페이지로 이동.
  // TODO: 경매(F-AUC)/서비스(F-SVC) 상세 페이지 라우트가 아직 없어(담당자5/서비스 담당자 영역),
  //       라우트가 생기면 이 경로만 실제 상세 페이지로 바꿔주면 된다.
  const handleViewTarget = (item) => {
    navigate(item.dealType === "service" ? `/service/${item.id}` : `/auction/${item.id}`);
  };

  // "작성한 리뷰" 탭은 페이지네이션 컨트롤이 PAGE_SIZE(10건) 기준 고정 위치에 그려지므로,
  // 마지막 페이지처럼 실제 항목이 적어도 캔버스 높이는 항상 그 자리를 포함해야 잘리지 않는다.
  const canvasHeight = activeTab === "writable"
    ? Math.max(MIN_CANVAS_HEIGHT, FIRST_ITEM_TOP + writableItems.length * ITEM_ROW_HEIGHT + 150)
    : FIRST_ITEM_TOP + PAGE_SIZE * ITEM_ROW_HEIGHT + 300;

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

      {isLoading && (
        <p className="absolute left-[173px] top-[300px] text-[#888] text-[15px]">불러오는 중...</p>
      )}

      {!isLoading && isError && (
        <div className="absolute left-[173px] top-[300px]">
          <p className="text-[#e63946] text-[15px] mb-2">목록을 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={() => refetchCurrent()}
            className="btn btn-ghost btn-sm"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 작성가능한 리뷰 */}
      {!isLoading && !isError && activeTab === "writable" && (
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
      {!isLoading && !isError && activeTab === "written" && (
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
