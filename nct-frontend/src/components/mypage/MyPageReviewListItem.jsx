import MyPageListItem from '@components/mypage/MyPageListItem';
import MyPageListPriceActions from '@components/mypage/MyPageListPriceActions';
import MyPageStatusBadge from '@components/mypage/MyPageStatusBadge';
import StarRatingDisplay from '@components/review/StarRatingDisplay';
import { formatDate } from '@utils/common';

const REVIEW_TYPE_META = {
  goods: { label: '물건거래', badgeClass: 'badge-primary' },
  service: { label: '서비스', badgeClass: 'badge-teal' },
};

export default function MyPageReviewListItem({
  variant,
  thumbnail,
  title,
  dealType = 'goods',
  partyLabel = '판매자',
  partyName,
  completedDate,
  rating,
  content,
  actionLabel = '리뷰 등록',
  onAction,
  onEdit,
  onDelete,
  onViewTarget,
}) {
  const typeMeta = REVIEW_TYPE_META[dealType] ?? REVIEW_TYPE_META.goods;
  const isWritten = variant === 'written';

  return (
    <MyPageListItem
      imageSrc={thumbnail}
      imageAlt={title}
      imageFallback="리뷰 이미지"
      onImageClick={onViewTarget}
      badge={<MyPageStatusBadge className={typeMeta.badgeClass}>{typeMeta.label}</MyPageStatusBadge>}
      title={(
        <button
          type="button"
          onClick={onViewTarget}
          className="w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left text-inherit hover:underline"
        >
          {title}
        </button>
      )}
      actions={(
        <MyPageListPriceActions topLine={`거래 완료일 ${formatDate(completedDate)}`}>
          {isWritten ? (
            <>
              <button type="button" onClick={onEdit} className="btn btn-outline">수정</button>
              <button type="button" onClick={onDelete} className="btn btn-danger">삭제</button>
            </>
          ) : (
            <button type="button" onClick={onAction} className="btn btn-primary">{actionLabel}</button>
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
        <p><strong>{partyLabel}</strong> {partyName || '-'}</p>
      )}
    </MyPageListItem>
  );
}
