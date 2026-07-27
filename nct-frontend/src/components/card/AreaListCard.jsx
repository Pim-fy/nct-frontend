// src/components/card/AreaListCard.jsx
import { Link } from 'react-router-dom';
const AreaListCard = ({ item, linkTo }) => (
  <Link to={linkTo} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
    <div className="img-placeholder" style={{ height: '160px', marginBottom: '12px' }}>
      {item.image && <img src={item.image} alt={item.title} />}
    </div>
    <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>{item.title}</h3>
    {item.description && <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>{item.description}</p>}
  </Link>
);
export default AreaListCard;
