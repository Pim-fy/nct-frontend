// src/pages/service/QuoteDetailPage.jsx
// 받은 견적 상세 — 요청자가 도착한 견적 하나를 자세히 보고 신고·선택할 수 있는 화면
// 라우트: /service-requests/:svcReqSn/quotes/:quoteId
//
// 목록에서 클릭할 때 넘겨준 견적 데이터를 우선 쓰고(location.state.quote), 새로고침 등으로
// state가 없으면 받은 견적 목록을 다시 불러와 quoteId로 찾아 복구한다.
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getReceivedQuotes, getQuoteHistory, selectQuoteAndCreateTrade } from '@api/quoteApi';
import ReportModal from '@components/common/ReportModal';
import ErrorMessage from '@components/common/ErrorMessage';
import ViewSkeleton from '@components/skeleton/ViewSkeleton';
import Toast from '@components/common/Toast';

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

export default function QuoteDetailPage() {
  const { svcReqSn, quoteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [quote, setQuote] = useState(location.state?.quote ?? null);
  const [loading, setLoading] = useState(!location.state?.quote);
  const [error, setError] = useState('');

  const [quoteHistory, setQuoteHistory] = useState([]);
  const [quoteHistoryLoading, setQuoteHistoryLoading] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [toast, setToast] = useState('');

  // state로 못 받은 경우(새로고침 등) 목록을 다시 불러와 복구
  useEffect(() => {
    if (quote) return;
    let cancelled = false;
    getReceivedQuotes(svcReqSn)
      .then(res => {
        if (cancelled) return;
        const found = (res.data ?? []).find(q => String(q.qutSn) === String(quoteId));
        if (!found) {
          setError('견적 정보를 찾을 수 없습니다.');
        } else {
          setQuote(found);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setError('견적 정보를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [quote, svcReqSn, quoteId]);

  useEffect(() => {
    if (!quote || !(quote.reviseCnt > 0)) return;
    let cancelled = false;
    setQuoteHistoryLoading(true);
    getQuoteHistory(quote.qutSn)
      .then(res => {
        if (cancelled) return;
        setQuoteHistory(res.data ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setQuoteHistory([]);
      })
      .finally(() => {
        if (cancelled) return;
        setQuoteHistoryLoading(false);
      });
    return () => { cancelled = true; };
  }, [quote]);

  // F-SVC-009/010: 조우진(7)이 통합한 선택+거래생성 계약 — 성공하면 서비스 거래 상세로 이동
  const handleSelectQuote = async () => {
    setSelecting(true);
    try {
      const result = await selectQuoteAndCreateTrade(svcReqSn, quote.qutSn);
      navigate(`/service-trades/${result.data.tradeId}`);
    } catch (err) {
      setToast(err.response?.data?.message || '견적 선택에 실패했습니다.');
    } finally {
      setSelecting(false);
    }
  };

  if (loading) return <ViewSkeleton />;
  if (error || !quote) {
    return (
      <div className="container py-10">
        <ErrorMessage message={error || '견적 정보를 불러오지 못했습니다.'} />
      </div>
    );
  }

  return (
    <div className="bg-white pb-14 text-base leading-[1.6] text-[#1d1d1f]">
      <div className="container max-w-2xl">

        <div className="flex justify-end pt-9 pb-4">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-[#e2e1dc] bg-white px-4 py-2.5 text-lg font-medium text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary"
            onClick={() => navigate(-1)}
          >
            ← 요청서 상세로
          </button>
        </div>

        <article className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-[#1d1d1f]">{quote.providerNm}</h1>
            <span className="shrink-0 rounded-lg bg-[#f0f0ee] px-3 py-1 text-sm font-medium text-[#5f5e5a]">
              {QUOTE_STATUS_LABEL[quote.statusCode] ?? quote.statusCode}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-primary">{fmtBudget(quote.amount)}</p>
          {quote.content && (
            <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-[#1d1d1f]">{quote.content}</p>
          )}
          {quote.attachments?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {quote.attachments.map(f => (
                <a
                  key={f.flSn}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e1dc] px-3 py-2 text-sm font-medium text-[#0048bf] hover:border-primary hover:bg-[#e5efff]"
                >
                  📎 {f.fileName}
                </a>
              ))}
            </div>
          )}
          <p className="mt-3 text-sm text-[#9a9ba5]">
            {fmtDate(quote.registeredAt)} 제출
            {quote.reviseCnt > 0 && ` · ${quote.reviseCnt}회 수정됨`}
          </p>

          {quote.reviseCnt > 0 && (
            <div className="mt-5 border-t border-[#e8e8e8] pt-4">
              <h2 className="mb-2 text-base font-semibold text-[#5f5e5a]">수정 이력</h2>
              {quoteHistoryLoading ? (
                <p className="text-sm text-[#9a9ba5]">불러오는 중...</p>
              ) : quoteHistory.length === 0 ? (
                <p className="text-sm text-[#9a9ba5]">이력이 없습니다.</p>
              ) : (
                <ul className="space-y-3">
                  {quoteHistory.map(h => (
                    <li key={h.qutHstSn} className="rounded-lg bg-[#f9fafb] p-3">
                      <p className="font-semibold text-[#1d1d1f]">{fmtBudget(h.amount)}</p>
                      {h.content && <p className="mt-1 whitespace-pre-line text-sm text-[#5f5e5a]">{h.content}</p>}
                      <p className="mt-1 text-xs text-[#9a9ba5]">{fmtDate(h.registeredAt)} 수정 전 내용</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* 신고: 황성경(3) 공용 ReportModal 연동. 선택하기: 조우진(7)의 선택+거래생성 계약 연동(F-SVC-009/010). */}
          <div className="mt-6 flex items-center justify-between gap-2 border-t border-[#e8e8e8] pt-5">
            <button
              type="button"
              onClick={() => setReportTarget({
                qutSn: quote.qutSn,
                providerUsrSn: quote.providerUsrSn,
                providerNm: quote.providerNm,
                svcReqSn,
              })}
              className="rounded-lg border border-[#e2e1dc] px-4 py-2 text-sm font-semibold text-[#a32d2d] transition-colors hover:bg-[#fcebeb]"
            >
              신고
            </button>
            {quote.statusCode !== 'QUTC0004' && quote.statusCode !== 'QUTC0005' && (
              <button
                type="button"
                onClick={handleSelectQuote}
                disabled={selecting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0048bf] disabled:opacity-50"
              >
                {selecting ? '처리 중...' : '이 견적 선택하기'}
              </button>
            )}
          </div>
        </article>

      </div>

      {reportTarget && (
        <ReportModal
          open={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetName={reportTarget.providerNm}
          targetType="service"
          referenceSn={reportTarget.svcReqSn}
          reportedUserSn={reportTarget.providerUsrSn}
          contextLabel={`견적 제공자: ${reportTarget.providerNm}`}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
