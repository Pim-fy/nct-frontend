// src/components/product/RichTextEditor.jsx
// 상품 설명용 경량 리치텍스트 에디터 — 굵게·기울임·밑줄·목록·이미지 삽입
// contentEditable 기반, 결과물은 HTML 문자열 (value/onChange)
// Props: value(HTML string), onChange(html), placeholder
import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { toImageUrl, uploadImage } from '@api/fileApi';

const SANITIZE_OPTS = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'img', 'div', 'span'],
  ALLOWED_ATTR: ['src', 'style'],
};

export default function RichTextEditor({ value, onChange, placeholder = '상품 설명을 입력하세요' }) {
  const editorRef = useRef(null);
  const lastValueRef = useRef(value || '');
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // 외부에서 value가 바뀐 경우(예: 수정 모드 로드)에만 DOM을 다시 채운다.
  // 매 입력마다 innerHTML을 다시 쓰면 커서 위치가 튄다.
  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== lastValueRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = DOMPurify.sanitize(value || '', SANITIZE_OPTS);
      lastValueRef.current = value || '';
    }
  }, [value]);

  const emitChange = () => {
    const html = DOMPurify.sanitize(editorRef.current.innerHTML, SANITIZE_OPTS);
    lastValueRef.current = html;
    onChange(html);
  };

  const exec = (command) => {
    editorRef.current.focus();
    document.execCommand(command);
    emitChange();
  };

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    setUploading(true);
    try {
      const res = await uploadImage(file, 'product');
      editorRef.current.focus();
      document.execCommand('insertImage', false, toImageUrl(res.url));
      editorRef.current.querySelectorAll('img').forEach(img => {
        if (!img.style.width) img.style.width = '100%';
      });
      emitChange();
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #e2e1dc', borderRadius: 5, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: '1px solid #e2e1dc', background: '#fafaf8' }}>
        <button type="button" onClick={() => exec('bold')} className="btn btn-ghost btn-sm" style={{ fontWeight: 700, padding: '0 12px' }}>B</button>
        <button type="button" onClick={() => exec('italic')} className="btn btn-ghost btn-sm" style={{ fontStyle: 'italic', padding: '0 12px' }}>I</button>
        <button type="button" onClick={() => exec('underline')} className="btn btn-ghost btn-sm" style={{ textDecoration: 'underline', padding: '0 12px' }}>U</button>
        <button type="button" onClick={() => exec('insertUnorderedList')} className="btn btn-ghost btn-sm" style={{ padding: '0 12px' }}>목록</button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn btn-ghost btn-sm"
          style={{ padding: '0 12px' }}
        >
          {uploading ? '업로드 중...' : '이미지 삽입'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={handleImageSelected} />
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={emitChange}
        onBlur={emitChange}
        data-placeholder={placeholder}
        className="rich-text-editor-body"
        style={{ flex: 1, minHeight: 200, overflowY: 'auto', padding: '12px 14px', fontSize: 16, lineHeight: 1.7, outline: 'none' }}
      />
    </div>
  );
}
