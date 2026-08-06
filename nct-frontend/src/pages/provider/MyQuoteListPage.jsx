// src/pages/provider/MyQuoteListPage.jsx
// F-SVC-005/006/008 + F-PROV-010: 제공자 내 견적 목록 (담당자3 황성경 소유)
// - 버튼/배지: PROJECT/ui-preview.html 클래스 시스템 사용 (btn, badge)
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { confirm, toast } from "@utils/common";
import { useMyQuotes, useWithdrawQuote } from "@hooks/useQuote";
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

function QuoteCard({ quote, onEdit, onCancel }) {
  const isDone   = quote.status === "종료";
  const isActive = quote.status === "진행중";
  const canEdit   = !isDone && !isActive && quote.editCount < 3;
  const canCancel = !isDone && !isActive;

  const fmt = (n) => Number(n).toLocaleString();

  return (
    <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] bg-white p-5 flex flex-col gap-3"
         style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)" }}>

      {/* 상단: 타이틀 + 액션 버튼 */}
      <div className="flex items-center gap-2">
        <p className="flex-1 min-w-0 font-bold text-[20px] text-[#333333] leading-none truncate">
          {quote.title}
        </p>

        {isDone ? (
          <span className="badge badge-gray shrink-0" style={{ borderRadius: "5px", height: "30px" }}>종료</span>
        ) : isActive ? (
          <span className="badge shrink-0" style={{ borderRadius: "5px", height: "30px", background: "#55C9C8", color: "#fff", border: "none" }}>진행중</span>
        ) : (
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(quote)}
              disabled={!canEdit}
              className="btn btn-outline btn-sm disabled:opacity-40 disabled:cursor-not-allowed h-[33px] text-[16px] font-medium"
              style={{ gap: 0 }}
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
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#969696" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span className="text-[16px] text-[#555]">견적 금액 {fmt(quote.amount)}원</span>
        </div>

        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#969696" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span className="text-[16px] text-[#969696]">제출일 {quote.submittedAt}</span>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

export default function MyQuoteListPage({ embedded = false } = {}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("대기중");

  const { data: pageData, isLoading, isError } = useMyQuotes({ page: 1, size: 50 });
  const withdrawMutation = useWithdrawQuote();

  const quotes = useMemo(() => {
    if (!pageData?.content) return [];
    return pageData.content.map((q) => ({
      qutSn:      q.qutSn,
      svcReqSn:   q.svcReqSn,
      title:      q.svcReqTitle,
      amount:     q.amount,
      content:    q.content,
      reviseCnt:  q.reviseCnt,
      submittedAt: q.registeredAt
        ? String(q.registeredAt).slice(0, 10).replace(/-/g, ".")
        : "-",
      status:    STATUS_MAP[q.statusCode] || "종료",
      editCount: q.reviseCnt,
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

  const handleEdit = (quote) => {
    if (quote.editCount >= 3) {
      toast({ icon: "warning", title: "수정 가능 횟수(3회)를 초과했습니다." });
      return;
    }
    // 요청번호와 견적번호를 경로에 남겨 새로고침·직접 진입에도 연결 관계를 유지한다.
    navigate(`/service-requests/${quote.svcReqSn}/quotes/${quote.qutSn}/edit`, {
      state: { from: '/user/mypage?section=quote' },
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
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
