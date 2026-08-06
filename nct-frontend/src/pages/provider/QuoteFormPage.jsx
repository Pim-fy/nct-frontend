// src/pages/provider/QuoteFormPage.jsx
// F-SVC-005/006: 제공자 견적 제출·수정 (담당자3 황성경 소유)
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSubmitQuote, useUpdateQuote } from "@hooks/useQuote";
import { getMyActiveQuote } from "@api/quoteApi";
import { getServiceRequest } from "@api/serviceRequestApi";
import { fetchMyProviderQuoteAccess } from "@api/providerProfileApi";
import { uploadQuotePhoto } from "@api/quoteApi";
import { toImageUrl } from "@api/fileApi";
import { toast } from "@utils/common";
import AlertModal from "@components/common/AlertModal";
import "./QuoteFormPage.css";

const MAX_CONTENT_LEN = 4000;
const MAX_ATTACH      = 5;
const MAX_EDIT_COUNT  = 3;

const FALLBACK_REQUEST = { title: "서비스 요청", category: "" };

// ─── 메인 ────────────────────────────────────────────────────────────────────

export default function QuoteFormPage() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { quoteId: routeQuoteId, svcReqSn: routeSvcReqSn } = useParams();
  const routeState = location.state || {};
  const fileInputRef = useRef(null);

  // 요청번호와 견적번호는 URL 경로에서 받고, 화면 표시용 정보만 router state를 사용한다.
  const quoteId = Number(routeQuoteId) || null;
  const isEditMode = Boolean(quoteId);
  const svcReqSn = Number(routeSvcReqSn) || null;
  const [svcReqInfo, setSvcReqInfo] = useState({
    svcReqSn,
    catSn: routeState.catSn || null,
    title:     routeState.svcReqTitle  || FALLBACK_REQUEST.title,
    category:  routeState.category     || FALLBACK_REQUEST.category,
    sub:       routeState.sub          || FALLBACK_REQUEST.sub,
    location:  routeState.location     || FALLBACK_REQUEST.location,
    budget:    routeState.budget       || FALLBACK_REQUEST.budget,
    requester: routeState.requester    || FALLBACK_REQUEST.requester,
  });

  const submitMutation = useSubmitQuote();
  const updateMutation = useUpdateQuote();

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");
  const [policyAgreed, setPolicyAgreed] = useState(isEditMode);
  const [editSuccessMsg, setEditSuccessMsg] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [requestLoading, setRequestLoading] = useState(Boolean(svcReqSn));
  const [requestLoadFailed, setRequestLoadFailed] = useState(false);

  const [form, setForm] = useState({
    amount: isEditMode && routeState.amount != null ? String(routeState.amount) : "",
    message:  isEditMode ? (routeState.content || "") : "",
  });
  const [prevForm,        setPrevForm]        = useState({ ...form });
  const [attachFiles,     setAttachFiles]     = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [initialAttachmentSns, setInitialAttachmentSns] = useState([]);
  const [revisions,   setRevisions]   = useState([]);
  const [editCount,   setEditCount]   = useState(isEditMode ? (routeState.reviseCnt || 0) : 0);
  const [isQuoteSubmitted, setIsQuoteSubmitted] = useState(isEditMode);
  const [activeQuoteLoading, setActiveQuoteLoading] = useState(isEditMode);
  const [activeQuoteLoadFailed, setActiveQuoteLoadFailed] = useState(false);
  const quoteAccessQuery = useQuery({
    queryKey: ['provider', 'quote-access', svcReqInfo.catSn],
    queryFn: () => fetchMyProviderQuoteAccess(svcReqInfo.catSn),
    enabled: !isEditMode && !requestLoading && Number(svcReqInfo.catSn) > 0,
    retry: false,
  });

  useEffect(() => {
    if (!svcReqSn) return undefined;
    let cancelled = false;

    getServiceRequest(svcReqSn)
      .then((res) => {
        if (cancelled || !res.data) return;
        const request = res.data;
        setSvcReqInfo((prev) => ({
          ...prev,
          svcReqSn,
          catSn: request.catSn,
          title: request.svcReqTtl || prev.title,
          category: request.catNm || prev.category,
          budget: request.svcReqBdgtAmt == null
            ? prev.budget
            : `${Number(request.svcReqBdgtAmt).toLocaleString('ko-KR')}원`,
        }));
        setRequestLoadFailed(false);
      })
      .catch(() => { if (!cancelled) setRequestLoadFailed(true); })
      .finally(() => { if (!cancelled) setRequestLoading(false); });

    if (isEditMode && quoteId) {
      getMyActiveQuote(svcReqSn)
        .then((res) => {
          const quote = res.data;
          if (cancelled || !quote || Number(quote.qutSn) !== Number(quoteId)) {
            if (!cancelled) {
              setActiveQuoteLoadFailed(true);
              setActiveQuoteLoading(false);
            }
            return;
          }
          setForm((prev) => ({
            ...prev,
            amount: quote.amount == null ? prev.amount : String(quote.amount),
            message: quote.content || '',
          }));
          setPrevForm((prev) => ({
            ...prev,
            amount: quote.amount == null ? prev.amount : String(quote.amount),
            message: quote.content || '',
          }));
          const attachments = quote.attachments || [];
          setExistingAttachments(attachments);
          setInitialAttachmentSns(attachments.map((attachment) => String(attachment.flSn)));
          setEditCount(quote.reviseCnt || 0);
          setActiveQuoteLoading(false);
        })
        .catch(() => {
          if (!cancelled) {
            setActiveQuoteLoadFailed(true);
            setActiveQuoteLoading(false);
          }
        });
    }
    return () => { cancelled = true; };
  }, [svcReqSn, isEditMode, quoteId]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const attachmentFingerprint = () => [
    ...existingAttachments.map((attachment) => String(attachment.flSn)),
    ...attachFiles.map((attachment) => attachment.id),
  ].join(',');

  const hasChanges = () =>
    form.amount !== prevForm.amount ||
    form.message !== prevForm.message ||
    attachmentFingerprint() !== initialAttachmentSns.join(',');

  const now = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const validate = () => {
    setSubmitted(true);
    if (!form.amount || Number(form.amount) <= 0) { setAlertMsg("견적 금액을 입력해 주세요.");    return false; }
    if (!form.message.trim())                     { setAlertMsg("내용을 입력해 주세요.");         return false; }
    if (existingAttachments.length + attachFiles.length === 0) {
      setAlertMsg("첨부파일을 추가해 주세요.");
      return false;
    }
    return true;
  };

  const handleAmountInput = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    set("amount", raw);
  };

  if (!svcReqSn) {
    return (
      <main className="container seller-page">
        <section className="card mx-auto max-w-[640px] py-12 text-center">
          <p className="m-0 text-[22px] font-bold text-[#1d1d1f]">서비스 요청을 먼저 선택해 주세요.</p>
          <button type="button" className="btn btn-primary mt-6" onClick={() => navigate('/service')}>서비스 요청 목록으로</button>
        </section>
      </main>
    );
  }

  if (requestLoading || (isEditMode && activeQuoteLoading) || (!isEditMode && quoteAccessQuery.isLoading)) {
    return <main className="container seller-page"><section className="card mx-auto max-w-[640px] py-12 text-center">견적 정보를 확인하는 중입니다.</section></main>;
  }

  if (requestLoadFailed || activeQuoteLoadFailed || (!isEditMode && (quoteAccessQuery.isError || quoteAccessQuery.data !== true))) {
    return (
      <main className="container seller-page">
        <section className="card mx-auto max-w-[640px] py-12 text-center">
          <p className="m-0 text-[22px] font-bold text-[#1d1d1f]">견적을 작성할 수 없습니다.</p>
          <p className="mb-6 mt-3 text-base text-[#686762]">공개 요청과 제공자 카테고리 승인 상태를 확인해 주세요.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate(`/service-requests/${svcReqSn}`)}>요청 상세로 돌아가기</button>
        </section>
      </main>
    );
  }

  const handleFiles = (fileList) => {
    const added = Array.from(fileList).slice(0, MAX_ATTACH - existingAttachments.length - attachFiles.length);
    if (!added.length) return;
    setAttachFiles(prev => [
      ...prev,
      ...added.map(f => ({
        id: crypto.randomUUID(),
        file: f,
        name: f.name,
        size: f.size,
        previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id) => setAttachFiles(prev => {
    const target = prev.find(f => f.id === id);
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
    return prev.filter(f => f.id !== id);
  });

  const removeExistingAttachment = (flSn) => {
    setExistingAttachments((prev) => prev.filter((attachment) => attachment.flSn !== flSn));
  };

  const fmtSize = (size) =>
    size < 1024 * 1024 ? Math.round(size / 1024) + "KB" : (size / 1024 / 1024).toFixed(1) + "MB";

  const uploadFiles = async () => {
    const results = await Promise.all(attachFiles.map(f => uploadQuotePhoto(f.file)));
    return results.map(r => r.flSn);
  };

  const handleSubmit = async () => {
    if (!policyAgreed) { setAlertMsg("수정 가능 정보를 확인해 주세요."); return; }
    if (!validate()) return;
    setLoading(true);
    try {
      const photoFlSns = await uploadFiles();
      await submitMutation.mutateAsync({
        svcReqSn: svcReqInfo.svcReqSn,
        amount:   Number(form.amount),
        content:  form.message,
        photoFlSns,
      });
      setIsQuoteSubmitted(true);
      setSubmitSuccess(true);
    } catch (err) {
      toast({ icon: "error", title: err?.response?.data?.message || "견적 제출에 실패했습니다. 다시 시도해 주세요." });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (editCount >= MAX_EDIT_COUNT) { setAlertMsg("수정 가능 횟수(3회)를 초과했습니다."); return; }
    if (!hasChanges())               { setAlertMsg("변경된 내용이 없습니다.");              return; }
    if (!validate()) return;
    setLoading(true);
    try {
      const newPhotoFlSns = await uploadFiles();
      const photoFlSns = [
        ...existingAttachments.map((attachment) => attachment.flSn),
        ...newPhotoFlSns,
      ];
      await updateMutation.mutateAsync({
        quoteId,
        amount:  Number(form.amount),
        content: form.message,
        photoFlSns,
      });
      const lines = [];
      if (form.amount  !== prevForm.amount)          lines.push("금액을 수정했습니다.");
      if (form.message !== prevForm.message)         lines.push("내용을 수정했습니다.");
      if (attachmentFingerprint() !== initialAttachmentSns.join(',')) lines.push("첨부파일을 변경했습니다.");
      const desc = lines.length ? lines.join(" ") : "내용 변경 없음.";
      const next = editCount + 1;
      setRevisions(prev => [...prev, { round: next, date: now(), desc }]);
      setPrevForm({ ...form });
      setEditCount(next);
      setEditSuccessMsg(`견적이 수정되었습니다.\n남은 수정 횟수: ${MAX_EDIT_COUNT - next}회`);
    } catch (err) {
      toast({ icon: "error", title: err?.response?.data?.message || "견적 수정에 실패했습니다. 다시 시도해 주세요." });
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

      <div className="qf-simple-layout">

        {/* 서비스 요청 한 줄 표시 */}
        <p style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>
          서비스요청 {svcReqInfo.title}
          {svcReqInfo.category && (
            <span className="badge badge-blue" style={{ fontSize: 13, borderRadius: 5, marginLeft: 8, verticalAlign: "middle" }}>
              {svcReqInfo.category}
            </span>
          )}
        </p>

        {/* 폼 카드 */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* 좌: 입력 필드 / 우: 수정가능정보 (50/50) */}
          <div className="qf-main-2col">

            {/* 좌측 — 금액·내용·첨부파일 세로 나열 */}
            <div className="qf-col-left">
              <div className="qf-field">
                <label>
                  견적 금액 <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="input"
                    placeholder="0"
                    value={form.amount ? Number(form.amount).toLocaleString() : ""}
                    onChange={handleAmountInput}
                    style={{
                      paddingRight: 36,
                      borderColor: submitted && (!form.amount || Number(form.amount) <= 0) ? "#EF4444" : undefined,
                    }}
                  />
                  <span style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    fontSize: 14, color: "#888", pointerEvents: "none",
                  }}>원</span>
                </div>
              </div>

              <div className="qf-field">
                <label>
                  내용 <span style={{ color: "#EF4444" }}>*</span>
                  <span className="qf-field-hint">{form.message.length} / {MAX_CONTENT_LEN}</span>
                </label>
                <textarea
                  className="input"
                  rows={9}
                  placeholder={"견적 내용을 입력하세요\n\n예) 서비스 범위, 예상 일정, 특이사항 등"}
                  value={form.message}
                  onChange={e => set("message", e.target.value.slice(0, MAX_CONTENT_LEN))}
                  maxLength={MAX_CONTENT_LEN}
                  style={{
                    resize: "vertical", minHeight: 180,
                    padding: "10px 12px", lineHeight: 1.6,
                    borderColor: submitted && !form.message.trim() ? "#EF4444" : undefined,
                  }}
                />
              </div>

              {/* 버튼 — 입력 필드 컬럼 하단 */}
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCancelConfirm(true)}
                  style={{ flex: 1 }}
                >
                  취소
                </button>
                {isQuoteSubmitted ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleEdit}
                    disabled={loading || editCount >= MAX_EDIT_COUNT}
                    style={{ flex: 1 }}
                  >
                    {loading ? "수정 중..." : "견적 수정"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    {loading ? "제출 중..." : "견적 제출"}
                  </button>
                )}
              </div>

              <div className="qf-field">
                <label>
                  첨부파일 <span style={{ color: "#EF4444" }}>*</span>
                  <span className="qf-field-hint">(최대 {MAX_ATTACH}개)</span>
                </label>
                <div
                  className="qf-thumb-wrap"
                  style={{ borderColor: submitted && existingAttachments.length + attachFiles.length === 0 ? "#EF4444" : undefined }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    onChange={e => handleFiles(e.target.files)}
                  />
                  <div className="qf-thumb-header">
                    <p className="qf-thumb-hint">
                      드래그앤드롭 또는 파일 선택 · 최대 {MAX_ATTACH}개 ({existingAttachments.length + attachFiles.length}/{MAX_ATTACH})
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={existingAttachments.length + attachFiles.length >= MAX_ATTACH}
                    >
                      파일 추가
                    </button>
                  </div>
                  <div className="qf-thumb-grid">
                    {existingAttachments.map((attachment) => {
                      const extension = attachment.fileName?.split(".").pop()?.toUpperCase() || "FILE";
                      const isImage = ["JPG", "JPEG", "PNG", "GIF", "WEBP"].includes(extension);
                      return (
                        <div key={`saved-${attachment.flSn}`} className="qf-thumb-item">
                          {isImage ? (
                            <img src={toImageUrl(attachment.url)} alt={attachment.fileName} className="qf-thumb-img" />
                          ) : (
                            <div className="qf-thumb-file">
                              <span className="qf-thumb-ext">{extension}</span>
                            </div>
                          )}
                          <button
                            type="button"
                            className="qf-thumb-del"
                            onClick={() => removeExistingAttachment(attachment.flSn)}
                            aria-label="기존 첨부파일 삭제"
                          >×</button>
                          <a
                            href={toImageUrl(attachment.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="qf-thumb-name"
                            title={`${attachment.fileName} 열기`}
                          >
                            {attachment.fileName}
                          </a>
                        </div>
                      );
                    })}
                    {attachFiles.map(f => (
                      <div key={f.id} className="qf-thumb-item">
                        {f.previewUrl ? (
                          <img src={f.previewUrl} alt={f.name} className="qf-thumb-img" />
                        ) : (
                          <div className="qf-thumb-file">
                            <span className="qf-thumb-ext">{f.name.split(".").pop().toUpperCase()}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          className="qf-thumb-del"
                          onClick={() => removeFile(f.id)}
                          aria-label="삭제"
                        >×</button>
                        <span className="qf-thumb-name">{f.name}</span>
                      </div>
                    ))}
                    {Array.from({ length: MAX_ATTACH - existingAttachments.length - attachFiles.length }, (_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="qf-thumb-empty"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span>+</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 — 수정 가능 정보 */}
            <div className="qf-col-right">
              <div className="qf-policy-wrap">
                <div className="qf-policy-head">
                  <h4>수정 가능 정보 <span style={{ color: "#c0392b" }}>*</span></h4>
                  <span>제출 후 최대 3회 수정 가능하며, 이력은 보존됩니다.</span>
                </div>
                <p className="qf-policy-remain">
                  {editCount < MAX_EDIT_COUNT
                    ? <span style={{ color: "#0064ff", fontWeight: 600 }}>남은 수정 횟수: {MAX_EDIT_COUNT - editCount}회</span>
                    : <span style={{ color: "#EF4444", fontWeight: 600 }}>수정 횟수를 모두 사용했습니다.</span>}
                </p>
                <ul className="qf-policy-list">
                  <li>제출한 견적은 요청자가 선택하기 전까지 수정할 수 있습니다</li>
                  <li>수정할 때마다 이력이 기록되며 요청자에게 공개됩니다</li>
                  <li>수정 횟수 3회를 모두 사용하면 추가 수정이 불가합니다</li>
                </ul>
                {revisions.length === 0 ? (
                  <p className="qf-no-history">아직 수정 이력이 없습니다.</p>
                ) : (
                  revisions.map(({ round, date, desc }) => (
                    <div key={round} className="qf-history-card">
                      <div className="qf-history-card-header">
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{round}회차 수정</span>
                        <span className="muted small">{date}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{desc}</p>
                    </div>
                  ))
                )}
                {!isEditMode && (
                  <div className="qf-policy-agree">
                    <label>
                      <input
                        type="checkbox"
                        checked={policyAgreed}
                        onChange={e => setPolicyAgreed(e.target.checked)}
                        style={{ accentColor: "#0048bf" }}
                      />
                      위 내용을 확인하였습니다.
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <AlertModal open={!!alertMsg} message={alertMsg} onClose={() => setAlertMsg("")} />

      {/* 견적 수정 완료 팝업 */}
      {editSuccessMsg && (
        <div className="qf-modal-overlay" onClick={() => setEditSuccessMsg("")}>
          <div className="qf-modal-box" onClick={e => e.stopPropagation()}>
            <div className="qf-modal-icon">✅</div>
            {editSuccessMsg.split("\n").map((line, i) => (
              <p key={i} style={{ margin: i === 0 ? "0 0 8px" : 0, fontSize: i === 0 ? 18 : 15, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? "#111" : "#555" }}>
                {line}
              </p>
            ))}
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 24, width: "100%" }}
              onClick={() => {
                setEditSuccessMsg("");
                navigate("/user/mypage?section=quote");
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 견적 제출 완료 팝업 */}
      {submitSuccess && (
        <div className="qf-modal-overlay">
          <div className="qf-modal-box">
            <div className="qf-modal-icon">✅</div>
            <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#111" }}>견적이 제출되었습니다.</p>
            <p style={{ margin: 0, fontSize: 15, color: "#555" }}>견적 제출 내역에서 확인하실 수 있습니다.</p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 24, width: "100%" }}
              onClick={() => {
                setSubmitSuccess(false);
                navigate("/user/mypage?section=quote");
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 취소 확인 팝업 */}
      {cancelConfirm && (
        <div className="qf-modal-overlay" onClick={() => setCancelConfirm(false)}>
          <div className="qf-modal-box" onClick={e => e.stopPropagation()}>
            <div className="qf-modal-icon">⚠️</div>
            <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#111" }}>작성을 취소하시겠습니까?</p>
            <p style={{ margin: 0, fontSize: 15, color: "#555" }}>작성 중인 내용은 저장되지 않습니다.</p>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
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
