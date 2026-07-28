// src/components/product/RichTextEditor.jsx
// 상품 설명용 경량 리치텍스트 에디터 — 굵게·기울임·밑줄·이미지 삽입
// contentEditable 기반, 결과물은 HTML 문자열 (value/onChange)
// Props: value(HTML string), onChange(html), placeholder, maxLength, pendingFilesMap
//
// 이미지는 선택 시점에 서버로 업로드하지 않는다 — 로컬 blob: URL로만 미리보기하고
// 실제 파일(File 객체)은 부모가 준 pendingFilesMap(blobUrl -> File)에 쌓아만 둔다.
// 이 map은 부모(ProductRegisterPage)가 소유하므로, 스텝 전환 등으로 이 컴포넌트가
// 잠깐 언마운트돼도 파일이 사라지지 않는다. 실제 업로드는 부모가 임시저장·상품등록
// 클릭 시 resolvePendingDescriptionImages()를 호출하는 시점에만 일어난다.
// (F-AUC-002: 저장 버튼을 눌러야만 DB에 반영)
import { useEffect, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { SANITIZE_OPTS, DEFAULT_MAX_LENGTH } from './richTextEditorImages';

// 업로드 후 실제 <img src="{백엔드 origin}/api/attachment/product/{yyyyMMdd}/{UUID}.{확장자}" style="width: 100%;">
// 태그 길이의 넉넉한 상한 추정치 — blob: 미리보기 URL은 이보다 짧아서, 삽입 시점엔 이 값으로 미리 막는다.
const ESTIMATED_IMG_TAG_LENGTH = 160;

export default function RichTextEditor({ value, onChange, placeholder = '상품 설명을 입력하세요', maxLength = DEFAULT_MAX_LENGTH, pendingFilesMap }) {
  const editorRef = useRef(null);
  // null = 아직 DOM에 한 번도 반영 안 됨 — 마운트 시점의 value가 이전과 우연히 같아도
  // (예: 스텝 전환 후 재마운트라 prop은 이미 최신인 경우) 반드시 한 번은 채워야 한다.
  const lastValueRef = useRef(null);
  const fileInputRef = useRef(null);
  const [length, setLength] = useState((value || '').length);

  // 외부에서 value가 바뀐 경우(마운트 시 최초 1회 포함, 수정 모드 로드, 스텝 전환 후 재마운트)에만 DOM을 다시 채운다.
  // 매 입력마다 innerHTML을 다시 쓰면 커서 위치가 튄다.
  useEffect(() => {
    if (!editorRef.current) return;
    if (lastValueRef.current === null || (value !== lastValueRef.current && document.activeElement !== editorRef.current)) {
      const sanitized = DOMPurify.sanitize(value || '', SANITIZE_OPTS);
      editorRef.current.innerHTML = sanitized;
      lastValueRef.current = value || '';
      setLength(sanitized.length);
    }
  }, [value]);

  // 글자수 제한을 넘기는 입력은 반영하지 않고 직전 상태로 되돌린다 — 백엔드 @Size(max=4000) 방어.
  const emitChange = () => {
    const html = DOMPurify.sanitize(editorRef.current.innerHTML, SANITIZE_OPTS);
    if (html.length > maxLength) {
      editorRef.current.innerHTML = lastValueRef.current;
      return;
    }
    lastValueRef.current = html;
    setLength(html.length);
    onChange(html);
  };

  const exec = (command) => {
    editorRef.current.focus();
    document.execCommand(command);
    emitChange();
  };

  // 서버 업로드 없이 로컬 blob: URL로만 미리보기 삽입 — 실제 업로드는 resolvePendingDescriptionImages()가 담당
  const handleImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    if (lastValueRef.current.length + ESTIMATED_IMG_TAG_LENGTH > maxLength) {
      alert(`상품 설명 글자수 제한(${maxLength.toLocaleString()}자)을 초과해 이미지를 추가할 수 없습니다. 설명을 줄이거나 이미지 수를 줄여주세요.`);
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    pendingFilesMap?.set(blobUrl, file);
    editorRef.current.focus();
    document.execCommand('insertImage', false, blobUrl);
    editorRef.current.querySelectorAll('img').forEach(img => {
      if (!img.style.width) img.style.width = '100%';
    });
    emitChange();
  };

  return (
    <div style={{ border: '1px solid #e2e1dc', borderRadius: 5, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: '1px solid #e2e1dc', background: '#fafaf8' }}>
        <button type="button" onClick={() => exec('bold')} className="btn btn-ghost btn-sm" style={{ fontWeight: 700, padding: '0 12px' }}>B</button>
        <button type="button" onClick={() => exec('italic')} className="btn btn-ghost btn-sm" style={{ fontStyle: 'italic', padding: '0 12px' }}>I</button>
        <button type="button" onClick={() => exec('underline')} className="btn btn-ghost btn-sm" style={{ textDecoration: 'underline', padding: '0 12px' }}>U</button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-ghost btn-sm"
          style={{ padding: '0 12px' }}
        >
          이미지 삽입
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" hidden onChange={handleImageSelected} />
        <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 13, color: length >= maxLength ? '#c0392b' : '#969696' }}>
          {length.toLocaleString()}/{maxLength.toLocaleString()}
        </span>
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
