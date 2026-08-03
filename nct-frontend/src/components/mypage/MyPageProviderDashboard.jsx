import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getUserReviews } from '@api/reviewApi';
import { useMyProviderProfile } from '@hooks/useProviderProfile';
import { useNotifications } from '@hooks/useNotification';
import { usePointBalance } from '@hooks/usePoint';
import { useMyQuotes } from '@hooks/useQuote';
import { assets } from '@components/mypage/assets';
import MyPageContentHeader from "@components/mypage/MyPageContentHeader";
import {
  MyPageDashboardSummaryCards,
  MyPageDashboardTop,
} from '@components/mypage/MyPageDashboardCommon';
import ProviderApprovedCategorySection from '@components/mypage/ProviderApprovedCategorySection';

export default function MyPageProviderDashboard({ user, onSwitchToGeneral, onOpenSection }) {
  const navigate = useNavigate();
  const profileQuery = useMyProviderProfile();
  const notificationsQuery = useNotifications();
  const pointBalanceQuery = usePointBalance();
  const quotesQuery = useMyQuotes({ page: 1, size: 1 });

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
  const pointBalance = pointBalanceQuery.data;
  const receivedReviews = receivedReviewsQuery.data?.content ?? [];
  const nickname = user?.nickname || '제공자';
  const openSection = (section) => onOpenSection?.(section);

  return (
    <div className="space-y-5">
      <MyPageContentHeader title="MY 홈" />
      <MyPageDashboardTop
        profileImageUrl={user?.profileImageUrl || user?.profileImage}
        nickname={nickname}
        email={user?.email || ''}
        actions={[
          {
            key: 'profile',
            label: '프로필 관리',
            onClick: () => openSection('profile'),
          },
          {
            key: 'general-switch',
            label: '일반 모드 전환',
            icon: assets.iconSwitch1,
            iconClassName: 'size-[10px]',
            onClick: onSwitchToGeneral,
          },
        ]}
        notifications={unreadNotifications}
        notificationsLoading={notificationsQuery.isLoading}
        onOpenNotifications={() => navigate('/user/notification')}
      />

      <MyPageDashboardSummaryCards
        ariaLabel="제공자 요약"
        items={[
          {
            key: 'point',
            color: '#776bf8',
            icon: assets.iconPoint,
            label: '포인트 잔액',
            value: pointBalanceQuery.isLoading ? '…' : formatNumber(pointBalance?.total),
            meta: pointBalanceQuery.isLoading
              ? '포인트를 불러오는 중입니다.'
              : `거래가능 ${formatNumber(pointBalance?.available)} · 홀딩 ${formatNumber(pointBalance?.hold)}`,
            onMore: () => openSection('wallet'),
          },
          {
            key: 'quote',
            color: '#0064ff',
            icon: assets.iconAction,
            label: '견적 현황',
            value: quotesQuery.isLoading
              ? '…'
              : quotesQuery.isError
                ? '—'
                : `${formatNumber(quotesQuery.data?.totalCount)}건`,
            meta: quotesQuery.isError
              ? '견적 현황을 불러오지 못했습니다.'
              : '제출한 견적 목록을 확인합니다.',
            onMore: () => openSection('quote'),
          },
          {
            key: 'service',
            color: '#005eb5',
            icon: assets.iconService,
            label: '서비스 현황',
            value: '—',
            meta: '진행 중인 서비스를 확인합니다.',
            onMore: () => openSection('service-trade'),
          },
          {
            key: 'done',
            color: '#e63946',
            icon: assets.iconEnd2,
            label: '완료 서비스',
            value: '—',
            meta: '완료된 서비스 내역을 확인합니다.',
            onMore: () => openSection('service-trade'),
          },
        ]}
      />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-3" aria-label="서비스 분야 권한과 리뷰">
        <ProviderApprovedCategorySection />

        <article className="min-h-72 rounded-[15px] border border-[#e3e8f0] bg-white p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#1f2937]">받은 리뷰</h2>
            {!receivedReviewsQuery.isLoading && !receivedReviewsQuery.isError && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#637085]">
                  {receivedReviewsQuery.data?.totalCount ?? 0}건
                </span>
                {(receivedReviewsQuery.data?.totalCount ?? 0) > 0 && (
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#0064ff] hover:underline"
                    onClick={() => openSection('received-review')}
                  >
                    전체보기
                  </button>
                )}
              </div>
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
    </div>
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

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString('ko-KR');
}
