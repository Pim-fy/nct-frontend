import MyPageListItem from '@components/mypage/MyPageListItem';
import MyPageListPriceActions from '@components/mypage/MyPageListPriceActions';
import MyPageStatusBadge from '@components/mypage/MyPageStatusBadge';
import StarRatingDisplay from '@components/review/StarRatingDisplay';
import { formatDate } from '@utils/common';

const REVIEW_TYPE_META = {
  goods: { label: '물건거래', badgeClass: 'badge-primary' },
  service: { label: '서비스', badgeClass: 'badge-teal' },
};

const isReviewExpired = (reviewDeadline) => {
  if (!reviewDeadline) return false;
  return new Date(reviewDeadline) < new Date(new Date().toDateString());
};

export default function MyPageReviewListItem({
  variant,
  thumbnail,
  title,
  dealType = 'goods',
  partyLabel = '판매자',
  partyName,
  completedDate,
  reviewDeadline,
  rating,
  content,
  onViewTarget,
}) {
  const typeMeta = REVIEW_TYPE_META[dealType] ?? REVIEW_TYPE_META.goods;
  const isWritten = variant === 'written';
  const expired = !isWritten && isReviewExpired(reviewDeadline);

  const dday = (() => {
    if (isWritten || !reviewDeadline || expired) return null;
    const today = new Date(new Date().toDateString());
    const deadline = new Date(reviewDeadline);
    const diff = Math.round((deadline - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'D-Day';
    if (diff > 0) return `D-${diff}`;
    return null;
  })();

  const deadlineText = (() => {
    if (isWritten || !reviewDeadline) return `거래 완료일 ${formatDate(completedDate)}`;
    if (expired) return `리뷰 작성 가능 기간이 만료되었습니다`;
    return `${formatDate(reviewDeadline)}까지 작성 가능`;
  })();

  return (
    <MyPageListItem
      imageSrc={thumbnail}
      imageAlt={title}
      imageFallback="리뷰 이미지"
      badge={<MyPageStatusBadge className={typeMeta.badgeClass}>{typeMeta.label}</MyPageStatusBadge>}
      title={title}
      actions={(
        <MyPageListPriceActions topLine={deadlineText} topLineClassName={expired ? 'text-[#e63946]' : undefined}>
          {expired ? (
            <span className="badge badge-danger" style={{ height: 38, fontSize: 14, display: 'inline-flex', alignItems: 'center', padding: '0 16px', borderRadius: 8 }}>
              기간 만료
            </span>
          ) : (
            <button type="button" onClick={onViewTarget} className="btn btn-primary">상세보기</button>
          )}
        </MyPageListPriceActions>
      )}
    >
      {isWritten ? (
        <div className="flex min-w-0 items-center gap-3">
          <StarRatingDisplay rating={rating} size={17} />
          <p className="truncate">{content}</p>
        </div>
      ) : (
        <p className="flex items-center gap-2">
        <span><strong>{partyLabel}</strong> {partyName || '-'}</span>
        {dday && (
          <span className={`badge ${dday === 'D-Day' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 12 }}>
            리뷰작성기간 {dday}
          </span>
        )}
      </p>
      )}
    </MyPageListItem>
  );
}
