// src/pages/user/report/MyReportListPage.jsx
// F-COM-018: 내 신고 내역 (담당자3 황성경 소유)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "@components/common/Pagination";
import { useMyReports } from "@hooks/useAbuseReport";

// ─── 코드 매핑 ────────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  ABRC0005: "접수됨",
  ABRC0006: "검토중",
  ABRC0007: "처리완료",
  ABRC0008: "반려",
};

const STATUS_BADGE_CLS = {
  ABRC0005: "badge-success",
  ABRC0006: "badge-warning",
  ABRC0007: "badge-primary",
  ABRC0008: "badge-danger",
};

const TYPE_BADGE_CLS = {
  ABRC0001: "badge-aqua",
  ABRC0002: "badge-success",
  ABRC0003: "badge-orange",
  ABRC0004: "badge-gray",
};

const STATUS_TABS = [
  { label: "전체",    status: null },
  { label: "접수됨",  status: "ABRC0005" },
  { label: "검토중",  status: "ABRC0006" },
  { label: "처리완료", status: "FINISHED" },
];

const PAGE_SIZE = 5;

const isFinished = (statusCode) =>
  statusCode === "ABRC0007" || statusCode === "ABRC0008";

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function StatusBadge({ statusCode }) {
  const label = STATUS_LABEL[statusCode] ?? statusCode;
  const cls   = STATUS_BADGE_CLS[statusCode] ?? "badge-gray";
  return <span className={`badge ${cls}`}>{label}</span>;
}

function TypeBadge({ typeCode, typeName }) {
  const cls = TYPE_BADGE_CLS[typeCode] ?? "badge-gray";
  return <span className={`badge ${cls}`}>{typeName ?? typeCode}</span>;
}

function ReportCard({ report, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(report)}
      className="w-full text-left border border-[#e8e9ec] rounded-[12px] bg-white hover:border-[#0064ff] transition-all group overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,100,255,0.10)]"
    >
      <div className="flex items-center">
        <div className="flex-1 min-w-0 p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <TypeBadge typeCode={report.reportTypeCode} typeName={report.reportTypeName} />
              <span className="text-[14px] text-[#969696]">#{report.reportSn}</span>
              <span className="text-[14px] text-[#d9d9d9]">·</span>
              <span className="text-[14px] text-[#969696]">
                {report.registeredAt?.slice(0, 10)}
              </span>
            </div>
            <StatusBadge statusCode={report.statusCode} />
          </div>

          <p className="font-bold text-[16px] text-black truncate mb-1">{report.title}</p>

          {report.targetName && (
            <p className="text-[16px] text-[#4e4e4e] truncate">{report.targetName}</p>
          )}

          {report.processReason && (
            <div className="flex items-center gap-1 mt-2">
              <svg className="size-3.5 shrink-0 text-[#0064ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-[14px] text-[#0064ff]">관리자 답변 있음</span>
            </div>
          )}
        </div>

        <div className="flex items-center pr-4 pl-1 shrink-0">
          <svg className="size-4 text-[#d9d9d9] group-hover:text-[#0064ff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

function ReportDetailModal({ report, onClose }) {
  if (!report) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-[12px] w-full max-w-[520px] max-h-[86vh] flex flex-col overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
        aria-labelledby="report-detail-modal-title"
      >
        {/* 헤더 */}
        <div className="px-6 pt-5 pb-4 border-b border-[#e8e9ec] flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <TypeBadge typeCode={report.reportTypeCode} typeName={report.reportTypeName} />
              <StatusBadge statusCode={report.statusCode} />
            </div>
            <h2 id="report-detail-modal-title" className="text-[18px] font-bold text-[#1a1a18] m-0 leading-snug">
              {report.title}
            </h2>
            <p className="text-[14px] text-[#888] m-0 mt-1">
              #{report.reportSn} · 접수 {report.registeredAt?.slice(0, 10)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 size-8 flex items-center justify-center rounded-full text-[#888] hover:bg-[#f5f6f8] hover:text-[#1a1a18] transition-colors text-[18px] leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {report.targetName && (
            <div className="bg-[#f5f6f8] rounded-[8px] p-4">
              <p className="text-[14px] text-[#888] font-medium m-0 mb-1">신고 대상</p>
              <p className="font-bold text-[16px] text-[#1a1a18] m-0">{report.targetName}</p>
            </div>
          )}

          <div>
            <p className="text-[16px] font-bold text-[#1a1a18] m-0 mb-2">신고 내용</p>
            <p className="text-[16px] text-[#444] leading-relaxed m-0">{report.content}</p>
          </div>

          {report.processReason && (
            <div className="rounded-[8px] p-4 bg-[#e5efff] border border-[#c0d8ff]">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="size-4 text-[#0064ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-[16px] font-bold text-[#0064ff] m-0">관리자 답변</p>
              </div>
              <p className="text-[16px] text-[#1a1a18] leading-relaxed m-0">{report.processReason}</p>
            </div>
          )}

          <div>
            <p className="text-[16px] font-bold text-[#1a1a18] m-0 mb-3">처리 상태</p>
            <div className="flex items-center gap-3">
              <span className={`size-2 rounded-full ${isFinished(report.statusCode) ? "bg-[#0064ff]" : "bg-[#e8e9ec]"}`} />
              <StatusBadge statusCode={report.statusCode} />
              <span className="text-[14px] text-[#888]">{report.updatedAt?.slice(0, 10)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function MyReportListPage({ embedded = false }) {
  const navigate = useNavigate();
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const activeTab = STATUS_TABS[activeTabIdx];

  const { data, isLoading, isError } = useMyReports({
    status: activeTab.status,
    page,
    size: PAGE_SIZE,
  });

  const reports    = data?.content ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleTab = (idx) => { setActiveTabIdx(idx); setPage(1); };

  return (
    <div className={embedded ? "" : "max-w-[1200px] mx-auto px-4 py-10"}>

      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <h1 className="text-2xl font-bold text-black m-0">내 신고 목록</h1>
        <button
          type="button"
          onClick={() => navigate("/user/mypage?section=report-form")}
          className="btn btn-primary btn-sm shrink-0"
        >
          신고 접수하기
        </button>
      </div>

      <div className="tab-group-1 mb-5">
        {STATUS_TABS.map((tab, idx) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => handleTab(idx)}
            className={`tab-pill${activeTabIdx === idx ? " active" : ""}`}
          >
            {tab.label}
            {activeTabIdx === idx && totalCount > 0 && (
              <span className="tab-count">{totalCount}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="size-8 border-2 border-[#0064ff] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-[#e5e5e5] rounded-[15px] bg-white">
          <p className="text-[16px] text-[#969696] m-0">목록을 불러오지 못했습니다.</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-[#e5e5e5] rounded-[15px] bg-white">
          <svg className="size-12 text-[#d9d9d9] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-[16px] text-[#969696] m-0">신고 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {reports.map((report) => (
            <ReportCard key={report.reportSn} report={report} onClick={setSelected} />
          ))}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} showSinglePage />
      )}

      <ReportDetailModal report={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
