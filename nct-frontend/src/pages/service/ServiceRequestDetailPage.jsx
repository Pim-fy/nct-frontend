// src/pages/service/ServiceRequestDetailPage.jsx
// 서비스 요청서 상세 — 요청자 본인(마감/이어서작성) / 타인+로그인(견적제출) / 비로그인(로그인유도)
// 라우트: /service-requests/:svcReqSn
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

const STATUS_BADGE_CLASS = {
  SVCC0001: 'bg-[#f0f0ee] text-[#5f5e5a]',
  SVCC0002: 'bg-[#e5efff] text-[#0048bf]',
  SVCC0003: 'bg-[#e8f0fe] text-[#1a56a4]',
  SVCC0004: 'bg-[#f0f0ee] text-[#5f5e5a]',
};

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'div', 'span'],
  ALLOWED_ATTR: ['style'],
};

function parseItem(raw) {
  const idx = raw.indexOf(': ');
  if (idx === -1) return { label: null, value: raw };
  return { label: raw.slice(0, idx), value: raw.slice(idx + 2) };
}

function fmtBudget(amt) {
  if (amt == null) return '예산 미정';
  return Number(amt).toLocaleString('ko-KR') + '원';
}

function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

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
    // TODO: 황성경(3) 견적 작성 라우트 확정 후 경로 교체
    navigate(`/quotes/new?svcReqSn=${svcReqSn}`);
  };

  if (loading) return <ViewSkeleton />;
  if (error || !request) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-6 py-10">
        <ErrorMessage message={error || '요청서 정보를 불러오지 못했습니다.'} />
      </div>
    );
  }

  const isOwner = authenticatedUserId != null && String(authenticatedUserId) === String(request.usrSn);
  const isDraft = request.svcReqStatusCd === 'SVCC0001';
  const isOpen  = request.svcReqStatusCd === 'SVCC0002';

  const parsedItems = (request.items ?? []).map(parseItem);

  const statusBadgeClass = STATUS_BADGE_CLASS[request.svcReqStatusCd] ?? 'bg-[#f0f0ee] text-[#5f5e5a]';
  const statusLabel      = STATUS_LABEL[request.svcReqStatusCd] ?? request.svcReqStatusCd;

  return (
    <div className="bg-white pb-14 text-base leading-[1.6] text-[#1d1d1f]">
      <div className="mx-auto w-full max-w-[1600px] px-4 lg:px-6">

        {/* 뒤로가기 */}
        <div className="flex justify-end pt-9 pb-4">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-[#e2e1dc] bg-white px-4 py-2 text-sm font-medium text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary"
            onClick={() => navigate(-1)}
          >
            ← 목록으로
          </button>
        </div>

        {/* 2열 레이아웃 */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_minmax(340px,420px)]">

          {/* ── 왼쪽: 요청 정보 카드 ── */}
          <article className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm">

            {/* 헤더 */}
            <div className="border-b border-[#e8e8e8] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {request.catNm && (
                    <span className="rounded-md bg-[#f0eeff] px-2.5 py-0.5 text-xs font-semibold text-[#4a36b0]">
                      {request.catNm}
                    </span>
                  )}
                  <span className={`rounded-md px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* 요청자 본인 액션 */}
                {isOwner && isDraft && (
                  <button
                    type="button"
                    className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0048bf]"
                    onClick={() => navigate('/service-requests/new', { state: { svcReqSn: Number(svcReqSn) } })}
                  >
                    이어서 작성
                  </button>
                )}
                {isOwner && isOpen && (
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-[#a32d2d] bg-white px-4 py-2 text-sm font-semibold text-[#a32d2d] transition-colors hover:bg-[#fcebeb] disabled:opacity-50"
                    onClick={handleClose}
                    disabled={closing}
                  >
                    {closing ? '마감 중...' : '요청 마감'}
                  </button>
                )}
              </div>

              <h1 className="mt-3 text-xl font-bold leading-[1.4]">{request.svcReqTtl}</h1>
              <p className="mt-1 text-sm text-[#5f5e5a]">
                {fmtBudget(request.svcReqBdgtAmt)}
                {request.svcReqRegDt && <span className="ml-2">· {fmtDate(request.svcReqRegDt)} 등록</span>}
              </p>
            </div>

            {/* 요청 항목 (위저드 답변) */}
            {parsedItems.length > 0 && (
              <div className="border-b border-[#e8e8e8] px-6 py-5">
                <h2 className="mb-3 text-sm font-semibold text-[#5f5e5a]">요청 항목</h2>
                <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
                  {parsedItems.map((item, i) => (
                    <div
                      key={i}
                      className="border-b border-[#e8e8e8] px-1 py-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
                    >
                      {item.label && (
                        <span className="mb-1 block text-xs text-[#888780]">{item.label}</span>
                      )}
                      <strong className="block text-sm font-semibold text-[#1d1d1f]">{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 요청 원문 */}
            <div className="px-6 py-5">
              {request.svcReqCn ? (
                <div
                  className="border-l-[3px] border-primary pl-4 text-sm leading-[1.9] text-[#1d1d1f] whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(request.svcReqCn, SANITIZE_CONFIG) }}
                />
              ) : (
                <p className="text-sm text-[#888780]">등록된 설명이 없습니다.</p>
              )}
            </div>
          </article>

          {/* ── 오른쪽: 견적 패널 ── */}
          <aside className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm lg:sticky lg:top-[84px]">

            {/* 패널 헤더 */}
            <div className="border-b border-[#e8e8e8] px-5 py-4">
              <h2 className="text-lg font-bold">도착한 견적</h2>
              <p className="mt-0.5 text-sm text-[#5f5e5a]">견적을 선택하면 상세 내용과 제공자 리뷰를 확인할 수 있습니다.</p>
            </div>

            {/* 액션 영역 */}
            {!isOwner && (
              <div className="border-b border-[#e8e8e8] px-5 py-4">
                {isAuthenticated ? (
                  isOpen ? (
                    <button
                      type="button"
                      className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-[#0048bf]"
                      onClick={handleQuoteClick}
                    >
                      견적 제출하기
                    </button>
                  ) : (
                    <p className="text-center text-sm text-[#888780]">견적 접수가 종료된 요청입니다.</p>
                  )
                ) : (
                  <div className="text-center">
                    <p className="mb-3 text-sm text-[#5f5e5a]">견적을 제출하려면 로그인이 필요합니다.</p>
                    <button
                      type="button"
                      className="w-full rounded-lg border border-primary py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-[#e5efff]"
                      onClick={() => navigate('/login', { state: { from: location } })}
                    >
                      로그인하기
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 견적 목록 자리 — 황성경(3) QUOTE API 구현 후 연동 */}
            <div className="px-5 py-6 text-center text-sm text-[#888780]">
              아직 도착한 견적이 없습니다.
            </div>
          </aside>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
