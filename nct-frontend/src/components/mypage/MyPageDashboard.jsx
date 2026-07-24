// src/components/mypage/MyPageDashboard.jsx
// Figma: mypage_01일반(node 18:2) CONTENTS 구간("MY 홈" 탭).
// - 절대좌표 → 반응형 전환. 통계카드 2x2→4열, 목록패널 1열→2열 그리드.
// TODO: 포인트(F-PNT)/경매(F-AUC)/서비스거래(F-SVC)/관심상품(F-WISH) API가 준비되면
//       STAT_CARDS/TODAY_ITEMS/WISH_ITEMS를 각 도메인 조회 결과로 교체한다.
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@utils/common";
import { assets } from "@components/mypage/assets";

const TODAY_ITEMS = [
  {
    thumbnail: assets.thumb1,
    badges: [{ label: "거래", cls: "badge-success" }, { label: "구매확정 대기", cls: "badge-teal" }],
    title: "[거래 구매확정] 다이슨 V11",
    meta: "거래 금액 148,000원 · 배송완료 후 3일째",
  },
  {
    thumbnail: assets.thumb2,
    badges: [{ label: "서비스 요청", cls: "badge-success" }],
    title: "[견적비교] 성수동 원룸 이사 운반",
    meta: "청년이사·바로운반 · 새 견적 도착",
  },
  {
    thumbnail: assets.thumb3,
    badges: [{ label: "거래", cls: "badge-success" }, { label: "구매확정 대기", cls: "badge-teal" }],
    title: "[거래 구매확정] 미니 보온 텀블러 세트",
    meta: "거래 금액 148,000원 · 배송완료 후 3일째",
  },
];

const WISH_ITEMS = [
  {
    thumbnail: assets.thumb1,
    badges: [{ label: "입찰 12회", cls: "badge-success" }, { label: "마감임박", cls: "badge-urgent" }],
    title: "피씨오브플레이어 컴퓨터 게이밍 조립컴퓨터 올인...",
    meta: "현재가 612,000원 · 오늘 18:00 종료",
  },
  {
    thumbnail: assets.thumb2,
    badges: [{ label: "입찰 3회", cls: "badge-success" }],
    title: "카본 패턴 1인용 게이밍 컴퓨터 철제책상 사무용책상...",
    meta: "현재가 32,000원 · 내입찰가 29,000원",
  },
  {
    thumbnail: assets.thumb3,
    badges: [{ label: "입찰 1회", cls: "badge-success" }, { label: "마감임박", cls: "badge-urgent" }],
    title: "PD 4포트 100W 멀티 충전기",
    meta: "현재가12,000원 · 내입찰가 9,000원 · 오늘 12:00 종료",
  },
];

const NOTICES = ["입찰가가 갱신되었습니다.", "관심 상품 마감 10분 전입니다", "새 견적이 도착했습니다"];

function StatCard({ color, icon, label, value, unit, meta, onMore }) {
  return (
    <div className="relative rounded-[10px] text-white p-5 md:mb-5 md:mt-5" style={{ backgroundColor: color }}>
      <button
        type="button"
        onClick={onMore}
        className="absolute right-4 top-4 bg-transparent border-none cursor-pointer"
        aria-label={`${label} 더보기`}
      >
        <img src={assets.iconMoreWhite} alt="" className="size-[20px] object-contain" />
      </button>
      <div className="flex items-start gap-3 mb-3">
        <img src={icon} alt="" className="size-[40px] object-contain shrink-0 mt-0.5" />
        <div className="min-w-0 pr-6 pl-4">
          <p className="font-bold text-[16px] opacity-90 leading-tight">{label}</p>
          <p className="font-bold text-[30px] leading-tight mt-0.5">{value}{unit}</p>
        </div>
      </div>
      <p className="text-[16px] opacity-80 truncate">{meta}</p>
    </div>
  );
}

function ListPanel({ title, items }) {
  return (
    <div className="border border-[rgba(0,0,0,0.11)] rounded-[15px] overflow-hidden">
      <div className="bg-[rgba(0,100,255,0.05)] px-5 h-[60px] flex items-center justify-between">
        <div className="flex  items-center gap-4 min-w-0">
          <span className="font-bold text-[18px] text-[#3a3a3a] shrink-0">{title}</span>
          <div className="hidden sm:flex items-center gap-4 text-[15px] mt-8 mr-0 ml-34">
            <span className="text-[#0064ff] font-bold border-b-2 border-[#0064ff] pb-px">전체</span>
            <span className="text-[#4e4e4e]">거래</span>
            <span className="text-[#4e4e4e]">서비스요청</span>
            <span className="text-[#4e4e4e]">입찰</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => toast({ icon: "info", title: "준비 중인 기능입니다." })}
          className="bg-transparent border-none cursor-pointer shrink-0 ml-2"
          aria-label={`${title} 더보기`}
        >
          <img src={assets.iconMore} alt="" className="size-[20px] object-contain opacity-40" />
        </button>
      </div>
      <div className="divide-y divide-[#e5e5e5]">
        {items.map((item) => (
          <div key={item.title} className="flex gap-4 p-5 items-center">
            <div className="size-[85px] shrink-0 rounded-[5px] border border-[#d9d9d9] overflow-hidden">
              <img alt={item.title} className="size-full object-cover" src={item.thumbnail} />
            </div>
            <div className="flex-1 min-w-0 ">
              <div className="flex flex-wrap gap-1.5 mb-1">
                {item.badges.map((badge) => (
                  <span key={badge.label} className={`badge ${badge.cls}`}>
                    {badge.label}
                  </span>
                ))}
              </div>
              <p className="font-bold text-[18px] text-black truncate">{item.title}</p>
              <p className="text-[15px] text-[#4e4e4e] truncate mt-1">{item.meta}</p>
            </div>
            <button
              type="button"
              onClick={() => toast({ icon: "info", title: "준비 중인 기능입니다." })}
              className="btn btn-ghost btn-sm shrink-0"
            >
              더보기 ›
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyPageDashboard({
  user,
  onRequestProviderSwitch,
  onOpenAuctionBids,
}) {
  const navigate = useNavigate();
  const nickname = user?.nickname || "고객";
  const email = user?.email || "";

  const statCards = [
    {
      key: "point",
      color: "#776bf8",
      icon: assets.iconPoint,
      label: "포인트 잔액",
      value: "250,000",
      unit: "",
      meta: "거래가능 240,000   ㅣ   홀딩 10,000",
      onMore: () => navigate("/user/mypage?section=wallet"),
    },
    {
      key: "auction",
      color: "#0064ff",
      icon: assets.iconAction,
      label: "경매 거래",
      value: "21",
      unit: "건",
      meta: "입찰중 10건   ㅣ   진행중 9건   ㅣ   완료 2건",
      // 경매 거래 카드의 + 버튼은 구매 거래가 표시되는 입찰 내역을 연다.
      onMore: onOpenAuctionBids,
    },
    {
      key: "service",
      color: "#005eb5",
      icon: assets.iconService,
      label: "서비스 거래",
      value: "3",
      unit: "건",
      meta: "등록 견적 1건   ㅣ   진행중 2건   ㅣ   완료 0건",
      onMore: () => toast({ icon: "info", title: "준비 중인 기능입니다." }),
    },
    {
      key: "done",
      color: "#e63946",
      icon: assets.iconEnd2,
      label: "거래 완료",
      value: "5",
      unit: "건",
      meta: "경매 2건   ㅣ   서비스 3건",
      onMore: () => toast({ icon: "info", title: "준비 중인 기능입니다." }),
    },
  ];

  return (
    <div className="space-y-5">
      {/* 프로필 헤더 + 알림 배너 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:grid lg:grid-cols-4 lg:gap-3 lg:items-end">
        <div className="flex items-center gap-3 shrink-0">
          <div className="size-[64px] rounded-full overflow-hidden bg-[#e6f0ff] shrink-0">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="" className="size-full object-cover" />
            ) : (
              <img src={assets.profile} alt="" className="size-full object-cover" />
            )}
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
                className="btn btn-ghost btn-sm"
              >
                <img src={assets.iconLogout} alt="" className="size-[12px]" />
                로그아웃
              </button>
              <button
                type="button"
                onClick={onRequestProviderSwitch}
                className="btn btn-ghost btn-sm"
              >
                <img src={assets.iconSwitch1} alt="" className="size-[10px]" />
                제공자 전환
              </button>
            </div>
          </div>
        </div>

        {/* 안읽은 알림 배너 */}
        <div className="ml-auto w-full md:w-[600px] md:flex-none lg:col-span-3 lg:ml-0 lg:w-full min-h-[45px] rounded-[25px] border border-[rgba(0,100,255,0.28)] bg-white flex items-center px-4 gap-2 overflow-hidden">
          <span className="flex items-center justify-center size-[18px] rounded-full bg-[#0064ff] text-white text-[13px] font-bold shrink-0">
            3
          </span>
          <span className="font-bold text-[#404040] shrink-0 mr-4">안읽은 알림</span>
          <div className="flex-1 min-w-0 hidden sm:flex items-center gap-3 overflow-hidden ">
            {NOTICES.map((notice) => (
              <span key={notice} className=" text-[14px] text-[#404040] flex items-center gap-1 shrink-0 truncate">
                <span className="text-[7px]">▶</span>
                {notice}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate("/user/notification")}
            className="ml-auto bg-transparent border-none cursor-pointer shrink-0"
          >
            <img src={assets.iconMore} alt="" className="size-[14px] object-contain opacity-40" />
          </button>
        </div>
      </div>

      {/* 통계 카드 4개 — 모바일: 4행 1열 / 태블릿: 2×2 / 데스크톱: 1행 4열 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ key, onMore, ...card }) => (
          <StatCard key={key} {...card} onMore={onMore} />
        ))}
      </div>

      {/* 오늘 확인할 일 / 관심상품 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListPanel title="오늘 확인할 일" items={TODAY_ITEMS} />
        <ListPanel title="관심상품" items={WISH_ITEMS} />
      </div>
    </div>
  );
}
