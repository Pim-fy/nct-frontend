const RECENT_AUCTIONS_STORAGE_KEY = 'nct:recent-auctions';
const RECENT_AUCTIONS_CHANGED_EVENT = 'nct:recent-auctions-changed';
const MAX_STORED_AUCTIONS = 10;

const canUseSessionStorage = () => typeof window !== 'undefined' && window.sessionStorage;

const normalizeRecentAuction = (auction) => {
  if (auction?.auctionId == null) return null;

  const auctionId = String(auction.auctionId);
  if (!auctionId.trim()) return null;

  return {
    auctionId,
    title: typeof auction.title === 'string' ? auction.title.trim() : '',
    imagePath: typeof auction.imagePath === 'string' ? auction.imagePath : null,
    viewedAt: Number.isFinite(auction.viewedAt) ? auction.viewedAt : Date.now(),
  };
};

export const getRecentAuctions = () => {
  if (!canUseSessionStorage()) return [];

  try {
    const stored = JSON.parse(
      window.sessionStorage.getItem(RECENT_AUCTIONS_STORAGE_KEY) || '[]',
    );

    if (!Array.isArray(stored)) {
      window.sessionStorage.removeItem(RECENT_AUCTIONS_STORAGE_KEY);
      return [];
    }

    return stored
      .map(normalizeRecentAuction)
      .filter(Boolean)
      .slice(0, MAX_STORED_AUCTIONS);
  } catch {
    window.sessionStorage.removeItem(RECENT_AUCTIONS_STORAGE_KEY);
    return [];
  }
};

export const addRecentAuction = (auction) => {
  if (!canUseSessionStorage()) return [];

  const recentAuction = normalizeRecentAuction({
    ...auction,
    viewedAt: Date.now(),
  });
  if (!recentAuction) return getRecentAuctions();

  const updatedAuctions = [
    recentAuction,
    ...getRecentAuctions().filter(
      (item) => item.auctionId !== recentAuction.auctionId,
    ),
  ].slice(0, MAX_STORED_AUCTIONS);

  window.sessionStorage.setItem(
    RECENT_AUCTIONS_STORAGE_KEY,
    JSON.stringify(updatedAuctions),
  );
  window.dispatchEvent(new CustomEvent(RECENT_AUCTIONS_CHANGED_EVENT, {
    detail: updatedAuctions,
  }));

  return updatedAuctions;
};

export const subscribeToRecentAuctions = (listener) => {
  if (typeof window === 'undefined') return () => {};

  const handleChange = (event) => {
    listener(Array.isArray(event.detail) ? event.detail : getRecentAuctions());
  };

  window.addEventListener(RECENT_AUCTIONS_CHANGED_EVENT, handleChange);
  return () => window.removeEventListener(RECENT_AUCTIONS_CHANGED_EVENT, handleChange);
};
