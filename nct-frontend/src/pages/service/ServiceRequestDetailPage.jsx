// src/pages/service/ServiceRequestDetailPage.jsx
// 서비스 요청서 상세 — 요청자 본인(마감/이어서작성) / 타인+로그인(견적제출) / 비로그인(로그인유도)
// 라우트: /service-requests/:svcReqSn
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { getServiceRequest, closeServiceRequest } from '@api/serviceRequestApi';
import { getReceivedQuotes } from '@api/quoteApi';
import { toImageUrl } from '@api/fileApi';
import ErrorMessage from '@components/common/ErrorMessage';
import ViewSkeleton from '@components/skeleton/ViewSkeleton';
import Toast from '@components/common/Toast';
import HeaderSearchPortal, {
  SimpleHeaderSearch,
} from '@components/common/HeaderSearchPortal';
import { CATEGORY_META } from './serviceRequestWizardSteps';

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

const QUOTE_STATUS_LABEL = {
  QUTC0001: '제출됨',
  QUTC0002: '수정됨',
  QUTC0004: '선택됨',
  QUTC0005: '철회됨',
};

function parseItem(raw) {
  const idx = raw.indexOf(': ');
  if (idx === -1) return { label: null, value: raw };
  return { label: raw.slice(0, idx), value: raw.slice(idx + 2) };
}

// 위저드에서 넘어오는 원본 형태: "{단계 제목}: {필드1}: {값1} / {필드2}: {값2} / ..."
// 맨 앞 단계 제목을 떼어내고, 나머지를 " / " 기준으로 필드별로 나눈다
function parseItemGroup(raw) {
  const titleIdx = raw.indexOf(': ');
  if (titleIdx === -1) return { title: raw, fields: [] };
  const title = raw.slice(0, titleIdx);
  const rest = raw.slice(titleIdx + 2);
  const fields = rest.split(' / ').map(parseItem);
  return { title, fields };
}

// "출발지 주소" → { prefix: "출발지", suffix: "주소" } — 접두어가 없으면 prefix는 null
function splitLabel(label) {
  if (!label) return { prefix: null, suffix: null };
  const spaceIdx = label.indexOf(' ');
  if (spaceIdx === -1) return { prefix: null, suffix: label };
  return { prefix: label.slice(0, spaceIdx), suffix: label.slice(spaceIdx + 1) };
}

// 같은 접두어(예: "출발지")가 필드 라벨 2개 이상에서 반복될 때만 "출발지"/"도착지"처럼
// 묶음 제목으로 보여주고 나머지 라벨만 표시한다. 1번만 나오는 접두어는 원래 라벨 그대로 둔다
// (예: "거주 인원"을 "거주"+"인원"으로 잘못 쪼개는 걸 방지)
function groupByLabelPrefix(fields) {
  const prefixCounts = new Map();
  fields.forEach(f => {
    const { prefix } = splitLabel(f.label);
    if (prefix) prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
  });

  const groups = [];
  const indexByPrefix = new Map();
  fields.forEach(f => {
    const { prefix, suffix } = splitLabel(f.label);
    const isRealGroup = prefix && prefixCounts.get(prefix) >= 2;
    if (isRealGroup && indexByPrefix.has(prefix)) {
      groups[indexByPrefix.get(prefix)].items.push({ label: suffix, value: f.value });
    } else if (isRealGroup) {
      indexByPrefix.set(prefix, groups.length);
      groups.push({ title: prefix, items: [{ label: suffix, value: f.value }] });
    } else {
      groups.push({ title: null, items: [{ label: f.label, value: f.value }] });
    }
  });
  return groups;
}

// "옮길 가전 (복수 선택)"처럼 뒤에 괄호 안내문이 붙는 제목은 두 줄로 자연스럽게 나눠 보여준다
function renderStepTitle(title) {
  const suffix = ' (복수 선택)';
  if (!title.endsWith(suffix)) return title;
  return (
    <>
      {title.slice(0, -suffix.length)}
      <br />
      (복수 선택)
    </>
  );
}

// 위저드에서 답변한 순서를 확인할 수 있도록 제목 앞에 번호를 붙인다
function renderThLabel(entry) {
  return (
    <>
      <span className="mr-1.5 text-[#9a9ba5]">{entry.number}.</span>
      {renderStepTitle(entry.title)}
    </>
  );
}

// 항목 하나의 값 영역 — 출발지/도착지처럼 실제로 묶이는 필드는 옅은 구분선으로 나눠 보여준다
// (양쪽 다 같은 간격을 갖도록 첫 칸엔 오른쪽 여백, 이후 칸엔 왼쪽 여백+구분선을 준다 — 폭이 한쪽으로 치우쳐 보이는 것 방지)
function renderEntryValue(entry) {
  const subGroups = groupByLabelPrefix(entry.fields);
  return (
    <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${subGroups.length || 1}, minmax(0, 1fr))` }}>
      {subGroups.map((sub, k) => (
        <div
          key={k}
          className={`flex flex-col gap-2 divide-y divide-[#eee] ${k > 0 ? 'border-l border-[#e2e1dc] pl-5' : ''} ${k < subGroups.length - 1 ? 'pr-5' : ''}`}
        >
          {sub.title && (
            <span className="pb-2 text-base font-bold text-[#1d1d1f]">{sub.title}</span>
          )}
          {sub.items.map((item, j) => (
            <div key={j} className={j === 0 ? '' : 'pt-2'}>
              {item.label && (
                <span className="mb-0.5 block text-base text-[#888780]">{item.label}</span>
              )}
              <strong className="block whitespace-pre-line font-semibold text-[#1d1d1f]">{item.value}</strong>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// 특이사항 메모 단계 제목 — SVC_REQ_ITEM이 아니라 SERVICE_REQUEST.SVC_REQ_CN에 별도 저장되므로
// 표에는 상세 조회 시점에 마지막 항목으로 합쳐서 보여준다
const MEMO_TITLE = '특이사항 메모';

// 짝을 지어도 되는데도 항상 한 행 전체를 써야 하는 항목 — 선택 항목이 많아질 수 있어 공간이 필요함
const ALWAYS_FULL_WIDTH_TITLES = ['추가 옵션 (복수 선택)', MEMO_TITLE];

// 옆 항목과 성격이 안 맞아 항상 혼자(빈 칸과) 두는 항목 — 옮길 가전/가구끼리 짝지어지도록 사이에 끼지 않게 함
const ALWAYS_ALONE_TITLES = ['평수·거주 인원'];

// 필드가 적은 단순 항목(건물 유형, 옮길 가전, 옮길 가구 등)은 내용이 짧아 한 줄을 다 차지하면
// 허전하므로 한 행에 2개씩 짝지어 채운다. 짝이 없이 하나만 남으면 나머지 절반은 빈 칸으로 둔다.
// 필드가 많은 항목(출발지·도착지 등)과 ALWAYS_FULL_WIDTH_TITLES는 그대로 한 행 전체를 쓴다.
// ALWAYS_ALONE_TITLES는 다른 항목과 짝짓지 않고 항상 혼자(빈 칸과 짝) 둔다
function buildTableRows(entries) {
  const rows = [];
  let pending = null;
  entries.forEach(entry => {
    const isFullWidth = ALWAYS_FULL_WIDTH_TITLES.includes(entry.title) || entry.fields.length > 2;
    const isAlone = ALWAYS_ALONE_TITLES.includes(entry.title);
    const isSimple = !isFullWidth && !isAlone;
    if (isSimple) {
      if (pending) {
        rows.push([pending, entry]);
        pending = null;
      } else {
        pending = entry;
      }
    } else {
      if (pending) { rows.push([pending, null]); pending = null; }
      rows.push(isAlone ? [entry, null] : [entry]);
    }
  });
  if (pending) rows.push([pending, null]);
  return rows;
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
  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const headerSearch = (
    <HeaderSearchPortal>
      <SimpleHeaderSearch
        onSearch={(keyword) => navigate(`/service?keyword=${encodeURIComponent(keyword)}`)}
        placeholder="필요한 서비스 요청을 검색하세요"
      />
    </HeaderSearchPortal>
  );

  useEffect(() => {
    setLoading(true);
    getServiceRequest(svcReqSn)
      .then(res => setRequest(res.data))
      .catch(() => setError('요청서 정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [svcReqSn]);

  // 견적 목록은 요청서 본인만 조회 가능(백엔드에서 NOT_RESOURCE_OWNER로 차단) — 요청서 로드 후 본인 확인되면 조회
  useEffect(() => {
    if (!request) return;
    const owner = authenticatedUserId != null && String(authenticatedUserId) === String(request.usrSn);
    if (!owner) return;
    setQuotesLoading(true);
    getReceivedQuotes(svcReqSn)
      .then(res => setQuotes(res.data ?? []))
      .catch(() => setQuotes([]))
      .finally(() => setQuotesLoading(false));
  }, [request, svcReqSn, authenticatedUserId]);

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
    // QuoteFormPage(황성경3 소유)는 svcReqSn 등을 쿼리스트링이 아니라 router state로 받는다
    navigate('/provider/quotes/new', {
      state: {
        svcReqSn,
        svcReqTitle: request.svcReqTtl,
        category: request.catNm,
        budget: fmtBudget(request.svcReqBdgtAmt),
      },
    });
  };

  if (loading) {
    return (
      <>
        {headerSearch}
        <ViewSkeleton />
      </>
    );
  }
  if (error || !request) {
    return (
      <>
        {headerSearch}
        <div className="container py-10">
          <ErrorMessage message={error || '요청서 정보를 불러오지 못했습니다.'} />
        </div>
      </>
    );
  }

  const isOwner = authenticatedUserId != null && String(authenticatedUserId) === String(request.usrSn);
  const isDraft = request.svcReqStatusCd === 'SVCC0001';
  const isOpen  = request.svcReqStatusCd === 'SVCC0002';

  const parsedItems = (request.items ?? []).map(parseItemGroup);
  parsedItems.push({ title: MEMO_TITLE, fields: [{ label: null, value: request.svcReqCn ?? '' }] });

  const statusBadgeClass = STATUS_BADGE_CLASS[request.svcReqStatusCd] ?? 'bg-[#f0f0ee] text-[#5f5e5a]';
  const statusLabel      = STATUS_LABEL[request.svcReqStatusCd] ?? request.svcReqStatusCd;
  const categoryColor    = CATEGORY_META[request.catNm]?.color ?? '#4a36b0';

  return (
    <>
      {headerSearch}
      <div className="bg-white pb-14 text-base leading-[1.6] text-[#1d1d1f]">
        <div className="container">

        {/* 뒤로가기 */}
        <div className="flex justify-end pt-9 pb-4">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-[#e2e1dc] bg-white px-4 py-2.5 text-lg font-medium text-[#5f5e5a] transition-colors hover:border-primary hover:text-primary"
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
                <div className="flex flex-wrap items-center gap-3">
                  {request.catNm && (
                    <span
                      className="rounded-lg px-4 py-1.5 text-lg font-bold"
                      style={{ backgroundColor: `${categoryColor}1a`, color: categoryColor }}
                    >
                      {request.catNm}
                    </span>
                  )}
                  <span className={`rounded-lg px-4 py-1.5 text-lg font-bold ${statusBadgeClass}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* 요청자 본인 액션 */}
                {isOwner && isDraft && (
                  <button
                    type="button"
                    className="shrink-0 rounded-lg bg-primary px-4 py-2.5 text-lg font-semibold text-white transition-colors hover:bg-[#0048bf]"
                    onClick={() => navigate('/service-requests/new', { state: { svcReqSn: Number(svcReqSn) } })}
                  >
                    이어서 작성
                  </button>
                )}
                {isOwner && isOpen && (
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-[#a32d2d] bg-white px-4 py-2.5 text-lg font-semibold text-[#a32d2d] transition-colors hover:bg-[#fcebeb] disabled:opacity-50"
                    onClick={handleClose}
                    disabled={closing}
                  >
                    {closing ? '마감 중...' : '요청 마감'}
                  </button>
                )}
              </div>

              <h1 className="mt-3 text-3xl font-bold leading-[1.4]">{request.svcReqTtl}</h1>
              <p className="mt-2 text-lg text-[#5f5e5a]">
                {fmtBudget(request.svcReqBdgtAmt)}
                {request.svcReqRegDt && <span className="ml-2">· {fmtDate(request.svcReqRegDt)} 등록</span>}
              </p>
            </div>

            {/* 요청 항목 (위저드 답변) — 경매등록 확인탭·위저드 확인탭과 동일한 신청서 표 양식
                필드가 1개뿐인 단순 항목은 2개씩 한 행에 짝지어 표시한다 */}
            {parsedItems.length > 0 && (
              <div className="border-b border-[#e8e8e8] px-6 py-5">
                <h2 className="mb-4 text-lg font-semibold text-[#5f5e5a]">요청 항목</h2>
                <table className="w-full table-fixed overflow-hidden rounded-[10px] border border-[#d8d6cf] text-lg">
                  <colgroup>
                    <col style={{ width: '17%' }} />
                    <col style={{ width: '33%' }} />
                    <col style={{ width: '17%' }} />
                    <col style={{ width: '33%' }} />
                  </colgroup>
                  <tbody>
                    {(() => {
                      const numberedItems = parsedItems.map((entry, idx) => ({ ...entry, number: idx + 1 }));
                      const tableRows = buildTableRows(numberedItems);
                      return tableRows.map((group, i) => {
                        const isLast = i === tableRows.length - 1;
                        const borderCls = isLast ? '' : 'border-b border-[#d8d6cf]';
                        const thCls = `break-keep px-4 py-4 text-left font-semibold border-r border-[#d8d6cf] ${borderCls}`;
                        const tdCls = `px-4 py-4 text-[#1d1d1f] ${borderCls}`;
                        // th 배경색·글자색은 전역 CSS(th { background:#fafaf8; color:#5f5e5a })가
                        // Tailwind 유틸리티보다 우선순위가 높아서 인라인 스타일로 덮어써야 실제로 반영된다
                        const thStyle = { verticalAlign: 'middle', backgroundColor: '#eef2fb', color: '#5f5e5a' };
                        if (group.length === 2) {
                          const second = group[1];
                          return (
                            <tr key={i}>
                              <th className={thCls} style={thStyle}>{renderThLabel(group[0])}</th>
                              <td className={`${tdCls} border-r border-[#d8d6cf]`}>{renderEntryValue(group[0])}</td>
                              <th className={thCls} style={thStyle}>{second ? renderThLabel(second) : ''}</th>
                              <td className={tdCls}>{second ? renderEntryValue(second) : ''}</td>
                            </tr>
                          );
                        }
                        const entry = group[0];
                        return (
                          <tr key={i}>
                            <th className={thCls} style={thStyle}>{renderThLabel(entry)}</th>
                            <td className={tdCls} colSpan={3}>{renderEntryValue(entry)}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* 첨부사진 — 요청 원문은 위 "요청 항목" 표의 "특이사항 메모" 행으로 이동함 */}
            {request.imageList?.length > 0 && (
              <div className="px-6 py-5">
                <h2 className="mb-4 text-lg font-semibold text-[#5f5e5a]">첨부사진</h2>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {request.imageList.map(img => (
                    <img
                      key={img.flSn}
                      src={toImageUrl(img.url)}
                      alt="요청 사진"
                      className="aspect-square w-full rounded-lg border border-[#e2e1dc] object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* ── 오른쪽: 견적 패널 ── */}
          <aside className="overflow-hidden rounded-2xl border border-[#e8e8e8] bg-white shadow-sm lg:sticky lg:top-[84px]">

            {/* 패널 헤더 */}
            <div className="border-b border-[#e8e8e8] px-5 py-4">
              <h2 className="text-2xl font-bold">도착한 견적</h2>
              <p className="mt-1 text-lg text-[#5f5e5a]">견적을 선택하면 상세 내용과 제공자 리뷰를 확인할 수 있습니다.</p>
            </div>

            {/* 액션 영역 */}
            {!isOwner && (
              <div className="border-b border-[#e8e8e8] px-5 py-4">
                {isAuthenticated ? (
                  isOpen ? (
                    <div className="rounded-2xl border-2 border-primary bg-[#e5efff] px-6 py-6 text-center">
                      <p className="mb-4 text-lg font-medium text-[#0048bf]">
                        이 요청에 아직 견적을 제출하지 않았습니다
                      </p>
                      <button
                        type="button"
                        className="w-full rounded-lg bg-primary py-3.5 text-lg font-bold text-white transition-colors hover:bg-[#0048bf]"
                        onClick={handleQuoteClick}
                      >
                        견적 제출하기
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-lg text-[#888780]">견적 접수가 종료된 요청입니다.</p>
                  )
                ) : (
                  <div className="rounded-2xl border-2 border-primary bg-[#e5efff] px-6 py-6 text-center">
                    <p className="mb-4 text-lg font-medium text-[#0048bf]">
                      견적을 제출하려면 로그인이 필요합니다
                    </p>
                    <button
                      type="button"
                      className="w-full rounded-lg bg-primary py-3.5 text-lg font-bold text-white transition-colors hover:bg-[#0048bf]"
                      onClick={() => navigate('/login', { state: { from: location } })}
                    >
                      로그인하기
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 견적 목록 — 본인 요청서일 때만 조회(GET /quotes/service-request/{svcReqSn}) */}
            {isOwner && (
              quotesLoading ? (
                <div className="px-5 py-6 text-center text-lg text-[#888780]">불러오는 중...</div>
              ) : quotes.length === 0 ? (
                <div className="px-5 py-6 text-center text-lg text-[#888780]">
                  아직 도착한 견적이 없습니다.
                </div>
              ) : (
                <ul className="divide-y divide-[#e8e8e8]">
                  {quotes.map(q => (
                    <li key={q.qutSn} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-semibold text-[#1d1d1f]">{q.providerNm}</span>
                        <span className="shrink-0 rounded-lg bg-[#f0f0ee] px-3 py-1 text-sm font-medium text-[#5f5e5a]">
                          {QUOTE_STATUS_LABEL[q.statusCode] ?? q.statusCode}
                        </span>
                      </div>
                      <p className="mt-1 text-xl font-bold text-primary">{fmtBudget(q.amount)}</p>
                      {q.content && (
                        <p className="mt-1 line-clamp-2 text-base text-[#5f5e5a]">{q.content}</p>
                      )}
                      {q.registeredAt && (
                        <p className="mt-1 text-sm text-[#9a9ba5]">{fmtDate(q.registeredAt)} 제출</p>
                      )}
                    </li>
                  ))}
                </ul>
              )
            )}
          </aside>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      </div>
    </>
  );
}
