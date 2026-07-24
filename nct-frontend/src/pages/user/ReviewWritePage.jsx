// src/pages/user/ReviewWritePage.jsx
//
// Figma: 에누리컷_디자인시안 / 21_review_write (node-id 42:21)
// - "리뷰작성" 목록(ReviewListPage)에서 "리뷰 등록" 클릭 시 진입하는 폼 화면.
// - 별점/텍스트/사진 첨부처럼 실제 입력·상태가 있는 "폼" 화면이라, 마케팅성 정적 페이지들이 쓰는
//   절대좌표 포팅(ScaledStage) 대신 SignupPage.jsx 와 같은 방식(시맨틱 Tailwind + 실제 상태관리)을 따랐다.
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import cameraIcon from "@assets/img/camera.png";
import StarRating from "@components/review/StarRating";
import { createReview } from "@api/reviewApi";
import { toast } from "@utils/common";

const MAX_PHOTOS = 5;
const MAX_CONTENT_LENGTH = 500;

const DEAL_TYPE_STYLE = {
  goods:   { label: "물건거래", color: "#0064ff" },
  service: { label: "서비스",   color: "#00ccd0" },
};

export default function ReviewWritePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  // 목록 페이지에서 navigate(..., { state: { item } }) 로 넘겨준 리뷰 대상 정보.
  // 새로고침 등으로 state 가 없으면(직접 URL 접근) 대상 정보를 알 수 없으므로 안내만 보여준다.
  const item = location.state?.item;

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [photos, setPhotos] = useState([]); // [{ file, previewUrl }]
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // 미리보기 URL은 컴포넌트가 사라질 때 반드시 해제해야 메모리 누수가 없다.
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const DEV_FALLBACK_ITEM = import.meta.env.DEV ? {
    id: 1,
    thumbnail: null,
    title: "다이슨 V11 무선청소기",
    dealType: "goods",
    partyLabel: "판매자",
    partyName: "홍길동",
    completedDate: "2026-07-01",
  } : null;

  const resolvedItem = item ?? DEV_FALLBACK_ITEM;

  if (!resolvedItem) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 text-center">
        <p className="text-[#4e4e4e]">리뷰 작성 대상 정보를 찾을 수 없습니다.</p>
        <p className="mt-1 text-sm text-[#969696]">목록에서 다시 "리뷰 등록"을 눌러주세요.</p>
        <button
          type="button"
          onClick={() => navigate("/user/reviews")}
          className="btn btn-primary mt-6"
        >
          리뷰작성 목록으로
        </button>
      </div>
    );
  }

  const dealTypeStyle = DEAL_TYPE_STYLE[resolvedItem.dealType] ?? DEAL_TYPE_STYLE.goods;

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files ?? []);
    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) return;

    const nextPhotos = files.slice(0, remainingSlots).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...nextPhotos]);
    // 같은 파일을 다시 선택할 수 있도록 입력값을 초기화
    e.target.value = "";
  };

  const handleRemovePhoto = (index) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
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
    formData.append("targetId", id ?? resolvedItem.id);
    formData.append("rating", rating);
    formData.append("content", content);
    photos.forEach((p) => formData.append("photos", p.file));

    setSubmitting(true);
    try {
      await createReview(formData);
      toast({ icon: "success", title: "리뷰가 등록되었습니다." });
      // 목록 화면의 캐시를 무효화해 다음에 보일 때 방금 등록한 리뷰까지 실제 API로 다시 불러오게 한다.
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });
      navigate("/user/reviews", { state: { justWrote: true } });
    } catch (err) {
      console.error("리뷰 등록 실패:", err);
      toast({ icon: "error", title: "리뷰 등록에 실패했습니다. 잠시 후 다시 시도해주세요." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mt-[50px] mb-[50px]">
      <h1 className="mb-5 text-2xl font-bold text-black">리뷰작성</h1>

      <div className="rounded-2xl border border-[#e5e5e5] bg-white p-8">
        {/* 상단 2열: 아이템 정보(좌) + 사진 첨부(우) / 모바일: 단일 열(사진은 별점 아래) */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* 좌: 아이템 정보 + 안내 + 별점 */}
          <div className="flex flex-col flex-1">
            <div className="flex gap-4">
              <div className="size-[129px] shrink-0 overflow-hidden rounded-[10px] border border-[#d9d9d9]">
                {resolvedItem.thumbnail && (
                  <img src={resolvedItem.thumbnail} alt={resolvedItem.title} className="size-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <span
                  className="mb-2 inline-block rounded border bg-white px-2.5 py-1 text-sm"
                  style={{ borderColor: dealTypeStyle.color, color: dealTypeStyle.color }}
                >
                  {dealTypeStyle.label}
                </span>
                <h2 className="truncate text-xl font-bold text-black">{resolvedItem.title}</h2>
                <p className="mt-1 text-[15px] text-[#4e4e4e]">
                  <span className="font-bold">{resolvedItem.partyLabel}</span>{"  "}{resolvedItem.partyName}
                </p>
                <p className="text-[15px] text-[#4e4e4e]">
                  <span className="font-bold">완료일</span>{"  "}{resolvedItem.completedDate}
                </p>
              </div>
            </div>

            <p className="mt-6 text-[15px] text-[#4e4e4e]">
              리뷰는 1거래 1회만 작성 가능하며 경매/서비스 거래 유형은 자동으로 구분됩니다.
            </p>

            <div className="mt-8">
              <p className="mb-3 text-lg font-bold text-black">상품에 만족하셨나요?</p>
              <StarRating value={rating} onChange={setRating} />
            </div>
          </div>

          {/* 우: 사진 첨부 */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFilesSelected}
            />
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={photos.length >= MAX_PHOTOS}
                className="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
              >
                <img src={cameraIcon} alt="" className="size-[22px] object-contain" />
                사진 첨부하기 (최대 5장)
              </button>
            </div>

            {photos.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {photos.map((p, index) => (
                  <div key={p.previewUrl} className="relative size-[126px] shrink-0 overflow-hidden rounded-[10px] border border-[#d9d9d9]">
                    <img src={p.previewUrl} alt={`첨부 이미지 ${index + 1}`} className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      aria-label="사진 삭제"
                      className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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

        {/* 등록 버튼 */}
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary w-[200px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "등록 중..." : "리뷰 등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
