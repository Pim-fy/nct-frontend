import {
  useEffect,
  useState,
} from 'react';
import {
  getUserReviews,
  getUserReviewTrust,
} from '@api/reviewApi';
import { Skeleton } from '@components/skeleton/BaseSkeleton';

const unwrapData = (response) => response?.data ?? response;

const formatScore = (score) => {
  const numericScore = Number(score);

  return Number.isFinite(numericScore)
    ? numericScore.toFixed(1)
    : '-';
};

/**
 * 거래 상대방의 물건 거래 신뢰지표와 최근 리뷰를 함께 표시한다.
 * 리뷰 목록이 없거나 API가 아직 배포되지 않은 경우에도 거래 상세 자체는 계속 볼 수 있어야 한다.
 */
const TradeTrustSummary = ({ counterpartUserId }) => {
  const [trust, setTrust] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!counterpartUserId) {
      setTrust(null);
      setReviews([]);
      return undefined;
    }

    let isActive = true;

    const loadTrustSummary = async () => {
      setIsLoading(true);
      setLoadError(false);

      try {
        const [trustResponse, reviewResponse] = await Promise.all([
          getUserReviewTrust(counterpartUserId),
          getUserReviews(counterpartUserId, {
            dealType: 'goods',
            page: 0,
            size: 3,
          }),
        ]);

        if (!isActive) {
          return;
        }

        const trustData = unwrapData(trustResponse);
        const reviewData = unwrapData(reviewResponse);

        setTrust(trustData);
        setReviews(reviewData?.content ?? []);
      } catch {
        if (isActive) {
          setLoadError(true);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadTrustSummary();

    return () => {
      isActive = false;
    };
  }, [counterpartUserId]);

  if (!counterpartUserId) {
    return (
      <div className="trade-trust">
        실제 거래 상대방 정보가 준비되면 리뷰와 신뢰지표를 표시합니다.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="trade-trust">
        <Skeleton height={20} style={{ marginBottom: 10, maxWidth: 220 }} />
        <Skeleton count={2} height={54} style={{ marginBottom: 8 }} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="trade-trust">
        리뷰와 신뢰지표를 지금 불러오지 못했습니다.
      </div>
    );
  }

  if (!trust?.hasReviews) {
    return <div className="trade-trust">아직 작성된 거래 리뷰가 없습니다.</div>;
  }

  return (
    <div className="trade-trust">
      <p className="trade-trust__score">
        거래 평점 <strong>★ {formatScore(trust.totalScore)}</strong>
        <span>리뷰 {trust.totalCount ?? 0}개</span>
      </p>
      {reviews.length > 0 && (
        <ul className="trade-trust__reviews">
          {reviews.map((review) => (
            <li key={review.reviewId}>
              <span>★ {review.rating}</span>
              <p>{review.content}</p>
              <small>{review.reviewerName} · {review.createdDate}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TradeTrustSummary;
