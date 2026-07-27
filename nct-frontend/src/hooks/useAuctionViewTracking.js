import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { increaseProductViewCount } from '@api/productApi';

const VIEW_STORAGE_PREFIX = 'nct:auction-view:';
const trackedViews = new Set();

const getStorageKey = (auctionId) => `${VIEW_STORAGE_PREFIX}${auctionId}`;

const readStoredView = (storageKey) => {
  try {
    return window.sessionStorage.getItem(storageKey);
  } catch {
    return null;
  }
};

const storeView = (storageKey, value) => {
  try {
    window.sessionStorage.setItem(storageKey, value);
  } catch {
    // In-memory tracking still prevents duplicate requests in this page session.
  }
};

const removeStoredView = (storageKey) => {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // The next page entry can retry through in-memory tracking.
  }
};

export function useAuctionViewTracking(auctionId, productId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!auctionId || !productId) return;

    const storageKey = getStorageKey(auctionId);
    if (trackedViews.has(storageKey) || readStoredView(storageKey)) return;

    trackedViews.add(storageKey);
    storeView(storageKey, 'pending');

    increaseProductViewCount(productId)
      .then(() => {
        storeView(storageKey, 'recorded');
        queryClient.refetchQueries({
          queryKey: ['auctionDetail', auctionId],
          type: 'active',
        }).catch(() => {});
      })
      .catch(() => {
        trackedViews.delete(storageKey);
        removeStoredView(storageKey);
      });
  }, [auctionId, productId, queryClient]);
}
