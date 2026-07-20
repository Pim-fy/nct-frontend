// src/components/mypage/MyPageDashboard.jsx
// Figma: mypage_01일반(node 18:2) CONTENTS 구간("MY 홈" 탭).
// - /user/mypage는 로그인 없이도 접근 가능한 라우트라(ProtectedRoute로 감싸져 있지 않음),
//   담당자BJN의 usePointBalance(GET /api/point/balance) 같은 인증 필요 API를 무조건 호출하면
//   비로그인 상태에서 401 → refresh 실패 → alert()+로그인 페이지 강제 이동이 발생한다.
//   그래서 포인트 잔액을 실제 API로 연동하지 않고 정적 데이터로 표시한다.
// TODO: 포인트(F-PNT)/경매(F-AUC)/서비스거래(F-SVC)/관심상품(F-WISH) API가 준비되고
//       이 페이지가 로그인 필수 라우트로 정리되면, STAT_CARDS/TODAY_ITEMS/WISH_ITEMS를
//       각 도메인 조회 결과로 교체한다.
import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@utils/common";
import { assets } from "@components/mypage/assets";

const TODAY_ITEMS = [
  {
    thumbnail: assets.thumb1,
    badges: [{ label: "거래", color: "#0064ff" }, { label: "구매확정 대기", color: "#e63946" }],
    title: "[거래 구매확정] 다이슨 V11",
    meta: "거래 금액 148,000원 · 배송완료 후 3일째",
  },
  {
    thumbnail: assets.thumb2,
    badges: [{ label: "서비스 요청", color: "#0064ff" }],
    title: "[견적비교] 성수동 원룸 이사 운반",
    meta: "청년이사·바로운반 · 새 견적 도착",
  },
  {
    thumbnail: assets.thumb3,
    badges: [{ label: "거래", color: "#0064ff" }, { label: "구매확정 대기", color: "#e63946" }],
    title: "[거래 구매확정] 미니 보온 텀블러 세트",
    meta: "거래 금액 148,000원 · 배송완료 후 3일째",
  },
];

const WISH_ITEMS = [
  {
    thumbnail: assets.thumb1,
    badges: [{ label: "입찰 12회", color: "#0064ff" }, { label: "마감임박", color: "#e63946" }],
    title: "피씨오브플레이어 컴퓨터 게이밍 조립컴퓨터 올인...",
    meta: "현재가 612,000원 · 오늘 18:00 종료",
  },
  {
    thumbnail: assets.thumb2,
    badges: [{ label: "입찰 3회", color: "#0064ff" }],
    title: "카본 패턴 1인용 게이밍 컴퓨터 철제책상 사무용책상...",
    meta: "현재가 32,000원 · 내입찰가 29,000원",
  },
  {
    thumbnail: assets.thumb3,
    badges: [{ label: "입찰 1회", color: "#0064ff" }, { label: "마감임박", color: "#e63946" }],
    title: "PD 4포트 100W 멀티 충전기",
    meta: "현재가12,000원 · 내입찰가 9,000원 · 오늘 12:00 종료",
  },
];

const NOTICES = ["입찰가가 갱신되었습니다.", "관심 상품 마감 10분 전입니다", "새 견적이 도착했습니다"];

function StatCard({ color, icon, label, value, unit, meta, onMore }) {
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
        onClick={onMore}
        className="absolute right-[18px] top-[18px] bg-transparent border-none cursor-pointer text-white text-[19px] font-bold leading-none"
        aria-label={`${label} 더보기`}
      >
        +
      </button>
    </div>
  );
}

function ListPanel({ title, items }) {
  return (
    <div className="relative w-[650px] h-[492px] bg-white border border-[rgba(0,0,0,0.11)] rounded-[15px] overflow-hidden shrink-0">
      <div className="absolute left-0 top-0 w-full h-[70px] bg-[rgba(0,100,255,0.05)] rounded-t-[15px]" />

      <p className="absolute left-[30px] top-[31px] font-['Inter:Bold'] font-bold text-[18px] text-[#3a3a3a] tracking-[-0.9px]">
        {title}
      </p>

      <div className="absolute left-[404px] top-[36px] flex items-center gap-[24px] font-['Noto_Sans_KR:Medium'] text-[15px] tracking-[-0.75px]">
        <span className="text-[#0064ff] font-['Inter:Bold'] font-bold border-b-2 border-[#0064ff] pb-[2px]">전체</span>
        <span className="text-[#4e4e4e]">거래</span>
        <span className="text-[#4e4e4e]">서비스요청</span>
        <span className="text-[#4e4e4e]">입찰</span>
      </div>
      <button
        type="button"
        onClick={() => toast({ icon: "info", title: "준비 중인 기능입니다." })}
        className="absolute right-[19px] top-[31px] bg-transparent border-none cursor-pointer text-[#3a3a3a] text-[19px] font-bold leading-none"
        aria-label={`${title} 더보기`}
      >
        +
      </button>

      {items.map((item, index) => (
        <div key={item.title} className="absolute left-0 w-full" style={{ top: 87 + index * 136 }}>
          <div
            className="absolute border border-[#d9d9d9] rounded-[5px] size-[85px] overflow-hidden"
            style={{ left: 30 }}
          >
            <img alt={item.title} className="size-full object-cover" src={item.thumbnail} />
          </div>

          <div className="absolute flex items-center gap-2" style={{ left: 135, top: -3 }}>
            {item.badges.map((badge) => (
              <span
                key={badge.label}
                className="h-[25px] rounded-[20px] border flex items-center px-3 font-['Noto_Sans_KR:Regular'] text-[14px] whitespace-nowrap"
                style={{ borderColor: badge.color, color: badge.color }}
              >
                {badge.label}
              </span>
            ))}
          </div>
          <p
            className="absolute font-['Noto_Sans_KR:Bold'] font-bold text-[18px] text-black truncate"
            style={{ left: 135, top: 35, width: 400 }}
          >
            {item.title}
          </p>
          <p
            className="absolute font-['Noto_Sans_KR:Regular'] text-[15px] text-[#4e4e4e] truncate"
            style={{ left: 135, top: 66, width: 400 }}
          >
            {item.meta}
          </p>

          <button
            type="button"
            onClick={() => toast({ icon: "info", title: "준비 중인 기능입니다." })}
            className="absolute right-[19px] flex items-center gap-1 h-[29px] px-3 rounded-[5px] border border-[#969696] bg-white text-[#969696] text-[14px] font-['Noto_Sans_KR:Medium'] cursor-pointer hover:bg-[#f5f5f5] transition-colors"
            style={{ top: 27 }}
          >
            더보기 ›
          </button>

          {index < items.length - 1 && (
            <div className="absolute left-[30px] right-[19px] top-[119px] h-px bg-[#e5e5e5]" />
          )}
        </div>
      ))}
    </div>
  );
}

export default function MyPageDashboard({ user, onRequestProviderSwitch }) {
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
      onMore: () => navigate("/user/point"),
    },
    {
      key: "auction",
      color: "#0064ff",
      icon: assets.iconAction,
      label: "경매 거래",
      value: "21",
      unit: "건",
      meta: "입찰중 10건   ㅣ   진행중 9건   ㅣ   완료 2건",
      // mypage_mybid.png 디자인상 이 카드의 더보기가 "내 입찰 내역"(F-AUC-022) 드릴다운 진입점이다.
      onMore: () => navigate("/my-bids"),
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
    <div className="absolute contents left-[448px] top-[167px]" data-name="CONTENTS">
      {/* 프로필 요약 */}
      <div className="absolute left-[448px] top-[167px] size-[72px] rounded-full overflow-hidden bg-[#e6f0ff]">
        {user?.profileImageUrl ? (
          <img src={user.profileImageUrl} alt="" className="size-full object-cover" />
        ) : (
          <img src={assets.profile} alt="" className="size-full object-cover" />
        )}
      </div>
      <p className="absolute left-[543px] top-[167px] font-['Noto_Sans_KR:Bold'] font-bold text-[18px] text-[#4e4e4e] flex items-center gap-1">
        <span className="inline-block size-[8px] rounded-full bg-[#2ecc71]" />
        {nickname}님
      </p>
      <p className="absolute left-[543px] top-[194px] font-['Noto_Sans_KR:Regular'] text-[14px] text-[#969696] tracking-[-0.7px]">
        {email}
      </p>

      <div className="absolute left-[448px] top-[247px] flex gap-2">
        <button
          type="button"
          className="h-[38px] w-[100px] rounded-[19px] border border-[#d9d9d9] bg-white text-[#4e4e4e] text-[14px] font-['Noto_Sans_KR:Regular'] cursor-pointer hover:bg-[#f5f5f5] transition-colors flex items-center justify-center gap-1.5"
        >
          <img src={assets.iconLogout} alt="" className="size-[13px]" />
          로그아웃
        </button>
        <button
          type="button"
          onClick={onRequestProviderSwitch}
          className="h-[38px] w-[113px] rounded-[19px] border border-[#d9d9d9] bg-white text-[#4e4e4e] text-[14px] font-['Noto_Sans_KR:Regular'] cursor-pointer hover:bg-[#f5f5f5] transition-colors flex items-center justify-center gap-1.5"
        >
          <img src={assets.iconSwitch1} alt="" className="size-[11px]" />
          제공자 전환
        </button>
      </div>

      {/* 안읽은 알림 */}
      <div className="absolute left-[784px] top-[237px] h-[46px] w-[984px] rounded-[20px] border border-[rgba(0,100,255,0.28)] bg-white flex items-center px-4 gap-1">
        <span className="relative flex items-center justify-center size-[19px] rounded-full bg-[#0064ff] text-white text-[12px] font-['Noto_Sans_KR:Bold'] font-bold shrink-0">
          3
        </span>
        <span className="font-['Noto_Sans_KR:Bold'] font-bold text-[14px] text-[#404040] shrink-0 ml-1">안읽은 알림</span>
        {NOTICES.map((notice) => (
          <span key={notice} className="text-[14px] text-[#404040] flex items-center gap-1 ml-4 truncate">
            <span className="text-[8px]">▶</span>
            {notice}
          </span>
        ))}
        <button
          type="button"
          onClick={() => navigate("/user/notification")}
          className="ml-auto bg-transparent border-none cursor-pointer text-[#404040] text-[14px] font-['Noto_Sans_KR:Bold'] font-bold"
        >
          +
        </button>
      </div>

      {/* 통계 카드 4개 */}
      <div className="absolute left-[448px] top-[315px] flex gap-[18px]">
        {statCards.map(({ key, onMore, ...card }) => (
          <StatCard key={key} {...card} onMore={onMore} />
        ))}
      </div>

      {/* 오늘 확인할 일 / 관심상품 */}
      <div className="absolute left-[448px] top-[523px] flex gap-[18px]">
        <ListPanel title="오늘 확인할 일" items={TODAY_ITEMS} />
        <ListPanel title="관심상품" items={WISH_ITEMS} />
      </div>
    </div>
  );
}
