const AuctionToast = ({ message }) => (
  <div className={`toast ${message ? 'open' : ''}`} id="toast">{message}</div>
);

export default AuctionToast;
