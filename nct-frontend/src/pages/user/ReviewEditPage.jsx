// src/pages/user/ReviewEditPage.jsx
//
// "내가 작성한 리뷰" 목록의 "수정" 버튼에서 진입하는 리뷰 수정 폼.
// ReviewWritePage.jsx(리뷰 등록 폼)를 그대로 참고해서 만들었다 - 구조/스타일은 동일하고
// 차이는 (1) 기존 별점·내용·사진으로 미리 채워진다는 것, (2) createReview 대신 updateReview를 호출한다는 것뿐이다.
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Camera, X } from "lucide-react";
import StarRating from "@components/review/StarRating";
import { updateReview } from "@api/reviewApi";
import { toast } from "@utils/common";

const MAX_PHOTOS = 5;
const MAX_CONTENT_LENGTH = 500;

const DEAL_TYPE_STYLE = {
  goods:   { label: "물건거래", color: "#0064ff" },
  service: { label: "서비스",   color: "#00ccd0" },
};

export default function ReviewEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // 목록 페이지에서 navigate(..., { state: { item } }) 로 넘겨준, 수정 대상 리뷰(기존 rating/content 포함).
  // 새로고침 등으로 state 가 없으면(직접 URL 접근) 대상 정보를 알 수 없으므로 안내만 보여준다.
  const item = location.state?.item;

  const [rating, setRating] = useState(item?.rating ?? 0);
  const [content, setContent] = useState(item?.content ?? "");
  const [photos, setPhotos] = useState([]); // [{ file, previewUrl }] - 새로 첨부한 사진만 들어간다.
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // 미리보기 URL은 컴포넌트가 사라질 때 반드시 해제해야 메모리 누수가 없다.
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!item) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 text-center">
        <p className="text-[#4e4e4e]">수정할 리뷰 정보를 찾을 수 없습니다.</p>
        <p className="mt-1 text-sm text-[#969696]">목록에서 다시 "수정"을 눌러주세요.</p>
        <button
          type="button"
          onClick={() => navigate("/user/reviews")}
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark"
        >
          리뷰작성 목록으로
        </button>
      </div>
    );
  }

  const dealTypeStyle = DEAL_TYPE_STYLE[item.dealType] ?? DEAL_TYPE_STYLE.goods;

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
    formData.append("rating", rating);
    formData.append("content", content);
    photos.forEach((p) => formData.append("photos", p.file));

    setSubmitting(true);
    try {
      await updateReview(id ?? item.id, formData);
      toast({ icon: "success", title: "리뷰가 수정되었습니다." });
      // TODO: 리뷰 목록 GET API가 아직 없어(reviewApi.getReviews 미연동), 수정한 내용을
      // location.state로 들려 보내서 목록 화면이 새로고침 없이 바로 반영하게 한다.
      navigate("/user/reviews", {
        state: { updatedReview: { id: item.id, rating, content } },
      });
    } catch (err) {
      console.error("리뷰 수정 실패:", err);
      toast({ icon: "error", title: "리뷰 수정에 실패했습니다. 잠시 후 다시 시도해주세요." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10">
      <h1 className="mb-5 text-2xl font-bold text-black">리뷰수정</h1>

      <div className="rounded-2xl border border-[#e5e5e5] bg-white p-8">
        {/* 리뷰 대상 정보 */}
        <div className="flex gap-4">
          <div className="size-[129px] shrink-0 overflow-hidden rounded-[10px] border border-[#d9d9d9]">
            {item.thumbnail && (
              <img src={item.thumbnail} alt={item.title} className="size-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <span
              className="mb-2 inline-block rounded border bg-white px-2.5 py-1 text-sm"
              style={{ borderColor: dealTypeStyle.color, color: dealTypeStyle.color }}
            >
              {dealTypeStyle.label}
            </span>
            <h2 className="truncate text-xl font-bold text-black">{item.title}</h2>
          </div>
        </div>

        {/* 별점 */}
        <div className="mt-8">
          <p className="mb-3 text-lg font-bold text-black">상품에 만족하셨나요?</p>
          <StarRating value={rating} onChange={setRating} />
        </div>

        {/* 사진 첨부 */}
        <div className="mt-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleFilesSelected}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= MAX_PHOTOS}
            className="flex w-full items-center justify-center gap-2 rounded border border-[#bcbcbc] bg-white py-4 text-lg font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Camera size={22} />
            사진 첨부하기 (최대 5장)
          </button>

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
            className="w-[200px] rounded bg-primary py-3 text-base font-bold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "수정 중..." : "수정 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
