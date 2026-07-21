import { Link } from 'react-router-dom';
import { toImageUrl } from '@api/fileApi';
import { formatPrice } from '../utils/auctionFormatters';

const formatAuctionCardTimeLabel = (endDateTime, statusCode, statusName) => {
  if (statusCode !== 'AUCC0002') return statusName || '준비';
  if (!endDateTime) return '진행중';

  const end = new Date(endDateTime);
  const diffMs = end.getTime() - Date.now();
  if (diffMs <= 0) return '종료 임박';

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `종료까지 ${days}일 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  if (hours > 0) return `종료까지 ${hours}시간 ${minutes}분`;
  return `종료 임박 ${minutes}분`;
};

const AuctionCard = ({ item }) => {
  const imageUrl = toImageUrl(item.thumbnailPath);
  const remainingTime = formatAuctionCardTimeLabel(item.endDateTime, item.auctionStatusCode, item.auctionStatusName);
  const isEndingSoon = remainingTime.startsWith('종료 임박');

  return (
    <Link className="auction-card" to={`/auction/${item.auctionId}`}>
      <div className="auction-card-thumb">
        {imageUrl ? (
          <img src={imageUrl} alt={item.title} />
        ) : (
          <span>{item.categoryName || '경매'}</span>
        )}
      </div>
      <div className="auction-card-top">
        <strong>{item.title}</strong>
        <span>{item.categoryName}</span>
      </div>
      <div className="auction-card-price">{formatPrice(item.currentPrice)}</div>
      <div className="auction-card-seller">
        <span>{item.sellerName}</span>
        <span>{item.tradeMethodName}</span>
      </div>
      <div className="auction-card-meta">
        <span>입찰 {item.bidCount ?? 0}회</span>
        <strong className={isEndingSoon ? 'danger' : ''}>{remainingTime}</strong>
      </div>
    </Link>
  );
};

export default AuctionCard;
