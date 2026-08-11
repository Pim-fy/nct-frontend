// src/pages/user/report/MyReportListPage.jsx
// F-COM-018: 내 신고 내역 (담당자3 황성경 소유)
import React, { useState } from "react";
import Pagination from "@components/common/Pagination";
import MyPageListSectionLayout from "@components/mypage/MyPageListSectionLayout";
import MyPageListSkeleton from "@components/skeleton/MyPageListSkeleton";
import MyPageListEmpty from "@components/mypage/MyPageListEmpty";
import MyPageListError from "@components/mypage/MyPageListError";
import { useMyReports } from "@hooks/useAbuseReport";

// ─── 코드 매핑 ────────────────────────────────────────────────────────────────

const STATUS_LABEL = {
  ABRC0005: "접수됨",
  ABRC0006: "처리중",
  ABRC0007: "처리완료",
  ABRC0008: "반려",
};

// 담당자 7: 신고 유형과 처리 상태를 목록에서 바로 구분할 수 있도록 배지 색상을 분리한다.
const STATUS_BADGE_STYLE = {
  ABRC0005: { background: "#fff5d6", color: "#9a6700", borderColor: "#f5d77a" },
  ABRC0006: { background: "#e8f0fe", color: "#1d4ed8", borderColor: "#b7cdf8" },
  ABRC0007: { background: "#e8f7ed", color: "#16703b", borderColor: "#b9e3c8" },
  ABRC0008: { background: "#fdecec", color: "#b42318", borderColor: "#f3b5b0" },
};

const TYPE_LABEL = {
  ABRC0001: "사기·기만",
  ABRC0002: "허위 정보",
  ABRC0003: "욕설·비방",
  ABRC0004: "기타",
};

const TYPE_BADGE_STYLE = {
  "사기·기만": { background: "#fff0f0", color: "#b42318", borderColor: "#f3b5b0" },
  "불법 거래": { background: "#fff0f0", color: "#b42318", borderColor: "#f3b5b0" },
  "허위 정보": { background: "#fff7e6", color: "#a15c00", borderColor: "#f3d19c" },
  "욕설·비방": { background: "#f4edff", color: "#6b3bbd", borderColor: "#d8c5f5" },
  "기타": { background: "#f2f4f7", color: "#475467", borderColor: "#d0d5dd" },
};

const DEFAULT_TYPE_BADGE_STYLE = TYPE_BADGE_STYLE["기타"];

const getTypeNames = (report) => {
  if (report.reportTypeNames?.length) return report.reportTypeNames;
  const code = report.reportTypeCode;
  const name = TYPE_LABEL[code] ?? report.reportTypeName;
  return name ? [name] : [];
};

const STATUS_TABS = [
  { label: "전체",    status: null },
  { label: "접수됨",  status: "ABRC0005" },
  { label: "반려",    status: "ABRC0008" },
  { label: "처리완료", status: "ABRC0007" },
];

const PAGE_SIZE = 5;

const fmtDate = (str) => str?.slice(0, 10).replace(/-/g, ".") ?? "-";

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function StatusBadge({ statusCode, style }) {
  const label = STATUS_LABEL[statusCode] ?? statusCode;
  const badgeStyle = STATUS_BADGE_STYLE[statusCode] ?? DEFAULT_TYPE_BADGE_STYLE;
  return <span className="badge border" style={{ ...badgeStyle, ...style }}>{label}</span>;
}

function TypeBadge({ typeName, style }) {
  const badgeStyle = TYPE_BADGE_STYLE[typeName] ?? DEFAULT_TYPE_BADGE_STYLE;
  return <span className="badge border" style={{ ...badgeStyle, ...style }}>{typeName}</span>;
}

function ReportCard({ report, isOpen, onToggle, number }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div className="transition-all bg-white overflow-hidden rounded-[15px] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#e4e9f2] hover:border-[#a0aec0] cursor-pointer">
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
            <div className="flex items-center gap-2 min-w-0">
              {getTypeNames(report).map((name) => (
                <TypeBadge key={name} typeName={name} style={{ borderRadius: "5px", fontSize: "14px", fontWeight: 400, flexShrink: 0, height: "28px", paddingLeft: "7px", paddingRight: "7px", display: "inline-flex", alignItems: "center" }} />
              ))}
              <p className="font-bold text-[18px] text-[#333] truncate mb-0 min-w-0">{report.title}</p>
            </div>
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
          <div className="flex items-center justify-between pt-4 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <p className="font-bold m-0 shrink-0" style={{ fontSize: "16px", color: "#333333" }}>신고 대상</p>
              <p className="font-bold text-[16px] text-[#1a1a18] m-0 truncate">{report.targetName || "-"}</p>
            </div>
            <p className="text-[13px] text-[#969696] m-0 shrink-0">
              접수번호 <strong className="text-[#333] font-medium">{report.reportSn}</strong>
            </p>
          </div>

          <div className="pb-1">
            <p className="font-bold m-0 mb-2" style={{ fontSize: "16px", color: "#333333" }}>신고 내용</p>
            <p className="text-[16px] text-[#444] leading-relaxed m-0">{report.content}</p>
          </div>

          {report.processReason && (
            <div className="rounded-[8px] p-4 border border-[#e8e9ec]" style={{ background: "#ffffff" }}>
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
  const [page, setPage] = useState(1);
  const [openSn, setOpenSn] = useState(null);

  const handleToggle = (sn) => setOpenSn((prev) => (prev === sn ? null : sn));

  const activeTab = STATUS_TABS[activeTabIdx];

  const { data, isLoading, isError, refetch } = useMyReports({
    status: activeTab.status,
    page,
    size: PAGE_SIZE,
  });

  const { data: countAll }      = useMyReports({ status: null,       page: 1, size: 1 });
  const { data: countReceived } = useMyReports({ status: "ABRC0005", page: 1, size: 1 });
  const { data: countFinished } = useMyReports({ status: "ABRC0007", page: 1, size: 1 });
  const { data: countRejected } = useMyReports({ status: "ABRC0008", page: 1, size: 1 });

  const TAB_COUNTS = [
    countAll?.totalCount,
    countReceived?.totalCount,
    countRejected?.totalCount,
    countFinished?.totalCount,
  ];

  const reports    = data?.content ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleTab = (idx) => { setActiveTabIdx(idx); setPage(1); };

  return (
    <div className={embedded ? "" : "max-w-[1200px] mx-auto px-4 py-10"}>

      <MyPageListSectionLayout
        title="신고"
        summaryItems={[
          { label: '접수됨', value: countReceived?.totalCount ?? 0 },
          { label: '반려', value: countRejected?.totalCount ?? 0 },
          { label: '처리완료', value: countFinished?.totalCount ?? 0 },
        ]}
        filterItems={STATUS_TABS.map((tab, idx) => ({ value: idx, label: tab.label, count: TAB_COUNTS[idx] }))}
        activeFilter={activeTabIdx}
        onFilterChange={handleTab}
        filterAriaLabel="신고 상태"
        isLoading={isLoading}
      />

      {isLoading ? (
        <MyPageListSkeleton count={PAGE_SIZE} />
      ) : isError ? (
        <MyPageListError message="목록을 불러오지 못했습니다." onRetry={() => refetch()} />
      ) : reports.length === 0 ? (
        <MyPageListEmpty message="신고 내역이 없습니다." />
      ) : (
        <div className="flex flex-col gap-3">
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

      {!isLoading && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} showSinglePage />
      )}

    </div>
  );
}
