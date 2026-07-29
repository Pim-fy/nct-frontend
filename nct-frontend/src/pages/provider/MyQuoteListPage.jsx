// src/pages/provider/MyQuoteListPage.jsx
// F-SVC-005/006/008 + F-PROV-010: 제공자 내 견적 목록 (담당자3 황성경 소유)
// - 더미 데이터로 UI 선구현. API 연동 시 DUMMY_QUOTES → useMyQuotes 훅 결과로 교체.
// - 버튼/배지: PROJECT/ui-preview.html 클래스 시스템 사용 (btn, badge)
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { confirm, toast } from "@utils/common";

// ─── 더미 데이터 ─────────────────────────────────────────────────────────────

const CATEGORY_BADGE = {
  이사:     "badge-success",
  청소:     "badge-success",
  레슨:     "badge-success",
  인테리어: "badge-success",
  이사운반: "badge-success",
  홈케어:   "badge-success",
};

const DUMMY_QUOTES = [
  {
    id: "QUO-0010",
    category: "이사",
    title: "소형 이사의 가구 재배치",
    location: "인천 부평구",
    price: { base: 70000, min: 120000, max: 180000 },
    submittedAt: "2026.06.14",
    status: "대기중",
    editCount: 1,
  },
  {
    id: "QUO-0009",
    category: "청소",
    title: "사무실 정기청소",
    location: "서울 강남구",
    price: { base: 390000, min: 120000, max: 180000 },
    submittedAt: "2026.08.02",
    status: "대기중",
    editCount: 0,
  },
  {
    id: "QUO-0008",
    category: "레슨",
    title: "주 2회 온라인 영어 회화 레슨",
    location: "서울 노원구",
    price: { base: 70000, min: 120000, max: 180000 },
    submittedAt: "2026.06.14",
    status: "대기중",
    editCount: 2,
  },
  {
    id: "QUO-0007",
    category: "인테리어",
    title: "거실 부분 인테리어 상담",
    location: "서울 강남구",
    price: { base: 390000, min: 120000, max: 180000 },
    submittedAt: "2026.08.02",
    status: "대기중",
    editCount: 0,
  },
  {
    id: "QUO-0006",
    category: "이사",
    title: "소형 이사의 가구 재배치",
    location: "인천 부평구",
    price: { base: 70000, min: 120000, max: 180000 },
    submittedAt: "2026.06.14",
    status: "대기중",
    editCount: 1,
  },
  {
    id: "QUO-0005",
    category: "청소",
    title: "주 1회 가정집 정기 청소",
    location: "서울 마포구",
    price: { base: 70000, min: 120000, max: 180000 },
    submittedAt: "2026.06.14",
    status: "대기중",
    editCount: 0,
  },
  {
    id: "QUO-0004",
    category: "이사운반",
    title: "포장이사 원룸 → 투룸 이사",
    location: "서울 성동구",
    price: { base: 550000, min: 450000, max: 650000 },
    submittedAt: "2026.07.10",
    status: "진행중",
    editCount: 0,
  },
  {
    id: "QUO-0003",
    category: "청소",
    title: "에어컨 분해 청소 (2대)",
    location: "서울 영등포구",
    price: { base: 160000, min: 140000, max: 180000 },
    submittedAt: "2026.07.01",
    status: "진행중",
    editCount: 1,
  },
  {
    id: "QUO-0002",
    category: "레슨",
    title: "수능 수학 과외 (고3 기준)",
    location: "경기 수원시",
    price: { base: 200000, min: 180000, max: 220000 },
    submittedAt: "2026.07.05",
    status: "진행중",
    editCount: 0,
  },
  {
    id: "QUO-0001",
    category: "홈케어",
    title: "입주청소 30평 풀옵션",
    location: "서울 송파구",
    price: { base: 480000, min: 420000, max: 520000 },
    submittedAt: "2026.06.01",
    status: "종료",
    editCount: 2,
  },
  {
    id: "QUO-0000",
    category: "이사",
    title: "가구 분해·조립 포함 1.5톤 이사",
    location: "인천 계양구",
    price: { base: 350000, min: 300000, max: 400000 },
    submittedAt: "2026.05.28",
    status: "종료",
    editCount: 0,
  },
];

const TABS = ["전체", "대기중", "진행중", "종료"];

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function CategoryBadge({ category }) {
  const cls = CATEGORY_BADGE[category] ?? "badge-success";
  return (
    <span className={`badge ${cls} shrink-0 font-medium`} style={{ fontSize: "14px", height: "33px", borderRadius: "5px" }}>
      {category}
    </span>
  );
}

function QuoteCard({ quote, onEdit, onCancel }) {
  const isDone   = quote.status === "종료";
  const isActive = quote.status === "진행중";
  const canEdit   = !isDone && !isActive && quote.editCount < 3;
  const canCancel = !isDone && !isActive;

  const fmt = (n) => n.toLocaleString();

  return (
    <div className="border border-[rgba(0,0,0,0.08)] rounded-[10px] bg-white p-5 flex flex-col gap-3"
         style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)" }}>

      {/* 상단: 뱃지 + 타이틀 + 액션 버튼 */}
      <div className="flex items-center gap-2">
        <CategoryBadge category={quote.category} />
        <p className="flex-1 min-w-0 font-bold text-[20px] text-[#333333] leading-none truncate">
          {quote.title}
        </p>

        {/* 상태별 버튼 영역 */}
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
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="text-[16px] text-[#555]">{quote.location}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#969696" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span className="text-[16px] text-[#555]">
            전력 {fmt(quote.price.base)}원
            <span className="text-[#bbb] mx-1">/</span>
            최대 {fmt(quote.price.min)}~{fmt(quote.price.max)}원
          </span>
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

export default function MyQuoteListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("대기중");

  const filtered = useMemo(
    () => activeTab === "전체" ? DUMMY_QUOTES : DUMMY_QUOTES.filter((q) => q.status === activeTab),
    [activeTab],
  );

  const countOf = (s) => DUMMY_QUOTES.filter((q) => q.status === s).length;
  const totalCount = DUMMY_QUOTES.length;

  const handleEdit = (quote) => {
    if (quote.editCount >= 3) {
      toast({ icon: "warning", title: "수정 가능 횟수(3회)를 초과했습니다." });
      return;
    }
    toast({ icon: "info", title: "견적 수정 — API 연동 후 활성화됩니다." });
  };

  const handleCancel = async (quote) => {
    const ok = await confirm({
      title: "견적을 철회하시겠습니까?",
      text: "철회한 견적은 복구할 수 없습니다.",
      icon: "warning",
      confirmButtonText: "철회",
      cancelButtonText: "취소",
    });
    if (ok) toast({ icon: "success", title: "견적이 철회되었습니다." });
  };

  return (
    <div className="flex flex-col gap-5">

      {/* 헤더 */}
      <h2 className="text-[22px] font-bold text-[#1a1a1a] m-0">내 견적</h2>

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
              key={quote.id}
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
