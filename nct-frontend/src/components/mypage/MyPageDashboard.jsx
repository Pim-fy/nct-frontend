// src/components/mypage/MyPageDashboard.jsx
// Figma: mypage_01일반(node 18:2) CONTENTS 구간("MY 홈" 탭).
// - 절대좌표 → 반응형 전환. 통계카드 2x2→4열, 목록패널 1열→2열 그리드.
// TODO: 포인트(F-PNT)/경매(F-AUC)/서비스거래(F-SVC)/관심상품(F-WISH) API가 준비되면
//       STAT_CARDS/TODAY_ITEMS/WISH_ITEMS를 각 도메인 조회 결과로 교체한다.
import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMyPagePath } from "@/routes/myPageRoutes";
import { useQuery } from "@tanstack/react-query";
import { fetchMyFavoriteAuctions } from "@api/auctionApi";
import { getMyBidHistory } from "@api/bidApi";
import { getMyServiceRequests } from "@api/serviceRequestApi";
import { getMyServiceTrades } from "@api/serviceTradeApi";
import { getMyProducts } from "@api/productApi";
import { getTradeHistory } from "@api/tradeApi";
import { getTradeListItems, toTradeHistoryItem } from "@api/tradeAdapter";
import { getWritableReviews } from "@api/reviewApi";
import { getTradeChatRooms } from "@api/tradeChatApi";
import { toTradeChatRooms } from "@api/tradeChatAdapter";
import { usePointBalance } from "@hooks/usePoint";
import { useNotifications } from "@hooks/useNotification";
import { useMemberProfile } from "@hooks/useMemberProfile";
import relativeTime from "@utils/relativeTime";
import { assets } from "@components/mypage/assets";
import MyPageContentHeader from "@components/mypage/MyPageContentHeader";
import {
  MyPageDashboardSummaryCards,
  MyPageDashboardTop,
} from "@components/mypage/MyPageDashboardCommon";

const WISH_TABS = [
  { label: "전체",     section: "wishlist" },
  { label: "거래",     section: "wishlist" },
  { label: "서비스요청", section: "wishlist" },
  { label: "입찰",     section: "wishlist" },
];

const NOTIF_TABS = ["전체", "경매", "거래", "채팅", "서비스", "운영"];

const DOMAIN_BADGE = {
  NTFC0010: "badge-urgent",
  NTFC0011: "badge-blue",
  NTFC0012: "badge-success",
  NTFC0013: "badge-primary",
  NTFC0014: "badge-gray",
};

const DOMAIN_TO_SECTION = {
  NTFC0010: "active-auctions",
  NTFC0011: "auction-bids",
  NTFC0012: "service-trade",
  NTFC0013: "wallet",
  NTFC0014: "chat",
};



function ListPanel({ title, items, tabs, onTabClick, onMore, onItemMore }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-[18px] text-[#1a1a1a] m-0">{title}</h3>
        <button
          type="button"
          onClick={onMore}
          className="bg-transparent border-none cursor-pointer flex items-center gap-1 text-[14px] text-[#969696]"
          aria-label={`${title} 더보기`}
        >
          더보기
          <img src={assets.iconMore} alt="" className="size-[14px] object-contain opacity-40" />
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-5 border-b border-[#e5e5e5] mb-4">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => { setActiveIdx(i); onTabClick?.(tab.section); }}
            style={{ marginBottom: -1 }}
            className={`pb-2.5 text-[15px] font-medium bg-transparent border-none cursor-pointer transition-colors ${
              i === activeIdx
                ? "text-[#0064ff] border-b-2 border-[#0064ff]"
                : "text-[#969696]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 카드 그리드 */}
      {items.length === 0 ? (
        <p className="text-[15px] text-[#969696] py-10 text-center">표시할 항목이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((item, i) => (
            <div
              key={`${item.title}-${i}`}
              className="border border-[rgba(0,0,0,0.08)] rounded-[15px] bg-white p-4 cursor-pointer hover:border-[rgba(0,100,255,0.3)] transition-colors"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
              onClick={() => onItemMore?.(item.section)}
            >
              <div className="flex flex-wrap gap-1 mb-2">
                {item.badges.map((badge) => (
                  <span key={badge.label} className={`badge ${badge.cls}`} style={{ fontSize: 13, height: 30, borderRadius: 5 }}>
                    {badge.label}
                  </span>
                ))}
              </div>
              <p className="font-bold text-[16px] text-[#1a1a1a] leading-snug mb-1.5" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {item.title}
              </p>
              <p className="text-[14px] text-[#969696] truncate">{item.meta}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationPanel({ notifications = [], onItemClick, onMore }) {
  const [activeIdx, setActiveIdx] = useState(0);

  // 탭 순서: 전체, 경매(NTFC0010), 거래(NTFC0011), 채팅(NTFC0014), 서비스(NTFC0012), 운영(NTFC0013)
  const NOTIF_TAB_CODES = [null, "NTFC0010", "NTFC0011", "NTFC0014", "NTFC0012", "NTFC0013"];
  const filtered = notifications
    .filter((n) => activeIdx === 0 || n.domainCd === NOTIF_TAB_CODES[activeIdx])
    .slice(0, 6);

  return (
    <div className="bg-white rounded-[15px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-[#e4e9f2] overflow-hidden">
      {/* 헤더 배경 영역 */}
      <div className="bg-[#f5f7fc] px-5 border-b border-[#e8e9ec]">
        <div className="flex items-end justify-between h-[60px] gap-4">
          <div className="flex items-end gap-5">
            <h3 className="font-bold text-[18px] text-[#1a1a1a] m-0 shrink-0 pb-[10px]">알림</h3>
            {NOTIF_TABS.map((tab, i) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveIdx(i)}
                className={`tab-underline${i === activeIdx ? " active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onMore}
            className="bg-transparent border-none cursor-pointer flex items-center gap-1 text-[14px] text-[#969696] shrink-0 pb-[10px]"
          >
            더보기 <ChevronRight size={14} className="text-[#969696]" />
          </button>
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="px-5 pb-5 min-h-[179px] flex flex-col">
        {filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[15px] text-[#969696] m-0">알림이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            {filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => onItemClick?.(DOMAIN_TO_SECTION[n.domainCd] ?? "home")}
                className="flex items-center gap-2 py-3.5 cursor-pointer hover:opacity-70 transition-opacity border-b border-[#e8e9ec]"
              >
                <span className={`badge ${DOMAIN_BADGE[n.domainCd] ?? "badge-gray"} shrink-0`} style={{ borderRadius: 5, fontSize: 12 }}>
                  {n.type}
                </span>
                <div className="flex-1 flex items-center gap-1.5 min-w-0">
                  <span className="text-[15px] text-[#1a1a1a] leading-snug truncate">{n.title}</span>
                  {!n.read && (
                    <span className="shrink-0 min-w-[16px] h-[16px] rounded-full bg-[#e63946] text-white text-[10px] font-bold inline-flex items-center justify-center leading-none">
                      N
                    </span>
                  )}
                </div>
                <span className="text-[13px] text-[#b0aea8] shrink-0">{relativeTime(n.regDt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const REVIEW_DEAL_TYPE = {
  goods:   { label: "물건거래", cls: "badge-blue" },
  service: { label: "서비스",   cls: "badge-success" },
};

function ReviewablePanel({ items, onWrite, onMore }) {
  const fmtDate = (str) => str?.slice(0, 10).replace(/-/g, ".") ?? "-";
  const preview = items.slice(0, 3);

  return (
    <div className="bg-white rounded-[15px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-[#e4e9f2] overflow-hidden">
      {/* 헤더 배경 영역 */}
      <div className="bg-[#f5f7fc] px-5 border-b border-[#e8e9ec]">
        <div className="flex items-end pb-3 justify-between h-[60px]">
          <h3 className="font-bold text-[18px] text-[#1a1a1a] m-0">
            거래 완료 리뷰작성
            <span className="ml-2 text-[15px] text-[#0064ff] font-bold">{items.length}건</span>
          </h3>
          <button
            type="button"
            onClick={onMore}
            className="bg-transparent border-none cursor-pointer flex items-center gap-1 text-[14px] text-[#969696] shrink-0"
          >
            더보기 <ChevronRight size={14} className="text-[#969696]" />
          </button>
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="px-5 pb-5 min-h-[122px]">
      <div className="divide-y divide-[#e8e9ec]">
        {preview.map((item) => {
          const type = REVIEW_DEAL_TYPE[item.dealType] ?? { label: item.dealType, cls: "badge-gray" };
          return (
            <div key={item.id} className="flex items-center gap-3 py-3.5">
              <span className={`badge ${type.cls} shrink-0`} style={{ borderRadius: 5, fontSize: 12 }}>
                {type.label}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-[#1a1a1a] m-0 truncate">{item.title}</p>
                <p className="text-[13px] text-[#969696] m-0 mt-0.5">
                  {item.partyLabel} {item.partyName} · {fmtDate(item.completedDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onWrite(item)}
                className="btn btn-sm btn-primary shrink-0"
              >
                리뷰작성
              </button>
            </div>
          );
        })}
      </div>

      {items.length > 3 && (
        <button
          type="button"
          onClick={onMore}
          className="w-full pt-3 text-[14px] text-[#969696] border-t border-[#e8e9ec] hover:text-[#0064ff] transition-colors"
        >
          {items.length - 3}건 더 보기
        </button>
      )}
      </div>
    </div>
  );
}

function ActiveChatPanel({ rooms, onOpenChat, onMore }) {
  return (
    <div className="bg-white rounded-[15px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-[#e4e9f2] overflow-hidden">
      {/* 헤더 배경 영역 */}
      <div className="bg-[#f5f7fc] px-5 border-b border-[#e8e9ec]">
        <div className="flex items-end pb-3 justify-between h-[60px]">
          <h3 className="font-bold text-[18px] text-[#1a1a1a] m-0">
            진행중인 채팅
            {rooms.length > 0 && (
              <span className="ml-2 text-[15px] text-[#0064ff] font-bold">{rooms.length}건</span>
            )}
          </h3>
          <button
            type="button"
            onClick={onMore}
            className="bg-transparent border-none cursor-pointer flex items-center gap-1 text-[14px] text-[#969696] shrink-0"
          >
            더보기 <ChevronRight size={14} className="text-[#969696]" />
          </button>
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="px-5 pb-5 min-h-[122px]">
      {rooms.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-[15px] text-[#969696] m-0">진행중인 채팅이 없습니다.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#e8e9ec]">
          {rooms.map((room) => (
            <div
              key={room.roomId}
              onClick={() => onOpenChat?.(room)}
              className="flex items-center gap-3 py-3.5 cursor-pointer hover:opacity-70 transition-opacity"
            >
              <div className="relative shrink-0">
                <div className="size-[36px] rounded-full bg-[#e6f0ff] flex items-center justify-center text-[#0064ff] font-bold text-[15px]">
                  {room.counterpartNickname?.[0] ?? "?"}
                </div>
                {room.unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-[#e63946] text-white text-[10px] font-bold flex items-center justify-center">
                    {room.unreadCount > 99 ? "99+" : room.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-[#1a1a1a] m-0 truncate">{room.productName}</p>
                <p className="text-[13px] text-[#969696] m-0 mt-0.5 truncate">{room.lastMessage}</p>
              </div>
              <span className="text-[13px] text-[#b0aea8] shrink-0">{room.latestMessageAt}</span>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default function MyPageDashboard({
  user,
  isProviderApproved,
  onLogout,
  onRequestProviderSwitch,
}) {
  const navigate = useNavigate();
  const nickname = user?.nickname || "고객";
  const email = user?.email || "";
  const profileQuery = useMemberProfile();

  // 관심상품 실데이터 — 최대 3건만 미리보기
  const wishQuery = useQuery({
    queryKey: ["auctionFavorites", 1, 3],
    queryFn: () => fetchMyFavoriteAuctions({ page: 1, size: 3 }),
    enabled: !!user,
  });
  const wishItems = (wishQuery.data?.items ?? []).map((item) => ({
    badges: [
      { label: item.auctionStatusName || "경매중", cls: "badge-blue" },
      ...(item.bidCount > 0 ? [{ label: `입찰 ${item.bidCount}회`, cls: "badge-teal" }] : []),
    ],
    title: item.title || `경매 #${item.auctionId}`,
    meta: item.currentPrice
      ? `현재가 ${Number(item.currentPrice).toLocaleString()}P`
      : "현재가 -",
    section: "active-auctions",
  }));

  const nav = (section) => () => navigate(getMyPagePath(section));

  // ── 실데이터 조회 ──────────────────────────────────────────────────────────

  // 포인트 잔액
  const { data: pointBalance } = usePointBalance({ enabled: !!user });

  // 알림 목록 — MY홈 패널에는 안읽은 것만 표시
  const notificationsQuery = useNotifications({ enabled: !!user });
  const allNotifications = notificationsQuery.data ?? [];
  const unreadNotifications = allNotifications.filter((n) => !n.read);

  // 경매 입찰 전체 이력 (구매자)
  const { data: bidHistory = [] } = useQuery({
    queryKey: ["bids", "my"],
    queryFn: getMyBidHistory,
    select: (res) => res.data ?? [],
    enabled: !!user,
  });
  const activeAuctionCnt = new Set(
    bidHistory
      .filter((b) => b.auctionStatusCode === "AUCC0002" && (b.displayStatus === "HIGHEST" || b.displayStatus === "OUTBID"))
      .map((b) => b.aucSn)
  ).size;
  const wonCnt = new Set(bidHistory.filter((b) => b.displayStatus === "WON").map((b) => b.aucSn)).size;

  // 구매 건수 — 상품 구매내역 페이지(TradeHistory fixedRole=BUYER)와 동일한 기준
  const { data: allTradeItems = [] } = useQuery({
    queryKey: ["trades", "my", "all"],
    queryFn: async () => {
      const res = await getTradeHistory({});
      return getTradeListItems(res).map(toTradeHistoryItem);
    },
    enabled: !!user,
  });
  const purchaseCnt = allTradeItems.filter((t) => t.type === "BUYER").length;

  // 담당자 7: 일반회원 서비스 현황은 요청자 전용 조회 계약만 사용한다.
  const { data: svcReqAll } = useQuery({
    queryKey: ["serviceRequests", "me", "total"],
    queryFn: () => getMyServiceRequests(1, 1),
    select: (res) => res.data,
    enabled: !!user,
  });
  const svcRequestCnt = svcReqAll?.total ?? 0;

  const { data: svcTradeAll } = useQuery({
    queryKey: ["my-service-trades", "REQUESTER", "ALL", "", 1, 1],
    queryFn: () => getMyServiceTrades({ role: "REQUESTER", page: 1, size: 1 }),
    enabled: !!user,
  });
  const svcTradeCnt = Number(svcTradeAll?.totalCount) || 0;

  const { data: svcTradeCompleted } = useQuery({
    queryKey: ["my-service-trades", "REQUESTER", "TRDC0006", "", 1, 1],
    queryFn: () => getMyServiceTrades({
      role: "REQUESTER",
      status: "TRDC0006",
      page: 1,
      size: 1,
    }),
    enabled: !!user,
  });
  const svcTradeCompletedCnt = Number(svcTradeCompleted?.totalCount) || 0;

  // 경매 판매 건수 (진행 중 상태)
  const { data: auctionActiveSummary } = useQuery({
    queryKey: ["products", "my", 1, 1, "ACTIVE"],
    queryFn: () => getMyProducts(1, 1, "ACTIVE"),
    select: (res) => res.data,
    enabled: !!user,
  });
  const auctionSaleCnt = auctionActiveSummary?.total ?? 0;

  // 진행중인 채팅방 (ACTIVE 상태만)
  const { data: activeChatRooms = [] } = useQuery({
    queryKey: ["chatRooms", "active"],
    queryFn: async () => {
      const res = await getTradeChatRooms();
      return toTradeChatRooms(res).filter((r) => r.roomStatus === "ACTIVE").slice(0, 3);
    },
    enabled: !!user,
  });

  // 미작성 리뷰 목록
  const { data: writableReviews = [] } = useQuery({
    queryKey: ["reviews", "writable"],
    queryFn: getWritableReviews,
    select: (res) => res.data ?? [],
    enabled: !!user,
  });

  const fmtP = (n) => (n != null ? Number(n).toLocaleString() : "...");

  // ── 통계 카드 ──────────────────────────────────────────────────────────────

  const subBtn = "text-white/70 hover:text-white underline underline-offset-2 transition-colors";

  const statCards = [
    {
      key: "point",
      color: "#776bf8",
      icon: assets.iconPoint,
      label: "포인트 잔액",
      value: fmtP(pointBalance?.total),
      unit: "P",
      meta: pointBalance
        ? `사용가능 ${fmtP(pointBalance.available)}P   ㅣ   환전가능 ${fmtP(pointBalance.settleable)}P`
        : "조회 중...",
      onMore: nav("wallet"),
    },
    {
      key: "auction",
      color: "#3B4DE3",
      icon: assets.iconAction,
      label: "경매 거래",
      value: String(purchaseCnt),
      unit: "건",
      meta: (
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <button type="button" onClick={nav("active-auctions")} className={subBtn}>진행중 {activeAuctionCnt}건</button>
          <span className="text-white/70">ㅣ</span>
          <button type="button" onClick={nav("auction-bids")}    className={subBtn}>구매 {purchaseCnt}건</button>
          <span className="text-white/70">ㅣ</span>
          <button type="button" onClick={nav("auction-sales")}   className={subBtn}>판매 {auctionSaleCnt}건</button>
        </span>
      ),
      onMore: nav("active-auctions"),
    },
    {
      key: "service",
      color: "#0CB8BB",
      icon: assets.iconService,
      label: "서비스 거래",
      value: String(svcRequestCnt + svcTradeCnt),
      unit: "건",
      meta: (
        <span className="flex items-center gap-x-2">
          <button type="button" onClick={nav("service-requests")} className={subBtn}>견적 요청 {svcRequestCnt}건</button>
          <span className="text-white/70">ㅣ</span>
          <button type="button" onClick={nav("service-trade")} className={subBtn}>서비스 거래 {svcTradeCnt}건</button>
        </span>
      ),
      onMore: nav("service-requests"),
    },
    {
      key: "done",
      color: "#e63946",
      icon: assets.iconEnd2,
      label: "거래 완료",
      value: String(wonCnt + svcTradeCompletedCnt),
      unit: "건",
      meta: (
        <span className="flex items-center gap-x-2">
          <button type="button" onClick={nav("auction-bids")}  className={subBtn}>경매 {wonCnt}건</button>
          <span className="text-white/70">ㅣ</span>
          <button type="button" onClick={nav("service-trade")} className={subBtn}>서비스 {svcTradeCompletedCnt}건</button>
        </span>
      ),
      onMore: undefined,
    },
  ];

  return (
    <div className="space-y-5">
      <MyPageContentHeader title="MY 홈" />

      <MyPageDashboardTop
        profileImageUrl={profileQuery.data?.profileImageUrl || user?.profileImageUrl}
        nickname={nickname}
        email={email}
        actions={[
          {
            key: 'logout',
            label: '로그아웃',
            icon: assets.iconLogout,
            onClick: onLogout,
          },
          {
            key: 'provider-switch',
            label: isProviderApproved ? '제공자 전환' : '제공자 신청',
            icon: assets.iconSwitch1,
            iconClassName: 'size-[10px]',
            onClick: onRequestProviderSwitch,
          },
        ]}
        notifications={unreadNotifications}
        notificationsLoading={notificationsQuery.isLoading}
        onOpenNotifications={() => navigate('/user/notification')}
      />

      {/* 통계 카드 4개 — 모바일: 4행 1열 / 태블릿: 2×2 / 데스크톱: 1행 4열 */}
      <MyPageDashboardSummaryCards
        items={statCards}
        ariaLabel="일반회원 거래 요약"
      />

      {/* 알림 100% */}
      <NotificationPanel
        notifications={allNotifications}
        onItemClick={(section) => navigate(getMyPagePath(section))}
        onMore={() => navigate("/user/notification")}
      />
      {/* 채팅 + 리뷰 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <ActiveChatPanel
          rooms={activeChatRooms}
          onOpenChat={() => navigate(getMyPagePath("chat"))}
          onMore={() => navigate(getMyPagePath("chat"))}
        />
        {writableReviews.length > 0 && (
          <ReviewablePanel
            items={writableReviews}
            onWrite={(item) => navigate(`/user/mypage/reviews/write/${item.id}`, { state: { item } })}
            onMore={() => navigate(getMyPagePath("review"))}
          />
        )}
      </div>
    </div>
  );
}
