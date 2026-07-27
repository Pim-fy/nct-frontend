// src/pages/product/steps/RegisterConfirmStep.jsx
// Step 2: 등록 전 상품정보·경매조건 요약 확인 + 최종 동의
// Props: form, agreed, setAgreed, images, selectedCat, selectedTrade, endDt, maxImages
export default function RegisterConfirmStep({ form, agreed, setAgreed, images, selectedCat, selectedTrade, endDt, maxImages = 5 }) {
  const thumb = images[0]?.url;
  return (
    <div>
      <div className="card" style={{ background: '#fafaf8', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* 대표 이미지 — 왼쪽 */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 180, height: 180, borderRadius: 10, background: '#e5e4df', overflow: 'hidden' }}>
              {thumb
                ? <img src={thumb} alt="대표이미지" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 12, fontSize: 15, color: '#b0aea8', textAlign: 'center' }}>대표이미지가 없습니다</span>
              }
            </div>
            <span style={{ fontSize: 15, color: '#888780', fontWeight: 600 }}>대표이미지</span>
          </div>
          {/* 상품 정보 — 오른쪽: 텍스트 절반 + 이미지 절반 */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 16 }}>
            {/* 텍스트 정보 */}
            <div style={{ flex: 0.8, minWidth: 0 }}>
              <p style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600, color: '#5f5e5a' }}>미리보기</p>
              <h4 style={{ margin: '0 0 4px', fontSize: 20 }}>{form.prdNm || '상품명 미입력'}</h4>
              {[
                ['카테고리', selectedCat?.catNm || '미선택'],
                ['거래방식', selectedTrade?.label || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 15, color: '#888780', fontWeight: 600, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 17, color: '#5f5e5a' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginTop: 8 }}>
                {[
                  ['시작가', form.prdStartAmt ? Number(form.prdStartAmt).toLocaleString() + '원' : '—'],
                  ['즉시구매가', form.prdIbyAmt ? Number(form.prdIbyAmt).toLocaleString() + '원' : '미설정'],
                  ['입찰 단위', form.bidUnit ? form.bidUnit.toLocaleString() + '원' : '—'],
                  ['시작 시점', form.startNow ? '즉시 시작' : (form.reserveDt ? new Date(form.reserveDt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—')],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 15, color: '#888780', fontWeight: 600, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: 17, color: '#1a1a18', fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 6, alignItems: 'baseline', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 15, color: '#888780', fontWeight: 600, flexShrink: 0 }}>종료 예정</span>
                  <span style={{ fontSize: 17, color: '#1a1a18', fontWeight: 500, lineHeight: 1.4 }}>
                    {endDt
                      ? <>
                          {endDt.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                          <br />
                          {endDt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </>
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
            {/* 이미지 나열 — 텍스트보다 훨씬 넓게, 늘어난 가로에 맞춰 세로도 자연히 커짐 */}
            <div style={{ flex: 2.2, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ width: '100%', aspectRatio: `${maxImages} / 1`, border: '1px solid #e2e1dc', borderRadius: 10, background: '#f5f4f0', padding: 10, display: 'grid', gridTemplateColumns: `repeat(${maxImages}, 1fr)`, gap: 8, boxSizing: 'border-box' }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 6, overflow: 'hidden', background: '#e5e4df', border: idx === 0 ? '2px solid #0064ff' : '1px solid #e2e1dc' }}>
                    <img src={img.url} alt={`이미지${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {idx === 0 && (
                      <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,100,255,0.82)', color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center', padding: '2px 0' }}>대표</span>
                    )}
                  </div>
                ))}
                {Array.from({ length: Math.max(maxImages - images.length, 0) }, (_, i) => (
                  <div
                    key={`empty-${i}`}
                    style={{ width: '100%', height: '100%', borderRadius: 6, border: '1px dashed #d8d6cf', background: '#fafaf8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}
                  >
                    <span style={{ fontSize: 13, color: '#b0aea8', textAlign: 'center', lineHeight: 1.3 }}>등록된 이미지가 없습니다</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid-2" style={{ margin: '20px 0' }}>
        <div className="card">
          <h4 style={{ marginBottom: 12 }}>상품 정보</h4>
          <table style={{ border: '1px solid #d8d6cf', borderRadius: 10 }}>
            <tbody>
              {[
                ['상품명', form.prdNm],
                ['카테고리', selectedCat?.catNm || '—'],
                ['거래 방식', selectedTrade?.label || '—'],
                ['이미지', `${images.length}장 등록됨`],
              ].map(([k, v], i, arr) => (
                <tr key={k}><th style={{ background: '#eef2fb', borderBottom: i === arr.length - 1 ? 'none' : '1px solid #d8d6cf', borderRight: '1px solid #d8d6cf' }}>{k}</th><td style={{ borderLeft: '1px solid #d8d6cf' }}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h4 style={{ marginBottom: 12 }}>경매 조건</h4>
          <table style={{ border: '1px solid #d8d6cf', borderRadius: 10 }}>
            <tbody>
              {[
                ['시작가', form.prdStartAmt ? Number(form.prdStartAmt).toLocaleString() + '원' : '—'],
                ['즉시구매가', form.prdIbyAmt ? Number(form.prdIbyAmt).toLocaleString() + '원' : '미설정'],
                ['입찰 단위', form.bidUnit.toLocaleString() + '원'],
                ['경매 기간', `${form.durationDays}일`],
                ['종료 예정', endDt ? endDt.toLocaleDateString('ko-KR') : '—'],
              ].map(([k, v], i, arr) => (
                <tr key={k}><th style={{ background: '#eef2fb', borderBottom: i === arr.length - 1 ? 'none' : '1px solid #d8d6cf', borderRight: '1px solid #d8d6cf' }}>{k}</th><td style={{ borderLeft: '1px solid #d8d6cf' }}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="policy-agree">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            style={{ flexShrink: 0 }}
          />
          <span>위 상품등록 정보를 확인하였으며, 경매시작 후 본문수정이 불가능함에 동의합니다.</span>
        </label>
      </div>
    </div>
  );
}
