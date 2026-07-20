const AuctionDetailModal = ({ isOpen, content, onClose }) => (
  <div className={`detail-modal ${isOpen ? 'open' : ''}`} id="detailModal" aria-hidden={!isOpen}>
    <div className="detail-modal-panel" role="dialog" aria-modal="true" aria-labelledby="detailModalTitle">
      <div className="detail-modal-head">
        <h2 id="detailModalTitle">{content.title}</h2>
        <button className="detail-modal-close" type="button" aria-label="상세 정보 닫기" onClick={onClose}>&times;</button>
      </div>
      <div className="detail-modal-body" id="detailModalBody">
        <ul className="detail-modal-list">
          {content.rows.map(([label, value]) => (
            <li key={label}><strong>{label}</strong><span>{value}</span></li>
          ))}
        </ul>
      </div>
    </div>
  </div>
);

export default AuctionDetailModal;
