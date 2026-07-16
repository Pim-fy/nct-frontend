import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import {
  ContentPageHeader,
  ContentPageShell,
  GuideFlowGrid,
  GuideFlowStrip,
  GuideModal,
} from '@components/content/ContentUi';
import guideExampleImage from '@assets/images/guide-service-example.svg';
import { GUIDE_FLOWS } from './guideData';

const GUIDE_STEPS = ['탐색', '요청·입찰', '거래 생성', '완료·환전'];

/** F-COM-014: 방문자도 볼 수 있는 정적 이용가이드 화면입니다. */
const GuidePage = () => {
  const [searchParams] = useSearchParams();
  const requestedFlowId = searchParams.get('flow');
  const [selectedGuide, setSelectedGuide] = useState(
    () => GUIDE_FLOWS.find((guide) => guide.id === requestedFlowId) ?? null,
  );
  const closeButtonRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!selectedGuide) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleModalKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedGuide(null);
      if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleModalKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleModalKeyDown);
      returnFocusRef.current?.focus();
    };
  }, [selectedGuide]);

  const openGuide = (guide) => {
    returnFocusRef.current = document.activeElement;
    setSelectedGuide(guide);
  };

  return (
    <ContentPageShell>
      <Helmet><title>이용가이드 | 에누리컷</title></Helmet>
      <ContentPageHeader
        description="등록부터 요청·입찰·거래 완료·환전까지 에누리컷의 핵심 이용 흐름을 확인하세요."
        eyebrow="처음 이용하는 분을 위한 안내"
        title="이용가이드"
      />

      <GuideFlowGrid guides={GUIDE_FLOWS} onOpen={openGuide} />
      <GuideFlowStrip steps={GUIDE_STEPS} />

      {selectedGuide && (
        <GuideModal
          closeButtonRef={closeButtonRef}
          guide={selectedGuide}
          imageAlt="에누리컷 핵심 이용 단계 예시"
          imageSrc={guideExampleImage}
          onClose={() => setSelectedGuide(null)}
        />
      )}
    </ContentPageShell>
  );
};

export default GuidePage;
