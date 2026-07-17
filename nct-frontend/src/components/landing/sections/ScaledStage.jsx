import React, { useEffect, useRef, useState } from "react";

// Figma 디자인 원본 캔버스 크기 (헤더 하단 ~ 푸터 상단 구간)
// 페이지마다 원본 프레임 높이가 다르므로 props로 오버라이드할 수 있게 열어둔다.
const DEFAULT_DESIGN_WIDTH = 1920;
const DEFAULT_CANVAS_HEIGHT = 2662; // 원본 헤더(top:0~82) 포함 좌표계에서의 전체 높이
const DEFAULT_TOP_CROP = 82; // 이 프로젝트는 자체 헤더(<LandingHeader />/<MainHeader />)를 쓰므로 그만큼 상단을 잘라냄

/**
 * Figma에서 변환된 절대좌표(고정 너비) 섹션들을
 * 화면 폭에 맞춰 자동으로 축소/확대해서 보여주는 래퍼입니다.
 *
 * - 완전한 반응형 재배치는 아니고, 디자인을 통째로 스케일링하는 방식입니다.
 * - 모바일 등 좁은 화면에서도 레이아웃이 깨지지 않고 축소되어 보이지만,
 *   글자 크기 자체가 함께 줄어들기 때문에 진짜 모바일 UX(터치 타겟, 줄바꿈 등)를
 *   원한다면 추후 섹션별로 반응형 레이아웃을 다시 짜는 작업이 필요합니다.
 *
 * @param {number} [designWidth]  원본 Figma 프레임 너비
 * @param {number} [canvasHeight] 원본 Figma 프레임 전체 높이 (헤더 포함 좌표계 기준)
 * @param {number} [topCrop]     이미 별도 헤더 컴포넌트로 대체되어 잘라낼 상단 높이
 */
export default function ScaledStage({
  children,
  designWidth = DEFAULT_DESIGN_WIDTH,
  canvasHeight = DEFAULT_CANVAS_HEIGHT,
  topCrop = DEFAULT_TOP_CROP,
}) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const visibleHeight = canvasHeight - topCrop;

  useEffect(() => {
    const updateScale = () => {
      const width = containerRef.current?.offsetWidth ?? designWidth;
      setScale(width / designWidth);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [designWidth]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: visibleHeight * scale,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -topCrop * scale,
          left: 0,
          width: designWidth,
          height: canvasHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
