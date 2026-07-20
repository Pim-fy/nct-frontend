// src/pages/product/ProductDetailSellerPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// 판매자 경매 상세 페이지 — 등록한 상품의 경매 현황 및 상태별 관리 화면
// 목업: 06_auction_detail_seller.html 기반
// 라우트: /product/:prdSn/seller
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toImageUrl } from '@api/fileApi';
import { getProduct, postProductComment, fetchProductComments } from '@api/productApi';
import { getAuctionStatus, requestAuctionCancel } from '@api/auctionApi';
import Breadcrumb from '@components/common/Breadcrumb';
import ErrorMessage from '@components/common/ErrorMessage';
import ViewSkeleton from '@components/skeleton/ViewSkeleton';
import Toast from '@components/common/Toast';

// ─── 상수 정의 ───────────────────────────────────────────────────────────────
// 상태 코드(PRDC)별 한글 라벨 · 배지 클래스
// 거래방식 코드(TRDC)별 한글 라벨
// 취소 요청 사유 선택지
const STATUS_LABEL = {
  PRDC0001: '임시저장',
  PRDC0002: '진행중',
  PRDC0003: '종료',
  PRDC0004: '삭제',
};

const STATUS_BADGE = {
  PRDC0001: 'badge-gray',
  PRDC0002: 'badge-blue',
  PRDC0003: 'badge-gray',
  PRDC0004: 'badge-danger',
};

const TRADE_LABEL = {
  TRDC0009: '배송만',
  TRDC0010: '직거래만',
  TRDC0020: '둘 다 가능',
};

const CANCEL_REASONS = ['상품 상태 변경', '상품 정보 오류', '판매 진행 불가', '기타'];

export default function ProductDetailSellerPage() {
  const { prdSn } = useParams();
  const navigate = useNavigate();

  // ─── 상품 데이터 상태 ────────────────────────────────────────────────────
  const [product, setProduct] = useState(null);
  const [auctionStatus, setAuctionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ─── 추가 공지 상태 (F-AUC-007) ─────────────────────────────────────────
  const [comments, setComments] = useState([]);
  const [cmtTtl, setCmtTtl] = useState('');
  const [cmtCn, setCmtCn] = useState('');
  const [cmtSubmitting, setCmtSubmitting] = useState(false);

  // ─── 취소 요청 모달 상태 (F-AUC-008) ────────────────────────────────────
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDetail, setCancelDetail] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  // ─── 상품 정보 + 경매 현황 + 추가 공지 조회 ────────────────────────────
  useEffect(() => {
    setLoading(true);
    getProduct(prdSn)
      .then(res => {
        const p = res.data;
        setProduct(p);
        const sideLoads = [fetchProductComments(prdSn).then(setComments).catch(() => {})];
        if (p.prdStatusCd === 'PRDC0002') {
          sideLoads.push(getAuctionStatus(prdSn).then(auc => setAuctionStatus(auc)).catch(() => {}));
        }
        return Promise.all(sideLoads);
      })
      .catch(() => setError('상품 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [prdSn]);

  // ─── 취소 요청 제출 (F-AUC-008) ────────────────────────────────────────
  const handleCancelSubmit = async () => {
    if (!cancelReason) {
      alert('취소 사유를 선택해 주세요.');
      return;
    }
    if (!auctionStatus?.aucSn) {
      setToast('경매 정보를 불러오지 못했습니다.');
      return;
    }
    setCancelSubmitting(true);
    try {
      await requestAuctionCancel(auctionStatus.aucSn, { reason: cancelReason, detail: cancelDetail });
      setToast('취소 요청이 접수되었습니다.');
      setCancelOpen(false);
      setCancelReason('');
      setCancelDetail('');
    } catch {
      setToast('취소 요청에 실패했습니다.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  // ─── 추가 공지 등록 (F-AUC-007) ────────────────────────────────────────
  const handleCommentSubmit = async () => {
    if (!cmtTtl.trim()) {
      alert('제목을 입력해 주세요.');
      return;
    }
    setCmtSubmitting(true);
    try {
      await postProductComment(prdSn, { ttl: cmtTtl.trim(), cn: cmtCn.trim() || null });
      const updated = await fetchProductComments(prdSn);
      setComments(updated);
      setCmtTtl('');
      setCmtCn('');
      setToast('추가 공지가 등록되었습니다.');
    } catch {
      setToast('추가 공지 등록에 실패했습니다.');
    } finally {
      setCmtSubmitting(false);
    }
  };

  // ─── 취소 모달 닫기 및 입력 초기화 ─────────────────────────────────────
  const closeCancel = () => {
    setCancelOpen(false);
    setCancelReason('');
    setCancelDetail('');
  };

  if (loading) return <ViewSkeleton />;

  if (error || !product) {
    return (
      <main className="container seller-page">
        <ErrorMessage message={error || '상품 정보를 불러오지 못했습니다.'} />
      </main>
    );
  }

  // ─── 상태 파생값 ─────────────────────────────────────────────────────────
  // 상태 코드에 따라 렌더링 분기(가격 라벨·결과 텍스트·버튼·notice)에 사용
  const isActive = product.prdStatusCd === 'PRDC0002';
  const isEnded  = product.prdStatusCd === 'PRDC0003';
  const isDraft  = product.prdStatusCd === 'PRDC0001';

  const priceLabel = isActive ? '현재가' : '시작가';
  const priceAmt = isActive && auctionStatus?.aucCurAmt != null
    ? auctionStatus.aucCurAmt
    : product.prdStartAmt;

  const resultText = isActive
    ? '내가 등록한 경매가 진행 중입니다.'
    : isEnded
    ? '유효 입찰 없이 경매가 종료되었습니다.'
    : '임시저장 상태입니다. 경매 설정을 완료해 공개할 수 있습니다.';

  // TODO(F-AUC-008/F-AUC-006): 판매자 귀책 취소 확정 시 'danger-note'로 교체
  const noticeClass = 'notice';
  const noticeText = isActive
    ? '입찰자의 포인트가 홀딩되어 있어 취소 시 관리자 승인이 필요합니다.'
    : isEnded
    ? '유찰 건은 거래와 정산이 생성되지 않습니다.'
    : '임시저장 상품은 경매 설정 완료 후 공개됩니다.';

  return (
    <main className="container seller-page">
      <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '경매 활동 내역', href: '/product/me' }, { label: '상품 상세' }]} />
      {/* 페이지 헤더 */}
      <div className="seller-auction-head">
        <div>
          <h1>내 경매 상품 상세</h1>
          <p className="muted small">
            {auctionStatus ? `AUC-${auctionStatus.aucSn}` : `PRD-${product.prdSn}`}
            {product.prdRegDt && ` · ${new Date(product.prdRegDt).toLocaleDateString('ko-KR')} 등록`}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/product/me')}>
          ← 경매 활동 내역
        </button>
      </div>

      {/* 2컬럼 레이아웃 */}
      <div className="seller-auction-layout">

        {/* 왼쪽: 상품 정보 */}
        <section className="card">
          <div className="seller-product">
            {/* 대표이미지 (F-AUC-002) — 없으면 빈 placeholder 유지 */}
            <div className="seller-product-img">
              {product.prdImgUrl && (
                <img
                  src={toImageUrl(product.prdImgUrl)}
                  alt={product.prdNm}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
                />
              )}
            </div>

            <div>
              <div className="seller-status-row">
                <span className={`badge ${STATUS_BADGE[product.prdStatusCd] ?? 'badge-gray'}`}>
                  {STATUS_LABEL[product.prdStatusCd] ?? product.prdStatusCd}
                </span>
                <span className="badge badge-goods">판매</span>
              </div>

              <h2 style={{ fontSize: 22, lineHeight: 1.4, margin: '8px 0 0' }}>{product.prdNm}</h2>

              <p className="seller-price">
                {priceLabel} {priceAmt?.toLocaleString()}원
              </p>

              <p className="muted small" style={{ margin: 0, lineHeight: 1.65 }}>
                {product.catNm && `${product.catNm} · `}
                {TRADE_LABEL[product.prdTrdMethodCd] ?? product.prdTrdMethodCd}
                {product.prdIbyAmt != null && ` · 즉시구매 ${product.prdIbyAmt.toLocaleString()}원`}
              </p>
              <p className="muted small" style={{ margin: '6px 0 0' }}>{resultText}</p>
            </div>
          </div>

          {/* 경매 메트릭 (F-AUC-006) */}
          <div className="seller-metrics">
            <div className="seller-metric">
              <span>입찰 현황</span>
              <strong>{auctionStatus ? `${auctionStatus.bidCount}건` : '—'}</strong>
            </div>
            <div className="seller-metric">
              <span>관심 인원</span>
              <strong>—</strong>
            </div>
            <div className="seller-metric">
              <span>종료 정보</span>
              <strong>
                {auctionStatus?.aucEndDt
                  ? new Date(auctionStatus.aucEndDt).toLocaleDateString('ko-KR')
                  : '—'}
              </strong>
            </div>
          </div>

          <div className="seller-history">
            <p className="muted small" style={{ padding: '14px 2px' }}>
              경매 활동 이력은 AUCTION 연계 후 표시됩니다.
            </p>
          </div>
        </section>

        {/* 오른쪽: 상태별 관리 */}
        <aside className="card">
          <h3 style={{ margin: '0 0 6px', fontSize: 20 }}>상태별 관리</h3>

          {isActive && (
            <p className="muted small" style={{ marginBottom: 18, lineHeight: 1.65 }}>
              입찰이 시작된 상품은 핵심 정보 수정이 제한됩니다.
            </p>
          )}
          {isEnded && (
            <p className="muted small" style={{ marginBottom: 18, lineHeight: 1.65 }}>
              상품 정보를 보완해 같은 조건 또는 새 조건으로 다시 등록할 수 있습니다.
            </p>
          )}
          {isDraft && (
            <p className="muted small" style={{ marginBottom: 18, lineHeight: 1.65 }}>
              경매 설정을 완료해 공개할 수 있습니다.
            </p>
          )}

          <div className="seller-action-list">
            {isActive && (
              <>
                {/* TODO: 담당자5(옥동민) route /auction/:prdSn 확인 후 경로 수정 */}
                <button className="btn btn-outline" onClick={() => navigate(`/auction/${prdSn}`)}>
                  구매자 화면 보기
                </button>
                <button className="btn btn-danger" onClick={() => setCancelOpen(true)}>
                  경매 취소 요청
                </button>
              </>
            )}

            {isEnded && (
              <>
                <button className="btn btn-primary" onClick={() => navigate('/product/register')}>
                  다시 등록
                </button>
                <button className="btn btn-outline" onClick={() => navigate(`/auction/${prdSn}`)}>
                  종료 화면 보기
                </button>
              </>
            )}

            {isDraft && (
              <button className="btn btn-primary" onClick={() => navigate('/product/register')}>
                경매 설정 완료하기
              </button>
            )}
          </div>

          <div className={noticeClass} style={{ marginTop: 16 }}>
            {noticeText}
          </div>
        </aside>
      </div>

      {/* 추가 공지 섹션 (F-AUC-007) */}
      <section className="card" style={{ marginTop: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 20 }}>추가 공지 이력</h3>

        {/* 등록 폼 — 진행중 상태에서만 표시 */}
        {isActive && (
          <div style={{ marginBottom: 24 }}>
            <div className="field">
              <label>제목 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input
                type="text"
                maxLength={200}
                placeholder="추가 공지 제목을 입력해 주세요"
                value={cmtTtl}
                onChange={e => setCmtTtl(e.target.value)}
              />
            </div>
            <div className="field">
              <label>내용</label>
              <textarea
                rows={3}
                maxLength={4000}
                placeholder="구매자에게 전달할 내용을 입력해 주세요 (선택)"
                value={cmtCn}
                onChange={e => setCmtCn(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={handleCommentSubmit}
                disabled={cmtSubmitting}
              >
                {cmtSubmitting ? '등록 중...' : '공지 등록'}
              </button>
            </div>
          </div>
        )}

        {/* 공지 목록 — 최신 4개 */}
        {comments.length === 0 ? (
          <p className="muted small" style={{ padding: '12px 2px' }}>등록된 추가 공지가 없습니다.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {comments.map(c => (
              <li key={c.prdCmtSn} style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 14 }}>
                <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 15 }}>{c.prdCmtTtl}</p>
                {c.prdCmtCn && <p style={{ margin: '0 0 4px', fontSize: 14, whiteSpace: 'pre-wrap' }}>{c.prdCmtCn}</p>}
                <p className="muted small" style={{ margin: 0 }}>
                  {new Date(c.prdCmtRegDt).toLocaleString('ko-KR')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 경매 취소 요청 모달 (F-AUC-008) */}
      <div
        className={`modal ${cancelOpen ? 'open' : ''}`}
        onClick={e => { if (e.target === e.currentTarget) closeCancel(); }}
      >
        <div className="modal-box">
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>경매 취소 요청</h3>

          <div className="notice" style={{ marginBottom: 16 }}>
            {product.prdNm} · 시작가 {product.prdStartAmt?.toLocaleString()}원
          </div>

          <div className="field">
            <label>취소 사유 선택</label>
            <select
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            >
              <option value="">사유를 선택해 주세요</option>
              {CANCEL_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>상세 사유</label>
            <textarea
              rows={4}
              placeholder="선택한 사유를 보완하거나 직접 입력해 주세요"
              value={cancelDetail}
              onChange={e => setCancelDetail(e.target.value)}
            />
          </div>

          <p className="muted small" style={{ marginBottom: 16 }}>
            취소 요청은 관리자 승인 후 처리됩니다. 승인 전까지 경매와 입찰자의 포인트 홀딩은 유지됩니다.
          </p>

          <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" onClick={closeCancel}>닫기</button>
            <button
              className="btn btn-danger"
              onClick={handleCancelSubmit}
              disabled={cancelSubmitting}
            >
              {cancelSubmitting ? '요청 중...' : '취소 요청 제출'}
            </button>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </main>
  );
}
