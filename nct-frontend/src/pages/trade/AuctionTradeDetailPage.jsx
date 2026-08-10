// @ai_generated
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TradeDetailBuyer from '@pages/trade/TradeDetailBuyer';
import TradeDetailSeller from '@pages/trade/TradeDetailSeller';
import TradeReviewSection from '@components/trade/TradeReviewSection';
import TradeProgressSteps from '@components/trade/TradeProgressSteps';
import { useAuctionTrade } from '@hooks/useAuctionTrade';
import AsyncRouteError from '@components/common/AsyncRouteError';
import TradeDetailSkeleton from '@components/trade/TradeDetailSkeleton';

export default function AuctionTradeDetailPage() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const tradeQuery = useAuctionTrade(auctionId);
  // @ai_generated (담당자1, 2026-08-07): 진행바를 좌우 컬럼을 가로지르는 공용 행으로 올리기
  // 위해, 실제 단계 계산은 TradeDetailBuyer/Seller에 그대로 두고 결과값만 이 상태로 받는다.
  const [stepperConfig, setStepperConfig] = useState(null);

  if (tradeQuery.isLoading) {
    return <TradeDetailSkeleton />;
  }

  if (tradeQuery.isError) {
    return <AsyncRouteError error={tradeQuery.error} onRetry={() => tradeQuery.refetch()} />;
  }

  if (!tradeQuery.data?.tradeId) {
    return <AsyncRouteError error={{ status: 404 }} onRetry={() => tradeQuery.refetch()} />;
  }

  const trade = tradeQuery.data;
  const viewerRole = trade.viewerRole ?? trade.userRole;
  const DetailPage = viewerRole === 'SELLER' ? TradeDetailSeller : TradeDetailBuyer;
  const backSection = viewerRole === 'SELLER' ? 'auction-sales' : 'auction-bids';
  const handleBack = () => navigate(`/user/mypage?section=${backSection}`);

  return (
    <div className="container auction-trade-detail-shell">
      {/* @ai_generated (담당자1, 2026-08-07): 제목·뒤로가기를 좌측 컬럼(TradeDetailHeader) 밖으로
          꺼내 두 컬럼 전체 폭을 쓰는 공용 타이틀 행으로 만들었다 - 그래야 그 아래 좌측(진행바+카드
          그리드)과 우측(거래 리뷰)이 같은 높이에서 시작한다. grid-column:1/-1로 두 컬럼을 모두
          차지한다(trade-detail.css의 .auction-trade-detail-shell__title-row). */}
      <div className="trade-detail-page__header auction-trade-detail-shell__title-row">
        <div>
          <h1>거래 상세</h1>
        </div>
        <button className="btn btn-ghost" type="button" onClick={handleBack}>
          ← 목록으로
        </button>
      </div>

      {/* @ai_generated (담당자1, 2026-08-07): 진행바도 제목처럼 두 컬럼을 가로지르는 공용 행으로
          올렸다 - "진행바가 거래 리뷰 위까지 걸쳐 있는" 게 자연스럽다는 판단. 값은
          TradeDetailBuyer/Seller가 onStepperChange로 보고한다(계산 로직 중복 방지). 첫 렌더
          직후(값이 아직 없을 때)는 아무것도 안 그린다. */}
      {stepperConfig && (
        <TradeProgressSteps
          steps={stepperConfig.steps}
          activeIndex={stepperConfig.activeIndex}
          ariaLabel={stepperConfig.ariaLabel}
        />
      )}

      {/* @ai_generated (담당자1, 2026-08-07): 이미 조회한 상세를 initialTrade로 주입해
          TradeDetailBuyer/Seller가 같은 상세를 다시 GET하지 않게 한다(3중 API 호출 제거).
          trade.tradeId를 key로 둬 다른 거래로 바뀌면 내부 상태를 새로 초기화한다.
          제목·뒤로가기·진행바가 위 공용 행으로 옮겨갔으니 embedded일 때는 자체 헤더·진행바를
          렌더링하지 않는다(onBack 미전달 + onStepperChange로 값만 보고). */}
      {/* @ai_generated (담당자1, 2026-08-07): auctionId를 넘겨야 완료 확인/발송 인증/일정 저장
          성공 후 이 컴포넌트가 부모(useAuctionTrade) 캐시를 무효화할 수 있다 - 안 넘기면 재조회를
          멈춘 대가로 완료 문구·리뷰 버튼이 새로고침 전까지 갱신되지 않는다. */}
      {/* 거래 리뷰 카드를 다른 카드들과 같은 3열 그리드 폭으로 맞추기 위해 reviewSlot으로
          trade-detail-grid 안에 그리게 한다(UNAVAILABLE 문구 분기용 완료 여부는 TRDC0006 = 완료). */}
      <DetailPage
        key={trade.tradeId}
        embedded
        tradeId={trade.tradeId}
        initialTrade={trade}
        auctionId={auctionId}
        onStepperChange={setStepperConfig}
        reviewSlot={(
          <TradeReviewSection
            tradeId={trade.tradeId}
            isTradeCompleted={trade.tradeStatus === 'TRDC0006'}
          />
        )}
      />
    </div>
  );
}
