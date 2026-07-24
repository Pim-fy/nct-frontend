// src/pages/product/steps/RegisterConfirmStep.jsx
// Step 2: 등록 전 상품정보·경매조건 요약 확인 + 최종 동의
// Props: form, agreed, setAgreed, images, selectedCat, selectedTrade, endDt
export default function RegisterConfirmStep({ form, agreed, setAgreed, images, selectedCat, selectedTrade, endDt }) {
  const thumb = images[0]?.url;
  return (
    <div>
      <div className="card" style={{ background: '#fafaf8', marginBottom: 20 }}>
        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#5f5e5a' }}>미리보기</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: 8, background: '#e5e4df', flexShrink: 0, overflow: 'hidden' }}>
            {thumb
              ? <img src={thumb} alt="대표이미지" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 28 }}>📦</span>
            }
          </div>
          <div>
            <h4 style={{ margin: '0 0 6px' }}>{form.prdNm || '상품명 미입력'}</h4>
            <p className="muted" style={{ margin: '0 0 4px', fontSize: 13 }}>
              {selectedCat?.catNm || '카테고리 미선택'} · {selectedTrade?.label || '—'}
            </p>
            <p className="muted" style={{ margin: '0 0 4px', fontSize: 14 }}>
              시작가 {form.prdStartAmt ? Number(form.prdStartAmt).toLocaleString() + '원' : '—'}
              {form.prdIbyAmt ? ` · 즉시구매 ${Number(form.prdIbyAmt).toLocaleString()}원` : ''}
            </p>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              종료 {endDt ? `${endDt.getFullYear()}.${endDt.getMonth()+1}.${endDt.getDate()} ${String(endDt.getHours()).padStart(2,'0')}:${String(endDt.getMinutes()).padStart(2,'0')}` : '—'}
            </p>
          </div>
        </div>
      </div>
      <div className="grid-2" style={{ margin: '20px 0' }}>
        <div className="card">
          <h4>상품 정보 (PRODUCT)</h4>
          <table>
            <tbody>
              {[
                ['상품명', form.prdNm],
                ['카테고리', selectedCat?.catNm || '—'],
                ['거래 방식', selectedTrade?.label || '—'],
                ['이미지', `${images.length}장 등록됨`],
              ].map(([k, v]) => (
                <tr key={k}><th>{k}</th><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h4>경매 조건 (AUCTION)</h4>
          <table>
            <tbody>
              {[
                ['시작가', form.prdStartAmt ? Number(form.prdStartAmt).toLocaleString() + '원' : '—'],
                ['즉시구매가', form.prdIbyAmt ? Number(form.prdIbyAmt).toLocaleString() + '원' : '미설정'],
                ['입찰 단위', form.bidUnit.toLocaleString() + '원'],
                ['경매 기간', `${form.durationDays}일`],
                ['종료 예정', endDt ? endDt.toLocaleDateString('ko-KR') : '—'],
              ].map(([k, v]) => (
                <tr key={k}><th>{k}</th><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="policy-agree">
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 2, flexShrink: 0 }}
          />
          <span>위 상품등록 정보를 확인하였으며, 경매시작 후 본문수정이 불가능함에 동의합니다.</span>
        </label>
      </div>
    </div>
  );
}
