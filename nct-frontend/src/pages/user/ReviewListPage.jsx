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
import MyPageReviewListItem from "@components/mypage/MyPageReviewListItem";
import Pagination from "@components/common/Pagination";
import MyPageListSectionLayout from "@components/mypage/MyPageListSectionLayout";
import MyPageListSkeleton from "@components/skeleton/MyPageListSkeleton";
import MyPageListEmpty from "@components/mypage/MyPageListEmpty";
import MyPageListError from "@components/mypage/MyPageListError";
import { useWritableReviews, useMyReviews } from "@hooks/useReview";
import { deleteReview } from "@api/reviewApi";
import { toImageUrl } from "@api/fileApi";
import { confirm, toast } from "@utils/common";

const PAGE_SIZE = 10;

export default function ReviewListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(() => (
    location.state?.justWrote || location.state?.justUpdated ? "written" : "all"
  ));
  const [writablePage, setWritablePage] = useState(1);
  const [writtenPage, setWrittenPage] = useState(1);
  const [allPage, setAllPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");

  const writableQuery = useWritableReviews();
  const myReviewsQuery = useMyReviews();

  const writableItems = useMemo(() => (
    (writableQuery.data ?? []).map((item) => ({ ...item, thumbnail: toImageUrl(item.thumbnail) }))
  ), [writableQuery.data]);

  const writtenItems = useMemo(() => (
    (myReviewsQuery.data ?? []).map((item) => ({ ...item, thumbnail: toImageUrl(item.photos?.[0]) }))
  ), [myReviewsQuery.data]);

  const filteredWritableItems = useMemo(
    () => writableItems.filter((item) => (
      !searchKeyword || String(item.title ?? "").toLowerCase().includes(searchKeyword)
    )),
    [writableItems, searchKeyword],
  );

  const filteredWrittenItems = useMemo(
    () => writtenItems.filter((item) => (
      !searchKeyword || String(item.title ?? "").toLowerCase().includes(searchKeyword)
    )),
    [writtenItems, searchKeyword],
  );

  // "전체" 탭은 다른 화면들과 같은 방식(하나로 합친 리스트 + 페이지네이션 하나)을 따른다.
  // 카드 종류가 다른 두 리스트를 completedDate 기준 최신순으로 합친다.
  const combinedItems = useMemo(() => [
    ...filteredWritableItems.map((item) => ({ ...item, kind: "writable" })),
    ...filteredWrittenItems.map((item) => ({ ...item, kind: "written" })),
  ].sort((a, b) => new Date(b.completedDate || 0) - new Date(a.completedDate || 0)), [filteredWritableItems, filteredWrittenItems]);

  const isLoading = activeTab === "all"
    ? (writableQuery.isLoading || myReviewsQuery.isLoading)
    : activeTab === "writable" ? writableQuery.isLoading : myReviewsQuery.isLoading;
  const isError = activeTab === "all"
    ? (writableQuery.isError || myReviewsQuery.isError)
    : activeTab === "writable" ? writableQuery.isError : myReviewsQuery.isError;
  const refetchCurrent = activeTab === "all"
    ? () => { writableQuery.refetch(); myReviewsQuery.refetch(); }
    : activeTab === "writable" ? writableQuery.refetch : myReviewsQuery.refetch;

  useEffect(() => {
    const { justWrote, justUpdated } = location.state ?? {};
    if (justWrote) {
      toast({ icon: "success", title: "작성한 리뷰 목록에 추가되었습니다." });
    } else if (justUpdated) {
      toast({ icon: "success", title: "리뷰가 수정되었습니다." });
    }
    if (justWrote || justUpdated) {
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs = [
    { key: "all",      label: "전체",        count: writableItems.length + writtenItems.length },
    { key: "writable", label: "작성가능 리뷰",  count: writableItems.length },
    { key: "written",  label: "작성완료 리뷰",  count: writtenItems.length },
  ];

  const writableTotalPages = Math.max(1, Math.ceil(filteredWritableItems.length / PAGE_SIZE));
  const pagedWritableItems = useMemo(
    () => filteredWritableItems.slice((writablePage - 1) * PAGE_SIZE, writablePage * PAGE_SIZE),
    [filteredWritableItems, writablePage],
  );

  const writtenTotalPages = Math.max(1, Math.ceil(filteredWrittenItems.length / PAGE_SIZE));
  const pagedWrittenItems = useMemo(
    () => filteredWrittenItems.slice((writtenPage - 1) * PAGE_SIZE, writtenPage * PAGE_SIZE),
    [filteredWrittenItems, writtenPage],
  );

  const allTotalPages = Math.max(1, Math.ceil(combinedItems.length / PAGE_SIZE));
  const pagedCombinedItems = useMemo(
    () => combinedItems.slice((allPage - 1) * PAGE_SIZE, allPage * PAGE_SIZE),
    [combinedItems, allPage],
  );

  const handleTabChange = (key) => {
    setActiveTab(key);
    setWritablePage(1);
    setWrittenPage(1);
    setAllPage(1);
  };

  const handleSearch = (keyword) => {
    setSearchKeyword(keyword.toLowerCase());
    setWritablePage(1);
    setWrittenPage(1);
    setAllPage(1);
  };

  // 전역 브레드크럼 (BJN, 260805): 접근 경로(state.from)를 함께 전달해 브레드크럼에 반영
  const handleWriteReview = (item) => {
    navigate(`/user/mypage/reviews/write/${item.id}`, { state: { item, from: location.pathname + location.search } });
  };

  const handleEditReview = (item) => {
    navigate(`/user/mypage/reviews/edit/${item.id}`, { state: { item, from: location.pathname + location.search } });
  };

  const handleDeleteReview = async (item) => {
    const ok = await confirm({ title: "리뷰를 삭제하시겠습니까?", text: "삭제한 리뷰는 복구할 수 없습니다." });
    if (!ok) return;
    try {
      await deleteReview(item.id);
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      if (activeTab === "written" && pagedWrittenItems.length === 1 && writtenPage > 1) setWrittenPage(writtenPage - 1);
      if (activeTab === "all" && pagedCombinedItems.length === 1 && allPage > 1) setAllPage(allPage - 1);
      toast({ icon: "success", title: "리뷰가 삭제되었습니다." });
    } catch (err) {
      const message = err.response?.data?.message;
      toast({ icon: "error", title: message || "리뷰 삭제에 실패했습니다. 잠시 후 다시 시도해주세요." });
    }
  };

  const handleViewTarget = (item) => {
    const tradeId = item.tradeId ?? item.id;

    if (item.dealType === "service") {
      navigate(`/service-trades/${tradeId}`);
      return;
    }

    const isSeller = item.partyLabel === "구매자";
    navigate(isSeller ? `/trades/${tradeId}/seller` : `/trades/${tradeId}`);
  };

  return (
    // MyPageListSectionLayout은 자체 trailing mb-5로 다음 콘텐츠와의 간격을 이미 책임진다.
    // 이걸 flex gap 컨테이너 안에 넣으면 flex item이 되면서 새 블록 서식 맥락(BFC)이 생겨
    // 내부 mb-5가 밖으로 못 빠져나가고 갇힌 채 부모 gap과 또 더해져 간격이 두 배가 된다.
    // 그래서 컨테이너 밖에 두고, gap이 실제로 필요한 콘텐츠 블록들만 별도로 감싼다.
    <>
      <MyPageListSectionLayout
        title="리뷰"
        summaryItems={[
          { label: '작성가능 리뷰', value: writableItems.length },
          { label: '작성완료 리뷰', value: writtenItems.length },
        ]}
        filterItems={tabs.map((tab) => ({ value: tab.key, label: tab.label, count: tab.count }))}
        activeFilter={activeTab}
        onFilterChange={handleTabChange}
        filterAriaLabel="리뷰 탭"
        onSearch={handleSearch}
        searchAriaLabel="리뷰 검색"
        searchPlaceholder="상품명·견적 요청 검색"
        isLoading={isLoading}
      />

      <div className="flex flex-col gap-5">
      {isLoading && <MyPageListSkeleton count={3} />}

      {/* 에러 */}
      {!isLoading && isError && (
        <MyPageListError message="목록을 불러오지 못했습니다." onRetry={() => refetchCurrent()} />
      )}

      {/* 전체 — 두 종류를 completedDate 최신순으로 합친 리스트 + 페이지네이션 하나 */}
      {!isLoading && !isError && activeTab === "all" && (
        <>
          {combinedItems.length === 0 ? (
            <MyPageListEmpty message="아직 리뷰 내역이 없습니다." />
          ) : (
            <div className="flex flex-col gap-3">
              {pagedCombinedItems.map((item) => (
                item.kind === "writable" ? (
                  <MyPageReviewListItem
                    key={`writable-${item.id}`}
                    variant="writable"
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
                ) : (
                  <MyPageReviewListItem
                    key={`written-${item.id}`}
                    variant="written"
                    thumbnail={item.thumbnail}
                    title={item.title}
                    dealType={item.dealType}
                    rating={item.rating}
                    content={item.content}
                    onEdit={() => handleEditReview(item)}
                    onDelete={() => handleDeleteReview(item)}
                    onViewTarget={() => handleViewTarget(item)}
                  />
                )
              ))}
            </div>
          )}
          <Pagination page={allPage} totalPages={allTotalPages} onPageChange={setAllPage} showSinglePage />
        </>
      )}

      {/* 작성가능한 리뷰 */}
      {!isLoading && !isError && activeTab === "writable" && (
        <>
          {filteredWritableItems.length === 0 ? (
            <MyPageListEmpty message="아직 작성 가능한 리뷰가 없습니다." />
          ) : (
            <div className="flex flex-col gap-3">
              {pagedWritableItems.map((item) => (
                <MyPageReviewListItem
                  key={item.id}
                  variant="writable"
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
          )}
          <Pagination page={writablePage} totalPages={writableTotalPages} onPageChange={setWritablePage} showSinglePage />
        </>
      )}

      {/* 작성한 리뷰 */}
      {!isLoading && !isError && activeTab === "written" && (
        <>
          {filteredWrittenItems.length === 0 ? (
            <MyPageListEmpty message="아직 작성한 리뷰가 없습니다." />
          ) : (
            <div className="flex flex-col gap-3">
              {pagedWrittenItems.map((item) => (
                <MyPageReviewListItem
                  key={item.id}
                  variant="written"
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
          )}
          <Pagination page={writtenPage} totalPages={writtenTotalPages} onPageChange={setWrittenPage} showSinglePage />
        </>
      )}
      </div>
    </>
  );
}
