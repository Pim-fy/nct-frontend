// src/pages/service/MyServiceRequestListPage.jsx
// 내 서비스 요청서 목록 페이지 — 임시저장·공개·매칭완료·종료 필터 (F-SVC-004)
// 라우트: /service-requests/me, 마이페이지 "내 서비스 요청 목록" 섹션에서도 embedded로 재사용
// 상품 판매 내역(MyProductList.jsx)과 동일한 마이페이지 공통 목록 컴포넌트를 사용한다.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteServiceRequest, closeServiceRequest } from '@api/serviceRequestApi';
import { toImageUrl } from '@api/fileApi';
import { useMyServiceRequests } from '@hooks/useServiceRequest';
import MyPageListSectionLayout from '@components/mypage/MyPageListSectionLayout';
import MyPageListItem from '@components/mypage/MyPageListItem';
import MyPageListEmpty from '@components/mypage/MyPageListEmpty';
import MyPageListError from '@components/mypage/MyPageListError';
import MyPageStatusBadge from '@components/mypage/MyPageStatusBadge';
import MyPageListSkeleton from '@components/skeleton/MyPageListSkeleton';
import Pagination from '@components/common/Pagination';
import Toast from '@components/common/Toast';
import ConfirmModal from '@components/common/ConfirmModal';

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

function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtBudget(amt) {
  if (amt == null) return '예산 미정';
  return Number(amt).toLocaleString('ko-KR') + '원';
}

const PAGE_SIZE = 10;

export default function MyServiceRequestListPage({ embedded = false }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState('');
  const [closeTarget, setCloseTarget] = useState(null);
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

  const handleCloseConfirm = async () => {
    const { svcReqSn } = closeTarget;
    setCloseTarget(null);
    try {
      await closeServiceRequest(svcReqSn);
      refetch();
    } catch (err) {
      setToast(err.response?.data?.message || '마감에 실패했습니다.');
    }
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
        {!embedded && <div className="page-title"><h1>내 서비스 요청</h1></div>}
        <MyPageListError message="목록을 불러오지 못했습니다." onRetry={() => refetch()} />
      </>
    );
  }

  return (
    <div className={embedded ? '' : 'container seller-page'}>
      <MyPageListSectionLayout
        title="내 서비스 요청"
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
            <button type="button" onClick={() => navigate('/service-requests/new')} className="btn btn-primary">
              견적 요청서 작성하기
            </button>
          ) : null}
        />
      ) : (
        <>
          <div className="history-list">
            {visibleList.map(item => {
              const isDraft = item.svcReqStatusCd === 'SVCC0001';
              const isOpen = item.svcReqStatusCd === 'SVCC0002';

              return (
                <MyPageListItem
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
                  actions={(
                    <>
                      {isDraft && (
                        <button
                          type="button"
                          onClick={() => navigate('/service-requests/new', { state: { svcReqSn: item.svcReqSn } })}
                          className="btn btn-sm btn-primary"
                        >
                          이어서 작성
                        </button>
                      )}
                      {!isDraft && (
                        <button
                          type="button"
                          onClick={() => navigate(`/service-requests/${item.svcReqSn}`)}
                          className="btn btn-sm btn-primary"
                        >
                          상세보기
                        </button>
                      )}
                      {isOpen && (
                        <button
                          type="button"
                          onClick={() => setCloseTarget({ svcReqSn: item.svcReqSn })}
                          className="btn btn-sm btn-ghost"
                        >
                          마감
                        </button>
                      )}
                      {isDraft && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ svcReqSn: item.svcReqSn })}
                          className="btn btn-sm btn-danger"
                        >
                          삭제
                        </button>
                      )}
                    </>
                  )}
                >
                  <p>예산 {fmtBudget(item.svcReqBdgtAmt)}</p>
                  <p>등록 {fmtDate(item.svcReqRegDt)}</p>
                </MyPageListItem>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-5">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={!!closeTarget}
        message="이 요청서를 마감하시겠습니까?"
        subMessage="마감 후에는 견적을 받을 수 없습니다."
        confirmLabel="마감"
        onConfirm={handleCloseConfirm}
        onCancel={() => setCloseTarget(null)}
      />
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
