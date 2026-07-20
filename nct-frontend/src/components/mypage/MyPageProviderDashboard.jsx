// src/components/mypage/MyPageProviderDashboard.jsx
// Figma: mypage_02제공자모드(node 57:495) CONTENTS 구간("MY 홈" 탭, 제공자 모드).
// - 정산현황 카드의 "정산관리"/"정산 계좌 확인" 버튼은 담당자BJN이 이미 구현한 /user/settlement 로 연결한다.
// - 견적/서비스거래/서비스채팅 등 아직 화면이 없는 항목은 "준비 중" 안내만 띄운다.
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

// 오전 방문 일정류는 "채팅", 견적/확인 요청류는 "견적" 버튼 - Figma가 같은 텍스트를 반복 배치한 정적 목업이라 그대로 따른다.
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
    <div
      className="relative h-[161px] w-[316px] rounded-[15px] text-white shrink-0"
      style={{ backgroundColor: color }}
    >
      <p className="absolute left-[96px] top-[21px] font-['Noto_Sans_KR:Bold'] font-bold text-[16px] tracking-[-0.8px]">
        {label}
      </p>
      <img src={icon} alt="" className="absolute left-[24px] top-[37px] size-[44px] object-contain" />
      <p className="absolute left-[96px] top-[58px] font-['Noto_Sans_KR:Bold'] font-bold text-[30px] tracking-[-1.5px]">
        {value}
        {unit}
      </p>
      <p className="absolute left-[24px] top-[111px] font-['Noto_Sans_KR:Medium'] text-[16px] tracking-[-0.8px] whitespace-nowrap">
        {meta}
      </p>
      <button
        type="button"
        onClick={() => toast({ icon: "info", title: "준비 중인 기능입니다." })}
        className="absolute right-[18px] top-[18px] bg-transparent border-none cursor-pointer text-white text-[19px] font-bold leading-none"
        aria-label={`${label} 더보기`}
      >
        +
      </button>
    </div>
  );
}

// 오늘 확인할 일 섹션 높이 동적 계산 (태스크 수에 따라 자동 조정)
function computeTodayTasksHeight(taskCount) {
  if (taskCount === 0) return 150; // header(70) + empty message(80)
  const rows = Math.ceil(taskCount / 3);
  const gridH = rows * 109 + (rows - 1) * 21;
  return 70 + 21 + gridH + 21; // header + padding-top + grid + padding-bottom
}

// 섹션 top 위치 계산 (동적 높이 기반)
const TODAY_TASKS_TOP = 530;
const TODAY_TASKS_H = computeTodayTasksHeight(TODAY_TASKS.length);
const SETTLEMENT_TOP = TODAY_TASKS_TOP + TODAY_TASKS_H + 20;
const SETTLEMENT_H = 192;
const PANELS_TOP = SETTLEMENT_TOP + SETTLEMENT_H + 20;

function TaskCard({ title, desc, action }) {
  return (
    <div className="relative h-[109px] w-full rounded-[5px] border border-[#eaeaea] bg-[#f7f7f7]">
      <p className="absolute left-[20px] top-[24px] right-[100px] font-['Noto_Sans_KR:Bold'] font-bold text-[18px] text-[#3a3a3a] tracking-[-0.9px] truncate">
        {title}
      </p>
      <p className="absolute left-[20px] top-[50px] right-[100px] font-['Noto_Sans_KR:Medium'] text-[14px] leading-[20px] text-[#555] tracking-[-0.7px] line-clamp-2">
        {desc}
      </p>
      <button
        type="button"
        onClick={() => toast({ icon: "info", title: "준비 중인 기능입니다." })}
        className="absolute right-[20px] top-[39px] flex h-[30px] items-center gap-1.5 rounded-[5px] border border-[#4e4e4e] bg-white px-3 text-[15px] font-['Noto_Sans_KR:Medium'] text-[#4e4e4e] cursor-pointer hover:bg-[#f5f5f5] transition-colors whitespace-nowrap"
      >
        <img src={action === "chat" ? assets.iconChat : assets.iconReport} alt="" className="size-[13px]" />
        {action === "chat" ? "채팅" : "견적"}
      </button>
    </div>
  );
}

function CompactListPanel({ title, items, itemLabelSize = "normal" }) {
  return (
    <div className="relative h-[492px] w-[650px] shrink-0 overflow-hidden rounded-[15px] border border-[rgba(0,0,0,0.11)] bg-white">
      <div className="absolute left-0 top-0 h-[70px] w-full rounded-t-[15px] bg-[rgba(0,100,255,0.05)]" />
      <p className="absolute left-[30px] top-[25px] font-['Inter:Bold'] font-bold text-[18px] text-[#3a3a3a] tracking-[-0.9px]">
        {title}
      </p>
      <button
        type="button"
        onClick={() => toast({ icon: "info", title: "준비 중인 기능입니다." })}
        className="absolute right-[19px] top-[25px] bg-transparent border-none cursor-pointer text-[19px] font-bold leading-none text-[#3a3a3a]"
        aria-label={`${title} 더보기`}
      >
        +
      </button>

      {items.map((item, index) => (
        <div key={item.title} className="absolute left-0 w-full" style={{ top: 95 + index * 135 }}>
          <div className="absolute left-[30px] size-[85px] overflow-hidden rounded-[5px] border border-[#d9d9d9]">
            <img alt={item.title} className="size-full object-cover" src={item.thumbnail} />
          </div>

          <span
            className="absolute h-[25px] rounded-[20px] border flex items-center px-3 font-['Noto_Sans_KR:Regular'] text-[14px] whitespace-nowrap"
            style={{ left: 135, top: -3, borderColor: item.badge.color, color: item.badge.color }}
          >
            {item.badge.label}
          </span>
          <p
            className={`absolute font-['Noto_Sans_KR:Bold'] font-bold text-black truncate ${
              itemLabelSize === "small" ? "text-[18px]" : "text-[18px]"
            }`}
            style={{ left: 135, top: 33, width: 320 }}
          >
            {item.title}
          </p>
          {item.meta && (
            <p
              className="absolute font-['Noto_Sans_KR:Regular'] text-[15px] text-[#4e4e4e] truncate"
              style={{ left: 135, top: 64, width: 320 }}
            >
              {item.meta}
            </p>
          )}

          <button
            type="button"
            onClick={() => toast({ icon: "info", title: "준비 중인 기능입니다." })}
            className="absolute right-[19px] flex h-[29px] items-center gap-1 rounded-[5px] border border-[#969696] bg-white px-3 text-[14px] font-['Noto_Sans_KR:Medium'] text-[#969696] cursor-pointer hover:bg-[#f5f5f5] transition-colors"
            style={{ top: 4 }}
          >
            더보기 ›
          </button>

          {index < items.length - 1 && (
            <div className="absolute left-[30px] right-[19px] top-[111px] h-px bg-[#e5e5e5]" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function MyPageProviderDashboard({ user, onSwitchToGeneral }) {
  const navigate = useNavigate();
  const nickname = user?.nickname || "고객";
  const email = user?.email || "";

  return (
    <div className="absolute contents left-[448px] top-[167px]" data-name="CONTENTS">
      {/* 프로필 요약 */}
      <div className="absolute left-[448px] top-[167px] size-[72px] overflow-hidden rounded-full bg-[#e6f0ff]">
        <img src={assets.profile} alt="" className="size-full object-cover" />
      </div>
      <p className="absolute left-[543px] top-[167px] flex items-center gap-1 font-['Noto_Sans_KR:Bold'] font-bold text-[18px] text-[#4e4e4e]">
        <span className="inline-block size-[8px] rounded-full bg-[#2ecc71]" />
        {nickname}님
      </p>
      <p className="absolute left-[543px] top-[194px] font-['Noto_Sans_KR:Regular'] text-[14px] text-[#969696] tracking-[-0.7px]">
        {email}
      </p>

      <div className="absolute left-[448px] top-[247px] flex gap-2">
        <button
          type="button"
          className="flex h-[38px] w-[100px] items-center justify-center gap-1.5 rounded-[19px] border border-[#d9d9d9] bg-white text-[14px] font-['Noto_Sans_KR:Regular'] text-[#4e4e4e] cursor-pointer hover:bg-[#f5f5f5] transition-colors"
        >
          <img src={assets.iconLogout} alt="" className="size-[13px]" />
          로그아웃
        </button>
        <button
          type="button"
          onClick={onSwitchToGeneral}
          className="flex h-[38px] w-[100px] items-center justify-center gap-1.5 rounded-[19px] border border-[#d9d9d9] bg-white text-[14px] font-['Noto_Sans_KR:Regular'] text-[#4e4e4e] cursor-pointer hover:bg-[#f5f5f5] transition-colors"
        >
          <img src={assets.iconSwitch1} alt="" className="size-[11px]" />
          일반 전환
        </button>
      </div>

      {/* 안읽은 알림 */}
      <div className="absolute left-[784px] top-[237px] flex h-[46px] w-[984px] items-center gap-1 rounded-[20px] border border-[rgba(0,100,255,0.28)] bg-white px-4">
        <span className="relative flex size-[19px] shrink-0 items-center justify-center rounded-full bg-[#0064ff] font-['Noto_Sans_KR:Bold'] font-bold text-[12px] text-white">
          3
        </span>
        <span className="ml-1 shrink-0 font-['Noto_Sans_KR:Bold'] font-bold text-[14px] text-[#404040]">안읽은 알림</span>
        <span className="ml-4 flex items-center gap-1 truncate text-[14px] text-[#404040]">
          <span className="text-[8px]">▶</span>
          입찰가가 갱신되었습니다.
        </span>
        <span className="ml-4 flex items-center gap-1 truncate text-[14px] text-[#404040]">
          <span className="text-[8px]">▶</span>
          관심 상품 마감 10분 전입니다
        </span>
        <span className="ml-4 flex items-center gap-1 truncate text-[14px] text-[#404040]">
          <span className="text-[8px]">▶</span>
          새 견적이 도착했습니다
        </span>
        <button
          type="button"
          onClick={() => navigate("/user/notification")}
          className="ml-auto bg-transparent border-none cursor-pointer font-['Noto_Sans_KR:Bold'] font-bold text-[14px] text-[#404040]"
        >
          +
        </button>
      </div>

      {/* 통계 카드 4개 */}
      <div className="absolute left-[448px] top-[315px] flex gap-[18px]">
        {STAT_CARDS.map(({ key, ...card }) => (
          <StatCard key={key} {...card} />
        ))}
      </div>

      {/* 오늘 확인할 일 (전체폭, 동적 높이 - 디자인상 정산현황 위) */}
      <div
        className="absolute left-[448px] w-[1318px] rounded-[15px] border border-[rgba(0,0,0,0.11)] bg-white"
        style={{ top: TODAY_TASKS_TOP }}
      >
        <div className="h-[70px] rounded-t-[15px] bg-[rgba(0,100,255,0.05)] flex items-center px-[30px]">
          <p className="font-['Noto_Sans_KR:Bold'] font-bold text-[18px] text-[#3a3a3a] tracking-[-0.9px]">
            오늘 확인할 일
          </p>
        </div>
        {TODAY_TASKS.length === 0 ? (
          <div className="flex items-center justify-center py-[40px]">
            <p className="font-['Noto_Sans_KR:Medium'] text-[16px] text-[#969696]">
              오늘 확인할 일이 없습니다.
            </p>
          </div>
        ) : (
          <div className="p-[21px] grid grid-cols-3 gap-x-[25px] gap-y-[21px]">
            {TODAY_TASKS.map((task, i) => (
              <TaskCard key={`${task.title}-${i}`} {...task} />
            ))}
          </div>
        )}
      </div>

      {/* 정산현황 (디자인상 오늘 확인할 일 아래) */}
      <div
        className="absolute left-[448px] h-[192px] w-[1318px] overflow-hidden rounded-[15px] border border-[rgba(0,0,0,0.11)] bg-white"
        style={{ top: SETTLEMENT_TOP }}
      >
        <div className="absolute left-0 top-0 h-[70px] w-full rounded-t-[15px] bg-[rgba(0,100,255,0.05)]" />
        <p className="absolute left-[30px] top-[26px] font-['Noto_Sans_KR:Bold'] font-bold text-[18px] text-[#3a3a3a] tracking-[-0.9px]">
          정산현황
        </p>
        <button
          type="button"
          onClick={() => navigate("/user/settlement")}
          className="absolute right-[168px] top-[13px] flex h-[45px] w-[95px] items-center justify-center rounded-[5px] bg-primary text-[16px] font-['Noto_Sans_KR:Medium'] text-white cursor-pointer hover:bg-[#0048bf] transition-colors"
        >
          정산관리
        </button>
        <button
          type="button"
          onClick={() => navigate("/user/settlement")}
          className="absolute right-[19px] top-[13px] flex h-[45px] w-[125px] items-center justify-center rounded-[5px] border border-primary bg-white text-[16px] font-['Noto_Sans_KR:Medium'] text-primary cursor-pointer hover:bg-[#f0f6ff] transition-colors"
        >
          정산 계좌 확인
        </button>

        {SETTLEMENT_STATS.map((stat, i) => (
          <div key={stat.label} className="absolute top-[108px] w-[400px]" style={{ left: 30 + i * 436 }}>
            <div className="flex items-baseline gap-2">
              <span className="font-['Noto_Sans_KR:Bold'] font-bold text-[18px] text-[#3a3a3a] tracking-[-0.9px] whitespace-nowrap">
                {stat.label}
              </span>
              <span className="font-['Noto_Sans_KR:Bold'] font-bold text-[25px] text-[#3a3a3a] tracking-[-1.25px] whitespace-nowrap">
                {stat.value}
              </span>
            </div>
            <p className="mt-[10px] font-['Noto_Sans_KR:Medium'] text-[16px] text-[#3a3a3a] tracking-[-0.8px] whitespace-nowrap">
              {stat.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 진행 중 서비스 / 최근 수주·견적 */}
      <div
        className="absolute left-[448px] flex gap-[18px]"
        style={{ top: PANELS_TOP }}
      >
        <CompactListPanel title="진행 중 서비스" items={IN_PROGRESS_ITEMS} />
        <CompactListPanel title="최근 수주·견적" items={RECENT_QUOTE_ITEMS} itemLabelSize="small" />
      </div>
    </div>
  );
}
