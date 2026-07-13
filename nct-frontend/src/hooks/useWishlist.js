// src/hooks/useWishlist.js
import { useState, useCallback } from 'react';

/**
 * 위시리스트(찜) 상태를 관리하는 훅
 */
export const useWishlist = () => {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveToStorage = (list) => {
    localStorage.setItem('wishlist', JSON.stringify(list));
  };

  const addToWishlist = useCallback((item) => {
    setWishlist(prev => {
      const exists = prev.some(w => w.id === item.id);
      if (exists) return prev;
      const next = [...prev, item];
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeFromWishlist = useCallback((itemId) => {
    setWishlist(prev => {
      const next = prev.filter(w => w.id !== itemId);
      saveToStorage(next);
      return next;
    });
  }, []);

  const toggleWishlist = useCallback((item) => {
    setWishlist(prev => {
      const exists = prev.some(w => w.id === item.id);
      const next = exists
        ? prev.filter(w => w.id !== item.id)
        : [...prev, item];
      saveToStorage(next);
      return next;
    });
  }, []);

  const isWishlisted = useCallback((itemId) => {
    return wishlist.some(w => w.id === itemId);
  }, [wishlist]);

  return { wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isWishlisted };
};
