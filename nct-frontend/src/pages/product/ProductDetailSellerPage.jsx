// src/pages/product/ProductDetailSellerPage.jsx
// 판매자 경매 상세 페이지 — 등록한 상품의 경매 현황 및 상태별 관리 화면
// 라우트: /product/:prdSn/seller
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toImageUrl } from '@api/fileApi';
import { getProduct, postProductComment, fetchProductComments, fetchProductInquiries, postInquiryReply } from '@api/productApi';
import { getAuctionStatus, requestAuctionCancel, fetchAuctionFavoriteStatus } from '@api/auctionApi';
import { TRADE_LABEL, STATUS_LABEL, STATUS_BADGE } from '@/constants/productConstants';
import useCountdown from '@hooks/useCountdown';
import Breadcrumb from '@components/common/Breadcrumb';
import ErrorMessage from '@components/common/ErrorMessage';
import ViewSkeleton from '@components/skeleton/ViewSkeleton';
import Toast from '@components/common/Toast';
import ConfirmModal from '@components/common/ConfirmModal';

const CANCEL_REASONS = ['상품 상태 변경', '상품 정보 오류', '판매 진행 불가', '기타'];

function groupInquiries(rawList) {
  const replies = rawList.filter(r => r.prdCmtTypeCd === 'PRDC0007');
  return rawList
    .filter(r => r.prdCmtTypeCd === 'PRDC0006')
    .map(q => ({
      inquirySn: q.prdCmtSn,
      usrNm: q.usrNm,
      content: q.prdCmtCn,
      regDt: new Date(q.prdCmtRegDt).toLocaleDateString('ko-KR'),
      reply: replies.find(r => r.prdCmtParentSn === q.prdCmtSn)?.prdCmtCn ?? null,
    }));
}

export default function ProductDetailSellerPage() {
  const { prdSn } = useParams();
  const navigate = useNavigate();

  const [product, setProduct]           = useState(null);
  const [auctionStatus, setAuctionStatus] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const now = useCountdown(!!auctionStatus?.aucEndDt);
  const remainTime = (() => {
    if (!auctionStatus?.aucEndDt) return '';
    const diff = new Date(auctionStatus.aucEndDt) - now;
    if (diff <= 0) return '종료';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const pad = n => String(n).padStart(2, '0');
    return d > 0 ? `${d}일 ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
  })();

  // 상품 수정 이력 (F-AUC-007)
  const [favoriteCount, setFavoriteCount] = useState(null);

  const [comments, setComments]         = useState([]);
  const [cmtTtl, setCmtTtl]             = useState('');
  const [cmtCn, setCmtCn]               = useState('');
  const [cmtSubmitting, setCmtSubmitting] = useState(false);

  // 구매자 문의 슬라이더
  const [inquiries, setInquiries]       = useState([]);
  const [inquiryIdx, setInquiryIdx]     = useState(0);
  const [slideDir, setSlideDir]         = useState('right');
  const [replyInput, setReplyInput]     = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [reportOpen, setReportOpen]           = useState(false);
  const [descOpen, setDescOpen]               = useState(false);

  // 취소 요청 모달 (F-AUC-008)
  const [cancelOpen, setCancelOpen]     = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [toast, setToast]               = useState('');

  useEffect(() => {
    setLoading(true);
    getProduct(prdSn)
      .then(res => {
        const p = res.data;
        setProduct(p);
        const sideLoads = [
          fetchProductComments(prdSn).then(r => setComments(r.data)).catch(() => {}),
          fetchProductInquiries(prdSn).then(r => setInquiries(groupInquiries(r.data))).catch(() => {}),
        ];
        if (p.prdStatusCd !== 'PRDC0001') {
          sideLoads.push(
            getAuctionStatus(prdSn)
              .then(auc => {
                setAuctionStatus(auc);
                return fetchAuctionFavoriteStatus(auc.aucSn);
              })
              .then(fav => setFavoriteCount(fav.favoriteCount))
              .catch(() => {})
          );
        }
        return Promise.all(sideLoads);
      })
      .catch(() => setError('상품 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [prdSn]);

  // 슬라이더 이동 시 답변 입력 초기화
  useEffect(() => { setReplyInput(''); }, [inquiryIdx]);

  const handleCancelSubmit = async () => {
    if (!cancelReason) { alert('취소 사유를 선택해 주세요.'); return; }
    if (!auctionStatus?.aucSn) { setToast('경매 정보를 불러오지 못했습니다.'); return; }
    setCancelSubmitting(true);
    try {
      await requestAuctionCancel(auctionStatus.aucSn, { reason: cancelReason });
      setToast('취소 요청이 접수되었습니다.');
      setCancelOpen(false);
      setCancelReason('');
      getAuctionStatus(prdSn).then(auc => setAuctionStatus(auc)).catch(() => {});
    } catch {
      setToast('취소 요청에 실패했습니다.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!cmtTtl.trim()) { alert('제목을 입력해 주세요.'); return; }
    setCmtSubmitting(true);
    try {
      await postProductComment(prdSn, { ttl: cmtTtl.trim(), cn: cmtCn.trim() || null });
      const updated = await fetchProductComments(prdSn);
      setComments(updated.data);
      setCmtTtl('');
      setCmtCn('');
      setToast('수정 이력이 등록되었습니다.');
    } catch {
      setToast('추가 공지 등록에 실패했습니다.');
    } finally {
      setCmtSubmitting(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyInput.trim()) { alert('답변 내용을 입력해 주세요.'); return; }
    const inquirySn = inquiries[inquiryIdx]?.inquirySn;
    if (!inquirySn) return;
    setReplySubmitting(true);
    try {
      await postInquiryReply(prdSn, inquirySn, { cn: replyInput.trim() });
      const updated = await fetchProductInquiries(prdSn);
      setInquiries(groupInquiries(updated.data));
      setReplyInput('');
      setToast('답변이 등록되었습니다.');
    } catch {
      setToast('답변 등록에 실패했습니다.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const closeCancel = () => { setCancelOpen(false); setCancelReason(''); };

  if (loading) return <ViewSkeleton />;
  if (error || !product) {
    return (
      <main className="container seller-page">
        <ErrorMessage message={error || '상품 정보를 불러오지 못했습니다.'} />
      </main>
    );
  }

  const isActive        = product.prdStatusCd === 'PRDC0002';
  const isEnded         = product.prdStatusCd === 'PRDC0003';
  const isDraft         = product.prdStatusCd === 'PRDC0001';
  const isCancelPending = isActive && auctionStatus?.aucStatusCd === 'AUCC0006';

  const priceLabel = isActive ? '현재가' : '시작가';
  const priceAmt   = isActive && auctionStatus?.aucCurAmt != null ? auctionStatus.aucCurAmt : product.prdStartAmt;

  const resultText = isCancelPending
    ? '취소 요청 검토 중입니다.'
    : isActive  ? '내가 등록한 경매가 진행 중입니다.'
    : isEnded   ? '유효 입찰 없이 경매가 종료되었습니다.'
    : '임시저장 상태입니다. 경매 설정을 완료해 공개할 수 있습니다.';

  const noticeClass = isCancelPending ? 'danger-note' : 'notice';
  const noticeText  = isCancelPending
    ? '취소 요청이 접수되었습니다. 관리자 검토 중이며 승인 전까지 입찰·즉시구매가 차단됩니다.'
    : isActive  ? '입찰자의 포인트가 홀딩되어 있어 취소 시 관리자 승인이 필요합니다.'
    : isEnded   ? '유찰 건은 거래와 정산이 생성되지 않습니다.'
    : '임시저장 상품은 경매 설정 완료 후 공개됩니다.';

  const currentInquiry = inquiries[inquiryIdx];
  const hasReply       = !!currentInquiry?.reply;

  return (
    <main className="container seller-page">
      <div style={{ marginTop: 24 }}>
        <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '상품 판매 내역', href: '/user/mypage?section=auction-sales' }, { label: '상품 상세' }]} />
      </div>

      <div className="seller-auction-head" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => navigate('/user/mypage?section=auction-sales')}>← 내 판매 내역</button>
      </div>

      {/* 2컬럼 레이아웃 */}
      <div className="seller-auction-layout" style={{ alignItems: 'stretch' }}>

        {/* 왼쪽: 상품 정보 */}
        <section className="card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
          <div style={{ background: '#eef2fb', padding: '14px 20px' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>상품 상세내용</h3>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="seller-product" style={{ alignItems: 'flex-start' }}>
            <div className="seller-product-img">
              {product.prdImgUrl && (
                <img src={toImageUrl(product.prdImgUrl)} alt={product.prdNm} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
              )}
            </div>
            <div>
              <div className="seller-status-row" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${STATUS_BADGE[product.prdStatusCd] ?? 'badge-gray'}`}>{STATUS_LABEL[product.prdStatusCd] ?? product.prdStatusCd}</span>
                  <span className="badge badge-goods">판매</span>
                </div>
                <p className="muted small" style={{ margin: 0 }}>
                  {auctionStatus ? `AUC-${auctionStatus.aucSn}` : `PRD-${product.prdSn}`}
                  {product.prdRegDt && ` · ${new Date(product.prdRegDt).toLocaleDateString('ko-KR')} 등록`}
                </p>
              </div>
              <h2 style={{ fontSize: 22, lineHeight: 1.4, margin: '8px 0 0' }}>{product.prdNm}</h2>
              <p className="seller-price">{priceLabel} {priceAmt?.toLocaleString()}원</p>
              <p className="muted small" style={{ margin: 0, lineHeight: 1.65 }}>
                {product.catNm && `${product.catNm} · `}
                {TRADE_LABEL[product.prdTrdMethodCd] ?? product.prdTrdMethodCd}
                {product.prdIbyAmt != null && ` · 즉시구매 ${product.prdIbyAmt.toLocaleString()}원`}
              </p>
              <p className="muted small" style={{ margin: '6px 0 0' }}>{resultText}</p>
            </div>
          </div>

          <div className="seller-metrics">
            <div className="seller-metric"><span>입찰 현황</span><strong>{auctionStatus ? `${auctionStatus.bidCount}건` : '—'}</strong></div>
            <div className="seller-metric"><span>관심 인원</span><strong>{favoriteCount != null ? `${favoriteCount}명` : '—'}</strong></div>
            <div className="seller-metric">
              <span>남은 시간</span>
              <strong>{remainTime || '—'}</strong>
              {auctionStatus?.aucEndDt && (
                <small className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {new Date(auctionStatus.aucEndDt).toLocaleString('ko-KR')} 종료
                  {auctionStatus.aucExtCnt > 0 && ` · 자동연장 ${auctionStatus.aucExtCnt}회`}
                </small>
              )}
            </div>
          </div>

          {product.prdCn && (
            <div style={{ marginTop: 18, borderTop: '1px solid #f0efec', paddingTop: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: 14, color: '#5f5e5a', fontWeight: 600 }}>상품 설명</p>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: '#1a1a18', overflow: 'hidden', maxHeight: descOpen ? 'none' : 72 }}>{product.prdCn}</p>
            </div>
          )}

          {product.prdCn && (
            <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: 16 }}>
              <button
                type="button"
                onClick={() => setDescOpen(v => !v)}
                style={{ fontSize: 13, color: '#5f5e5a', background: '#fff', border: '1px solid #e2e1dc', borderRadius: 8, padding: '6px 24px', cursor: 'pointer' }}
              >
                {descOpen ? '접기 ▲' : '더보기 ▼'}
              </button>
            </div>
          )}

          </div>{/* /padding div */}

        </section>

        {/* 오른쪽: 상태별 관리 + 상품 수정 이력 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <aside className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: '#eef2fb', padding: '14px 20px' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>상태별 관리</h3>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {isCancelPending && <p className="muted small" style={{ marginBottom: 18, lineHeight: 1.65 }}>취소 요청 검토 중입니다. 승인 시 경매가 취소되며 반려 시 경매가 재개됩니다.</p>}
              {isActive && !isCancelPending && <p className="muted small" style={{ marginBottom: 18, lineHeight: 1.65 }}>입찰이 시작된 상품은 핵심 정보 수정이 제한됩니다.</p>}
              {isDraft && <p className="muted small" style={{ marginBottom: 18, lineHeight: 1.65 }}>경매 설정을 완료해 공개할 수 있습니다.</p>}
              <div className="seller-action-list">
                {isActive && (
                  <>
                    <button className="btn btn-outline" onClick={() => auctionStatus?.aucSn && navigate(`/auction/${auctionStatus.aucSn}`)}>구매자 화면 보기</button>
                    {isCancelPending
                      ? <button className="btn btn-danger" disabled>취소 요청 검토 중</button>
                      : <button className="btn btn-danger" onClick={() => setCancelOpen(true)}>경매 취소 요청</button>
                    }
                  </>
                )}
                {isEnded && <button className="btn btn-outline" onClick={() => auctionStatus?.aucSn && navigate(`/auction/${auctionStatus.aucSn}`)}>종료 화면 보기</button>}
                {isDraft && <button className="btn btn-primary" onClick={() => navigate('/product/register', { state: { prdSn: Number(prdSn) } })}>경매 설정 완료하기</button>}
              </div>
              <div className={noticeClass} style={{ marginTop: 16 }}>{noticeText}</div>
            </div>
          </aside>

          {/* 상품 수정 이력 (F-AUC-007, 축소) */}
          <aside className="card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
            <div style={{ background: '#eef2fb', padding: '14px 20px' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>상품 내용 수정</h3>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {isActive && (
                <div style={{ marginBottom: 8 }}>
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="제목 (필수)"
                    value={cmtTtl}
                    onChange={e => setCmtTtl(e.target.value)}
                    style={{ width: '100%', marginBottom: 8, fontSize: 16 }}
                  />
                  <hr style={{ border: 'none', borderTop: '1px solid #f0efec', margin: '0 0 8px' }} />
                  <textarea
                    rows={3}
                    maxLength={4000}
                    placeholder="내용 (선택)"
                    value={cmtCn}
                    onChange={e => setCmtCn(e.target.value)}
                    style={{ width: '100%', fontSize: 16, resize: 'none', overflowY: 'auto' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                    <button className="btn btn-primary btn-sm" onClick={handleCommentSubmit} disabled={cmtSubmitting}>
                      {cmtSubmitting ? '등록 중...' : '등록'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* 하단: 구매자 문의 + 수정 내역 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(280px,1fr)', gap: 20, marginTop: 24, marginBottom: 48 }}>

      {/* 구매자 문의 */}
      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#eef2fb', padding: '14px 20px' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>구매자 문의</h3>
        </div>
        <div style={{ padding: '16px 20px' }}>
        {inquiries.length === 0 ? (
          <p className="muted" style={{ padding: '12px 2px', fontSize: 15 }}>등록된 문의가 없습니다.</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* 왼쪽 화살표 */}
              <button
                type="button"
                onClick={() => { setSlideDir('right'); setInquiryIdx(i => i - 1); }}
                disabled={inquiryIdx === 0}
                style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', border: '1px solid #d1d0cc', background: '#fff', fontSize: 22, cursor: inquiryIdx === 0 ? 'not-allowed' : 'pointer', opacity: inquiryIdx === 0 ? 0.3 : 1 }}
              >
                ‹
              </button>

              {/* 문의 카드 */}
              <div
                key={inquiryIdx}
                className={slideDir === 'left' ? 'slide-from-left' : 'slide-from-right'}
                style={{ flex: 1, border: '1px solid #f0efec', borderRadius: 12, padding: '22px 24px', minHeight: 260 }}
              >
                {/* 문의 내용 */}
                <div style={{ marginBottom: 18 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 14, color: '#969696' }}>
                    {currentInquiry.usrNm} · {currentInquiry.regDt}
                  </p>
                  <p style={{ margin: 0, fontSize: 18, lineHeight: 1.65 }}>{currentInquiry.content}</p>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid #f0efec', margin: '0 0 18px' }} />

                {/* 답변 영역 — 1:1 제한: 이미 답변된 경우 읽기 전용 */}
                {hasReply ? (
                  <div style={{ background: '#f8f8f6', borderRadius: 8, padding: '14px 16px' }}>
                    <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#0064ff' }}>판매자 답변</p>
                    <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65 }}>{currentInquiry.reply}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <textarea
                      rows={3}
                      placeholder="답변 내용을 입력해 주세요"
                      value={replyInput}
                      onChange={e => setReplyInput(e.target.value)}
                      style={{ flex: 1, fontSize: 17, resize: 'none', borderRadius: 8, border: '1px solid #d1d0cc', padding: '10px 14px' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => setReportOpen(true)}
                        style={{ color: '#a32d2d', borderColor: '#e8a0a0', background: '#fcebeb' }}
                      >
                        신고
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleReplySubmit}
                        disabled={replySubmitting}
                        style={{ marginTop: 'auto' }}
                      >
                        {replySubmitting ? '등록 중...' : '답변 등록'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 오른쪽 화살표 */}
              <button
                type="button"
                onClick={() => { setSlideDir('left'); setInquiryIdx(i => i + 1); }}
                disabled={inquiryIdx === inquiries.length - 1}
                style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', border: '1px solid #d1d0cc', background: '#fff', fontSize: 22, cursor: inquiryIdx === inquiries.length - 1 ? 'not-allowed' : 'pointer', opacity: inquiryIdx === inquiries.length - 1 ? 0.3 : 1 }}
              >
                ›
              </button>
            </div>

            <p className="muted small" style={{ textAlign: 'center', marginTop: 12, fontSize: 14 }}>
              {inquiryIdx + 1} / {inquiries.length}
            </p>
          </>
        )}
        </div>
      </section>

      {/* 수정 내역 */}
      <aside className="card" style={{ minHeight: 260, padding: 0, overflow: 'hidden' }}>
        <div style={{ background: '#eef2fb', padding: '14px 20px' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>수정 내역</h3>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {comments.length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>등록된 수정 내역이 없습니다.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto' }}>
              {comments.map((c, i) => (
                <li key={c.prdCmtSn} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottom: '1px solid #f0efec' }}>
                  <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: '#0064ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 16 }}>{c.prdCmtTtl}</p>
                    {c.prdCmtCn && <p style={{ margin: '0 0 4px', fontSize: 14, color: '#5f5e5a', whiteSpace: 'pre-wrap' }}>{c.prdCmtCn}</p>}
                    <p className="muted small" style={{ margin: 0, fontSize: 13 }}>{new Date(c.prdCmtRegDt).toLocaleDateString('ko-KR')}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      </div>{/* /하단 grid */}

      <ConfirmModal
        open={reportOpen}
        message="해당 구매자 문의를 신고하시겠습니까?"
        subMessage="※ 욕설 및 할인 요청 등 불필요한 문의내용이 포함되어 있을때 신고해주세요."
        confirmLabel="신고하기"
        onConfirm={() => { setReportOpen(false); setToast('신고가 접수되었습니다.'); }}
        onCancel={() => setReportOpen(false)}
      />

      {/* 경매 취소 요청 모달 (F-AUC-008) */}
      <div className={`modal ${cancelOpen ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) closeCancel(); }}>
        <div className="modal-box">
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>경매 취소 요청</h3>
          <div className="notice" style={{ marginBottom: 16 }}>
            {product.prdNm} · 시작가 {product.prdStartAmt?.toLocaleString()}원
          </div>
          <div className="field">
            <label>취소 사유 선택</label>
            <select value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
              <option value="">사유를 선택해 주세요</option>
              {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <p className="muted small" style={{ marginBottom: 16 }}>
            취소 요청은 관리자 승인 후 처리됩니다. 승인 전까지 경매와 입찰자의 포인트 홀딩은 유지됩니다.
          </p>
          <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={closeCancel}>닫기</button>
            <button className="btn btn-danger" onClick={handleCancelSubmit} disabled={cancelSubmitting}>
              {cancelSubmitting ? '요청 중...' : '취소 요청 제출'}
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </main>
  );
}
