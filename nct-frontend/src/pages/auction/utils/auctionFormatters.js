import { toImageUrl } from '@api/fileApi';

export const formatPrice = (value) => {
  const number = Number(value || 0);
  return `${number.toLocaleString('ko-KR')}원`;
};

export const formatNumber = (value) => {
  const number = Number(value || 0);
  return number.toLocaleString('ko-KR');
};

export const parseAmount = (value) => Number(String(value || '').replace(/[^0-9]/g, '')) || 0;

export const createImageItems = (images = []) => images.map((image, index) => ({
  id: image.imageId || `image-${index}`,
  url: toImageUrl(image.path),
  alt: image.originalName || `상품 이미지 ${index + 1}`,
  representative: image.representative,
})).filter((image) => image.url);

export const formatRemainingTime = (endDateTime, statusCode, statusName, now = Date.now()) => {
  if (statusCode !== 'AUCC0002') return statusName || '준비';
  if (!endDateTime) return '진행중';

  const diffMs = new Date(endDateTime).getTime() - now;
  if (diffMs <= 0) return '종료 임박';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `D-${String(days).padStart(2, '0')} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
