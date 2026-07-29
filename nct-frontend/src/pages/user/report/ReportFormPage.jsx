// src/pages/user/report/ReportFormPage.jsx
// F-COM-018 (2단계): 신고 접수 폼 — 담당자3 황성경 소유
// - 더미 submit. API 연동 시 useMutation(postReport) 으로 교체.
// - 제출 후 /user/mypage?section=report-list 로 이동.
import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const REPORT_TYPES = [
  "제공자 프로필",
  "거래 문제",
  "서비스 요청",
  "부적절한 리뷰",
  "기타",
];

const TARGET_TYPES = [
  { value: "provider", label: "제공자 프로필" },
  { value: "trade",    label: "경매 거래" },
  { value: "service",  label: "서비스 거래" },
  { value: "review",   label: "리뷰" },
  { value: "direct",   label: "직접 입력" },
];

const MAX_FILES = 5;
const MAX_FILE_MB = 10;

const EMPTY = { type: "", targetType: "direct", targetId: "", targetName: "", title: "", content: "" };

export default function ReportFormPage({ embedded = false }) {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const goBack = () =>
    embedded
      ? navigate("/user/mypage?section=report-list")
      : navigate(-1);

  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]); // { id, file, previewUrl }[]
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const addFiles = (fileList) => {
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) return;
    const toAdd = Array.from(fileList).slice(0, remaining);
    const oversized = toAdd.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (oversized.length) {
      setErrors((prev) => ({ ...prev, files: `${MAX_FILE_MB}MB 이하 파일만 첨부 가능합니다.` }));
      return;
    }
    const newItems = toAdd.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));
    setFiles((prev) => [...prev, ...newItems]);
    setErrors((prev) => ({ ...prev, files: "" }));
  };

  const handleFileInput = (e) => { addFiles(e.target.files); e.target.value = ""; };
  const handleDrop = (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); };

  const removeFile = (id) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const validate = () => {
    const e = {};
    if (!form.type)        e.type    = "신고 유형을 선택해 주세요.";
    if (!form.targetName.trim()) e.targetName = "신고 대상을 입력해 주세요.";
    if (!form.title.trim())      e.title      = "제목을 입력해 주세요.";
    if (!form.content.trim())    e.content    = "신고 내용을 입력해 주세요.";
    if (form.content.length > 2000) e.content = "2,000자 이내로 입력해 주세요.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setSubmitting(true);
    // TODO: API 연동 — await postReport({ ...form, files })
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    navigate("/user/mypage?section=report-list");
  };

  const isTargetIdVisible = form.targetType !== "direct";

  return (
    <div className={embedded ? "" : "max-w-[680px] mx-auto px-4 py-10"}>

      {/* 페이지 헤더 */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={goBack}
          className="shrink-0 size-9 flex items-center justify-center rounded-full text-[#888] hover:bg-[#f5f6f8] transition-colors"
          aria-label="뒤로가기"
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-[24px] font-bold text-[#1a1a18] m-0">신고 접수하기</h1>
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {/* ── 신고 유형 ── */}
        <section className="bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-7 mb-4">
          <h2 className="text-[16px] font-bold text-[#1a1a18] mb-4 pb-3 border-b border-[#e8e9ec]">신고 유형</h2>
          <div className="flex flex-wrap gap-2">
            {REPORT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("type", t)}
                className={`h-[38px] px-5 rounded-[8px] text-[15px] font-medium border transition-colors ${
                  form.type === t
                    ? "bg-[#0064ff] text-white border-[#0064ff]"
                    : "bg-white text-[#333] border-[#e8e9ec] hover:border-[#0064ff] hover:text-[#0064ff]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {errors.type && <p className="text-[14px] text-red-500 mt-2">{errors.type}</p>}
        </section>

        {/* ── 신고 대상 ── */}
        <section className="bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-7 mb-4">
          <h2 className="text-[16px] font-bold text-[#1a1a18] mb-4 pb-3 border-b border-[#e8e9ec]">신고 대상</h2>

          {/* 대상 유형 */}
          <div className="mb-4">
            <label className="block text-[14px] font-medium text-[#888] mb-2">대상 유형</label>
            <div className="flex flex-wrap gap-2">
              {TARGET_TYPES.map((tt) => (
                <button
                  key={tt.value}
                  type="button"
                  onClick={() => set("targetType", tt.value)}
                  className={`h-[34px] px-4 rounded-full text-[14px] font-medium border transition-colors ${
                    form.targetType === tt.value
                      ? "bg-[#0064ff] text-white border-[#0064ff]"
                      : "bg-white text-[#444] border-[#e8e9ec] hover:border-[#0064ff] hover:text-[#0064ff]"
                  }`}
                >
                  {tt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 거래/서비스 ID */}
          {isTargetIdVisible && (
            <div className="mb-4">
              <label className="block text-[14px] font-medium text-[#888] mb-1.5">
                {form.targetType === "provider" ? "제공자 ID" : "거래 번호"}
                <span className="text-[#bbb] font-normal ml-1">(선택)</span>
              </label>
              <input
                type="text"
                value={form.targetId}
                onChange={(e) => set("targetId", e.target.value)}
                placeholder={form.targetType === "provider" ? "예: 제공자명 또는 ID" : "예: TRD-5821"}
                className="w-full h-[46px] rounded-[8px] border border-[#e8e9ec] px-4 text-[16px] text-[#1a1a18] placeholder:text-[#bbb] outline-none focus:border-[#0064ff] transition-colors"
              />
            </div>
          )}

          {/* 신고 대상 이름 */}
          <div>
            <label className="block text-[14px] font-medium text-[#888] mb-1.5">
              신고 대상 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.targetName}
              onChange={(e) => set("targetName", e.target.value)}
              placeholder="신고 대상의 이름 또는 상품명을 입력해 주세요."
              className={`w-full h-[46px] rounded-[8px] border px-4 text-[16px] text-[#1a1a18] placeholder:text-[#bbb] outline-none focus:border-[#0064ff] transition-colors ${
                errors.targetName ? "border-red-400 bg-red-50" : "border-[#e8e9ec]"
              }`}
            />
            {errors.targetName && <p className="text-[14px] text-red-500 mt-1">{errors.targetName}</p>}
          </div>
        </section>

        {/* ── 신고 내용 ── */}
        <section className="bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-7 mb-4">
          <h2 className="text-[16px] font-bold text-[#1a1a18] mb-4 pb-3 border-b border-[#e8e9ec]">신고 내용</h2>

          {/* 제목 */}
          <div className="mb-4">
            <label className="block text-[14px] font-medium text-[#888] mb-1.5">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="신고 제목을 간략히 입력해 주세요."
              maxLength={100}
              className={`w-full h-[46px] rounded-[8px] border px-4 text-[16px] text-[#1a1a18] placeholder:text-[#bbb] outline-none focus:border-[#0064ff] transition-colors ${
                errors.title ? "border-red-400 bg-red-50" : "border-[#e8e9ec]"
              }`}
            />
            {errors.title && <p className="text-[14px] text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-[14px] font-medium text-[#888] mb-1.5">
              신고 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="신고 사유를 최대한 자세히 입력해 주세요. (최대 2,000자)"
              maxLength={2000}
              rows={7}
              className={`w-full rounded-[8px] border px-4 py-3 text-[16px] text-[#1a1a18] placeholder:text-[#bbb] outline-none focus:border-[#0064ff] transition-colors resize-none leading-relaxed ${
                errors.content ? "border-red-400 bg-red-50" : "border-[#e8e9ec]"
              }`}
            />
            <div className="flex items-start justify-between mt-1 gap-2">
              {errors.content
                ? <p className="text-[14px] text-red-500">{errors.content}</p>
                : <span />}
              <p className="text-[13px] text-[#bbb] shrink-0">{form.content.length.toLocaleString()} / 2,000</p>
            </div>
          </div>
        </section>

        {/* ── 첨부파일 — qf-photo-header + qf-photo-grid 동일 구조 ── */}
        <section
          className="bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-7 mb-8"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {/* 헤더 */}
          <div className="flex justify-between items-start gap-2 pb-3 border-b border-[#e8e9ec] mb-3">
            <div>
              <h2 className="text-[16px] font-bold text-[#1a1a18]">첨부파일</h2>
              <p className="text-[14px] text-[#888] mt-1">
                드래그앤드롭 또는 파일 선택 · 최대 {MAX_FILES}개 ({files.length}/{MAX_FILES}) · 파일당 {MAX_FILE_MB}MB 이하
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={files.length >= MAX_FILES}
                className="btn btn-ghost btn-sm"
              >
                <svg className="size-[15px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                파일 선택
              </button>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            onChange={handleFileInput}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />

          {/* 5열 그리드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {files.map((item) => {
              const ext = item.file.name.split(".").pop().toUpperCase().slice(0, 4);
              return (
                <div key={item.id} style={{ position: "relative" }}>
                  <div style={{ aspectRatio: "1", overflow: "hidden", borderRadius: 8, border: "1px solid #e8e9ec", background: "#f5f6f8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {item.previewUrl ? (
                      <img
                        src={item.previewUrl}
                        alt={item.file.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "0 4px", width: "100%" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0064ff", background: "#e5efff", borderRadius: 4, padding: "2px 6px" }}>{ext}</span>
                        <span style={{ fontSize: 11, color: "#888", maxWidth: "90%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.file.name.replace(/\.[^.]+$/, "")}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    title="삭제"
                    style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#111", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: "20px", padding: 0, zIndex: 1 }}
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {/* 빈 슬롯 */}
            {Array.from({ length: MAX_FILES - files.length }, (_, i) => (
              <div
                key={`empty-${i}`}
                onClick={() => fileRef.current?.click()}
                style={{ aspectRatio: "1", borderRadius: 8, border: "1px dashed #d8d6cf", background: "#fafaf8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <span style={{ fontSize: 24, color: "#c7c5bd" }}>+</span>
              </div>
            ))}
          </div>

          {errors.files && <p className="text-[14px] text-red-500 mt-2">{errors.files}</p>}
        </section>

        {/* 안내 문구 */}
        <div className="bg-[#f5f6f8] rounded-[8px] p-4 mb-6 text-[14px] text-[#888] leading-relaxed">
          <p className="font-semibold text-[#444] mb-1">신고 접수 안내</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>허위 신고는 서비스 이용에 제한이 있을 수 있습니다.</li>
            <li>접수 후 처리까지 영업일 기준 3~5일이 소요될 수 있습니다.</li>
            <li>처리 결과는 내 신고 목록에서 확인하실 수 있습니다.</li>
          </ul>
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={goBack}
            className="btn btn-outline flex-1"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary flex-1"
          >
            {submitting ? "접수 중…" : "신고 접수하기"}
          </button>
        </div>

      </form>
    </div>
  );
}
