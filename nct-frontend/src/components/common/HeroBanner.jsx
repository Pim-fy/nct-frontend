// src/components/common/HeroBanner.jsx
// TODO: 구현 예정
const HeroBanner = ({ title, subtitle, backgroundImage }) => (
  <div style={{ background: backgroundImage ? `url(${backgroundImage}) center/cover` : '#f0f4ff', padding: '60px 0', textAlign: 'center' }}>
    <h1 style={{ margin: 0, fontSize: '36px' }}>{title}</h1>
    {subtitle && <p style={{ marginTop: '12px', color: '#5f5e5a' }}>{subtitle}</p>}
  </div>
);
export default HeroBanner;
