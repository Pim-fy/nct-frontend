// src/components/mypage/MyPageProviderDashboard.jsx
// Figma: mypage_02제공자모드(node 57:495) CONTENTS 구간("MY 홈" 탭, 제공자 모드).
// - 절대좌표 → 반응형 전환. 통계카드 2x2→4열, 오늘할일 1→3열 그리드.
// - 정산관리/정산계좌 버튼은 담당자BJN의 /user/settlement 로 연결.
// TODO: 서비스 제공(F-SVC)/견적(F-QUOTE)/정산(F-PAY) 도메인 API가 준비되면
//       STAT_CARDS / TODAY_TASKS / IN_PROGRESS_ITEMS / RECENT_QUOTE_ITEMS 를 각 조회 결과로 교체한다.
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@utils/common";
import { assets } from "@components/mypage/assets";

const STAT_CARDS = [
  {
    key: "in-progress",
    color: "#0cb8bb",
    icon: assets.iconService,
    label: "진행중 서비스 제공",
    value: "4",
    unit: "건",
    meta: "오늘 일정 2건   ㅣ   완료 확인 대기 1건",
  },
  {
    key: "accepted-quote",
    color: "#3b4de3",
    icon: assets.iconAction,
    label: "수락된 견적",
    value: "3",
    unit: "건",
    meta: "이번 주 신규 수주 기준",
  },
  {
    key: "settleable",
    color: "#692fb1",
    icon: assets.iconPoint,
    label: "정산 가능",
    value: "120,000",
    unit: "",
    meta: "서비스 완료 확인 후 신청 가능",
  },
  {
    key: "today",
    color: "#2f4368",
    icon: assets.iconEnd2,
    label: "오늘 확인할 일",
    value: "8",
    unit: "건",
    meta: "문의 5건 · 일정 확인 3건",
  },
];

const SETTLEMENT_STATS = [
  { label: "정산가능", value: "120,000원", desc: "이번 주 처리 가능한 서비스 수익" },
  { label: "정산 진행중", value: "85,000원", desc: "등록된 계좌로 입금 예정" },
  { label: "다음 정산 예정", value: "42,000원", desc: "완료 확인 대기 서비스 기준" },
];

const TODAY_TASKS = [
  { title: "오전 이사 방문 일정 확인", desc: "의뢰인 김서연님과 10:00 방문 전 채팅 확인이 필요합니다.", action: "chat" },
  { title: "에어컨 청소 견적 문의 답변", desc: "요청 조건을 확인하고 견적서를 작성해 주세요.", action: "quote" },
  { title: "완료 서비스 확인 요청", desc: "포장이사 서비스의 완료 확인과 리뷰 요청이 대기 중입니다.", action: "quote" },
  { title: "오전 이사 방문 일정 확인", desc: "의뢰인 김서연님과 10:00 방문 전 채팅 확인이 필요합니다.", action: "chat" },
  { title: "에어컨 청소 견적 문의 답변", desc: "요청 조건을 확인하고 견적서를 작성해 주세요.", action: "quote" },
  { title: "완료 서비스 확인 요청", desc: "포장이사 서비스의 완료 확인과 리뷰 요청이 대기 중입니다.", action: "quote" },
];

const IN_PROGRESS_ITEMS = [
  {
    thumbnail: assets.thumb1,
    badge: { label: "방문예정", color: "#0064ff" },
    title: "피씨오브플레이어 컴퓨터 게이밍 조립컴퓨터 올인...",
    meta: "7월 12일 10:00 · 서울 마포구",
  },
  {
    thumbnail: assets.thumb3,
    badge: { label: "준비중", color: "#969696" },
    title: "에어컨 분해 청소",
    meta: "7월 12일 15:00 · 서울 영등포구",
  },
  {
    thumbnail: assets.thumb2,
    badge: { label: "일정확인", color: "#e63946" },
    title: "입주청소",
    meta: "7월 13일 09:00 · 서울 성동구",
  },
];

const RECENT_QUOTE_ITEMS = [
  {
    thumbnail: assets.thumb1,
    badge: { label: "수락됨", color: "#0064ff" },
    title: "포장이사 견적",
  },
  {
    thumbnail: assets.thumb3,
    badge: { label: "일정조율", color: "#969696" },
    title: "에어컨 분해 청소",
  },
  {
    thumbnail: assets.thumb2,
    badge: { label: "답변대기", color: "#e63946" },
    title: "입주청소",
  },
];

function StatCard({ color, icon, label, value, unit, meta }) {
  return (
    <div className="relative rounded-[10px] text-white p-3  mb-5 mt-5" style={{ backgroundColor: color }}>
      <button
        type="button"
        onClick={() => toast({ icon: "info", title: "준비 중인 기능입니다." })}
        className="absolute right-4 top-4 bg-transparent border-none cursor-pointer text-white text-[20px] font-bold leading-none "
        aria-label={`${label} 더보기`}
      >
        +
      </button>
      <div className=" gap-3 p-2">
        <div className="flex items-start mb-3">
          <img src={icon} alt="" className="size-[40px] object-contain shrink-0 mt-0.5" />
          <div className="min-w-0 pr-6 pl-3">
            <p className="font-bold opacity-90 leading-tight">{label}</p>
            <p className="font-bold text-[30px] leading-tight mt-0.5">{value}{unit}</p>
          </div>
        </div>
        <p className="opacity-80 truncate">{meta}</p>
      </div>
    </div>
  );
}

function TaskCard({ title, desc, action }) {
  return (
    <div className="rounded-[5px] border border-[#eaeaea] bg-[#f7f7f7] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-[15px] text-[#3a3a3a] truncate">{title}</p>
          <p className="text-[14px] leading-[18px] text-[#555] mt-1 line-clamp-2">{desc}</p>
        </div>
        <button
          type="button"
          onClick={() => toast({ icon: "info", title: "준비 중인 기능입니다." })}
          className="shrink-0 flex h-[28px] items-center gap-1.5 rounded-[5px] border border-[#4e4e4e] bg-white px-2.5 text-[14px] text-[#4e4e4e] cursor-pointer hover:bg-[#f5f5f5] transition-colors whitespace-nowrap"
        >
          <img src={action === "chat" ? assets.iconChat : assets.iconReport} alt="" className="size-[11px]" />
          {action === "chat" ? "채팅" : "견적"}
        </button>
      </div>
    </div>
  );
}

function CompactListPanel({ title, items }) {
  return (
    <div className="border border-[rgba(0,0,0,0.11)] rounded-[15px] overflow-hidden">
      <div className="bg-[rgba(0,100,255,0.05)] px-5 h-[50px] flex items-center justify-between">
        <span className="font-bold text-[16px] text-[#3a3a3a]">{title}</span>
        <button
          type="button"
          onClick={() => toast({ icon: "info", title: "준비 중인 기능입니다." })}
          className="bg-transparent border-none cursor-pointer text-[20px] font-bold leading-none text-[#3a3a3a]"
          aria-label={`${title} 더보기`}
        >
          +
        </button>
      </div>
      <div className="divide-y divide-[#e5e5e5]">
        {items.map((item) => (
          <div key={item.title} className="flex items-start gap-4 p-5">
            <div className="size-[72px] shrink-0 rounded-[5px] border border-[#d9d9d9] overflow-hidden">
              <img alt={item.title} className="size-full object-cover" src={item.thumbnail} />
            </div>
            <div className="flex-1 min-w-0">
              <span
                className="inline-flex h-[22px] rounded-full border items-center px-2.5 whitespace-nowrap mb-1"
                style={{ borderColor: item.badge.color, color: item.badge.color }}
              >
                {item.badge.label}
              </span>
              <p className="font-bold text-black truncate">{item.title}</p>
              {item.meta && (
                <p className="text-[12px] text-[#4e4e4e] truncate mt-0.5">{item.meta}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => toast({ icon: "info", title: "준비 중인 기능입니다." })}
              className="shrink-0 flex h-[28px] items-center gap-1 rounded-[5px] border border-[#969696] bg-white px-3 text-[#969696] cursor-pointer hover:bg-[#f5f5f5] transition-colors whitespace-nowrap"
            >
              더보기 ›
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyPageProviderDashboard({ user, onSwitchToGeneral }) {
  const navigate = useNavigate();
  const nickname = user?.nickname || "고객";
  const email = user?.email || "";

  return (
    <div className="space-y-5">
      {/* 프로필 헤더 + 알림 배너 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="size-[64px] rounded-full overflow-hidden bg-[#e6f0ff] shrink-0">
            <img src={assets.profile} alt="" className="size-full object-cover" />
          </div>
          <div>
            <p className="font-bold text-[16px] text-[#4e4e4e] flex items-center gap-1.5">
              <span className="inline-block size-[8px] rounded-full bg-[#2ecc71]" />
              {nickname}님
            </p>
            <p className="text-[14px] text-[#969696] mt-0.5">{email}</p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="h-[30px] px-3 rounded-full border border-[#d9d9d9] bg-white text-[#4e4e4e] text-[14px] cursor-pointer hover:bg-[#f5f5f5] transition-colors flex items-center gap-1.5"
              >
                <img src={assets.iconLogout} alt="" className="size-[12px]" />
                로그아웃
              </button>
              <button
                type="button"
                onClick={onSwitchToGeneral}
                className="h-[30px] px-3 rounded-full border border-[#d9d9d9] bg-white text-[#4e4e4e] text-[14px] cursor-pointer hover:bg-[#f5f5f5] transition-colors flex items-center gap-1.5"
              >
                <img src={assets.iconSwitch1} alt="" className="size-[10px]" />
                일반 전환
              </button>
            </div>
          </div>
        </div>

        {/* 안읽은 알림 배너 */}
        <div className="flex-1 min-w-0 min-h-[45px] rounded-[25px] border border-[rgba(0,100,255,0.28)] bg-white flex items-center px-4 gap-2 overflow-hidden">
          <span className="flex items-center justify-center size-[18px] rounded-full bg-[#0064ff] text-white text-[13px] font-bold shrink-0">
            3
          </span>
          <span className="font-bold text-[16px] text-[#404040] shrink-0">안읽은 알림</span>
          <span className="hidden sm:flex items-center gap-1 text-[14px] text-[#404040] ml-2 truncate">
            <span className="text-[7px]">▶</span>
            입찰가가 갱신되었습니다.
          </span>
          <button
            type="button"
            onClick={() => navigate("/user/notification")}
            className="ml-auto bg-transparent border-none cursor-pointer font-bold text-[#404040] shrink-0"
          >
            +
          </button>
        </div>
      </div>

      {/* 통계 카드 4개 — 모바일: 4행 1열 / 태블릿: 2×2 / 데스크톱: 1행 4열 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ key, ...card }) => (
          <StatCard key={key} {...card} />
        ))}
      </div>

      {/* 오늘 확인할 일 */}
      <div className="border border-[rgba(0,0,0,0.11)] rounded-[15px] overflow-hidden">
        <div className="bg-[rgba(0,100,255,0.05)] h-[50px] px-5 flex items-center">
          <p className="font-bold text-[16px] text-[#3a3a3a]">오늘 확인할 일</p>
        </div>
        {TODAY_TASKS.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-[16px] text-[#969696]">오늘 확인할 일이 없습니다.</p>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TODAY_TASKS.map((task, i) => (
              <TaskCard key={`${task.title}-${i}`} {...task} />
            ))}
          </div>
        )}
      </div>

      {/* 정산현황 */}
      <div className="border border-[rgba(0,0,0,0.11)] rounded-[15px] overflow-hidden">
        <div className="bg-[rgba(0,100,255,0.05)] h-[50px] px-5 flex items-center justify-between">
          <p className="font-bold text-[16px] text-[#3a3a3a]">정산현황</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/user/settlement")}
              className="h-[38px] px-4 rounded-[5px] bg-primary text-white cursor-pointer hover:bg-[#0048bf] transition-colors"
            >
              정산관리
            </button>
            <button
              type="button"
              onClick={() => navigate("/user/settlement")}
              className="h-[38px] px-4 rounded-[5px] border border-primary bg-white text-primary cursor-pointer hover:bg-[#f0f6ff] transition-colors"
            >
              정산 계좌 확인
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 p-5 gap-4">
          {SETTLEMENT_STATS.map((stat, i) => (
            <div key={stat.label} className={`${i > 0 ? "sm:border-l sm:border-[#f0f0f0] sm:pl-5" : ""}`}>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-[15px] text-[#3a3a3a]">{stat.label}</span>
                <span className="font-bold text-[20px] text-[#3a3a3a]">{stat.value}</span>
              </div>
              <p className="text-[14px] text-[#555] mt-1">{stat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 진행 중 서비스 / 최근 수주·견적 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompactListPanel title="진행 중 서비스" items={IN_PROGRESS_ITEMS} />
        <CompactListPanel title="최근 수주·견적" items={RECENT_QUOTE_ITEMS} />
      </div>
    </div>
  );
}
