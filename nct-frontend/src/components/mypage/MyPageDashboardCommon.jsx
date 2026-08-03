// 담당자 7: 일반·제공자 마이페이지 홈의 상단 프로필, 알림 바, 요약 카드 규격을 공유한다.
// 화면별 데이터와 버튼 동작만 props로 받고 레이아웃과 스타일은 이 파일에서 한 번만 관리한다.
import { assets } from '@components/mypage/assets';

export function MyPageDashboardTop({
  profileImageUrl,
  nickname,
  email,
  actions = [],
  notifications = [],
  notificationsLoading = false,
  onOpenNotifications,
}) {
  const notificationCount = notifications.length > 99 ? '99+' : notifications.length;

  return (
    <section
      className="flex flex-col gap-4 sm:flex-row sm:items-center lg:grid lg:grid-cols-4 lg:items-end lg:gap-3"
      aria-label="마이페이지 회원 요약"
    >
      <div className="flex shrink-0 items-center gap-5">
        <div className="size-[72px] shrink-0 overflow-hidden rounded-full bg-[#e6f0ff]">
          <img
            src={profileImageUrl || assets.profile}
            alt=""
            className="size-full object-cover"
          />
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-[16px] font-bold text-[#4e4e4e]">
            <span className="inline-block size-2 rounded-full bg-[#2ecc71]" aria-hidden="true" />
            {nickname}님
          </p>
          <p className="mt-0.5 min-h-5 text-[14px] text-[#969696]">{email}</p>
          <div className="mt-2 flex gap-2">
            {actions.map((action) => (
              <button
                key={action.key}
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={action.onClick}
              >
                {action.icon && (
                  <img
                    src={action.icon}
                    alt=""
                    className={action.iconClassName || 'size-3'}
                  />
                )}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ml-auto flex min-h-[45px] w-full items-center gap-2 overflow-hidden rounded-[25px] border border-[rgba(0,100,255,0.28)] bg-white px-4 md:w-[600px] md:flex-none lg:col-span-3 lg:ml-0 lg:w-full">
        <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-[#0064ff] text-[13px] font-bold text-white">
          {notificationCount}
        </span>
        <span className="mr-4 shrink-0 font-bold text-[#404040]">안읽은 알림</span>
        <div className="hidden min-w-0 flex-1 items-center gap-3 overflow-hidden sm:flex">
          {notificationsLoading ? (
            <span className="text-[14px] text-[#969696]">알림을 불러오는 중입니다.</span>
          ) : notifications.length === 0 ? (
            <span className="text-[14px] text-[#969696]">새 알림이 없습니다.</span>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <span
                key={notification.id}
                className="flex shrink-0 items-center gap-1 truncate text-[14px] text-[#404040]"
              >
                <span className="text-[7px]">▶</span>
                {notification.title}
              </span>
            ))
          )}
        </div>
        <button
          type="button"
          className="ml-auto shrink-0 cursor-pointer border-none bg-transparent"
          onClick={onOpenNotifications}
          aria-label="알림 전체 보기"
        >
          <img src={assets.iconMore} alt="" className="size-[14px] object-contain opacity-40" />
        </button>
      </div>
    </section>
  );
}

export function MyPageDashboardSummaryCards({ items, ariaLabel }) {
  return (
    <section
      className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4"
      aria-label={ariaLabel}
    >
      {items.map(({ key, ...item }) => (
        <MyPageDashboardSummaryCard key={key} {...item} />
      ))}
    </section>
  );
}

function MyPageDashboardSummaryCard({
  color,
  icon,
  label,
  value,
  unit,
  meta,
  onMore,
}) {
  return (
    <article
      className="relative flex h-[150px] flex-col justify-center rounded-[15px] p-5 text-white md:mb-5 md:mt-5"
      style={{ backgroundColor: color }}
    >
      {onMore && (
        <button
          type="button"
          className="absolute right-4 top-4 cursor-pointer border-none bg-transparent"
          onClick={onMore}
          aria-label={`${label} 상세 보기`}
        >
          <img src={assets.iconMoreWhite} alt="" className="size-5 object-contain" />
        </button>
      )}
      <div className="mb-3 flex items-start gap-3">
        <img src={icon} alt="" className="mt-0.5 size-10 shrink-0 object-contain" />
        <div className="min-w-0 pl-4 pr-6">
          <p className="text-[16px] font-bold leading-tight opacity-90">{label}</p>
          <p className="mt-0.5 text-[30px] font-bold leading-tight">{value}{unit}</p>
        </div>
      </div>
      {typeof meta === 'string' ? (
        <p className="truncate text-[16px] opacity-80">{meta}</p>
      ) : (
        <div className="text-[16px]">{meta}</div>
      )}
    </article>
  );
}
