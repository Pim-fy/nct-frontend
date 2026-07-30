// src/pages/provider/QuoteFormPage.jsx
// F-SVC-005/006: 제공자 견적 제출·수정 (담당자3 황성경 소유)
import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSubmitQuote, useUpdateQuote } from "@hooks/useQuote";
import cameraIcon from "@assets/img/icon_camera.png";
import iconImage from "@assets/img/icon_image.png";
import { toast } from "@utils/common";
import AlertModal from "@components/common/AlertModal";
import "./QuoteFormPage.css";

const MAX_WORK_PHOTOS = 20;
const MAX_MESSAGE_LEN = 1000;
const PHOTO_COLS      = 5;

const FALLBACK_REQUEST = { title: "서비스 요청", category: "", sub: "", location: "", budget: "", requester: "" };

function FieldBlock({ label, required, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 16, fontWeight: 500, color: "#333" }}>
        {label}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 13, color: "#969696", margin: 0 }}>{hint}</p>}
    </div>
  );
}

const DURATION_OPTIONS = ["30분", "1시간", "2시간", "3시간", "4시간", "반나절", "하루", "이틀", "3일", "1주일", "직접입력"];

function DurationField({ value, onChange, error }) {
  const isCustom = !DURATION_OPTIONS.slice(0, -1).includes(value);
  const [mode, setMode] = useState(isCustom ? "custom" : "select");

  const handleSelect = (e) => {
    const v = e.target.value;
    if (v === "직접입력") {
      setMode("custom");
      onChange("");
    } else {
      setMode("select");
      onChange(v);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <select
        className="input"
        value={mode === "custom" ? "직접입력" : value}
        onChange={handleSelect}
        style={{ borderColor: error && mode === "select" && !value ? "#EF4444" : undefined }}
      >
        <option value="">선택하세요</option>
        {DURATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {mode === "custom" && (
        <input
          type="text"
          className="input"
          placeholder="예) 5시간, 2주"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus
          style={{ borderColor: error && !value.trim() ? "#EF4444" : undefined }}
        />
      )}
    </div>
  );
}

// 작업 사진 업로드 — 경매등록 ProductImageUpload와 동일한 레이아웃
function WorkPhotoUpload({ photos, onChange, submitted }) {
  const [pickMode, setPickMode] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList).slice(0, MAX_WORK_PHOTOS - photos.length);
    if (!files.length) return;
    const newItems = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
    }));
    onChange(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setAsRepresentative = (id) => {
    onChange(prev => {
      const idx = prev.findIndex(p => p.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [picked] = next.splice(idx, 1);
      next.unshift(picked);
      return next;
    });
    setPickMode(false);
  };

  const removePhoto = (id) => {
    onChange(prev => {
      const target = prev.find(p => p.id === id);
      if (target?.file) URL.revokeObjectURL(target.url);
      return prev.filter(p => p.id !== id);
    });
  };

  const emptyCount = photos.length >= MAX_WORK_PHOTOS
    ? 0
    : PHOTO_COLS - (photos.length % PHOTO_COLS);

  return (
    <div
      className="card"
      style={{ border: "none", padding: 0, boxShadow: "none", minHeight: 220, display: "flex", flexDirection: "column" }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
    >
      <div className="qf-photo-header">
        <div>
          <strong>작업 사진</strong>
          <p className="muted small" style={{ margin: "4px 0 0" }}>
            {pickMode
              ? "대표로 지정할 사진을 선택하세요"
              : `드래그앤드롭 또는 파일 선택 · 최대 ${MAX_WORK_PHOTOS}장 (${photos.length}/${MAX_WORK_PHOTOS})`}
          </p>
        </div>
        <div className="qf-summary-actions">
          <button
            type="button"
            onClick={() => setPickMode(v => !v)}
            disabled={photos.length === 0}
            className="btn btn-ghost"
            style={pickMode ? { background: "#0064ff", color: "#fff", borderColor: "#0064ff" } : undefined}
          >
            <img src={iconImage} alt="" style={{ width: 15, height: 15, display: "block" }} />
            대표이미지로 지정
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= MAX_WORK_PHOTOS}
            className="btn btn-ghost"
          >
            <img src={cameraIcon} alt="" style={{ width: 15, height: 15, display: "block" }} />
            사진등록
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          hidden
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      <div className="qf-photo-grid">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            style={{ position: "relative" }}
          >
            {/* 이미지 영역 (overflow hidden으로 objectFit 적용) */}
            <div
              onClick={() => pickMode && setAsRepresentative(photo.id)}
              style={{
                aspectRatio: "1",
                overflow: "hidden",
                borderRadius: 8,
                cursor: pickMode && i !== 0 ? "pointer" : "default",
                border: i === 0 ? "2px solid #0064ff"
                  : pickMode ? "2px dashed #0064ff"
                  : "1px solid #eee",
              }}
            >
              <img
                src={photo.url}
                alt={`작업 사진 ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              {i === 0 && photos.length > 1 && (
                <span className="badge badge-blue" style={{ position: "absolute", top: 4, left: 4, fontSize: 13 }}>대표</span>
              )}
            </div>
            {/* X 버튼 — 이미지 컨테이너 밖에 배치하여 클리핑 방지 */}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removePhoto(photo.id); }}
              title="삭제"
              style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", border: "none", background: "#111", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: "20px", padding: 0, zIndex: 1 }}
            >
              ×
            </button>
          </div>
        ))}
        {Array.from({ length: emptyCount }, (_, i) => (
          <div
            key={`empty-${i}`}
            onClick={() => fileInputRef.current?.click()}
            style={{ width: "100%", borderRadius: 8, border: "1px dashed #d8d6cf", background: "#fafaf8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", aspectRatio: "1" }}
          >
            <span style={{ fontSize: 24, color: "#c7c5bd" }}>+</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

export default function QuoteFormPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const routeState = location.state || {};

  // router state: { svcReqSn, svcReqTitle, category, location, budget, requester }  → 신규
  //               { quoteId, svcReqSn, svcReqTitle, amount, content, reviseCnt }    → 수정
  const isEditMode = !!routeState.quoteId;
  const [quoteId]  = useState(routeState.quoteId || null);
  const svcReqInfo = {
    svcReqSn:  routeState.svcReqSn,
    title:     routeState.svcReqTitle  || FALLBACK_REQUEST.title,
    category:  routeState.category     || FALLBACK_REQUEST.category,
    sub:       routeState.sub          || FALLBACK_REQUEST.sub,
    location:  routeState.location     || FALLBACK_REQUEST.location,
    budget:    routeState.budget       || FALLBACK_REQUEST.budget,
    requester: routeState.requester    || FALLBACK_REQUEST.requester,
  };

  const submitMutation = useSubmitQuote();
  const updateMutation = useUpdateQuote();

  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [alertMsg,  setAlertMsg]  = useState("");

  const MAX_EDIT_COUNT = 3;

  const [form, setForm] = useState({
    price:    isEditMode ? String(routeState.amount  || "") : "",
    duration: "",
    message:  isEditMode ? (routeState.content || "") : "",
  });
  const [prevForm, setPrevForm] = useState({ ...form });
  const [workPhotos, setWorkPhotos] = useState([]);
  const [prevPhotoIds, setPrevPhotoIds] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [editCount, setEditCount] = useState(isEditMode ? (routeState.reviseCnt || 0) : 0);
  const [isQuoteSubmitted, setIsQuoteSubmitted] = useState(isEditMode);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const fmt = n => (n ? Number(n).toLocaleString() : "");

  const photosChanged = () => {
    const ids = workPhotos.map(p => p.id);
    if (ids.length !== prevPhotoIds.length) return true;
    return ids.some((id, i) => id !== prevPhotoIds[i]);
  };

  const buildDiff = (prev, next) => {
    const lines = [];
    if (prev.price !== next.price)
      lines.push(`견적 금액을 ${fmt(prev.price)}원에서 ${fmt(next.price)}원으로 수정했습니다.`);
    if (prev.duration !== next.duration)
      lines.push(`예상 소요 시간을 ${prev.duration}에서 ${next.duration}으로 수정했습니다.`);
    if (prev.message !== next.message)
      lines.push("견적 메시지를 수정했습니다.");
    if (photosChanged())
      lines.push(`작업 사진을 ${prevPhotoIds.length}장에서 ${workPhotos.length}장으로 변경했습니다.`);
    return lines.length ? lines.join(" ") : "내용 변경 없음.";
  };

  const now = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const validate = () => {
    setSubmitted(true);
    if (!form.price)             { setAlertMsg("견적 금액을 입력해 주세요.");          return false; }
    if (Number(form.price) <= 0) { setAlertMsg("견적 금액은 1원 이상이어야 합니다."); return false; }
    if (!form.duration.trim())   { setAlertMsg("예상 소요 시간을 입력해 주세요.");     return false; }
    if (!form.message.trim())    { setAlertMsg("견적 메시지를 입력해 주세요.");        return false; }
    return true;
  };

  const [editSuccessMsg, setEditSuccessMsg] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const hasChanges = () =>
    form.price !== prevForm.price ||
    form.duration !== prevForm.duration ||
    form.message !== prevForm.message ||
    photosChanged();

  const handleEdit = async () => {
    if (editCount >= MAX_EDIT_COUNT) { setAlertMsg("수정 가능 횟수(3회)를 초과했습니다."); return; }
    if (!hasChanges()) { setAlertMsg("변경된 내용이 없습니다."); return; }
    if (!validate()) return;
    setLoading(true);
    try {
      await updateMutation.mutateAsync({
        quoteId,
        amount:  Number(form.price),
        content: form.message,
      });
      const desc = buildDiff(prevForm, form);
      const next = editCount + 1;
      setRevisions(prev => [...prev, { round: next, date: now(), desc }]);
      setPrevForm({ ...form });
      setPrevPhotoIds(workPhotos.map(p => p.id));
      setEditCount(next);
      setEditSuccessMsg(`견적이 수정되었습니다.\n남은 수정 횟수: ${MAX_EDIT_COUNT - next}회`);
    } catch (err) {
      toast({ icon: "error", title: err?.response?.data?.message || "견적 수정에 실패했습니다. 다시 시도해 주세요." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await submitMutation.mutateAsync({
        svcReqSn: svcReqInfo.svcReqSn,
        amount:   Number(form.price),
        content:  form.message,
      });
      setIsQuoteSubmitted(true);
      setSubmitSuccess(true);
    } catch (err) {
      toast({ icon: "error", title: err?.response?.data?.message || "견적 제출에 실패했습니다. 다시 시도해 주세요." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container seller-page">

      {/* 페이지 헤더 */}
      <div className="page-title">
        <div><h1 style={{ fontWeight: 700 }}>견적 작성</h1></div>
      </div>

      {/* 견적 입력(좌) + 요청요약·수정가능정보(우) 2열 */}
      <div className="qf-main-grid">

        {/* 좌: 견적 정보 입력 */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          <div className="qf-price-grid">
            <FieldBlock label="견적 금액" required>
              <input
                type="number"
                className="input no-spinner"
                placeholder="예) 160000"
                value={form.price}
                onChange={e => set("price", e.target.value)}
                min={0}
                style={{ borderColor: submitted && !form.price ? "#EF4444" : undefined }}
              />
              {form.price && (
                <p style={{ fontSize: 14, color: "#0064ff", margin: 0, fontWeight: 500 }}>{fmt(form.price)}원</p>
              )}
            </FieldBlock>

            <FieldBlock label="예상 소요 시간" required>
              <DurationField
                value={form.duration}
                onChange={val => set("duration", val)}
                error={submitted && !form.duration.trim()}
              />
            </FieldBlock>
          </div>

          <FieldBlock label={`견적 메시지 ${form.message.length}/${MAX_MESSAGE_LEN}`} required>
            <textarea
              className="input"
              rows={6}
              placeholder="제공할 서비스의 내용, 방식, 포함 항목 등을 상세히 작성하세요."
              value={form.message}
              onChange={e => set("message", e.target.value.slice(0, MAX_MESSAGE_LEN))}
              maxLength={MAX_MESSAGE_LEN}
              style={{
                resize: "vertical", minHeight: 140,
                padding: "10px 12px", lineHeight: 1.6,
                borderColor: submitted && !form.message.trim() ? "#EF4444" : undefined,
              }}
            />
          </FieldBlock>

          {/* 작업 사진 */}
          <WorkPhotoUpload photos={workPhotos} onChange={setWorkPhotos} submitted={submitted} />

          {!isQuoteSubmitted && (
            <div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? "제출 중..." : "견적 제출"}
              </button>
            </div>
          )}
        </div>

        {/* 우: 요청 요약 + 수정 가능 정보 */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* 요청 요약 카드 */}
          <section className="card qf-summary-card">
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>요청 요약</h3>
            <p className="qf-summary-text" style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {svcReqInfo.category && (
                <span className="badge badge-blue" style={{ fontSize: 13, borderRadius: 5, height: 28 }}>
                  {svcReqInfo.category}{svcReqInfo.sub ? `·${svcReqInfo.sub}` : ""}
                </span>
              )}
              <span style={{ fontSize: 16, color: "#333" }}>
                {svcReqInfo.title}
                {svcReqInfo.location  && ` · ${svcReqInfo.location}`}
                {svcReqInfo.budget    && ` · 예산 ${svcReqInfo.budget}`}
                {svcReqInfo.requester && ` · 요청자 ${svcReqInfo.requester}`}
              </span>
            </p>
          </section>

          {/* 수정 가능 정보 카드 */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, flexShrink: 0 }}>수정 가능 정보</h3>
              <span style={{ fontSize: 14, color: "#4E4E4E" }}>제출 후 최대 3회 수정 가능하며, 이력은 보존됩니다.</span>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: 15 }}>
              {editCount < MAX_EDIT_COUNT
                ? <span style={{ color: "#0064ff", fontWeight: 600 }}>남은 수정 횟수: {MAX_EDIT_COUNT - editCount}회</span>
                : <span style={{ color: "#EF4444", fontWeight: 600 }}>수정 횟수를 모두 사용했습니다.</span>}
            </p>
            {revisions.length === 0 ? (
              <p style={{ fontSize: 15, color: "#969696", margin: 0 }}>아직 수정 이력이 없습니다.</p>
            ) : revisions.map(({ round, date, desc }) => (
              <div key={round} className="card qf-history-card" style={{ background: "#fafaf8", boxShadow: "none", marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{round}회차 수정 내용</h4>
                  <span className="muted small">{date}</span>
                </div>
                <p style={{ margin: 0, fontSize: 15 }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* 버튼 영역 — 카드 밖 하단 */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            {isQuoteSubmitted && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleEdit}
                disabled={loading || editCount >= MAX_EDIT_COUNT}
                style={editCount >= MAX_EDIT_COUNT ? {
                  background: "#e0e0e0", color: "#999", borderColor: "#e0e0e0", cursor: "not-allowed", pointerEvents: "none"
                } : undefined}
              >
                견적 수정
              </button>
            )}
            <button type="button" className="btn btn-danger" onClick={() => setCancelConfirm(true)}>견적 취소</button>
          </div>

        </aside>

      </div>

      <AlertModal open={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg("")} />

      {/* 견적 수정 완료 레이어팝업 */}
      {editSuccessMsg && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setEditSuccessMsg("")}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, padding: "36px 40px",
              maxWidth: 380, width: "90%", textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            {editSuccessMsg.split("\n").map((line, i) => (
              <p key={i} style={{ margin: i === 0 ? "0 0 8px" : 0, fontSize: i === 0 ? 18 : 15, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? "#111" : "#555" }}>
                {line}
              </p>
            ))}
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 24, width: "100%" }}
              onClick={() => setEditSuccessMsg("")}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 견적 제출 완료 레이어팝업 */}
      {submitSuccess && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, padding: "36px 40px",
              maxWidth: 380, width: "90%", textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#111" }}>견적이 제출되었습니다.</p>
            <p style={{ margin: 0, fontSize: 15, color: "#555" }}>내 견적 목록에서 확인하실 수 있습니다.</p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 24, width: "100%" }}
              onClick={() => { setSubmitSuccess(false); navigate("/provider/quotes"); }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 견적 취소 확인 팝업 */}
      {cancelConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setCancelConfirm(false)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 16, padding: "36px 40px",
              maxWidth: 380, width: "90%", textAlign: "center",
              boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#111" }}>견적을 취소하시겠습니까?</p>
            <p style={{ margin: 0, fontSize: 15, color: "#555" }}>작성 중인 내용은 저장되지 않습니다.</p>
            <div style={{ display: "flex", gap: "10px", marginTop: 24 }}>
              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setCancelConfirm(false)}>
                돌아가기
              </button>
              <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => navigate(-1)}>
                취소 확인
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
