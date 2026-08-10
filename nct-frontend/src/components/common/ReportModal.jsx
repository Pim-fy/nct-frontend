// src/components/common/ReportModal.jsx
// 신고 모달 — 어느 페이지에서든 import하여 사용 가능
//
// 사용법 (다른 담당자 페이지에 버튼 삽입 시):
//   import ReportModal from '@components/common/ReportModal';
//   const [reportOpen, setReportOpen] = useState(false);
//
//   <button onClick={() => setReportOpen(true)}>신고하기</button>
//   <ReportModal
//     open={reportOpen}
//     onClose={() => setReportOpen(false)}
//     targetName="홍길동"              // (선택) 신고 대상 이름 pre-fill
//     targetLabel="경매 상품"          // (선택) 신고 대상 필드 라벨
//     targetLocked                     // (선택) 신고 대상 이름 수정 방지
//     hideTitle                        // (선택) 제목 입력을 숨기고 자동 생성
//     targetType="provider"           // (선택) 'provider'|'auction'|'trade'|'service'|'review'|'direct'
//     referenceSn={123}               // (선택) 거래번호 등 참조 ID
//     reportedUserSn={123}            // (선택) 피신고자 회원번호
//     reportTypeLabel="제공자 프로필"   // (선택) 신고 유형 pre-fill
//     contextLabel="제공자: 홍길동"     // (선택) 모달 상단에 컨텍스트 표시
//   />
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSubmitCustomerReport } from "@hooks/useAbuseReport";
import { toast } from "@utils/common";

const REPORT_TYPES = [
  "허위 정보",
  "사기·기만",
  "욕설·비방",
  "불법 거래",
  "기타",
];

const TYPE_CODE_MAP = {
  "허위 정보": "ABRC0002",
  "사기·기만": "ABRC0001",
  "욕설·비방": "ABRC0003",
  "불법 거래": "ABRC0001",
  "기타":      "ABRC0004",
};

const REF_TYPE_CODE_MAP = {
  provider: "REFC0001",
  auction:  "REFC0003",
  trade:    "REFC0005",
  service:  "REFC0007",
  review:   null,
  direct:   null,
};

const EMPTY_FORM = { types: [], targetName: "", title: "", content: "" };

export default function ReportModal(props) {
  if (!props.open) return null;
  return <ReportModalContent {...props} />;
}

function ReportModalContent({
  onClose,
  targetName: initialTargetName = "",
  targetLabel = "신고 대상",
  targetLocked = false,
  hideTitle = false,
  targetType = "direct",
  referenceSn,
  reportedUserSn,
  reportTypeLabel = "",
  contextLabel = "",
}) {
  const { mutateAsync, isPending } = useSubmitCustomerReport();
  const navigate = useNavigate();

  const [form, setForm] = useState(() => ({
    ...EMPTY_FORM,
    types: reportTypeLabel ? [reportTypeLabel] : [],
    targetName: initialTargetName || "",
  }));
  const [errors, setErrors] = useState({});

  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // 모달 열릴 때 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const toggleType = (t) => {
    setForm((prev) => ({
      ...prev,
      types: prev.types.includes(t) ? [] : [t],
    }));
    if (errors.types) setErrors((prev) => ({ ...prev, types: "" }));
  };

  const set = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (form.types.length === 0)  e.types      = "신고 유형을 하나 이상 선택해 주세요.";
    if (!form.targetName.trim())  e.targetName = "신고 대상을 입력해 주세요.";
    if (!hideTitle && !form.title.trim()) e.title = "제목을 입력해 주세요.";
    if (!form.content.trim())     e.content    = "신고 내용을 입력해 주세요.";
    if (form.content.length > 2000) e.content  = "2,000자 이내로 입력해 주세요.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      const reportTitle = hideTitle
        ? `[${form.types[0]}] ${form.targetName.trim()}`.slice(0, 100)
        : form.title.trim();
      // 담당자 7 · F-COM-015: 제공자 신고 대상 회원번호를 공통 신고 계약에 전달합니다.
      await mutateAsync({
        reportTypeCode:    TYPE_CODE_MAP[form.types[0]] ?? "ABRC0004",
        reportedUserSn:    reportedUserSn ?? null,
        referenceTypeCode: REF_TYPE_CODE_MAP[targetType] ?? null,
        referenceSn:       referenceSn ?? null,
        targetName:        form.targetName.trim() || null,
        title:             reportTitle,
        content:           form.content.trim(),
      });
      toast({ icon: "success", title: "신고가 접수되었습니다." });
      onClose();
      navigate("/user/mypage/reports");
    } catch {
      setErrors((prev) => ({ ...prev, _server: "신고 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." }));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 p-4"
    >
      <div
        className="bg-white rounded-[16px] w-full max-w-[520px] max-h-[90vh] flex flex-col overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.18)]"
      >
        {/* 헤더 */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between shrink-0" style={{ backgroundColor: "#0064ff" }}>
          <h2 className="text-[20px] font-bold text-white m-0">신고하기</h2>
          <button
            type="button"
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full transition-colors text-[18px] leading-none text-white hover:bg-white/20"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 본문 — 스크롤 영역 */}
        <form onSubmit={handleSubmit} noValidate className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* 컨텍스트 표시 (진입 경로 정보) */}
          {contextLabel && (
            <div className="bg-[#f5f6f8] rounded-[8px] px-4 py-3">
              <p className="text-[14px] text-[#888] m-0">신고 대상</p>
              <p className="text-[16px] font-bold text-[#1a1a18] m-0 mt-0.5">{contextLabel}</p>
            </div>
          )}

          {/* 신고 유형 — 복수 선택 가능 */}
          <div>
            <p className="text-[15px] font-bold text-[#1a1a18] mb-1">
              신고 유형 <span className="text-red-500">*</span>
            </p>
            <p className="text-[13px] text-[#969696] mb-2">1개 선택</p>
            <div className="flex flex-wrap gap-2">
              {REPORT_TYPES.map((t) => {
                const active = form.types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={`h-[36px] px-4 rounded-[8px] text-[14px] font-medium border transition-colors flex items-center gap-1.5 ${
                      active
                        ? "bg-[#0064ff] text-white border-[#0064ff]"
                        : "bg-white text-[#333] border-[#e8e9ec] hover:border-[#0064ff] hover:text-[#0064ff]"
                    }`}
                  >
                    {active && <span className="text-[12px]">✓</span>}
                    {t}
                  </button>
                );
              })}
            </div>
            {errors.types && <p className="text-[13px] text-red-500 mt-1.5">{errors.types}</p>}
          </div>

          {/* 신고 대상 이름 */}
          <div>
            <label className="block text-[15px] font-bold text-[#1a1a18] mb-2">
              {targetLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.targetName}
              onChange={targetLocked ? undefined : (e) => set("targetName", e.target.value)}
              disabled={targetLocked}
              placeholder="신고 대상의 이름 또는 상품명을 입력해 주세요."
              className={`w-full h-[44px] rounded-[8px] border px-4 text-[15px] outline-none transition-colors ${
                errors.targetName
                  ? "border-red-400 bg-red-50 text-[#1a1a18]"
                  : targetLocked
                    ? "cursor-not-allowed border-[#e8e9ec] bg-[#f5f6f8] text-[#555] opacity-100"
                    : "border-[#e8e9ec] text-[#1a1a18] placeholder:text-[#bbb] focus:border-[#0064ff]"
              }`}
            />
            {errors.targetName && <p className="text-[13px] text-red-500 mt-1">{errors.targetName}</p>}
          </div>

          {/* 제목 */}
          {!hideTitle && (
            <div>
              <label className="block text-[15px] font-bold text-[#1a1a18] mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="신고 제목을 간략히 입력해 주세요."
                maxLength={100}
                className={`w-full h-[44px] rounded-[8px] border px-4 text-[15px] text-[#1a1a18] placeholder:text-[#bbb] outline-none focus:border-[#0064ff] transition-colors ${
                  errors.title ? "border-red-400 bg-red-50" : "border-[#e8e9ec]"
                }`}
              />
              {errors.title && <p className="text-[13px] text-red-500 mt-1">{errors.title}</p>}
            </div>
          )}

          {/* 신고 내용 */}
          <div>
            <label className="block text-[15px] font-bold text-[#1a1a18] mb-2">
              신고 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="신고 사유를 최대한 자세히 입력해 주세요. (최대 2,000자)"
              maxLength={2000}
              rows={5}
              className={`w-full rounded-[8px] border px-4 py-3 text-[15px] text-[#1a1a18] placeholder:text-[#bbb] outline-none focus:border-[#0064ff] transition-colors resize-none leading-relaxed ${
                errors.content ? "border-red-400 bg-red-50" : "border-[#e8e9ec]"
              }`}
            />
            <div className="flex items-start justify-between mt-1 gap-2">
              {errors.content
                ? <p className="text-[13px] text-red-500">{errors.content}</p>
                : <span />}
              <p className="text-[13px] text-[#bbb] shrink-0">{form.content.length.toLocaleString()} / 2,000</p>
            </div>
          </div>

          {/* 안내 문구 */}
          <div className="bg-[#f5f6f8] rounded-[8px] px-4 py-3 text-[13px] text-[#888] leading-relaxed">
            <p className="font-semibold text-[#444] mb-1 m-0">신고 안내</p>
            <ul className="list-disc list-inside space-y-0.5 m-0 p-0">
              <li>허위 신고는 서비스 이용에 제한이 있을 수 있습니다.</li>
              <li>처리까지 영업일 기준 3~5일이 소요될 수 있습니다.</li>
              <li>처리 결과는 마이페이지 &gt; 내 신고 목록에서 확인하실 수 있습니다.</li>
            </ul>
          </div>

          {errors._server && (
            <p className="text-[13px] text-red-500">{errors._server}</p>
          )}

        </form>

        {/* 하단 버튼 — 스크롤 밖에 고정 */}
        <div className="px-6 pb-5 pt-3 border-t border-[#e8e9ec] flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline flex-1"
          >
            취소
          </button>
          <button
            type="submit"
            form=""
            disabled={isPending}
            onClick={handleSubmit}
            className="btn btn-danger flex-1"
          >
            {isPending ? "신고 중…" : "신고하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
