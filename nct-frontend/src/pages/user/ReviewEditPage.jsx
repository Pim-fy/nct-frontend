// src/pages/user/ReviewEditPage.jsx
//
// "내가 작성한 리뷰" 목록의 "수정" 버튼에서 진입하는 리뷰 수정 폼.
// ReviewWritePage.jsx(리뷰 등록 폼)를 그대로 참고해서 만들었다 - 구조/스타일은 동일하고
// 차이는 (1) 기존 별점·내용·사진으로 미리 채워진다는 것, (2) createReview 대신 updateReview를 호출한다는 것뿐이다.
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import StarRating from "@components/review/StarRating";
import { updateReview } from "@api/reviewApi";
import { useAuctionTrade } from "@hooks/useAuctionTrade";
import { reviewQueryKeys, useMyTradeReview } from "@hooks/useReview";
import { toImageUrl } from "@api/fileApi";
import AsyncRouteError from "@components/common/AsyncRouteError";
import { toast } from "@utils/common";
import "../provider/QuoteFormPage.css";

const MAX_PHOTOS = 5;
const MAX_CONTENT_LENGTH = 500;

const DEAL_TYPE_STYLE = {
  goods:   { label: "물건거래", color: "#0064ff" },
  service: { label: "서비스",   color: "#00ccd0" },
};

export default function ReviewEditPage() {
  const { id, auctionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // 목록 페이지에서 navigate(..., { state: { item } }) 로 넘겨준, 수정 대상 리뷰(기존 rating/content 포함).
  // 새로고침 등으로 state 가 없으면(직접 URL 접근) 대상 정보를 알 수 없으므로 안내만 보여준다.
  const item = location.state?.item;
  const tradeQuery = useAuctionTrade(auctionId);
  const routeTrade = tradeQuery.data;
  const reviewQuery = useMyTradeReview(routeTrade?.tradeId);
  const routeReview = reviewQuery.data;
  const routeItem = routeTrade && routeReview ? {
    id: routeReview.reviewId,
    thumbnail: toImageUrl(routeTrade.productImageUrl),
    title: routeTrade.productName,
    dealType: "goods",
    rating: routeReview.rating,
    content: routeReview.content,
    photos: routeReview.photos,
  } : null;
  const resolvedItem = routeItem ?? item;
  // @ai_generated (담당자1, 2026-08-07): useMyTradeReview는 tradeId가 정해지기 전까지
  // enabled:false라 isLoading이 false로 남는다. 이 틈에 아래 WRITTEN 가드가 먼저 걸려
  // "수정할 수 있는 리뷰를 찾을 수 없습니다" 문구가 한 프레임 노출될 수 있어(P3-5), data 도착
  // 전까지도 로딩으로 본다.
  const reviewStatusPending = Boolean(routeTrade?.tradeId)
    && reviewQuery.data === undefined
    && !reviewQuery.isError;

  if (auctionId && (tradeQuery.isLoading || reviewQuery.isLoading || reviewStatusPending)) {
    return <div className="container py-16">리뷰 정보를 불러오는 중입니다.</div>;
  }

  if (auctionId && (tradeQuery.isError || reviewQuery.isError)) {
    const error = tradeQuery.error ?? reviewQuery.error;
    return (
      <AsyncRouteError
        error={error}
        onRetry={() => {
          if (tradeQuery.isError) tradeQuery.refetch();
          if (reviewQuery.isError) reviewQuery.refetch();
        }}
      />
    );
  }

  if (auctionId && routeReview?.status !== "WRITTEN") {
    return (
      <div className="container py-16 text-center">
        <p className="text-[#4e4e4e]">수정할 수 있는 리뷰를 찾을 수 없습니다.</p>
        <button type="button" onClick={() => navigate(`/auction/${auctionId}/trade`)} className="btn btn-primary mt-6">
          거래 상세로
        </button>
      </div>
    );
  }

  if (!resolvedItem) {
    return (
      <div className="container py-16 text-center">
        <p className="text-[#4e4e4e]">수정할 리뷰 정보를 찾을 수 없습니다.</p>
        <p className="mt-1 text-sm text-[#969696]">목록에서 다시 "수정"을 눌러주세요.</p>
        <button
          type="button"
          onClick={() => navigate("/user/mypage?section=review")}
          className="btn btn-primary mt-6"
        >
          리뷰작성 목록으로
        </button>
      </div>
    );
  }

  // @ai_generated (담당자1, 2026-08-07): 위 가드를 전부 통과한 시점에는 resolvedItem이 이미
  // 확정돼 있다. 폼 상태(rating/content)는 이 하위 컴포넌트에서 useState 초기값으로만 채우고,
  // key={resolvedItem.id}로 대상이 바뀔 때만 새로 마운트한다 - "effect 안에서 도착한 데이터로
  // setState"하던 예전 방식(setTimeout(0)으로 린트만 우회, 실제로는 초기 렌더 빈 폼 플래시와
  // 편집 중 백그라운드 refetch가 입력값을 덮어쓰는 위험이 있었다, P3-4)을 없앤다.
  return (
    <ReviewEditForm
      key={resolvedItem.id}
      resolvedItem={resolvedItem}
      reviewId={routeReview?.reviewId ?? id}
      auctionId={auctionId}
    />
  );
}

function ReviewEditForm({ resolvedItem, reviewId, auctionId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(resolvedItem.rating ?? 0);
  const [content, setContent] = useState(resolvedItem.content ?? "");
  const [photos, setPhotos] = useState([]); // [{ id, file, previewUrl }] - 새로 첨부한 사진만 들어간다.
  const [pickMode, setPickMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // 미리보기 URL은 컴포넌트가 사라질 때 반드시 해제해야 메모리 누수가 없다.
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dealTypeStyle = DEAL_TYPE_STYLE[resolvedItem.dealType] ?? DEAL_TYPE_STYLE.goods;
  // 서버는 "기존 사진 + 이번에 추가하는 사진"을 합산해서 5장 제한을 검사한다(PUT은 추가만 되는 구조) —
  // 프론트도 새로 고르는 사진 개수만 세면 안 되고 기존 사진 수를 같이 반영해야 한다.
  const existingPhotoCount = resolvedItem.photos?.length ?? 0;

  const addFiles = (fileList) => {
    const files = Array.from(fileList);
    const remainingSlots = MAX_PHOTOS - existingPhotoCount - photos.length;
    if (remainingSlots <= 0) return;
    const nextPhotos = files.slice(0, remainingSlots).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...nextPhotos]);
  };

  const handleFilesSelected = (e) => {
    addFiles(e.target.files ?? []);
    e.target.value = "";
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const setAsRepresentative = (photoId) => {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === photoId);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return next;
    });
    setPickMode(false);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ icon: "error", title: "별점을 선택해주세요." });
      return;
    }
    if (content.trim().length === 0) {
      toast({ icon: "error", title: "리뷰 내용을 입력해주세요." });
      return;
    }

    const formData = new FormData();
    formData.append("rating", rating);
    formData.append("content", content);
    photos.forEach((p) => formData.append("photos", p.file));

    setSubmitting(true);
    try {
      await updateReview(reviewId ?? resolvedItem.id, formData);
      await queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all });
      toast({ icon: "success", title: "리뷰가 수정되었습니다." });
      navigate(auctionId ? `/auction/${auctionId}/trade` : "/user/mypage?section=review");
    } catch (err) {
      console.error("리뷰 수정 실패:", err);
      toast({ icon: "error", title: "리뷰 수정에 실패했습니다. 잠시 후 다시 시도해주세요." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold text-black">리뷰수정</h1>

      {/* 상단 2열: 아이템 정보(좌) + 사진 첨부(우) / 모바일: 단일 열(사진은 별점 아래) */}
      <div className="flex flex-col md:flex-row gap-8">
          {/* 좌: 아이템 정보 + 별점 */}
          <div className="flex flex-col flex-1">
            {/* 모바일: 썸네일 위, 정보 아래 (세로+중앙) / 태블릿+: 가로 */}
            <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <div className="size-[129px] shrink-0 overflow-hidden rounded-[10px] border border-[#d9d9d9]">
                {resolvedItem.thumbnail && (
                  <img src={resolvedItem.thumbnail} alt={resolvedItem.title} className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0 text-center md:text-left">
                <span
                  className="mb-2 inline-block rounded border bg-white px-2.5 py-1 text-sm"
                  style={{ borderColor: dealTypeStyle.color, color: dealTypeStyle.color }}
                >
                  {dealTypeStyle.label}
                </span>
                <h2 className="text-xl font-bold text-black">{resolvedItem.title}</h2>
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-lg font-bold text-black text-center md:text-left">만족하셨나요?</p>
              <div className="flex justify-center md:justify-start">
                <StarRating value={rating} onChange={setRating} />
              </div>
            </div>
          </div>

          {/* 우: 사진 첨부 */}
          <div
            className="card flex-1 min-w-0 flex flex-col"
            style={{ border: "none", padding: 0, boxShadow: "none", minHeight: 220 }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          >
            <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFilesSelected} />

            <div className="qf-photo-header">
              <div>
                <strong style={{ fontSize: 16 }}>사진 첨부</strong>
                <p style={{ fontSize: 14, color: "#969696", margin: "4px 0 0" }}>
                  {pickMode
                    ? "대표로 지정할 사진을 선택하세요"
                    : `드래그앤드롭 또는 파일 선택 · 최대 ${MAX_PHOTOS}장 (기존 ${existingPhotoCount} + 신규 ${photos.length})`}
                </p>
              </div>
              <div className="qf-summary-actions">
                <button
                  type="button"
                  onClick={() => setPickMode((v) => !v)}
                  disabled={photos.length === 0}
                  className="btn btn-ghost btn-sm"
                  style={pickMode ? { background: "#0064ff", color: "#fff", borderColor: "#0064ff" } : undefined}
                >
                  대표이미지로 지정
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={existingPhotoCount + photos.length >= MAX_PHOTOS}
                  className="btn btn-ghost btn-sm"
                >
                  사진등록
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
              {photos.map((p, i) => (
                <div key={p.id} style={{ position: "relative" }}>
                  <div
                    onClick={() => pickMode && i !== 0 && setAsRepresentative(p.id)}
                    style={{
                      aspectRatio: "1",
                      overflow: "hidden",
                      borderRadius: 8,
                      cursor: pickMode && i !== 0 ? "pointer" : "default",
                      border: i === 0 ? "2px solid #0064ff" : pickMode ? "2px dashed #0064ff" : "1px solid #eee",
                    }}
                  >
                    <img
                      src={p.previewUrl}
                      alt={`첨부 이미지 ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    {i === 0 && (
                      <span className="badge badge-blue" style={{ position: "absolute", top: 4, left: 4, fontSize: 13 }}>대표</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemovePhoto(i); }}
                    style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#111", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: "20px", padding: 0, zIndex: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {Array.from({ length: MAX_PHOTOS - existingPhotoCount - photos.length }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ aspectRatio: "1", borderRadius: 8, border: "1px dashed #d8d6cf", background: "#fafaf8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <span style={{ fontSize: 24, color: "#c7c5bd" }}>+</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 리뷰 내용 */}
        <div className="mt-8">
          <p className="mb-3 text-lg font-bold text-black">어떤 점이 좋았나요?</p>
          <div className="rounded border border-[#ebebeb] bg-[#f8f9fd] p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
              maxLength={MAX_CONTENT_LENGTH}
              placeholder="거래 경험을 구체적으로 작성하세요."
              rows={6}
              className="w-full resize-none bg-transparent text-lg text-black placeholder:text-[#969696] focus:outline-none"
            />
            <p className="text-right text-lg text-[#969696]">{content.length}/{MAX_CONTENT_LENGTH}</p>
          </div>
        </div>

        {/* 수정 완료 버튼 */}
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary w-[200px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "수정 중..." : "수정 완료"}
          </button>
        </div>

    </div>
  );
}
