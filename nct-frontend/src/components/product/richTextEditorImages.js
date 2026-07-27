// src/components/product/richTextEditorImages.js
// RichTextEditor.jsx의 상수·유틸을 별도 파일로 분리 — 컴포넌트 파일이 컴포넌트만
// export해야 Fast Refresh가 정상 동작한다(react-refresh/only-export-components).
import DOMPurify from 'dompurify';
import { toImageUrl, uploadImage } from '@api/fileApi';

export const SANITIZE_OPTS = {
  // ul/ol/li는 목록 버튼 제거 후에도 과거 저장된 설명에 남아있을 수 있어 허용 태그에서 빼지 않는다.
  ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'img', 'div', 'span'],
  ALLOWED_ATTR: ['src', 'style'],
  // 기본 허용 프로토콜(http/https 등)에 blob:을 추가 — 업로드 전 로컬 미리보기 src가 정제되며 지워지지 않게
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|blob):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
};

// 백엔드 ProductRegisterRequest.prdCn의 @Size(max=4000)과 반드시 같은 값을 유지해야 한다.
export const DEFAULT_MAX_LENGTH = 4000;

// 부모(ProductRegisterPage)가 임시저장·상품등록 클릭 시 호출 — 그때서야 실제로 서버에 업로드하고
// 본문 HTML의 blob: 주소를 실제 서버 URL로 치환한 최종 HTML을 돌려준다.
export async function resolvePendingDescriptionImages(html, pendingFilesMap, maxLength = DEFAULT_MAX_LENGTH) {
  if (!pendingFilesMap || pendingFilesMap.size === 0) return html;

  const container = document.createElement('div');
  container.innerHTML = html || '';

  await Promise.all(
    Array.from(container.querySelectorAll('img')).map(async (img) => {
      const blobUrl = img.getAttribute('src');
      const file = pendingFilesMap.get(blobUrl);
      if (!file) return;
      const res = await uploadImage(file, 'product');
      img.setAttribute('src', toImageUrl(res.data.url));
    }),
  );

  pendingFilesMap.forEach((_file, blobUrl) => URL.revokeObjectURL(blobUrl));
  pendingFilesMap.clear();

  const resolvedHtml = DOMPurify.sanitize(container.innerHTML, SANITIZE_OPTS);
  if (resolvedHtml.length > maxLength) {
    throw new Error(`상품 설명이 이미지 주소 변환 후 글자수 제한(${maxLength.toLocaleString()}자)을 초과했습니다. 이미지 수를 줄여주세요.`);
  }
  return resolvedHtml;
}
