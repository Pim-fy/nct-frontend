import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getUserReviews } from '@api/reviewApi';
import { useMyPortfolios, useMyProviderProfile } from '@hooks/useProviderProfile';
import { useNotifications } from '@hooks/useNotification';
import { usePointBalance } from '@hooks/usePoint';
import { assets } from '@components/mypage/assets';

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

function StatCard({ color, icon, label, value, unit, meta, onMore }) {
  return (
    <div className="relative rounded-[10px] text-white p-3 md:mb-5 md:mt-5" style={{ backgroundColor: color }}>
      <button
        type="button"
        onClick={onMore ?? (() => toast({ icon: "info", title: "준비 중인 기능입니다." }))}
        className="absolute right-4 top-4 bg-transparent border-none cursor-pointer"
        aria-label={`${label} 더보기`}
      >
        <img src={assets.iconMoreWhite} alt="" className="size-[20px] object-contain" />
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

function TaskCard({ title, desc, action, onAction }) {
  return (
    <div className="rounded-[5px] border border-[#eaeaea] bg-[#f7f7f7] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-[15px] text-[#3a3a3a] truncate">{title}</p>
          <p className="text-[14px] leading-[18px] text-[#555] mt-1 line-clamp-2">{desc}</p>
        </div>
        <button
          type="button"
          onClick={onAction ?? (() => toast({ icon: "info", title: "준비 중인 기능입니다." }))}
          className="btn btn-ghost btn-sm shrink-0"
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
          className="bg-transparent border-none cursor-pointer"
          aria-label={`${title} 더보기`}
        >
          <img src={assets.iconMore} alt="" className="size-[20px] object-contain opacity-40" />
        </button>
      </div>
      <div className="divide-y divide-[#e5e5e5]">
        {items.map((item) => (
          <div key={item.title} className="flex items-center gap-4 p-5">
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

export default function MyPageProviderDashboard({ user, onLogout, onSwitchToGeneral }) {
// 담당자 7 · F-PROV-009: 일반/제공자 모드 전환 시 상단 구조가 흔들리지 않도록
// 일반 마이페이지와 같은 프로필·알림·요약 카드 레이아웃을 사용한다.
// 받은 서비스 리뷰는 기존 리뷰 조회 계약을 소비하고, 견적·서비스 현황은 조회 계약이 들어오면 연결한다.
export default function MyPageProviderDashboard({ user, onSwitchToGeneral, onOpenSection }) {
  const navigate = useNavigate();
  const profileQuery = useMyProviderProfile();
  const portfoliosQuery = useMyPortfolios();
  const notificationsQuery = useNotifications();
  const pointBalanceQuery = usePointBalance();

  const profile = profileQuery.data;
  const providerUserSn = Number(profile?.userSn);
  const receivedReviewsQuery = useQuery({
    queryKey: ['reviews', 'received', providerUserSn, 'service', 0, 3],
    queryFn: () => getUserReviews(providerUserSn, {
      dealType: 'service',
      page: 0,
      size: 3,
    }).then((response) => response?.data ?? response),
    enabled: Number.isSafeInteger(providerUserSn) && providerUserSn > 0,
  });
  const notifications = notificationsQuery.data ?? [];
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const latestNotification = unreadNotifications[0] ?? notifications[0];
  const pointBalance = pointBalanceQuery.data;
  const receivedReviews = receivedReviewsQuery.data?.content ?? [];
  const nickname = user?.nickname || '제공자';
  const availableArea = profile?.availableArea?.trim();
  const introduction = profile?.introduction?.trim();
  const openSection = (section) => onOpenSection?.(section);

  return (
    <main className="w-full space-y-5" aria-labelledby="provider-dashboard-title">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center lg:grid lg:grid-cols-4 lg:items-end lg:gap-3">
        <div className="flex shrink-0 items-center gap-3">
          <div className="size-16 shrink-0 overflow-hidden rounded-full bg-[#e6f0ff]">
            <img
              src={user?.profileImageUrl || user?.profileImage || assets.profile}
              alt=""
              className="size-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-[#2ecc71]" aria-hidden="true" />
              <h1 id="provider-dashboard-title" className="text-[16px] font-bold text-[#4e4e4e]">
                {nickname}님
              </h1>
            </div>
            {user?.email && <p className="mt-0.5 text-[14px] text-[#969696]">{user.email}</p>}
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={onLogout}
                className="btn btn-ghost btn-sm"
                onClick={() => openSection('profile')}
              >
                프로필 관리
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onSwitchToGeneral}>
                일반 모드 전환
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="ml-auto flex min-h-[45px] w-full items-center gap-2 overflow-hidden rounded-[25px] border border-[rgba(0,100,255,0.28)] bg-white px-4 text-left lg:col-span-3 lg:ml-0"
          onClick={() => navigate('/user/notification')}
        >
          {unreadNotifications.length > 0 && (
            <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#0064ff] text-[13px] font-bold text-white">
              {unreadNotifications.length > 99 ? '99+' : unreadNotifications.length}
            </span>
          )}
          <span className="mr-4 shrink-0 font-bold text-[#404040]">
            {unreadNotifications.length > 0 ? '안 읽은 알림' : '알림'}
          </span>
          <span className="min-w-0 truncate text-[14px] text-[#404040]">
            {notificationsQuery.isLoading
              ? '알림을 불러오는 중입니다.'
              : latestNotification?.title || '새 알림이 없습니다.'}
          </span>
          <span className="ml-auto text-3xl font-light leading-none text-[#8da2bd]" aria-hidden="true">+</span>
        </button>
      </section>

<<<<<<< HEAD
      {/* 통계 카드 4개 — 모바일: 4행 1열 / 태블릿: 2×2 / 데스크톱: 1행 4열 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ key, ...card }) => (
          <StatCard
            key={key}
            {...card}
            onMore={key === "settleable" ? () => navigate("/user/settlement") : undefined}
          />
=======
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4" aria-label="제공자 요약">
        <SummaryCard
          color="#776bf8"
          icon={assets.iconPoint}
          label="포인트 잔액"
          value={pointBalanceQuery.isLoading ? '…' : formatNumber(pointBalance?.total)}
          meta={pointBalanceQuery.isLoading
            ? '포인트를 불러오는 중입니다.'
            : `거래가능 ${formatNumber(pointBalance?.available)} · 홀딩 ${formatNumber(pointBalance?.hold)}`}
          onClick={() => openSection('wallet')}
        />
        <SummaryCard
          color="#0064ff"
          icon={assets.iconAction}
          label="견적 현황"
          value="—"
          meta="참여 중인 견적을 확인합니다."
          onClick={() => openSection('quote')}
        />
        <SummaryCard
          color="#005eb5"
          icon={assets.iconService}
          label="서비스 현황"
          value="—"
          meta="진행 중인 서비스를 확인합니다."
          onClick={() => openSection('service-trade')}
        />
        <SummaryCard
          color="#e63946"
          icon={assets.iconEnd2}
          label="완료 서비스"
          value="—"
          meta="완료된 서비스 내역을 확인합니다."
          onClick={() => openSection('service-trade')}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-label="제공자 프로필과 리뷰">
        <article className="rounded-2xl border border-[#e3e8f0] bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-[#1f2937]">내 제공자 프로필</h2>
            <button
              type="button"
              className="text-sm font-semibold text-[#0064ff] hover:underline"
              onClick={() => openSection('profile')}
            >
              수정하기
            </button>
          </div>

          {profileQuery.isLoading ? (
            <div className="mt-5 h-20 animate-pulse rounded-xl bg-[#f3f6fa]" aria-label="프로필 정보를 불러오는 중" />
          ) : profileQuery.isError ? (
            <p className="mt-5 rounded-xl bg-[#fff5f5] px-4 py-4 text-sm text-[#b42318]">
              프로필 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ProfileSummaryItem label="활동 지역" value={availableArea || '아직 등록되지 않았습니다.'} />
              <ProfileSummaryItem label="소개" value={introduction || '아직 등록되지 않았습니다.'} />
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4 border-t border-[#edf0f4] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#27364b]">포트폴리오</p>
              <p className="mt-1 text-sm text-[#6b7788]">
                {portfoliosQuery.isLoading
                  ? '등록한 포트폴리오를 확인하는 중입니다.'
                  : `등록 ${portfoliosQuery.data?.length ?? 0}건 · 대표 작업 이미지와 설명을 공개 프로필에 보여주세요.`}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg bg-[#0064ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0056d6]"
              onClick={() => openSection('profile')}
            >
              포트폴리오 관리
            </button>
          </div>
        </article>

        <article className="min-h-72 rounded-2xl border border-[#e3e8f0] bg-white p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#1f2937]">받은 리뷰</h2>
            {!receivedReviewsQuery.isLoading && !receivedReviewsQuery.isError && (
              <span className="text-sm font-semibold text-[#637085]">
                {receivedReviewsQuery.data?.totalCount ?? 0}건
              </span>
            )}
          </div>
          <ReceivedReviewContent
            isLoading={profileQuery.isLoading || receivedReviewsQuery.isLoading}
            isError={profileQuery.isError || receivedReviewsQuery.isError}
            reviews={receivedReviews}
            onRetry={() => {
              if (profileQuery.isError) {
                profileQuery.refetch();
              } else {
                receivedReviewsQuery.refetch();
              }
            }}
          />
        </article>
      </section>
    </main>
  );
}

function ReceivedReviewContent({ isLoading, isError, reviews, onRetry }) {
  if (isLoading) {
    return (
      <div className="mt-6 space-y-3 border-t border-dashed border-[#dce3ec] pt-5" aria-label="받은 리뷰를 불러오는 중">
        {[1, 2].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-xl bg-[#f3f6fa]" />
>>>>>>> develop
        ))}
      </div>
    );
  }

<<<<<<< HEAD
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
              <TaskCard
                key={`${task.title}-${i}`}
                {...task}
                onAction={task.action === "chat" ? () => navigate("/user/mypage?section=chat") : undefined}
              />
            ))}
          </div>
        )}
=======
  if (isError) {
    return (
      <div className="mt-6 border-t border-dashed border-[#dce3ec] pt-5">
        <p className="text-sm leading-6 text-[#b42318]">받은 리뷰를 불러오지 못했습니다.</p>
        <button
          type="button"
          className="mt-3 text-sm font-semibold text-[#0064ff] hover:underline"
          onClick={onRetry}
        >
          다시 불러오기
        </button>
>>>>>>> develop
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="mt-6 border-t border-dashed border-[#dce3ec] pt-5">
        <p className="text-sm leading-6 text-[#6b7788]">아직 받은 서비스 리뷰가 없습니다.</p>
      </div>
    );
  }

  return (
    <ul className="mt-5 divide-y divide-[#edf0f4] border-t border-dashed border-[#dce3ec]">
      {reviews.map((review) => (
        <li key={review.reviewId} className="py-4 first:pt-5">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-sm text-[#f59e0b]" aria-label={`평점 ${review.rating}점`}>
              ★ {review.rating}
            </strong>
            <span className="text-xs text-[#8a96a8]">{review.createdDate}</span>
          </div>
          {review.productTitle && (
            <p className="mt-2 truncate text-xs font-semibold text-[#637085]">
              {review.productTitle}
            </p>
          )}
          <p className="mt-1 break-words text-sm leading-6 text-[#27364b]">{review.content}</p>
          <p className="mt-2 text-xs text-[#8a96a8]">{review.reviewerName}</p>
        </li>
      ))}
    </ul>
  );
}

function ProfileSummaryItem({ label, value }) {
  return (
    <div className="rounded-xl border border-[#edf0f4] bg-[#fafbfc] px-4 py-4">
      <p className="text-xs font-semibold text-[#637085]">{label}</p>
      <p className="mt-2 break-words text-sm leading-6 text-[#27364b]">{value}</p>
    </div>
  );
}

function SummaryCard({ color, icon, label, value, meta, onClick }) {
  const cardAction = onClick ? (
    <button
      type="button"
      className="absolute right-4 top-4 bg-transparent text-3xl font-light leading-none text-white"
      onClick={onClick}
      aria-label={`${label} 상세 보기`}
    >
      +
    </button>
  ) : (
    <span className="absolute right-4 top-4 text-3xl font-light leading-none text-white" aria-hidden="true">+</span>
  );

  return (
    <article className="relative rounded-[10px] p-5 text-white md:mb-5 md:mt-5" style={{ backgroundColor: color }}>
      {cardAction}
      <div className="mb-3 flex items-start gap-3">
        <img src={icon} alt="" className="mt-0.5 size-10 shrink-0 object-contain" />
        <div className="min-w-0 pl-4 pr-6">
          <p className="text-[16px] font-bold leading-tight text-white/90">{label}</p>
          <p className="mt-0.5 text-[30px] font-bold leading-tight">{value}</p>
        </div>
      </div>
      <p className="truncate text-[16px] text-white/80">{meta}</p>
    </article>
  );
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString('ko-KR');
}
