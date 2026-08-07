// src/pages/provider/MyQuoteListPage.jsx
// F-SVC-005/006/008 + F-PROV-010: 제공자 내 견적 목록 (담당자3 황성경 소유)
// - 버튼/배지: PROJECT/ui-preview.html 클래스 시스템 사용 (btn, badge)
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { confirm, toast } from "@utils/common";
import { useMyQuotes, useWithdrawQuote } from "@hooks/useQuote";
import { getMyActiveQuote } from "@api/quoteApi";
import { toImageUrl } from "@api/fileApi";
import MyPageContentHeader from "@components/mypage/MyPageContentHeader";

// ─── 상태 매핑 ────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  QUTC0001: "대기중",  // 제출
  QUTC0002: "대기중",  // 수정
  QUTC0003: "종료",    // 만료
  QUTC0004: "진행중",  // 선택됨
  QUTC0005: "종료",    // 철회
};

const TABS = ["전체", "대기중", "진행중", "종료"];

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function QuoteCard({ quote, onEdit, onCancel, onDetail }) {
  const navigate = useNavigate();
  const isDone   = quote.status === "종료";
  const isActive = quote.status === "진행중";
  const canEdit   = !isDone && !isActive && quote.editCount < 3;
  const canCancel = !isDone && !isActive;
  const maxEdited = quote.editCount >= 3;

  const fmt = (n) => Number(n).toLocaleString();

  return (
    <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] bg-white p-5 flex flex-col gap-3"
         style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)" }}>

      {/* 상단: 타이틀 + 액션 버튼 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {quote.catNm && (
            <span className="badge badge-blue" style={{ fontSize: 12, borderRadius: 5, flexShrink: 0 }}>{quote.catNm}</span>
          )}
          <p
            className="flex-1 min-w-0 font-bold text-[20px] text-[#333333] leading-none truncate cursor-pointer hover:text-[#0064ff] hover:underline transition-colors"
            onClick={() => navigate(`/service-requests/${quote.svcReqSn}`)}
          >
            {quote.title}
          </p>
        </div>
        {/* 액션 버튼 */}

        {isDone ? (
          <div className="flex gap-1.5 shrink-0">
            <button type="button" onClick={() => onDetail(quote)} className="btn btn-outline btn-sm h-[33px] text-[16px] font-medium">
              상세보기
            </button>
            <span className="badge badge-gray shrink-0" style={{ borderRadius: "5px", height: "40px" }}>종료</span>
          </div>
        ) : isActive ? (
          <div className="flex gap-1.5 shrink-0">
            <button type="button" onClick={() => onDetail(quote)} className="btn btn-outline btn-sm h-[33px] text-[16px] font-medium">
              상세보기
            </button>
            <span className="badge shrink-0" style={{ borderRadius: "5px", height: "40px", background: "#55C9C8", color: "#fff", border: "none" }}>진행중</span>
          </div>
        ) : (
          <div className="flex gap-1.5 shrink-0">
            <button type="button" onClick={() => onDetail(quote)} className="btn btn-outline btn-sm h-[33px] text-[16px] font-medium">
              상세보기
            </button>
            <button
              type="button"
              onClick={() => onEdit(quote)}
              disabled={!canEdit}
              className="btn btn-outline btn-sm disabled:cursor-not-allowed h-[33px] text-[16px] font-medium"
              style={{ gap: 0, ...(maxEdited ? { background: '#e0e0e0', color: '#999', borderColor: '#e0e0e0' } : {}) }}
            >
              수정{quote.editCount > 0 && (
                <span className="text-[13px] opacity-70">({quote.editCount}/3)</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onCancel(quote)}
              disabled={!canCancel}
              className="btn btn-ghost btn-sm h-[33px] text-[16px] font-medium"
              style={{ borderColor: "#4E4E4E", color: "#4E4E4E" }}
            >
              취소
            </button>
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div className="h-px bg-[#f0f0f0]" />

      {/* 하단 메타 정보 */}
      <div className="flex items-start justify-between gap-2">
        {/* 좌: 의뢰 예산 + 희망일 */}
        <div className="flex flex-col gap-2" style={{ padding: '8px 0' }}>
          {quote.svcReqBdgtAmt != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#969696" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, position: 'relative', top: -2 }}>
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              <span style={{ fontSize: 15, color: '#555', lineHeight: 1 }}>의뢰 예산 {fmt(quote.svcReqBdgtAmt)}원</span>
            </div>
          )}
          {quote.svcReqHopeDt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#969696" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, position: 'relative', top: -2 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span style={{ fontSize: 15, color: '#555', lineHeight: 1 }}>희망일 {quote.svcReqHopeDt}</span>
            </div>
          )}
        </div>
        {/* 우: 내 견적금액 + 제출일 */}
        <div className="flex flex-col gap-2 items-end" style={{ background: '#f0f6ff', borderRadius: 10, padding: '8px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7fd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, position: 'relative', top: -2 }}>
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span style={{ fontSize: 15, color: '#1a4fa0', fontWeight: 600, lineHeight: 1 }}>내 견적금액 {fmt(quote.amount)}원</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4a7fd4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flexShrink: 0, position: 'relative', top: -2 }}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style={{ fontSize: 15, color: '#4a7fd4', lineHeight: 1 }}>내 견적 제출일 {quote.submittedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

export default function MyQuoteListPage({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("대기중");
  const [detailModal, setDetailModal] = useState(null);
  const [detailAttachments, setDetailAttachments] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const { data: pageData, isLoading, isError } = useMyQuotes({ page: 1, size: 50 });
  const withdrawMutation = useWithdrawQuote();

  const quotes = useMemo(() => {
    if (!pageData?.content) return [];
    return pageData.content.map((q) => ({
      qutSn:      q.qutSn,
      svcReqSn:   q.svcReqSn,
      title:      q.svcReqTitle,
      quoteTitle: q.qutTtl || q.title || '',
      amount:     q.amount,
      content:    q.content,
      reviseCnt:  q.reviseCnt,
      submittedAt: q.registeredAt
        ? String(q.registeredAt).slice(0, 10).replace(/-/g, ".")
        : "-",
      status:    STATUS_MAP[q.statusCode] || "종료",
      editCount:     q.reviseCnt,
      catNm:         q.catNm || '',
      svcReqBdgtAmt: q.svcReqBdgtAmt || null,
      svcReqHopeDt:  q.svcReqRegDt ? String(q.svcReqRegDt).slice(0, 10).replace(/-/g, '.') : null,
    }));
  }, [pageData]);

  const filtered = useMemo(
    () => activeTab === "전체" ? quotes : quotes.filter((q) => q.status === activeTab),
    [activeTab, quotes],
  );

  const countOf = (s) => quotes.filter((q) => q.status === s).length;
  const totalCount = quotes.length;
  const pageHeader = embedded
    ? <MyPageContentHeader title="내 견적" />
    : <h2 className="m-0 text-[22px] font-bold text-[#1a1a1a]">내 견적</h2>;

  const handleDetail = async (quote) => {
    setDetailModal(quote);
    setDetailAttachments([]);
    setDetailLoading(true);
    try {
      const res = await getMyActiveQuote(quote.svcReqSn);
      setDetailAttachments(res.data?.attachments || []);
    } catch {
      // 첨부파일 없이 기본 정보만 표시
    } finally {
      setDetailLoading(false);
    }
  };

  const handleEdit = (quote) => {
    if (quote.editCount >= 3) {
      toast({ icon: "warning", title: "수정 가능 횟수(3회)를 초과했습니다." });
      return;
    }
    // 요청번호와 견적번호를 경로에 남겨 새로고침·직접 진입에도 연결 관계를 유지한다.
    navigate(`/service-requests/${quote.svcReqSn}/quotes/${quote.qutSn}/edit`, {
      state: { from: '/user/mypage?section=quote', quoteTitle: quote.quoteTitle || '' },
    });
  };

  const handleCancel = async (quote) => {
    const ok = await confirm({
      title: "견적을 철회하시겠습니까?",
      text: "철회한 견적은 복구할 수 없습니다.",
      icon: "warning",
      confirmButtonText: "철회",
      cancelButtonText: "취소",
    });
    if (!ok) return;
    try {
      await withdrawMutation.mutateAsync(quote.qutSn);
      toast({ icon: "success", title: "견적이 철회되었습니다." });
    } catch (err) {
      toast({ icon: "error", title: err?.response?.data?.message || "견적 철회에 실패했습니다." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        {pageHeader}
        <div className="flex items-center justify-center py-20">
          <p className="text-[15px] text-[#969696]">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-5">
        {pageHeader}
        <div className="flex items-center justify-center py-20">
          <p className="text-[15px] text-[#969696]">견적 목록을 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col gap-5">

      {/* 헤더 */}
      {pageHeader}

      {/* 탭 */}
      <div className="tab-group-1">
        {TABS.map((tab) => {
          const count    = tab === "전체" ? totalCount : countOf(tab);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`tab-pill${isActive ? " active" : ""}`}
            >
              {tab}
              <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 카드 그리드 */}
      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 border border-[rgba(0,0,0,0.08)] rounded-[10px] bg-white">
            <p className="text-[15px] text-[#969696]">해당 견적이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((quote) => (
              <QuoteCard
                key={quote.qutSn}
                quote={quote}
                onEdit={handleEdit}
                onCancel={handleCancel}
                onDetail={handleDetail}
              />
            ))}
          </div>
        )}
      </div>

    </div>

      {/* 견적 상세보기 모달 */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 1000, width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>

            {/* 헤더 */}
            <div style={{ position: 'relative', background: '#0064ff', padding: '16px 20px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>견적 상세보기</p>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#fff', display: 'flex', alignItems: 'center' }}
                aria-label="닫기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* 본문 */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#888' }}>제목</p>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111' }}>{detailModal.quoteTitle || '—'}</p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#888' }}>서비스 요청</p>
                <p style={{ margin: 0, fontSize: 15, color: '#555' }}>{detailModal.title}</p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#888' }}>견적 금액</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0064ff' }}>
                  {Number(detailModal.amount).toLocaleString()}원
                </p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13, color: '#888' }}>내용</p>
                <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap', color: '#333', background: '#f8f8f6', borderRadius: 8, padding: '10px 12px', maxHeight: 200, overflowY: 'auto' }}>
                  {detailModal.content || '—'}
                </p>
              </div>

              <div style={{ marginBottom: 20 }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: '#888' }}>
                  첨부파일{detailLoading ? '' : ` (${detailAttachments.length}개)`}
                </p>
                {detailLoading ? (
                  <p style={{ margin: 0, fontSize: 14, color: '#aaa' }}>불러오는 중...</p>
                ) : detailAttachments.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 14, color: '#aaa' }}>없음</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {detailAttachments.map((a, i) => {
                      const displayName = (a.fileName && !/^\d+$/.test(a.fileName.trim())) ? a.fileName : `첨부파일 ${i + 1}`;
                      const ext = displayName.split('.').pop().toUpperCase();
                      const isImg = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP'].includes(ext);
                      return (
                        <div key={a.flSn} style={{ background: '#f8f8f6', borderRadius: 8, overflow: 'hidden' }}>
                          {isImg && (
                            <img src={toImageUrl(a.url)} alt={displayName} style={{ width: '100%', display: 'block', maxHeight: 320, objectFit: 'contain', background: '#eee' }} />
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 12px' }}>
                            <span style={{ fontSize: 14, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{displayName}</span>
                            <a
                              href={toImageUrl(a.url)}
                              download={displayName}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#0064ff', textDecoration: 'none', flexShrink: 0, fontWeight: 500 }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                              다운로드
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 20, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 13, color: '#888' }}>내 견적 제출일</p>
                  <p style={{ margin: 0, fontSize: 14, color: '#333' }}>{detailModal.submittedAt}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: 13, color: '#888' }}>수정 횟수</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: detailModal.editCount >= 3 ? '#EF4444' : '#0064ff' }}>
                    {detailModal.editCount}/3 {detailModal.editCount >= 3 ? '(수정 불가)' : `(잔여 ${3 - detailModal.editCount}회)`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
