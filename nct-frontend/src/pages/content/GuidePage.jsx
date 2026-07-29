import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import {
  ContentPageShell,
  GuideJourneyOverview,
} from '@components/content/ContentUi';
import { GUIDE_FLOWS, GUIDE_JOURNEYS } from './guideData';

/** F-COM-014: 방문자도 볼 수 있는 정적 이용가이드 화면입니다. */
const GuidePage = () => {
  const [searchParams] = useSearchParams();
  const requestedFlowId = searchParams.get('flow');
  const highlightedFlowId = GUIDE_FLOWS.some((guide) => guide.id === requestedFlowId)
    ? requestedFlowId
    : null;

  return (
    <ContentPageShell>
      <Helmet><title>이용가이드 | 에누리컷</title></Helmet>
      <header className="guide-hero">
        <div className="guide-hero__copy">
          <span>START GUIDE</span>
          <h1>처음이어도 흐름만 알면 어렵지 않아요</h1>
          <p>경매와 서비스 요청이 시작되고 거래가 완료되기까지의 과정을 한눈에 확인하세요.</p>
        </div>
        <div className="guide-hero__tags" aria-label="이용가이드 주요 내용">
          <span>경매 거래</span>
          <span>서비스 요청</span>
          <span>안전한 포인트 거래</span>
        </div>
      </header>

      <GuideJourneyOverview
        guides={GUIDE_FLOWS}
        highlightedFlowId={highlightedFlowId}
        journeys={GUIDE_JOURNEYS}
      />

      <p className="guide-example-note">
        화면 예시는 이용 흐름을 설명하기 위한 가상 데이터이며 실제 회원·거래 정보와 무관합니다.
      </p>
    </ContentPageShell>
  );
};

export default GuidePage;
