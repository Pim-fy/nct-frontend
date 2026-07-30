import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getUserReviews } from '@api/reviewApi';
import { useMyPortfolios, useMyProviderProfile } from '@hooks/useProviderProfile';
import { useNotifications } from '@hooks/useNotification';
import { usePointBalance } from '@hooks/usePoint';
import { assets } from '@components/mypage/assets';
import MyPageContentHeader from "@components/mypage/MyPageContentHeader";

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
      <MyPageContentHeader title="MY 홈" />
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
        ))}
      </div>
    );
  }

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
