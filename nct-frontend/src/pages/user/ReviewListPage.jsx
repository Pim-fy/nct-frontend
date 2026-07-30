// src/pages/user/ReviewListPage.jsx
//
// Figma: 에누리컷_디자인시안
//   - 작성가능한 리뷰 탭: node-id 42:289
//   - 작성한 리뷰 탭:     node-id 56:138
// - MyPage 사이드바 레이아웃(flex-1) 안에서 렌더링되므로 ScaledStage 대신 반응형 flex 레이아웃 사용.
// - GET /api/reviews/writable, /me 연동 완료 (useReview.js). 생성/수정은 각각 ReviewWritePage/
//   ReviewEditPage에서 처리하고, 이 화면으로 돌아올 때 TanStack Query 캐시를 무효화해 다시 불러온다.
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ReviewableItemCard from "@components/review/ReviewableItemCard";
import WrittenReviewItemCard from "@components/review/WrittenReviewItemCard";
import Pagination from "@components/common/Pagination";
import { useWritableReviews, useMyReviews } from "@hooks/useReview";
import { deleteReview } from "@api/reviewApi";
import { toImageUrl } from "@api/fileApi";
import { confirm, toast } from "@utils/common";
import { Skeleton } from "@components/skeleton/BaseSkeleton";

const PAGE_SIZE = 10;

const DEV_WRITABLE = import.meta.env.DEV ? [
  { id: 1, thumbnail: null, title: "다이슨 V11 무선청소기",       dealType: "goods",   partyLabel: "판매자", partyName: "이**", completedDate: "2026-07-01" },
  { id: 2, thumbnail: null, title: "성수동 원룸 이사 운반",       dealType: "service", partyLabel: "제공자", partyName: "김**", completedDate: "2026-07-10" },
  { id: 3, thumbnail: null, title: "PD 4포트 100W 멀티 충전기",   dealType: "goods",   partyLabel: "판매자", partyName: "박**", completedDate: "2026-07-15" },
] : [];

const DEV_WRITTEN = import.meta.env.DEV ? [
  { id: 10, thumbnail: null, title: "카본 패턴 게이밍 책상",       dealType: "goods",   rating: 5, content: "배송도 빠르고 상태가 정말 좋았어요. 판매자분도 친절하셨습니다.", photos: [] },
  { id: 11, thumbnail: null, title: "성수동 원룸 청소 서비스",     dealType: "service", rating: 4, content: "꼼꼼하게 청소해주셨는데 시간이 조금 늦게 끝났어요.", photos: [] },
] : [];

export default function ReviewListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("writable");
  const [page, setPage] = useState(1);

  const writableQuery = useWritableReviews();
  const myReviewsQuery = useMyReviews();

  const writableItems = useMemo(() => {
    const real = (writableQuery.data ?? []).map((item) => ({ ...item, thumbnail: toImageUrl(item.thumbnail) }));
    return real.length > 0 ? real : DEV_WRITABLE;
  }, [writableQuery.data]);

  const writtenItems = useMemo(() => {
    const real = (myReviewsQuery.data ?? []).map((item) => ({ ...item, thumbnail: toImageUrl(item.photos?.[0]) }));
    return real.length > 0 ? real : DEV_WRITTEN;
  }, [myReviewsQuery.data]);

  const isLoading = activeTab === "writable" ? writableQuery.isLoading : myReviewsQuery.isLoading;
  const isError   = activeTab === "writable" ? writableQuery.isError   : myReviewsQuery.isError;
  const refetchCurrent = activeTab === "writable" ? writableQuery.refetch : myReviewsQuery.refetch;

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
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = [
    { key: "writable", label: "작성가능한 리뷰", count: writableItems.length },
    { key: "written",  label: "내가작성한 리뷰", count: writtenItems.length },
  ];

  const totalPages = Math.max(1, Math.ceil(writtenItems.length / PAGE_SIZE));
  const pagedWrittenItems = useMemo(
    () => writtenItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [writtenItems, page],
  );

  const handleTabChange = (key) => { setActiveTab(key); setPage(1); };

  const handleWriteReview = (item) => {
    navigate(`/user/reviews/write/${item.id}`, { state: { item } });
  };

  const handleEditReview = (item) => {
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

  const handleViewTarget = (item) => {
    navigate(item.dealType === "service" ? `/service/${item.id}` : `/auction/${item.id}`);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <h2 className="text-[22px] font-bold text-[#1a1a1a] m-0">리뷰작성</h2>

      {/* 탭 */}
      <div className="tab-group-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`tab-pill${isActive ? " active" : ""} whitespace-nowrap`}
            >
              {tab.label}
              <span className="tab-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              borderRadius={20}
              height={209}
              key={index}
            />
          ))}
        </div>
      )}

      {/* 에러 */}
      {!isLoading && isError && (
        <div>
          <p className="text-[#e63946] text-[15px] mb-2">목록을 불러오지 못했습니다.</p>
          <button type="button" onClick={() => refetchCurrent()} className="btn btn-ghost btn-sm">
            다시 시도
          </button>
        </div>
      )}

      {/* 작성가능한 리뷰 */}
      {!isLoading && !isError && activeTab === "writable" && (
        writableItems.length === 0 ? (
          <div className="flex items-center justify-center py-20 border border-[rgba(0,0,0,0.08)] rounded-[10px] bg-white">
            <p className="text-[15px] text-[#969696]">아직 작성 가능한 리뷰가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {writableItems.map((item) => (
              <ReviewableItemCard
                key={item.id}
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
            ))}
          </div>
        )
      )}

      {/* 작성한 리뷰 */}
      {!isLoading && !isError && activeTab === "written" && (
        writtenItems.length === 0 ? (
          <div className="flex items-center justify-center py-20 border border-[rgba(0,0,0,0.08)] rounded-[10px] bg-white">
            <p className="text-[15px] text-[#969696]">아직 작성한 리뷰가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {pagedWrittenItems.map((item) => (
                <WrittenReviewItemCard
                  key={item.id}
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
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )
      )}
    </div>
  );
}
