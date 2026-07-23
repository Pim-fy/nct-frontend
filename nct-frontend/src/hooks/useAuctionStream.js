import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BACKEND_URL } from '@api/axios';

export function useAuctionStream(auctionId, enabled) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !auctionId) return undefined;

    const eventSource = new EventSource(
      `${BACKEND_URL}/api/auctions/${auctionId}/stream`,
      { withCredentials: true },
    );

    const handleAuctionUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['auctionDetail', auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['bids', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['point', 'balance'] });
    };

    eventSource.addEventListener('auction-updated', handleAuctionUpdated);
    eventSource.onerror = () => {};

    return () => {
      eventSource.removeEventListener('auction-updated', handleAuctionUpdated);
      eventSource.close();
    };
  }, [auctionId, enabled, queryClient]);
}
