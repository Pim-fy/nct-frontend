// src/pages/user/report/MyReportListPage.jsx
// F-COM-018: 내 신고 내역 (담당자3 황성경 소유)
import React, { useState } from "react";
import Pagination from "@components/common/Pagination";
import { useMyReports } from "@hooks/useAbuseReport";
import ReportModal from "@components/common/ReportModal";

// ─── 코드 매핑 ────────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  ABRC0005: "접수됨",
  ABRC0006: "검토중",
  ABRC0007: "처리완료",
  ABRC0008: "반려",
};

const STATUS_BADGE_CLS = {
  ABRC0005: "badge-urgent",    // 접수됨  → #FFC526 채움
  ABRC0006: "badge-orange",    // 검토중  → 녹색 채움 (거래진행중 스타일)
  ABRC0007: "badge-gray",      // 처리완료 → 회색 채움 (종료 스타일)
  ABRC0008: "badge-danger",    // 반려    → 빨강 채움
};

const getTypeNames = (report) =>
  report.reportTypeNames ?? (report.reportTypeName ? [report.reportTypeName] : []);

const STATUS_TABS = [
  { label: "전체",    status: null },
  { label: "접수됨",  status: "ABRC0005" },
  { label: "검토중",  status: "ABRC0006" },
  { label: "처리완료", status: "FINISHED" },
];

const PAGE_SIZE = 5;

const fmtDate = (str) => str?.slice(0, 10).replace(/-/g, ".") ?? "-";

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function StatusBadge({ statusCode, style }) {
  const label = STATUS_LABEL[statusCode] ?? statusCode;
  const cls   = STATUS_BADGE_CLS[statusCode] ?? "badge-gray";
  return <span className={`badge ${cls}`} style={style}>{label}</span>;
}

function TypeBadge({ typeName, style }) {
  return <span className="badge badge-success" style={style}>{typeName}</span>;
}

function ReportCard({ report, isOpen, onToggle, number }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div className="transition-all bg-white overflow-hidden rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-[#e4e9f2] hover:border-[#a0aec0] cursor-pointer">
      {/* 헤더 행 */}
      <button
        type="button"
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-full text-left group bg-white cursor-pointer"
      >
        <div className="flex items-center py-6 px-5 gap-4">
          <span className="shrink-0 text-[14px] font-medium text-[#969696] w-6 text-center">{number}</span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {getTypeNames(report).map((name) => (
                <TypeBadge key={name} typeName={name} style={{ borderRadius: "5px", fontSize: "14px", fontWeight: 400 }} />
              ))}
            </div>
            <p className="font-bold text-[18px] text-[#333] truncate mb-0">{report.title}</p>
            {report.processReason && !isOpen && (
              <div className="flex items-center gap-1 mt-1.5">
                <svg className="size-3.5 shrink-0 text-[#0064ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="text-[14px] text-[#0064ff]">관리자 답변 있음</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 pl-3 shrink-0">
            <span className="text-[14px] text-[#969696]">{fmtDate(report.registeredAt)}</span>
            <StatusBadge statusCode={report.statusCode} style={{ borderRadius: "5px", fontSize: "14px", fontWeight: 400 }} />
            <svg
              className={`size-5 transition-transform duration-200 ${isOpen ? "rotate-0 text-[#0064ff]" : "rotate-180 text-[#aaa] group-hover:text-[#0064ff]"}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* 아코디언 상세 내용 */}
      {isOpen && (
        <div className="pb-5 space-y-4 border-t border-[#e8e9ec] pr-5 pl-[60px]" style={{ background: "#F8FAFC" }}>
          <p className="text-[13px] text-[#969696] pt-4 m-0 text-right">
            접수번호 <strong className="text-[#333] font-medium">#{report.reportSn}</strong>
          </p>

          <div className="pb-1 flex items-center gap-3">
            <p className="font-bold m-0 shrink-0" style={{ fontSize: "16px", color: "#333333" }}>신고 대상</p>
            <p className="font-bold text-[16px] text-[#1a1a18] m-0 truncate">{report.targetName || "-"}</p>
          </div>

          <div className="pb-4">
            <p className="font-bold m-0 mb-2" style={{ fontSize: "16px", color: "#333333" }}>신고 내용</p>
            <p className="text-[16px] text-[#444] leading-relaxed m-0">{report.content}</p>
          </div>

          {report.processReason && (
            <div className="rounded-[8px] p-4 border border-[#e8e9ec]" style={{ background: "#F8FAFC" }}>
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
        </div>
      )}
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function MyReportListPage({ embedded = false }) {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [openSn, setOpenSn] = useState(null);

  const handleToggle = (sn) => setOpenSn((prev) => (prev === sn ? null : sn));

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

      <div className="flex items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl font-bold text-black m-0">내 신고 목록</h1>
        {/* 테스트용 버튼 — 확인 후 제거 예정 */}
        <button type="button" className="btn btn-danger btn-sm shrink-0" onClick={() => setReportOpen(true)}>
          신고하기 (테스트)
        </button>
      </div>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        contextLabel="신고 테스트"
        targetName="테스트대상"
        targetType="direct"
      />

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
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[20px] bg-white border border-[#e4e9f2] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <svg className="size-12 text-[#d9d9d9] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-[16px] text-[#969696] m-0">신고 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {reports.map((report, idx) => (
            <ReportCard
              key={report.reportSn}
              report={report}
              isOpen={openSn === report.reportSn}
              onToggle={() => handleToggle(report.reportSn)}
              number={totalCount - (page - 1) * PAGE_SIZE - idx}
            />
          ))}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} showSinglePage />
      )}

    </div>
  );
}
