// src/components/mypage/MyPageDashboard.jsx
// Figma: mypage_01일반(node 18:2) CONTENTS 구간("MY 홈" 탭).
// - 절대좌표 → 반응형 전환. 통계카드 2x2→4열, 목록패널 1열→2열 그리드.
// TODO: 포인트(F-PNT)/경매(F-AUC)/서비스거래(F-SVC)/관심상품(F-WISH) API가 준비되면
//       STAT_CARDS/TODAY_ITEMS/WISH_ITEMS를 각 도메인 조회 결과로 교체한다.
import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMyFavoriteAuctions } from "@api/auctionApi";
import { getMyBidHistory } from "@api/bidApi";
import { getMyServiceRequests } from "@api/serviceRequestApi";
import { getMyQuotes } from "@api/quoteApi";
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

const WISH_TABS = [
  { label: "전체",     section: "wishlist" },
  { label: "거래",     section: "wishlist" },
  { label: "서비스요청", section: "wishlist" },
  { label: "입찰",     section: "wishlist" },
];

const NOTIF_TABS = ["전체", "경매·거래", "서비스", "운영·기타"];

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



function StatCard({ color, icon, label, value, unit, meta, onMore }) {
  return (
    <div className="relative rounded-[10px] text-white p-5 md:mb-5 md:mt-5" style={{ backgroundColor: color }}>
      {onMore && (
        <button
          type="button"
          onClick={onMore}
          className="absolute right-4 top-4 bg-transparent border-none cursor-pointer"
          aria-label={`${label} 더보기`}
        >
          <img src={assets.iconMoreWhite} alt="" className="size-[20px] object-contain" />
        </button>
      )}
      <div className="flex items-start gap-3 mb-3">
        <img src={icon} alt="" className="size-[40px] object-contain shrink-0 mt-0.5" />
        <div className="min-w-0 pr-6 pl-4">
          <p className="font-bold text-[16px] opacity-90 leading-tight">{label}</p>
          <p className="font-bold text-[30px] leading-tight mt-0.5">{value}{unit}</p>
        </div>
      </div>
      {typeof meta === 'string' ? (
        <p className="text-[16px] opacity-80 truncate">{meta}</p>
      ) : (
        <div className="text-[16px]">{meta}</div>
      )}
    </div>
  );
}

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
              className="border border-[rgba(0,0,0,0.08)] rounded-[10px] bg-white p-4 cursor-pointer hover:border-[rgba(0,100,255,0.3)] transition-colors"
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

  const filtered = notifications.filter((n) => {
    if (activeIdx === 1) return n.domainCd === "NTFC0010" || n.domainCd === "NTFC0011";
    if (activeIdx === 2) return n.domainCd === "NTFC0012";
    if (activeIdx === 3) return n.domainCd === "NTFC0013" || n.domainCd === "NTFC0014";
    return true;
  });

  return (
    <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-[#e4e9f2] overflow-hidden">
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
      <div className="px-5 pb-5 min-h-[122px]">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-[15px] text-[#969696] m-0">알림이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4">
            {filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => onItemClick?.(DOMAIN_TO_SECTION[n.domainCd] ?? "home")}
                className="flex items-center gap-3 py-3.5 cursor-pointer hover:opacity-70 transition-opacity border-b border-[#e8e9ec]"
              >
                <span className={`badge ${DOMAIN_BADGE[n.domainCd] ?? "badge-gray"} shrink-0`} style={{ borderRadius: 5, fontSize: 12 }}>
                  {n.type}
                </span>
                <p className="flex-1 min-w-0 text-[15px] text-[#1a1a1a] m-0 leading-snug truncate">{n.title}</p>
                <span className="text-[13px] text-[#b0aea8] shrink-0 ml-2">{relativeTime(n.regDt)}</span>
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
    <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-[#e4e9f2] overflow-hidden">
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
    <div className="bg-white rounded-[20px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-[#e4e9f2] overflow-hidden">
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
  onOpenAuctionBids,
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
      ? `현재가 ${Number(item.currentPrice).toLocaleString()}원`
      : "현재가 -",
    section: "active-auctions",
  }));

  const nav = (section) => () => navigate(`/user/mypage?section=${section}`);

  // ── 실데이터 조회 ──────────────────────────────────────────────────────────

  // 포인트 잔액
  const { data: pointBalance } = usePointBalance({ enabled: !!user });

  // 알림 목록 — MY홈 패널에는 안읽은 것만 표시
  const { data: allNotifications = [] } = useNotifications({ enabled: !!user });
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

  // 서비스 요청 전체 건수 (구매자 입찰)
  const { data: svcReqAll } = useQuery({
    queryKey: ["serviceRequests", "me", "total"],
    queryFn: () => getMyServiceRequests(1, 1),
    select: (res) => res.data,
    enabled: !!user,
  });
  const svcBidCnt = svcReqAll?.totalCount ?? 0;

  // 서비스 요청 완료 건수
  const { data: svcReqClosed } = useQuery({
    queryKey: ["serviceRequests", "me", "closed"],
    queryFn: () => getMyServiceRequests(1, 1, "CLOSED"),
    select: (res) => res.data,
    enabled: !!user,
  });
  const svcClosedCnt = svcReqClosed?.totalCount ?? 0;

  // 견적 목록 건수 (제공자 판매)
  const { data: quotePage } = useQuery({
    queryKey: ["quotes", "my", { page: 1, size: 1 }],
    queryFn: () => getMyQuotes({ page: 1, size: 1 }),
    select: (res) => res.data,
    enabled: !!user,
  });
  const svcSaleCnt = quotePage?.totalCount ?? 0;

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
      color: "#0064ff",
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
      color: "#005eb5",
      icon: assets.iconService,
      label: "서비스 거래",
      value: String(svcBidCnt + svcSaleCnt),
      unit: "건",
      meta: (
        <span className="flex items-center gap-x-2">
          <button type="button" onClick={nav("service-bids")}  className={subBtn}>입찰 {svcBidCnt}건</button>
          <span className="text-white/70">ㅣ</span>
          <button type="button" onClick={nav("service-sales")} className={subBtn}>판매 {svcSaleCnt}건</button>
        </span>
      ),
      onMore: nav("service-bids"),
    },
    {
      key: "done",
      color: "#e63946",
      icon: assets.iconEnd2,
      label: "거래 완료",
      value: String(wonCnt + svcClosedCnt),
      unit: "건",
      meta: (
        <span className="flex items-center gap-x-2">
          <button type="button" onClick={nav("auction-bids")}  className={subBtn}>경매 {wonCnt}건</button>
          <span className="text-white/70">ㅣ</span>
          <button type="button" onClick={nav("service-sales")} className={subBtn}>서비스 {svcClosedCnt}건</button>
        </span>
      ),
      onMore: undefined,
    },
  ];

  return (
    <div className="space-y-5">
      <MyPageContentHeader title="MY 홈" />

      {/* 프로필 헤더 + 알림 배너 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:grid lg:grid-cols-4 lg:gap-3 lg:items-end">
        <div className="flex items-center gap-3 shrink-0">
          <div className="size-[64px] rounded-full overflow-hidden bg-[#e6f0ff] shrink-0">
            {(profileQuery.data?.profileImageUrl || user?.profileImageUrl) ? (
              <img src={profileQuery.data?.profileImageUrl || user.profileImageUrl} alt="" className="size-full object-cover" />
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
                onClick={onLogout}
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
                {isProviderApproved ? '제공자 전환' : '제공자 신청'}
              </button>
            </div>
          </div>
        </div>

        {/* 안읽은 알림 배너 */}
        <div className="ml-auto w-full md:w-[600px] md:flex-none lg:col-span-3 lg:ml-0 lg:w-full min-h-[45px] rounded-[25px] border border-[rgba(0,100,255,0.28)] bg-white flex items-center px-4 gap-2 overflow-hidden">
          <span className="flex items-center justify-center size-[18px] rounded-full bg-[#0064ff] text-white text-[13px] font-bold shrink-0">
            {unreadNotifications.length}
          </span>
          <span className="font-bold text-[#404040] shrink-0 mr-4">안읽은 알림</span>
          <div className="flex-1 min-w-0 hidden sm:flex items-center gap-3 overflow-hidden">
            {unreadNotifications.length === 0 ? (
              <span className="text-[14px] text-[#969696]">새 알림이 없습니다.</span>
            ) : (
              unreadNotifications.slice(0, 5).map((n) => (
                <span key={n.id} className="text-[14px] text-[#404040] flex items-center gap-1 shrink-0 truncate">
                  <span className="text-[7px]">▶</span>
                  {n.title}
                </span>
              ))
            )}
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

      {/* 알림 100% */}
      <NotificationPanel
        notifications={unreadNotifications}
        onItemClick={(section) => navigate(`/user/mypage?section=${section}`)}
        onMore={() => navigate("/user/notification")}
      />
      {/* 채팅 + 리뷰 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <ActiveChatPanel
          rooms={activeChatRooms}
          onOpenChat={() => navigate("/user/mypage?section=chat")}
          onMore={() => navigate("/user/mypage?section=chat")}
        />
        {writableReviews.length > 0 && (
          <ReviewablePanel
            items={writableReviews}
            onWrite={(item) => navigate(`/user/reviews/write/${item.id}`, { state: { item } })}
            onMore={() => navigate("/user/mypage?section=review")}
          />
        )}
      </div>
    </div>
  );
}
