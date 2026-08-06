const AuctionToast = ({ message }) => {
  if (!message) return null;

  return (
    <div
      className="auction-toast fixed bottom-7 left-1/2 z-[400] flex min-h-12 w-[min(calc(100%_-_32px),420px)] -translate-x-1/2 items-center justify-center rounded-lg bg-[#1d1d1f] px-5 py-3 text-center text-body-md font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
};

export default AuctionToast;
