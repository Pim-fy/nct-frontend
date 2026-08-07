// src/pages/service/MyServiceRequestListPage.jsx
// 내 서비스 요청서 목록 페이지 — 임시저장·공개·매칭완료·종료 필터 (F-SVC-004)
// 라우트: /service-requests/me, 마이페이지 "내 서비스 요청 목록" 섹션에서도 embedded로 재사용
// 상품 판매 내역(MyProductList.jsx)과 동일한 마이페이지 공통 목록 컴포넌트를 사용한다.
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, MessageSquareText } from 'lucide-react';
import { deleteServiceRequest } from '@api/serviceRequestApi';
import { toImageUrl } from '@api/fileApi';
import { useMyServiceRequests } from '@hooks/useServiceRequest';
import { formatDate } from '@utils/common';
import MyPageListSectionLayout from '@components/mypage/MyPageListSectionLayout';
import MyPageAuctionListItem from '@components/mypage/MyPageAuctionListItem';
import MyPageListEmpty from '@components/mypage/MyPageListEmpty';
import MyPageListError from '@components/mypage/MyPageListError';
import MyPageStatusBadge from '@components/mypage/MyPageStatusBadge';
import MyPageListSkeleton from '@components/skeleton/MyPageListSkeleton';
import Pagination from '@components/common/Pagination';
import Toast from '@components/common/Toast';
import ConfirmModal from '@components/common/ConfirmModal';
import MyPageMobileCard from '@components/mypage/MyPageMobileCard';

const FILTERS = [
  { label: '전체',     value: null },
  { label: '임시저장', value: 'DRAFT' },
  { label: '공개',     value: 'OPEN' },
  { label: '매칭완료', value: 'MATCHED' },
  { label: '종료',     value: 'CLOSED' },
];

const STATUS_LABEL = {
  SVCC0001: '임시저장',
  SVCC0002: '공개',
  SVCC0003: '매칭완료',
  SVCC0004: '종료',
};

const STATUS_BADGE = {
  SVCC0001: 'badge-outline-gray',
  SVCC0002: 'badge-outline-orange',
  SVCC0003: 'badge-primary',
  SVCC0004: 'badge-outline-gray',
};

function fmtBudget(amt) {
  if (amt == null) return '미정';
  return Number(amt).toLocaleString('ko-KR') + 'P';
}

const PAGE_SIZE = 10;

export default function MyServiceRequestListPage({ embedded = false }) {
  const navigate = useNavigate();
  // 전역 브레드크럼 (BJN, 260805): 상세로 이동할 때 접근 경로(state.from)를 전달하기 위해 사용
  const location = useLocation();
  const [filter, setFilter] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading, isError, refetch } = useMyServiceRequests(page, PAGE_SIZE, filter);
  const { data: allSummary,     isLoading: isAllLoading }     = useMyServiceRequests(1, 1, null);
  const { data: draftSummary,   isLoading: isDraftLoading }   = useMyServiceRequests(1, 1, 'DRAFT');
  const { data: openSummary,    isLoading: isOpenLoading }    = useMyServiceRequests(1, 1, 'OPEN');
  const { data: matchedSummary, isLoading: isMatchedLoading } = useMyServiceRequests(1, 1, 'MATCHED');
  const { data: closedSummary,  isLoading: isClosedLoading }  = useMyServiceRequests(1, 1, 'CLOSED');

  const list = data?.list ?? [];
  const totalPages = data?.totalPages ?? 1;
  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const visibleList = normalizedKeyword
    ? list.filter(item => String(item.svcReqTtl ?? '').toLowerCase().includes(normalizedKeyword))
    : list;
  const isSummaryLoading = isAllLoading || isDraftLoading || isOpenLoading || isMatchedLoading || isClosedLoading;

  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1);
  };

  const handleDeleteConfirm = async () => {
    const { svcReqSn } = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteServiceRequest(svcReqSn);
      refetch();
    } catch (err) {
      setToast(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  if (isError) {
    return (
      <>
        {!embedded && <div className="page-title"><h1>견적 요청</h1></div>}
        <MyPageListError message="목록을 불러오지 못했습니다." onRetry={() => refetch()} />
      </>
    );
  }

  return (
    <div className={embedded ? '' : 'container seller-page'}>
      <MyPageListSectionLayout
        title="견적 요청"
        summaryItems={[
          { label: '공개 중',   value: openSummary?.total ?? 0 },
          { label: '매칭완료', value: matchedSummary?.total ?? 0 },
          { label: '종료',     value: closedSummary?.total ?? 0 },
        ]}
        filterItems={FILTERS.map(item => ({
          ...item,
          count: {
            DRAFT: draftSummary?.total,
            OPEN: openSummary?.total,
            MATCHED: matchedSummary?.total,
            CLOSED: closedSummary?.total,
          }[item.value] ?? (item.value === null ? allSummary?.total : 0),
        }))}
        activeFilter={filter}
        onFilterChange={handleFilterChange}
        filterAriaLabel="서비스 요청 상태"
        onSearch={setSearchKeyword}
        searchAriaLabel="요청서 제목 검색"
        searchPlaceholder="요청서 제목 검색"
        isLoading={isLoading || isSummaryLoading}
      />

      {isLoading ? (
        <MyPageListSkeleton count={4} />
      ) : visibleList.length === 0 ? (
        <MyPageListEmpty
          message="해당 조건의 서비스 요청이 없습니다."
          action={filter === null ? (
            <button type="button" onClick={() => navigate('/service-requests/new', { state: { from: location.pathname + location.search } })} className="btn btn-primary">
              견적 요청서 작성하기
            </button>
          ) : null}
        />
      ) : (
        <>
          {/* history-list의 display:grid가 불레이어 CSS라 Tailwind hidden(@layer utilities)보다 우선
              적용된다 — hidden/lg:block은 별도 래퍼에 둬서 두 display 선언이 충돌하지 않게 한다. */}
          <div className="hidden lg:block">
          <div className="history-list">
            {visibleList.map(item => {
              const isDraft = item.svcReqStatusCd === 'SVCC0001';

              return (
                <MyPageAuctionListItem
                  key={item.svcReqSn}
                  imageSrc={item.repImageUrl ? toImageUrl(item.repImageUrl) : undefined}
                  imageAlt={item.svcReqTtl}
                  imageFallback={item.catNm}
                  badge={
                    <MyPageStatusBadge className={STATUS_BADGE[item.svcReqStatusCd] ?? 'badge-outline-gray'}>
                      {STATUS_LABEL[item.svcReqStatusCd] ?? item.svcReqStatusCd}
                    </MyPageStatusBadge>
                  }
                  title={item.svcReqTtl}
                  topLine={isDraft ? `수정 ${formatDate(item.svcReqUpdtDt)}` : `등록 ${formatDate(item.svcReqRegDt)}`}
                  priceItems={[
                    { label: '견적 수', value: `${item.quoteCount ?? 0}건` },
                    { label: '예산', value: fmtBudget(item.svcReqBdgtAmt) },
                  ]}
                  categoryLabel={item.catNm}
                  actionButton={isDraft ? (
                    // 작성재개·삭제 폭을 그리드로 묶어서 더 넓은 쪽에 맞춰 자동으로 통일한다
                    // (임의 px 대신 브라우저가 실제 렌더 너비로 계산하게 함).
                    <div className="grid justify-items-stretch gap-2">
                      <button
                        type="button"
                        onClick={() => navigate('/service-requests/new', { state: { svcReqSn: item.svcReqSn, from: location.pathname + location.search } })}
                        className="btn btn-sm btn-primary"
                      >
                        작성재개
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ svcReqSn: item.svcReqSn })}
                        className="btn btn-sm btn-danger"
                      >
                        삭제
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(`/service-requests/${item.svcReqSn}`, { state: { from: location.pathname + location.search } })}
                      className="btn btn-sm btn-primary"
                    >
                      상세보기
                    </button>
                  )}
                />
              );
            })}
          </div>
          </div>

          <div className="grid gap-4 lg:hidden">
            {visibleList.map(item => {
              const isDraft = item.svcReqStatusCd === 'SVCC0001';
              const actionButton = isDraft ? (
                <>
                  <button type="button" onClick={() => navigate('/service-requests/new', { state: { svcReqSn: item.svcReqSn, from: location.pathname + location.search } })} className="btn btn-sm btn-primary">작성재개</button>
                  <button type="button" onClick={() => setDeleteTarget({ svcReqSn: item.svcReqSn })} className="btn btn-sm btn-danger">삭제</button>
                </>
              ) : (
                <button type="button" onClick={() => navigate(`/service-requests/${item.svcReqSn}`, { state: { from: location.pathname + location.search } })} className="btn btn-sm btn-primary">상세보기</button>
              );

              return (
                <MyPageMobileCard
                  key={item.svcReqSn}
                  imageSrc={item.repImageUrl ? toImageUrl(item.repImageUrl) : undefined}
                  imageAlt={item.svcReqTtl}
                  imageFallbackLabel={item.catNm}
                  badge={(
                    <MyPageStatusBadge className={STATUS_BADGE[item.svcReqStatusCd] ?? 'badge-outline-gray'}>
                      {STATUS_LABEL[item.svcReqStatusCd] ?? item.svcReqStatusCd}
                    </MyPageStatusBadge>
                  )}
                  title={item.svcReqTtl}
                  price={fmtBudget(item.svcReqBdgtAmt)}
                  infoItems={[
                    { icon: MessageSquareText, label: '견적 수', value: `${item.quoteCount ?? 0}건` },
                    isDraft
                      ? { icon: ClipboardList, label: '수정일', value: formatDate(item.svcReqUpdtDt) }
                      : { icon: ClipboardList, label: '등록일', value: formatDate(item.svcReqRegDt) },
                  ]}
                  footerLeft={`카테고리 · ${item.catNm}`}
                  actionButton={actionButton}
                />
              );
            })}
          </div>
        </>
      )}

      {!isLoading && (
        <div className="mt-5">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} showSinglePage />
        </div>
      )}
      <ConfirmModal
        open={!!deleteTarget}
        message="이 요청서를 삭제하시겠습니까?"
        subMessage="삭제하면 되돌릴 수 없습니다."
        confirmLabel="삭제"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}
