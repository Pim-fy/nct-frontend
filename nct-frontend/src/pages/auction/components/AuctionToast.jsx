const AuctionToast = ({ message }) => {
  if (!message) return null;

  return (
    <div
      className="fixed bottom-7 left-1/2 z-[100] -translate-x-1/2 rounded-lg bg-[#1d1d1f] px-4 py-2.5 text-sm whitespace-nowrap text-white shadow-lg"
      id="toast"
      role="status"
    >
      {message}
    </div>
  );
};

export default AuctionToast;
