// src/pages/provider/MyQuoteListPage.jsx
// 담당자 7 연결 · F-SVC-005/006/008: 제공자 견적 제출 내역을 마이페이지 공통 목록으로 표시합니다.
import { useMemo, useState } from 'react';
import { CalendarDays, FileText, Tags } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Pagination from '@components/common/Pagination';
import MyPageListSectionLayout from '@components/mypage/MyPageListSectionLayout';
import MyPageListItem from '@components/mypage/MyPageListItem';
import MyPageListPriceActions from '@components/mypage/MyPageListPriceActions';
import MyPageListEmpty from '@components/mypage/MyPageListEmpty';
import MyPageListError from '@components/mypage/MyPageListError';
import MyPageMobileCard from '@components/mypage/MyPageMobileCard';
import MyPageStatusBadge from '@components/mypage/MyPageStatusBadge';
import MyPageListSkeleton from '@components/skeleton/MyPageListSkeleton';
import { useMyQuotes, useWithdrawQuote } from '@hooks/useQuote';
import { confirm, toast } from '@utils/common';

const PAGE_SIZE = 10;

const STATUS_CONFIG = {
  QUTC0001: { group: 'waiting', label: '제출됨', badgeClass: 'badge-blue' },
  QUTC0002: { group: 'waiting', label: '수정됨', badgeClass: 'badge-blue' },
  QUTC0003: { group: 'ended', label: '만료됨', badgeClass: 'badge-gray' },
  QUTC0004: { group: 'in-progress', label: '선택됨', badgeClass: 'badge-teal' },
  QUTC0005: { group: 'ended', label: '철회됨', badgeClass: 'badge-gray' },
};

const FILTER_LABELS = {
  all: '전체',
  waiting: '대기 중',
  'in-progress': '진행 중',
  ended: '종료',
};

const VALID_FILTERS = new Set(Object.keys(FILTER_LABELS));

const formatAmount = (amount) => (
  Number.isFinite(Number(amount)) ? `${Number(amount).toLocaleString()}P` : '-'
);

const formatDate = (value) => {
  if (!value) return '-';
  return String(value).slice(0, 10).replaceAll('-', '.');
};

function QuoteStatusBadge({ quote }) {
  return (
    <MyPageStatusBadge className={quote.badgeClass}>
      {quote.statusLabel}
    </MyPageStatusBadge>
  );
}

function QuoteActionButtons({ quote, onDetail, onEdit, onWithdraw }) {
  const isEditableStatus = ['QUTC0001', 'QUTC0002'].includes(quote.statusCode);
  const canEdit = isEditableStatus && quote.editCount < 3;
  const canWithdraw = isEditableStatus;

  return (
    <>
      <button type="button" className="btn btn-sm btn-primary" onClick={() => onDetail(quote)}>
        상세보기
      </button>
      {isEditableStatus && (
        <button
          type="button"
          className="btn btn-sm btn-outline"
          disabled={!canEdit}
          onClick={() => onEdit(quote)}
          title={canEdit ? undefined : '견적 수정 가능 횟수 3회를 모두 사용했습니다.'}
        >
          {canEdit ? `수정${quote.editCount > 0 ? ` ${quote.editCount}/3` : ''}` : '수정 3/3'}
        </button>
      )}
      {canWithdraw && (
        <button type="button" className="btn btn-sm btn-danger" onClick={() => onWithdraw(quote)}>
          철회
        </button>
      )}
    </>
  );
}

export default function MyQuoteListPage({ embedded = false } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const activeFilter = VALID_FILTERS.has(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'waiting';

  const {
    data: pageData,
    isLoading,
    isError,
    refetch,
  } = useMyQuotes({ page: 1, size: 50 });
  const withdrawMutation = useWithdrawQuote();

  const quotes = useMemo(() => (pageData?.content ?? []).map((quote) => {
    const status = STATUS_CONFIG[quote.statusCode] ?? {
      group: 'ended',
      label: quote.statusCode || '알 수 없음',
      badgeClass: 'badge-gray',
    };

    return {
      ...quote,
      requestTitle: quote.svcReqTitle || '서비스 요청',
      quoteTitle: quote.qutTtl || '제출 견적',
      submittedAtLabel: formatDate(quote.registeredAt),
      editCount: Number(quote.reviseCnt ?? 0),
      statusGroup: status.group,
      statusLabel: status.label,
      badgeClass: status.badgeClass,
    };
  }), [pageData]);

  const countByGroup = (group) => quotes.filter((quote) => quote.statusGroup === group).length;
  const filteredQuotes = useMemo(
    () => activeFilter === 'all'
      ? quotes
      : quotes.filter((quote) => quote.statusGroup === activeFilter),
    [activeFilter, quotes],
  );
  const totalPages = Math.max(1, Math.ceil(filteredQuotes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleQuotes = filteredQuotes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const returnPath = `${location.pathname}${location.search}${location.hash}`;

  const filterItems = Object.entries(FILTER_LABELS).map(([value, label]) => ({
    value,
    label,
    count: value === 'all' ? quotes.length : countByGroup(value),
  }));

  const handleFilterChange = (nextFilter) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('tab', nextFilter);
    setSearchParams(nextSearchParams, { replace: true });
    setPage(1);
  };

  const handleDetail = (quote) => {
    navigate(`/service-requests/${quote.svcReqSn}/quotes/${quote.qutSn}`, {
      state: { quote, from: returnPath },
    });
  };

  const handleEdit = (quote) => {
    if (quote.editCount >= 3) {
      toast({ icon: 'warning', title: '수정 가능 횟수(3회)를 초과했습니다.' });
      return;
    }
    navigate(`/service-requests/${quote.svcReqSn}/quotes/${quote.qutSn}/edit`, {
      state: { from: returnPath, quoteTitle: quote.quoteTitle },
    });
  };

  const handleWithdraw = async (quote) => {
    const confirmed = await confirm({
      title: '견적을 철회하시겠습니까?',
      text: '철회한 견적은 복구할 수 없습니다.',
      icon: 'warning',
      confirmButtonText: '철회',
      cancelButtonText: '취소',
    });
    if (!confirmed) return;

    try {
      await withdrawMutation.mutateAsync(quote.qutSn);
      toast({ icon: 'success', title: '견적이 철회되었습니다.' });
    } catch (error) {
      toast({
        icon: 'error',
        title: error?.response?.data?.message || '견적 철회에 실패했습니다.',
      });
    }
  };

  const renderActions = (quote) => (
    <QuoteActionButtons
      quote={quote}
      onDetail={handleDetail}
      onEdit={handleEdit}
      onWithdraw={handleWithdraw}
    />
  );

  return (
    <div className={embedded ? '' : 'container seller-page'}>
      <MyPageListSectionLayout
        title="견적 제출 내역"
        summaryItems={[
          { label: '전체', value: quotes.length },
          { label: '대기 중', value: countByGroup('waiting') },
          { label: '진행 중', value: countByGroup('in-progress') },
          { label: '종료', value: countByGroup('ended') },
        ]}
        filterItems={filterItems}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        filterAriaLabel="견적 상태"
        isLoading={isLoading}
      />

      {isLoading ? (
        <MyPageListSkeleton count={4} />
      ) : isError ? (
        <MyPageListError message="견적 목록을 불러오지 못했습니다." onRetry={() => refetch()} />
      ) : filteredQuotes.length === 0 ? (
        <MyPageListEmpty message="해당 상태의 견적이 없습니다." />
      ) : (
        <>
          <div className="hidden flex-col gap-3 lg:flex">
            {visibleQuotes.map((quote) => (
              <MyPageListItem
                key={quote.qutSn}
                imageAlt={quote.requestTitle}
                imageFallback={<FileText size={34} aria-hidden="true" />}
                badge={<QuoteStatusBadge quote={quote} />}
                title={quote.requestTitle}
                actions={(
                  <MyPageListPriceActions
                    topLine={`제출일 ${quote.submittedAtLabel}`}
                    priceItems={[
                      { label: '내 견적', value: formatAmount(quote.amount), highlight: true },
                      ...(quote.svcReqBdgtAmt != null
                        ? [{ label: '요청 예산', value: formatAmount(quote.svcReqBdgtAmt) }]
                        : []),
                    ]}
                  >
                    {renderActions(quote)}
                  </MyPageListPriceActions>
                )}
              >
                <p>견적 제목 · {quote.quoteTitle}</p>
                <p>카테고리 · {quote.catNm || '미분류'}</p>
              </MyPageListItem>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
            {visibleQuotes.map((quote) => (
              <MyPageMobileCard
                key={quote.qutSn}
                imageFallbackLabel={quote.catNm || '견적'}
                badge={<QuoteStatusBadge quote={quote} />}
                title={quote.requestTitle}
                price={formatAmount(quote.amount)}
                priceSuffix="내 견적"
                infoItems={[
                  { icon: Tags, label: '카테고리', value: quote.catNm || '미분류' },
                  { icon: CalendarDays, label: '제출일', value: quote.submittedAtLabel },
                ]}
                footerLeft={quote.quoteTitle}
                footerRight={quote.editCount > 0 ? `수정 ${quote.editCount}/3` : undefined}
                actionButton={renderActions(quote)}
              />
            ))}
          </div>
        </>
      )}

      {!isLoading && !isError && filteredQuotes.length > 0 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          showSinglePage
          ariaLabel="견적 제출 내역 페이지 이동"
        />
      )}
    </div>
  );
}
