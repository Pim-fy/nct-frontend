import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { X } from 'lucide-react';
import {
  MockupContentPageHeader,
  MockupGuideFlowCard,
} from '@components/content/mockup/MockupContentComponents';
import guideExampleImage from '@assets/images/guide-service-example.svg';
import { GUIDE_FLOWS } from './guideData';
import './contentPages.css';

/** F-COM-014: 방문자도 볼 수 있는 정적 이용가이드 화면입니다. */
const GuidePage = () => {
  const [selectedGuide, setSelectedGuide] = useState(null);
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
    <div className="content-page">
      <Helmet><title>이용가이드 | 에누리컷</title></Helmet>
      <MockupContentPageHeader
        description="등록부터 요청·입찰·거래 완료·환전까지 에누리컷의 핵심 이용 흐름을 확인하세요."
        eyebrow="처음 이용하는 분을 위한 안내"
        title="이용가이드"
      />

      <section className="guide-flow-grid" aria-label="에누리컷 이용 흐름">
        {GUIDE_FLOWS.map((guide) => (
          <MockupGuideFlowCard guide={guide} key={guide.id} onOpen={openGuide} />
        ))}
      </section>

      <section className="content-flow-strip" aria-label="전체 이용 순서">
        <strong>전체 흐름</strong>
        <div><span>탐색</span><i /> <span>요청·입찰</span><i /> <span>거래 생성</span><i /> <span>완료·환전</span></div>
      </section>

      {selectedGuide && (
        <div className="content-modal" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedGuide(null);
        }}>
          <section
            aria-labelledby="guide-modal-title"
            aria-describedby="guide-modal-description"
            aria-modal="true"
            className="content-modal__panel"
            role="dialog"
          >
            <div className="content-modal__heading">
              <div>
                <span>{selectedGuide.order}단계</span>
                <h2 id="guide-modal-title">{selectedGuide.flowTitle}</h2>
              </div>
              <button
                aria-label="이용가이드 닫기"
                onClick={() => setSelectedGuide(null)}
                ref={closeButtonRef}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <img alt="에누리컷 핵심 이용 단계 예시" src={guideExampleImage} />
            <p id="guide-modal-description">{selectedGuide.flowCopy}</p>
          </section>
        </div>
      )}
    </div>
  );
};

export default GuidePage;
