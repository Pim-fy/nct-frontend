const AUCTION_SEARCH_HISTORY_KEY = 'nct:auction-search-history';
const MAX_AUCTION_SEARCH_HISTORY = 7;

const getLocalStorage = () => {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const normalizeSearchTerm = (term) => (
  typeof term === 'string' ? term.trim() : ''
);

export const getAuctionSearchHistory = () => {
  const storage = getLocalStorage();
  if (!storage) return [];

  try {
    const stored = JSON.parse(storage.getItem(AUCTION_SEARCH_HISTORY_KEY) || '[]');
    if (!Array.isArray(stored)) return [];

    return stored
      .map(normalizeSearchTerm)
      .filter(Boolean)
      .filter((term, index, terms) => (
        terms.findIndex((candidate) => (
          candidate.toLocaleLowerCase() === term.toLocaleLowerCase()
        )) === index
      ))
      .slice(0, MAX_AUCTION_SEARCH_HISTORY);
  } catch {
    storage.removeItem(AUCTION_SEARCH_HISTORY_KEY);
    return [];
  }
};

export const addAuctionSearchHistory = (term) => {
  const storage = getLocalStorage();
  const normalizedTerm = normalizeSearchTerm(term);
  if (!storage || !normalizedTerm) return getAuctionSearchHistory();

  const normalizedKey = normalizedTerm.toLocaleLowerCase();
  const updatedHistory = [
    normalizedTerm,
    ...getAuctionSearchHistory().filter(
      (item) => item.toLocaleLowerCase() !== normalizedKey,
    ),
  ].slice(0, MAX_AUCTION_SEARCH_HISTORY);

  storage.setItem(AUCTION_SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  return updatedHistory;
};

export const removeAuctionSearchHistory = (term) => {
  const storage = getLocalStorage();
  if (!storage) return [];

  const normalizedKey = normalizeSearchTerm(term).toLocaleLowerCase();
  const updatedHistory = getAuctionSearchHistory().filter(
    (item) => item.toLocaleLowerCase() !== normalizedKey,
  );
  storage.setItem(AUCTION_SEARCH_HISTORY_KEY, JSON.stringify(updatedHistory));
  return updatedHistory;
};

export const clearAuctionSearchHistory = () => {
  const storage = getLocalStorage();
  if (storage) storage.removeItem(AUCTION_SEARCH_HISTORY_KEY);
  return [];
};
