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
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    const merged = [...files, ...selected].slice(0, MAX_FILES);
    const oversized = merged.filter((f) => f.size > MAX_FILE_MB * 1024 * 1024);
    if (oversized.length) {
      setErrors((prev) => ({ ...prev, files: `${MAX_FILE_MB}MB 이하 파일만 첨부 가능합니다.` }));
      return;
    }
    setFiles(merged);
    setErrors((prev) => ({ ...prev, files: "" }));
    e.target.value = "";
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

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

        {/* ── 첨부파일 ── */}
        <section className="bg-white rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] p-7 mb-8">
          <h2 className="text-[16px] font-bold text-[#1a1a18] mb-1 pb-3 border-b border-[#e8e9ec]">첨부파일</h2>
          <p className="text-[14px] text-[#888] mb-4">최대 {MAX_FILES}개 · 파일당 {MAX_FILE_MB}MB 이하 (이미지, PDF, 문서)</p>

          {/* 파일 목록 */}
          {files.length > 0 && (
            <ul className="mb-3 space-y-2">
              {files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center gap-3 px-4 py-2.5 rounded-[8px] bg-[#f5f6f8] border border-[#e8e9ec]">
                  <svg className="size-4 text-[#888] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="flex-1 min-w-0 text-[15px] text-[#444] truncate">{f.name}</span>
                  <span className="text-[13px] text-[#bbb] shrink-0">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="shrink-0 size-6 flex items-center justify-center rounded-full text-[#bbb] hover:bg-[#e8e9ec] hover:text-[#666] transition-colors text-[16px]"
                    aria-label="파일 삭제"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          {files.length < MAX_FILES && (
            <>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFiles}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn btn-outline btn-sm gap-1.5"
              >
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                파일 첨부 ({files.length}/{MAX_FILES})
              </button>
            </>
          )}

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
