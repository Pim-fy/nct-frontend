// src/components/Icon/IconSVG.jsx
// 커스텀 SVG 아이콘 래퍼 컴포넌트
const IconSVG = ({ src, alt = '', width = 24, height = 24, className = '' }) => (
  <img src={src} alt={alt} width={width} height={height} className={className} />
);
export default IconSVG;
