// src/pages/service/ServiceRequestManagePage.jsx
// 서비스 요청서 관리 — 요청자 전용 견적 비교·선택·매칭 관리 (F-SVC-007, F-SVC-009, F-SVC-010)
// 라우트: /service-requests/:svcReqSn/manage
//
// 뼈대만 먼저 잡아둔 상태 — 견적 선택(F-SVC-009/010)은 QUOTE 잠금 포트(황성경3)·서비스 거래 생성
// 계약(정민재4)이 확정돼야 실제로 동작한다. 그 전까지 "선택하기" 버튼은 비활성화해 둔다.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { getServiceRequest } from '@api/serviceRequestApi';
import { getReceivedQuotes, selectQuoteAndCreateTrade } from '@api/quoteApi';
import ErrorMessage from '@components/common/ErrorMessage';
import ViewSkeleton from '@components/skeleton/ViewSkeleton';

const QUOTE_STATUS_LABEL = {
  QUTC0001: '제출됨',
  QUTC0002: '수정됨',
  QUTC0004: '선택됨',
  QUTC0005: '철회됨',
};

function fmtBudget(amt) {
  if (amt == null) return '예산 미정';
  return Number(amt).toLocaleString('ko-KR') + '원';
}

function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function ServiceRequestManagePage() {
  const { svcReqSn } = useParams();
  const navigate = useNavigate();
  const { user, isProvider } = useAuth();
  const authenticatedUserId = user?.id ?? user?.userId ?? user?.userSn ?? user?.usrSn;

  const [request, setRequest] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectingQuoteId, setSelectingQuoteId] = useState(null);

  const handleSelectQuote = async (quote) => {
    if (!['QUTC0001', 'QUTC0002'].includes(quote.statusCode)) return;
    if (!window.confirm('이 견적을 선택하면 거래와 보관금이 생성됩니다. 계속하시겠습니까?')) return;

    setSelectingQuoteId(quote.qutSn);
    setError('');
    try {
      const response = await selectQuoteAndCreateTrade(svcReqSn, quote.qutSn);
      const tradeId = response.data?.tradeId;
      if (!tradeId) throw new Error('거래 생성 결과를 확인할 수 없습니다.');
      navigate(`/service-trades/${tradeId}`);
    } catch (selectionError) {
      setError(selectionError.response?.data?.message || '견적 선택에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSelectingQuoteId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getServiceRequest(svcReqSn), getReceivedQuotes(svcReqSn)])
      .then(([reqRes, quotesRes]) => {
        if (cancelled) return;
        setRequest(reqRes.data);
        setQuotes(quotesRes.data ?? []);
        setError('');
      })
      .catch(() => {
        if (cancelled) return;
        setError('요청서 또는 견적 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [svcReqSn]);

  if (loading) return <ViewSkeleton />;
  if (error || !request) {
    return (
      <div className="container py-10">
        <ErrorMessage message={error || '요청서 정보를 불러오지 못했습니다.'} />
      </div>
    );
  }

  const isOwner = !isProvider
    && authenticatedUserId != null
    && String(authenticatedUserId) === String(request.usrSn);

  if (!isOwner) {
    return (
      <div className="container py-10">
        <ErrorMessage message="본인 요청서만 관리할 수 있습니다." />
      </div>
    );
  }

  return (
    <div className="bg-white pb-14 text-base leading-[1.6] text-[#1d1d1f]">
      <div className="container">

        <div className="flex items-center justify-between pt-9 pb-4">
          <h1 className="text-[28px] font-bold">견적 비교·선택</h1>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-[#e2e1dc] bg-white px-4 py-2.5 text-lg font-medium text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary"
            onClick={() => navigate(`/service-requests/${svcReqSn}`)}
          >
            ← 요청서 상세로
          </button>
        </div>

        <p className="mb-6 text-lg text-[#5f5e5a]">
          {request.svcReqTtl} · {fmtBudget(request.svcReqBdgtAmt)}
        </p>

        {/* 견적 비교 목록 (F-SVC-009) */}
        <section className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm">
          <div className="border-b border-[#e8e8e8] px-6 py-5">
            <h2 className="text-xl font-bold">받은 견적 비교</h2>
            <p className="mt-1 text-base text-[#5f5e5a]">
              마음에 드는 견적을 선택하면 해당 제공자와 매칭되고 거래가 시작됩니다.
            </p>
          </div>

          {quotes.length === 0 ? (
            <div className="px-6 py-10 text-center text-lg text-[#888780]">
              아직 도착한 견적이 없습니다.
            </div>
          ) : (
            <ul className="divide-y divide-[#e8e8e8]">
              {quotes.map(q => (
                <li key={q.qutSn} className="flex items-center justify-between gap-4 px-6 py-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1d1d1f]">{q.providerNm}</span>
                      <span className="shrink-0 rounded-lg bg-[#f0f0ee] px-3 py-1 text-sm font-medium text-[#5f5e5a]">
                        {QUOTE_STATUS_LABEL[q.statusCode] ?? q.statusCode}
                      </span>
                    </div>
                    <p className="mt-1 text-xl font-bold text-primary">{fmtBudget(q.amount)}</p>
                    {q.content && (
                      <p className="mt-1 line-clamp-2 text-base text-[#5f5e5a]">{q.content}</p>
                    )}
                    {/* 견적서 첨부파일 — 필드명은 황성경(3) QUOTE 구조 확정 전 임시(fileUrl/fileName), 확정되면 맞춰서 교체 */}
                    {q.fileUrl && (
                      <a
                        href={q.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-[#0048bf] hover:underline"
                      >
                        📎 {q.fileName || '첨부 견적서'}
                      </a>
                    )}
                    {q.registeredAt && (
                      <p className="mt-1 text-sm text-[#9a9ba5]">{fmtDate(q.registeredAt)} 제출</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectQuote(q)}
                    disabled={!['QUTC0001', 'QUTC0002'].includes(q.statusCode) || selectingQuoteId != null}
                    className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-lg font-semibold text-white transition-colors hover:bg-[#0048bf] disabled:cursor-not-allowed disabled:bg-[#e2e1dc] disabled:text-[#9a9ba5]"
                  >
                    선택하기
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 견적 변경이력 비교 (F-SVC-007) — 자리만 잡아둠 */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm">
          <div className="border-b border-[#e8e8e8] px-6 py-5">
            <h2 className="text-xl font-bold">견적 변경이력 비교</h2>
          </div>
          <div className="px-6 py-10 text-center text-lg text-[#888780]">
            준비 중인 기능입니다.
          </div>
        </section>

      </div>
    </div>
  );
}
