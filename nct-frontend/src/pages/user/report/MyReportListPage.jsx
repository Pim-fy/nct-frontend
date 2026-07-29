// src/pages/user/report/MyReportListPage.jsx
// F-COM-018: 내 신고 내역 (담당자3 황성경 소유)
// - 더미 데이터로 UI 선구현. API 연동 시 DUMMY_REPORTS → useMyReports 훅 결과로 교체.
// - 신고 접수 폼(/customer-support/reports/new)은 별도 페이지 (F-COM-018 2단계)
// - 처리·제재(F-OPS-007~008)는 담당자7(조우진) 영역 — 이 페이지는 처리 결과 확인 전용
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ─── 더미 데이터 ────────────────────────────────────────────────────────────

const DUMMY_REPORTS = [
  {
    id: "RPT-0010",
    type: "제공자 프로필",
    targetName: "이사마스터 박철수",
    targetDesc: "제공자 프로필 · 이사/운반",
    title: "허위 자격증 등록 및 사진 도용 의심",
    content: "제공자 프로필에 등록된 자격증 사진이 인터넷에서 도용한 것으로 의심됩니다. 실제 보유 여부 확인을 요청드립니다.",
    files: ["증거_스크린샷.png"],
    status: "처리완료",
    adminNote: "신고 내용 검토 결과, 해당 제공자에게 자격증 원본 제출을 요청하였으며 미제출로 인해 해당 자격증 정보가 삭제 처리되었습니다.",
    submittedAt: "2026-07-18",
    updatedAt: "2026-07-21",
    timeline: [
      { status: "접수됨", at: "2026-07-18 14:23" },
      { status: "검토중", at: "2026-07-19 10:00" },
      { status: "처리완료", at: "2026-07-21 09:15" },
    ],
  },
  {
    id: "RPT-0009",
    type: "거래 문제",
    targetName: "다이슨 V11 무선청소기",
    targetDesc: "경매 거래 · TRD-5821",
    title: "상품 상태가 설명과 심하게 다름",
    content: "낙찰 후 수령한 제품이 '상태 A급'으로 표기되어 있었으나 실제로는 외관 스크래치가 다수 있고 배터리 수명이 현저히 낮은 상태였습니다.",
    files: ["사진_1.jpg", "사진_2.jpg", "사진_3.jpg"],
    status: "검토중",
    adminNote: null,
    submittedAt: "2026-07-22",
    updatedAt: "2026-07-23",
    timeline: [
      { status: "접수됨", at: "2026-07-22 18:05" },
      { status: "검토중", at: "2026-07-23 08:30" },
    ],
  },
  {
    id: "RPT-0008",
    type: "부적절한 리뷰",
    targetName: "성수동 원룸 이사 서비스",
    targetDesc: "서비스 거래 · SVC-3310",
    title: "근거 없는 악성 리뷰 삭제 요청",
    content: "해당 거래에서 서비스를 성실히 제공했음에도 사실과 전혀 다른 내용의 1점 리뷰가 등록되었습니다. 부당한 평가라 판단하여 삭제 요청합니다.",
    files: [],
    status: "반려",
    adminNote: "검토 결과, 해당 리뷰는 실제 거래 이후 작성된 것으로 확인되어 삭제 기준에 해당하지 않습니다.",
    submittedAt: "2026-07-15",
    updatedAt: "2026-07-17",
    timeline: [
      { status: "접수됨", at: "2026-07-15 11:40" },
      { status: "검토중", at: "2026-07-16 09:00" },
      { status: "반려", at: "2026-07-17 16:00" },
    ],
  },
  {
    id: "RPT-0007",
    type: "서비스 요청",
    targetName: "에어컨 분해 청소",
    targetDesc: "서비스 요청 · SVC-2998",
    title: "서비스 완료 후 추가 금액 요구",
    content: "견적서에 없던 추가 부품 교체 비용을 서비스 완료 직후 현장에서 요구받았습니다. 사전 합의 없는 추가 청구입니다.",
    files: ["견적서_원본.pdf"],
    status: "접수됨",
    adminNote: null,
    submittedAt: "2026-07-24",
    updatedAt: "2026-07-24",
    timeline: [
      { status: "접수됨", at: "2026-07-24 09:12" },
    ],
  },
  {
    id: "RPT-0006",
    type: "제공자 프로필",
    targetName: "청소전문가 김민준",
    targetDesc: "제공자 프로필 · 청소/입주청소",
    title: "다른 제공자 사진 및 후기 무단 사용",
    content: "다른 제공자의 포트폴리오 사진과 실제 고객 후기를 무단으로 복사하여 본인 프로필에 등록한 것으로 보입니다.",
    files: ["원본_출처_링크.txt", "비교_스크린샷.png"],
    status: "검토중",
    adminNote: null,
    submittedAt: "2026-07-20",
    updatedAt: "2026-07-22",
    timeline: [
      { status: "접수됨", at: "2026-07-20 16:55" },
      { status: "검토중", at: "2026-07-22 11:00" },
    ],
  },
  {
    id: "RPT-0005",
    type: "거래 문제",
    targetName: "미니 보온 텀블러 세트",
    targetDesc: "경매 거래 · TRD-5700",
    title: "낙찰 후 판매자 연락 두절",
    content: "낙찰 완료 후 3일이 지났으나 판매자와 연락이 전혀 되지 않습니다. 배송 예정일도 지났고 채팅도 읽음 처리가 없습니다.",
    files: [],
    status: "처리완료",
    adminNote: "판매자에게 제재 처분 및 거래 강제 취소 처리가 완료되었습니다. 결제하신 금액은 영업일 기준 3일 내 환불 예정입니다.",
    submittedAt: "2026-07-10",
    updatedAt: "2026-07-12",
    timeline: [
      { status: "접수됨", at: "2026-07-10 20:33" },
      { status: "검토중", at: "2026-07-11 09:00" },
      { status: "처리완료", at: "2026-07-12 14:20" },
    ],
  },
  {
    id: "RPT-0004",
    type: "부적절한 리뷰",
    targetName: "PD 4포트 100W 멀티 충전기",
    targetDesc: "경매 거래 · TRD-5610",
    title: "경쟁 입찰자로 추정되는 악의적 리뷰",
    content: "상품을 구매한 적도 없는 계정에서 낙찰 직후 근거 없는 1점 리뷰가 등록되었습니다. 구매 이력 확인 후 삭제를 요청합니다.",
    files: ["스크린샷_리뷰.png"],
    status: "검토중",
    adminNote: null,
    submittedAt: "2026-07-08",
    updatedAt: "2026-07-09",
    timeline: [
      { status: "접수됨", at: "2026-07-08 13:22" },
      { status: "검토중", at: "2026-07-09 10:00" },
    ],
  },
  {
    id: "RPT-0003",
    type: "서비스 요청",
    targetName: "입주청소 풀옵션",
    targetDesc: "서비스 요청 · SVC-2800",
    title: "약속 시간 무단 변경 및 서비스 질 불량",
    content: "당일 오전 갑자기 2시간 늦게 방문하겠다고 일방 통보하였고, 실제 청소 결과가 견적서 내용과 달랐습니다.",
    files: ["청소전_사진.jpg", "청소후_사진.jpg"],
    status: "처리완료",
    adminNote: "제공자 측 과실이 확인되어 서비스 금액의 30% 환불 처리가 완료되었습니다.",
    submittedAt: "2026-07-03",
    updatedAt: "2026-07-06",
    timeline: [
      { status: "접수됨", at: "2026-07-03 19:10" },
      { status: "검토중", at: "2026-07-04 09:30" },
      { status: "처리완료", at: "2026-07-06 11:45" },
    ],
  },
  {
    id: "RPT-0002",
    type: "거래 문제",
    targetName: "카본 패턴 게이밍 책상",
    targetDesc: "경매 거래 · TRD-5401",
    title: "단순 변심으로 인한 환불 요청",
    content: "개인 사정으로 낙찰 후 구매 의사가 없어졌습니다. 판매자와 합의하에 환불 처리를 요청드립니다.",
    files: [],
    status: "반려",
    adminNote: "낙찰 후 단순 변심은 취소 및 환불 정책상 처리 불가합니다.",
    submittedAt: "2026-06-28",
    updatedAt: "2026-06-30",
    timeline: [
      { status: "접수됨", at: "2026-06-28 15:00" },
      { status: "반려", at: "2026-06-30 10:00" },
    ],
  },
  {
    id: "RPT-0001",
    type: "기타",
    targetName: "없음",
    targetDesc: "직접 입력",
    title: "포인트 충전 중 중복 결제 발생",
    content: "포인트 충전 중 네트워크 오류가 발생하여 동일 금액이 두 번 결제된 것으로 보입니다. 중복 결제 환불을 요청드립니다.",
    files: ["결제내역_캡처.png"],
    status: "처리완료",
    adminNote: "중복 결제가 확인되어 포인트 복구가 완료되었습니다.",
    submittedAt: "2026-06-20",
    updatedAt: "2026-06-22",
    timeline: [
      { status: "접수됨", at: "2026-06-20 22:48" },
      { status: "검토중", at: "2026-06-21 09:00" },
      { status: "처리완료", at: "2026-06-22 09:00" },
    ],
  },
];

// ─── 상태 / 유형 메타 ────────────────────────────────────────────────────────

const STATUS_META = {
  접수됨:  { bg: "bg-sky-50",   text: "text-sky-700",   border: "border-sky-200"   },
  검토중:  { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  처리완료: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  반려:    { bg: "bg-red-50",   text: "text-red-600",   border: "border-red-200"   },
};

const TYPE_COLOR = {
  "제공자 프로필": { text: "text-violet-700", bg: "bg-violet-50" },
  "거래 문제":     { text: "text-blue-700",   bg: "bg-blue-50"   },
  "서비스 요청":   { text: "text-teal-700",   bg: "bg-teal-50"   },
  "부적절한 리뷰": { text: "text-amber-700",  bg: "bg-amber-50"  },
  "기타":          { text: "text-gray-600",   bg: "bg-gray-100"  },
};

const STATUS_TABS = ["전체", "접수됨", "검토중", "처리완료", "반려"];
const PAGE_SIZE = 6;

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-semibold border ${m.bg} ${m.text} ${m.border}`}>
      {status}
    </span>
  );
}

function TypeTag({ type }) {
  const c = TYPE_COLOR[type] ?? TYPE_COLOR["기타"];
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${c.text} ${c.bg}`}>
      {type}
    </span>
  );
}

function ReportRow({ report, onClick }) {
  const hasAnswer = !!report.adminNote;
  return (
    <button
      type="button"
      onClick={() => onClick(report)}
      className="w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
    >
      {/* 상태 인디케이터 선 */}
      <div className="flex flex-col items-center gap-1 shrink-0 self-stretch justify-center">
        <span
          className="w-[3px] rounded-full flex-1"
          style={{
            background:
              report.status === "처리완료" ? "#16a34a"
              : report.status === "검토중"  ? "#d97706"
              : report.status === "반려"    ? "#ef4444"
              : "#0ea5e9",
            minHeight: 40,
          }}
        />
      </div>

      {/* 본문 */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <TypeTag type={report.type} />
          <span className="text-[14px] text-gray-400">{report.id}</span>
          <span className="text-[14px] text-gray-300">·</span>
          <span className="text-[14px] text-gray-400">{report.submittedAt}</span>
        </div>
        <p className="font-semibold text-gray-900 text-[15px] truncate m-0 mb-0.5">{report.title}</p>
        <p className="text-[15px] text-gray-500 truncate m-0">{report.targetName}
          <span className="text-gray-300 mx-1">·</span>
          <span className="text-gray-400">{report.targetDesc}</span>
        </p>
        {hasAnswer && (
          <p className="text-[14px] text-blue-600 mt-1.5 m-0 flex items-center gap-1">
            <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            관리자 답변이 등록되었습니다
          </p>
        )}
      </div>

      {/* 우측: 상태 + 화살표 */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <StatusBadge status={report.status} />
        <svg
          className="size-4 text-gray-300 group-hover:text-gray-400 transition-colors"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

function ReportDetailModal({ report, onClose }) {
  if (!report) return null;

  return (
    <div
      className="user-modal-overlay flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[520px] max-h-[86vh] flex flex-col overflow-hidden"
        aria-labelledby="report-detail-modal-title"
        aria-modal="true"
        role="dialog"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.16)" }}
      >
        {/* 헤더 */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <TypeTag type={report.type} />
              <StatusBadge status={report.status} />
            </div>
            <h2 className="text-[18px] font-bold text-gray-900 m-0 leading-snug" id="report-detail-modal-title">{report.title}</h2>
            <p className="text-[14px] text-gray-400 m-0 mt-1">{report.id} · 접수 {report.submittedAt}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 transition-colors"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 (스크롤) */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* 신고 대상 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-[14px] text-gray-400 font-medium m-0 mb-1">신고 대상</p>
            <p className="font-semibold text-gray-800 text-[15px] m-0">{report.targetName}</p>
            <p className="text-[14px] text-gray-400 m-0 mt-0.5">{report.targetDesc}</p>
          </div>

          {/* 신고 내용 */}
          <div>
            <p className="text-[15px] font-semibold text-gray-700 m-0 mb-2">신고 내용</p>
            <p className="text-[15px] text-gray-600 leading-relaxed m-0">{report.content}</p>
          </div>

          {/* 첨부파일 */}
          {report.files.length > 0 && (
            <div>
              <p className="text-[15px] font-semibold text-gray-700 m-0 mb-2">첨부파일 ({report.files.length})</p>
              <div className="flex flex-wrap gap-2">
                {report.files.map((f) => (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[14px] text-gray-600"
                  >
                    <svg className="size-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 관리자 답변 */}
          {report.adminNote && (
            <div className="rounded-xl p-4 bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="size-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-[15px] font-semibold text-blue-700 m-0">관리자 답변</p>
              </div>
              <p className="text-[15px] text-blue-800 leading-relaxed m-0">{report.adminNote}</p>
            </div>
          )}

          {/* 처리 이력 */}
          <div>
            <p className="text-[15px] font-semibold text-gray-700 m-0 mb-3">처리 이력</p>
            <ol className="space-y-3 m-0 p-0 list-none">
              {report.timeline.map((step, i) => {
                const isLast = i === report.timeline.length - 1;
                const m = STATUS_META[step.status] ?? {};
                return (
                  <li key={step.at} className="flex items-start gap-3">
                    <div className="flex flex-col items-center shrink-0 mt-1">
                      <span className={`size-2 rounded-full ${isLast ? "bg-blue-500" : "bg-gray-300"}`} />
                      {!isLast && <span className="w-px h-6 bg-gray-200 mt-1" />}
                    </div>
                    <div>
                      <StatusBadge status={step.status} />
                      <p className="text-[14px] text-gray-400 m-0 mt-1">{step.at}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm w-full">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function MyReportListPage({ embedded = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("전체");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const handleTab = (t) => { setActiveTab(t); setPage(1); };

  const filtered = useMemo(
    () => activeTab === "전체" ? DUMMY_REPORTS : DUMMY_REPORTS.filter((r) => r.status === activeTab),
    [activeTab],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const countOf = (s) => DUMMY_REPORTS.filter((r) => r.status === s).length;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">

      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-[28px] font-[800] text-gray-900 m-0">내 신고 내역</h1>
          <p className="text-gray-400 text-[14px] mt-1 m-0">접수한 신고의 처리 현황을 확인할 수 있습니다.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/customer-support/reports/new")}
          className="btn btn-primary btn-sm shrink-0"
        >
          신고 접수하기
        </button>
      </div>

      {/* 상태 탭 */}
      <div className="flex items-center gap-1 border-b border-gray-100 mb-1">
        {STATUS_TABS.map((tab) => {
          const count = tab === "전체" ? DUMMY_REPORTS.length : countOf(tab);
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTab(tab)}
              className={`relative px-4 py-3 text-[15px] font-medium transition-colors whitespace-nowrap
                ${isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              {tab}
              {count > 0 && (
                <span
                  className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full
                    ${isActive ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
                >
                  {count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* 리스트 카드 */}
      <div
        className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        {paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="size-12 text-gray-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400 text-[15px] m-0">신고 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {paged.map((report) => (
              <ReportRow key={report.id} report={report} onClick={setSelected} />
            ))}
          </div>
        )}
      </div>

      {/* 결과 수 + 페이지네이션 */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <p className="text-[14px] text-gray-400 m-0">
            총 <span className="font-semibold text-gray-600">{filtered.length}건</span>
          </p>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="size-8 rounded-lg border border-gray-200 text-gray-500 text-[14px] flex items-center justify-center disabled:opacity-40 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`size-8 rounded-lg border text-[14px] font-medium transition-colors
                    ${p === page
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"}`}
                >{p}</button>
              ))}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="size-8 rounded-lg border border-gray-200 text-gray-500 text-[14px] flex items-center justify-center disabled:opacity-40 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >›</button>
            </div>
          )}
        </div>
      )}

      {/* 상세 모달 */}
      <ReportDetailModal report={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
