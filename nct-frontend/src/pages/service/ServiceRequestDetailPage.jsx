// src/pages/service/ServiceRequestDetailPage.jsx
// 서비스 요청서 상세 페이지 — 요청자 본인은 관리(수정/마감), 그 외에는 조회만 (F-SVC-003~004)
// 목업: 11_service_request_detail.html 기반 (견적 목록 패널은 QUOTE API 미구현이라 자리만 남겨둠 — 황성경 담당)
// 라우트 예정: /service-requests/:svcReqSn
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '@hooks/useAuth';
import { getServiceRequest, closeServiceRequest } from '@api/serviceRequestApi';
import ErrorMessage from '@components/common/ErrorMessage';
import ViewSkeleton from '@components/skeleton/ViewSkeleton';
import Toast from '@components/common/Toast';

const STATUS_LABEL = {
  SVCC0001: '임시저장',
  SVCC0002: '공개',
  SVCC0003: '매칭완료',
  SVCC0004: '종료',
};
const STATUS_BADGE = {
  SVCC0001: 'badge-gray',
  SVCC0002: 'badge-success',
  SVCC0003: 'badge-primary',
  SVCC0004: 'badge-gray',
};

const RICH_TEXT_SANITIZE = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'img', 'div', 'span'],
  ALLOWED_ATTR: ['src', 'style'],
};

export default function ServiceRequestDetailPage() {
  const { svcReqSn } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const authenticatedUserId = user?.id ?? user?.userId ?? user?.userSn ?? user?.usrSn;

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setLoading(true);
    getServiceRequest(svcReqSn)
      .then(res => setRequest(res.data))
      .catch(() => setError('요청서 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [svcReqSn]);

  const handleClose = async () => {
    setClosing(true);
    try {
      await closeServiceRequest(svcReqSn);
      setRequest(prev => ({ ...prev, svcReqStatusCd: 'SVCC0004' }));
      setToast('요청서를 마감했습니다.');
    } catch (err) {
      setToast(err.response?.data?.message || '마감에 실패했습니다.');
    } finally {
      setClosing(false);
    }
  };

  const handleQuoteClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    // TODO: 황성경(3) 소유 견적 작성 화면(02_제공자모드/12_quote_form.html) 라우트 확정되면 경로 교체
    navigate(`/quotes/new?svcReqSn=${svcReqSn}`);
  };

  if (loading) return <ViewSkeleton />;
  if (error || !request) {
    return (
      <main className="container seller-page">
        <ErrorMessage message={error || '요청서 정보를 불러오지 못했습니다.'} />
      </main>
    );
  }

  const isOwner = authenticatedUserId != null && String(authenticatedUserId) === String(request.usrSn);
  const isDraft = request.svcReqStatusCd === 'SVCC0001';
  const isOpen = request.svcReqStatusCd === 'SVCC0002';

  return (
    <main className="container seller-page">
      <div className="row" style={{ justifyContent: 'flex-end', margin: '40px 0 16px' }}>
        <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>← 목록으로</button>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(320px,380px)', gap: 24, alignItems: 'start' }}>
        <article className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid #f0efec' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="row" style={{ gap: 8 }}>
                {request.catNm && <span className="badge badge-blue">{request.catNm}</span>}
                <span className={`badge ${STATUS_BADGE[request.svcReqStatusCd] ?? 'badge-gray'}`}>
                  {STATUS_LABEL[request.svcReqStatusCd] ?? request.svcReqStatusCd}
                </span>
              </div>
              {isOwner && isDraft && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/service-requests/new', { state: { svcReqSn: Number(svcReqSn) } })}
                >
                  이어서 작성
                </button>
              )}
              {isOwner && isOpen && (
                <button type="button" className="btn btn-danger" onClick={handleClose} disabled={closing}>
                  {closing ? '마감 중...' : '요청 마감'}
                </button>
              )}
              {!isOwner && isOpen && (
                <button type="button" className="btn btn-primary" onClick={handleQuoteClick}>
                  견적 작성하기
                </button>
              )}
            </div>
            <h1 style={{ margin: '14px 0 4px', fontSize: 22 }}>{request.svcReqTtl}</h1>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              {request.svcReqBdgtAmt != null ? `예산 ${Number(request.svcReqBdgtAmt).toLocaleString()}원` : '예산 미정'}
              {request.svcReqRegDt && ` · ${new Date(request.svcReqRegDt).toLocaleDateString('ko-KR')} 등록`}
            </p>
          </div>

          {request.items?.length > 0 && (
            <div style={{ padding: '18px 24px 0' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>요청 항목</h3>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
                {request.items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            </div>
          )}

          <div style={{ padding: '22px 24px 24px' }}>
            {request.svcReqCn
              ? (
                <div
                  className="rich-text-editor-body"
                  style={{ fontSize: 15, lineHeight: 1.8, color: '#1a1a18', padding: 0 }}
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(request.svcReqCn, RICH_TEXT_SANITIZE) }}
                />
              )
              : <p className="muted">등록된 설명이 없습니다.</p>}
          </div>
        </article>

        <aside className="card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: 84 }}>
          <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid #f0efec' }}>
            <h2 style={{ margin: 0, fontSize: 20 }}>도착한 견적</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: 14 }}>견적을 선택하면 상세 내용과 제공자 리뷰를 확인할 수 있습니다.</p>
          </div>
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p className="muted">아직 도착한 견적이 없습니다.</p>
          </div>
        </aside>
      </section>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </main>
  );
}
