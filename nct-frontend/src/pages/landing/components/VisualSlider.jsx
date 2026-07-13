// src/pages/landing/components/VisualSlider.jsx
import { useState, useEffect, useCallback } from 'react';
import '@assets/css/landing.css';

const SLIDES = [
  {
    id: 1,
    heading: '실시간 경매와 생활 서비스를 한 화면에서',
    sub: '',
    bg: '#f0f4ff',
  },
  {
    id: 2,
    heading: '마감 임박 경매를 빠르게 확인',
    sub: '놓치지 마세요',
    bg: '#fff5f0',
  },
  {
    id: 3,
    heading: '생활 서비스 견적을 한 번에 비교',
    sub: '믿을 수 있는 전문가를 찾아보세요',
    bg: '#f0fff4',
  },
];

const AUTO_PLAY_INTERVAL = 4000;

/**
 * 메인 비주얼 슬라이드 카드
 */
const VisualSlider = () => {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((index) => {
    setCurrent((index + SLIDES.length) % SLIDES.length);
  }, []);

  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  // 자동 재생
  useEffect(() => {
    const timer = setInterval(() => goTo(current + 1), AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [current, goTo]);

  return (
    <article className="home-visual-card" aria-label="메인 비주얼 슬라이드">
      {/* 이전 버튼 */}
      <button className="visual-arrow prev" type="button" onClick={prev} aria-label="이전 슬라이드">
        ‹
      </button>

      {/* 슬라이드 트랙 */}
      <div
        className="visual-track"
        style={{ transform: `translateX(${-100 * current}%)` }}
      >
        {SLIDES.map((slide) => (
          <div
            key={slide.id}
            className="visual-slide"
            style={{ background: slide.bg }}
          >
            <div className="visual-copy">
              <h2>{slide.heading}</h2>
              {slide.sub && <p>{slide.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* 다음 버튼 */}
      <button className="visual-arrow next" type="button" onClick={next} aria-label="다음 슬라이드">
        ›
      </button>

      {/* 인디케이터 */}
      <div className="visual-dots" aria-label="슬라이드 선택">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            type="button"
            className={idx === current ? 'active' : ''}
            onClick={() => goTo(idx)}
            aria-label={`${idx + 1}번째 슬라이드`}
          />
        ))}
      </div>
    </article>
  );
};

export default VisualSlider;
