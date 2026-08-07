import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import {
  ContentPageShell,
  GuideJourneyOverview,
} from '@components/content/ContentUi';
import { GUIDE_FLOWS, GUIDE_JOURNEYS } from './guideData';

/** 담당자 7, F-COM-014: 실제 이용 흐름과 단계별 화면 예시를 제공하는 정적 이용가이드입니다. */
const GuidePage = () => {
  const [searchParams] = useSearchParams();
  const requestedFlowId = searchParams.get('flow');
  const highlightedFlowId = GUIDE_FLOWS.some((guide) => guide.id === requestedFlowId)
    ? requestedFlowId
    : null;

  return (
    <ContentPageShell className="public-guide-page">
      <Helmet><title>이용가이드 | 에누리컷</title></Helmet>
      <GuideJourneyOverview
        guides={GUIDE_FLOWS}
        highlightedFlowId={highlightedFlowId}
        journeys={GUIDE_JOURNEYS}
      />
    </ContentPageShell>
  );
};

export default GuidePage;
