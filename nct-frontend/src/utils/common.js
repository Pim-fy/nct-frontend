// src/utils/common.js

/**
 * 숫자를 한국 화폐 형식으로 포맷
 * @param {number} amount
 * @returns {string} e.g. "1,234,567원"
 */
export const formatPrice = (amount) => {
  if (amount == null) return '0원';
  return `${Number(amount).toLocaleString('ko-KR')}원`;
};

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\. /g, '-').replace('.', '');
};

/**
 * 날짜를 상대 시간으로 표시 (예: "3분 전", "2일 전")
 * @param {string|Date} date
 * @returns {string}
 */
export const timeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diff = Math.floor((now - past) / 1000);

  if (diff < 60)          return `${diff}초 전`;
  if (diff < 3600)        return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400)       return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 30)  return `${Math.floor(diff / 86400)}일 전`;
  if (diff < 86400 * 365) return `${Math.floor(diff / (86400 * 30))}달 전`;
  return `${Math.floor(diff / (86400 * 365))}년 전`;
};

/**
 * 문자열 말줄임 처리
 * @param {string} str
 * @param {number} limit
 * @returns {string}
 */
export const truncate = (str, limit = 50) => {
  if (!str) return '';
  return str.length > limit ? `${str.slice(0, limit)}...` : str;
};

/**
 * 빈 값 체크
 * @param {*} value
 * @returns {boolean}
 */
export const isEmpty = (value) => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * 클래스명 조합 (falsy 값 제거)
 * @param {...string} classes
 * @returns {string}
 */
export const cn = (...classes) => classes.filter(Boolean).join(' ');

/**
 * 디바운스
 * @param {Function} fn
 * @param {number} delay
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
