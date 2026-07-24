// src/pages/product/steps/ProductInfoStep.jsx
// Step 0: 상품명·카테고리·거래형태·설명·이미지 입력
// Props: form, set, categories, bannedKeywordError, images, onChange, tradeMethods, maxImages
import ProductImageUpload from '@components/product/ProductImageUpload';

export default function ProductInfoStep({ form, set, categories, bannedKeywordError, images, onChange, tradeMethods, maxImages }) {
  return (
    <div>
      <div className="field">
        <label>상품명 <span>{form.prdNm.length}/100</span></label>
        <input
          className="input"
          type="text"
          value={form.prdNm}
          onChange={e => set('prdNm', e.target.value)}
          maxLength={100}
          placeholder="다이슨 V11 청소기"
        />
        {bannedKeywordError && (
          <p className="field-error" style={{ color: 'var(--color-danger, #e53e3e)', fontSize: 13, marginTop: 4 }}>
            {bannedKeywordError}
          </p>
        )}
      </div>

      <div className="field">
        <label>카테고리</label>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <button
              key={cat.catSn}
              type="button"
              onClick={() => set('catSn', String(cat.catSn))}
              className={`chip ${String(form.catSn) === String(cat.catSn) ? 'active' : ''}`}
            >
              {cat.catNm}
            </button>
          ))}
        </div>
      </div>

      <div className="field deal-options">
        <label>거래 형태</label>
        <div className="row">
          {tradeMethods.map(({ value, label, Icon }) => (
            <label
              key={value}
              className={`line-option ${form.prdTrdMethodCd === value ? 'checked' : ''}`}
            >
              <input
                type="radio"
                name="prdTrdMethodCd"
                value={value}
                checked={form.prdTrdMethodCd === value}
                onChange={() => set('prdTrdMethodCd', value)}
              />
              <Icon />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="field">
        <label>상품 설명 <span>{form.prdCn.length}/2000</span></label>
        <textarea
          className="input"
          value={form.prdCn}
          onChange={e => set('prdCn', e.target.value)}
          maxLength={2000}
          rows={6}
        />
      </div>

      {/* 이미지 업로드 (F-AUC-002) — 선택 즉시 업로드, 첫 장이 대표이미지 */}
      <ProductImageUpload images={images} onChange={onChange} maxImages={maxImages} />
    </div>
  );
}
