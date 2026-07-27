// src/components/card/CategorySection.jsx
const CategorySection = ({ title, children }) => (
  <section style={{ marginBottom: '40px' }}>
    <h2 style={{ fontSize: '20px', marginBottom: '16px', borderBottom: '2px solid var(--color-primary, #0064ff)', paddingBottom: '8px', display: 'inline-block' }}>{title}</h2>
    {children}
  </section>
);
export default CategorySection;
