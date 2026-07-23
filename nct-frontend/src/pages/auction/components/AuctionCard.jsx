import { Link } from 'react-router-dom';
import { toImageUrl } from '@api/fileApi';
import useCountdown from '@hooks/useCountdown';
import { formatPrice, resolveAuctionResultLabel } from '../utils/auctionFormatters';

const formatAuctionCardTimeLabel = (item, now) => {
  const resultLabel = resolveAuctionResultLabel(item);
  if (resultLabel) return resultLabel;
  if (!item.endDateTime) return '남은 시간 -';

  const end = new Date(item.endDateTime);
  const diffMs = Math.max(end.getTime() - now, 0);

  const totalMinutes = Math.ceil(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `남은 시간 ${days}일 ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  if (hours > 0) return `남은 시간 ${hours}시간 ${minutes}분`;
  return `남은 시간 ${totalMinutes}분`;
};

const AuctionCard = ({ item }) => {
  const isCountingDown = Boolean(
    item.endDateTime && item.auctionStatusCode === 'AUCC0002',
  );
  const now = useCountdown(isCountingDown);
  const imageUrl = toImageUrl(item.thumbnailPath);
  const auctionResultLabel = resolveAuctionResultLabel(item);
  const remainingTime = formatAuctionCardTimeLabel(item, now);
  const isTimeExpired = item.auctionStatusCode !== 'AUCC0002'
    || !item.endDateTime
    || new Date(item.endDateTime).getTime() <= now
    || Boolean(auctionResultLabel);

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
        <strong className={isTimeExpired ? 'ended' : ''}>{remainingTime}</strong>
      </div>
    </Link>
  );
};

export default AuctionCard;
