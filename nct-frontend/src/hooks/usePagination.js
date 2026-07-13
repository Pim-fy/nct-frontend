// src/hooks/usePagination.js
import { useState } from 'react';

/**
 * 페이지네이션 상태를 관리하는 훅
 * @param {number} initialPage  - 초기 페이지 (기본: 1)
 * @param {number} initialSize  - 페이지당 항목 수 (기본: 10)
 */
export const usePagination = (initialPage = 1, initialSize = 10) => {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [totalPages, setTotalPages] = useState(0);

  const goToPage   = (p) => setPage(p);
  const nextPage   = () => setPage(prev => Math.min(prev + 1, totalPages));
  const prevPage   = () => setPage(prev => Math.max(prev - 1, 1));
  const resetPage  = () => setPage(initialPage);

  return {
    page,
    size,
    totalPages,
    setPage,
    setSize,
    setTotalPages,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
  };
};
