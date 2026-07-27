import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
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
  const returnPath = `${location.pathname}${location.search}${location.hash}`;

  return (
    <Link
      className="flex min-h-[410px] flex-col overflow-hidden rounded-lg border border-[#f0efec] bg-white p-5 text-inherit no-underline shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)] transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.1)] max-md:min-h-0"
      to={`/auction/${item.auctionId}`}
      state={{ from: returnPath }}
    >
      <div className="flex h-[210px] items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(135deg,#e8f0fe,#f8f8f6)] text-[#5f5e5a]">
        {imageUrl ? (
          <img className="block size-full object-cover" src={imageUrl} alt={item.title} />
        ) : (
          <span className="inline-flex size-24 items-center justify-center rounded-full bg-white/60 text-[15px] font-extrabold">
            {item.categoryName || '경매'}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <strong className="min-w-0 overflow-hidden text-base leading-[1.35] font-bold text-[#1a1a18] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
          {item.title}
        </strong>
        <span className="shrink-0 rounded-lg bg-[#f0f0ee] px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-[#5f5e5a]">
          {item.categoryName}
        </span>
      </div>
      <div className="mt-2 text-xl font-extrabold text-primary-dark">
        {formatPrice(item.currentPrice)}
      </div>
      <div className="mt-1 mb-3.5 flex items-center gap-2.5 text-[13px] text-[#5f5e5a]">
        <span>{item.sellerName}</span>
        <span>{item.tradeMethodName}</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#f0efec] pt-3.5 max-md:flex-col max-md:items-start">
        <span className="text-[13px] font-semibold text-[#5f5e5a]">
          입찰 {item.bidCount ?? 0}회
        </span>
        <strong
          className={`inline-flex min-h-9 w-44 max-w-full items-center justify-center rounded-lg border px-3 text-center text-sm leading-none font-bold whitespace-nowrap tabular-nums ${
            isTimeExpired
              ? 'border-[#d8d8d8] bg-[#f1f1f1] text-[#7a7a7a]'
              : 'border-[#c9ddff] bg-primary-light text-primary-dark'
          }`}
        >
          {remainingTime}
        </strong>
      </div>
    </Link>
  );
};

export default AuctionCard;
