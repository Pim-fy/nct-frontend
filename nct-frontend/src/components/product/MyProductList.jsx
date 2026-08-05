// src/components/product/MyProductList.jsx
// 내 판매 목록 순수 목록 컴포넌트 — MyProductListPage · MyPage 아코디언에서 재사용
// 마이페이지 공통 목록 컴포넌트를 사용하며 가격·날짜 표시 형식을 유지한다.
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toImageUrl } from '@api/fileApi';
import { deleteProduct } from '@api/productApi';
import { TRADE_LABEL, TRADE_STATUS_LABEL } from '@/constants/productConstants';
import { useMyProducts } from '@hooks/useProduct';
import Pagination from '@components/common/Pagination';
import Toast from '@components/common/Toast';
import ConfirmModal from '@components/common/ConfirmModal';
import MyPageListSectionLayout from '@components/mypage/MyPageListSectionLayout';
import MyPageListItem from '@components/mypage/MyPageListItem';
import MyPageListEmpty from '@components/mypage/MyPageListEmpty';
import MyPageListError from '@components/mypage/MyPageListError';
import MyPageContentHeader from '@components/mypage/MyPageContentHeader';
import MyPageStatusBadge from '@components/mypage/MyPageStatusBadge';
import MyPageListSkeleton from '@components/skeleton/MyPageListSkeleton';

// ─── 필터 ────────────────────────────────────────────────────────────────────

const FILTERS = [
  { value: null,      label: '전체' },
  { value: 'DRAFT',   label: '임시저장' },
  { value: 'ACTIVE',  label: '진행 중' },
  { value: 'WON',     label: '낙찰' },
  { value: 'TRADING', label: '거래 중' },
  { value: 'CLOSED',  label: '종료' },
];

const CLOSED_SUB_FILTERS = [
  { value: '',         label: '전체 종료' },
  { value: 'DONE',     label: '완료' },
  { value: 'CANCELED', label: '취소' },
  { value: 'ENDED',    label: '유찰' },
];

// ─── 배지 ────────────────────────────────────────────────────────────────────

const AUC_STATUS_LABEL = {
  AUCC0001: '준비',
  AUCC0002: '진행 중',
  AUCC0003: '낙찰',
  AUCC0004: '유찰',
  AUCC0005: '취소',
  AUCC0006: '취소요청',
};

const AUC_STATUS_BADGE = {
  AUCC0001: 'badge-outline-gray',
  AUCC0002: 'badge-outline-orange',
  AUCC0003: 'badge-outline-gray',
  AUCC0004: 'badge-outline-gray',
  AUCC0005: 'badge-danger',
  AUCC0006: 'badge-danger', // 취소요청도 취소(AUCC0005)와 같은 색으로 — 둘 다 위험/주의 상태
};

const TRADE_BADGE = {
  TRDC0003: 'badge-teal',
  TRDC0004: 'badge-orange',
  TRDC0005: 'badge-orange',
  TRDC0006: 'badge-outline-gray',
  TRDC0007: 'badge-danger',
  TRDC0008: 'badge-danger',
};

// 상품이 혼합 방식이어도 실제 낙찰 시 선택한 거래 방식으로 현재 상태를 표시한다.
const getTradeStatusLabel = (product) => {
  if (product.tradeStatusCd === 'TRDC0004') {
    if (product.tradeMethodCd === 'TRDC0009') return '배송 중';
    if (product.tradeMethodCd === 'TRDC0010') return '직거래 중';
    return '배송·직거래 중';
  }

  return TRADE_STATUS_LABEL[product.tradeStatusCd] ?? product.tradeStatusCd;
};

const PRD_STATUS_LABEL = {
  PRDC0001: '임시저장',
  PRDC0002: '진행 중',
  PRDC0003: '종료',
};

const PRD_STATUS_BADGE = {
  PRDC0001: 'badge-outline-gray',
  PRDC0002: 'badge-outline-orange',
  PRDC0003: 'badge-outline-gray',
};

// ─── 헬퍼 ────────────────────────────────────────────────────────────────────

function fmtPrice(n) {
  return n != null ? `${Number(n).toLocaleString()}원` : '-';
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function MyProductList({ onOpenTradeDetail }) {
  const navigate = useNavigate();
  // 전역 브레드크럼 (BJN, 260805): 상세로 이동할 때 접근 경로(state.from)를 전달 —
  // 이 컴포넌트는 /product/me 단독 페이지와 마이페이지(상품 판매 내역) 양쪽에서 쓰이므로
  // 현재 위치를 그대로 넘기면 진입 경로별로 브레드크럼이 알맞게 표시된다
  const location = useLocation();
  const breadcrumbFrom = { from: location.pathname + location.search };
  const [filter, setFilter]       = useState(null);
  const [subFilter, setSubFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage]           = useState(1);
  const [toast, setToast]         = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const activeFilterType = filter === 'CLOSED' && subFilter
    ? subFilter
    : filter;

  const { data, isLoading, isError, refetch } = useMyProducts(page, 10, activeFilterType);
  const { data: allSummaryData, isLoading: isAllSummaryLoading } = useMyProducts(1, 1, null);
  const { data: draftSummaryData, isLoading: isDraftSummaryLoading } = useMyProducts(1, 1, 'DRAFT');
  const { data: activeSummaryData, isLoading: isActiveSummaryLoading } = useMyProducts(1, 1, 'ACTIVE');
  const { data: wonSummaryData, isLoading: isWonSummaryLoading } = useMyProducts(1, 1, 'WON');
  const { data: tradingSummaryData, isLoading: isTradingSummaryLoading } = useMyProducts(1, 1, 'TRADING');
  const { data: closedSummaryData, isLoading: isClosedSummaryLoading } = useMyProducts(1, 1, 'CLOSED');
  const list       = data?.list       ?? [];
  const totalPages = data?.totalPages ?? 1;
  const normalizedSearchKeyword = searchKeyword.trim().toLowerCase();
  const visibleList = normalizedSearchKeyword
    ? list.filter((product) => String(product.prdNm ?? '').toLowerCase().includes(normalizedSearchKeyword))
    : list;
  const isSummaryLoading = isAllSummaryLoading
    || isDraftSummaryLoading
    || isActiveSummaryLoading
    || isWonSummaryLoading
    || isTradingSummaryLoading
    || isClosedSummaryLoading;

  const handleFilterChange = (value) => {
    setFilter(value);
    setSubFilter('');
    setPage(1);
  };

  const handleSubFilterChange = (value) => { setSubFilter(value); setPage(1); };

  const handleDeleteConfirm = async () => {
    const { prdSn } = confirmTarget;
    setConfirmTarget(null);
    try {
      await deleteProduct(prdSn);
      refetch();
    } catch (err) {
      setToast(err.response?.data?.message || '삭제에 실패했습니다.');
    }
  };

  if (isError) {
    return (
      <>
        <MyPageContentHeader title="상품 판매 내역" />
        <MyPageListError message="목록을 불러오지 못했습니다." onRetry={() => refetch()} />
      </>
    );
  }

  return (
    <>
      <MyPageListSectionLayout
        title="상품 판매 내역"
        summaryItems={[
          { label: '진행 중', value: activeSummaryData?.total ?? 0 },
          { label: '낙찰', value: wonSummaryData?.total ?? 0 },
          { label: '거래 중', value: tradingSummaryData?.total ?? 0 },
        ]}
        filterItems={FILTERS.map((item) => ({
          ...item,
          count: {
            DRAFT: draftSummaryData?.total,
            ACTIVE: activeSummaryData?.total,
            WON: wonSummaryData?.total,
            TRADING: tradingSummaryData?.total,
            CLOSED: closedSummaryData?.total,
          }[item.value] ?? (item.value === null ? allSummaryData?.total : 0),
        }))}
        activeFilter={filter}
        onFilterChange={handleFilterChange}
        filterAriaLabel="판매 경매 상태"
        onSearch={setSearchKeyword}
        searchAriaLabel="판매 상품명 검색"
        extraControls={filter === 'CLOSED' ? (
          <select
            value={subFilter}
            onChange={e => handleSubFilterChange(e.target.value)}
            aria-label="종료 상태"
            className="h-9 shrink-0 cursor-pointer rounded-lg border border-[#dce2ed] bg-white px-3 text-sm outline-none focus:border-[#1466f5]"
          >
            {CLOSED_SUB_FILTERS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        ) : null}
        isLoading={isLoading || isSummaryLoading}
      />

      {isLoading ? (
        <MyPageListSkeleton count={4} />
      ) : visibleList.length === 0 ? (
        <MyPageListEmpty
          message="해당 조건의 판매 내역이 없습니다."
          action={filter === null ? (
            <button
              type="button"
              onClick={() => navigate('/product/register', { state: breadcrumbFrom })}
              className="btn btn-primary"
            >
              경매 등록하기
            </button>
          ) : null}
        />
      ) : (
        <>
          <div className="history-list">
            {visibleList.map((p) => {
              const badgeLabel = p.tradeSn
                ? getTradeStatusLabel(p)
                : p.aucStatusCd
                ? (AUC_STATUS_LABEL[p.aucStatusCd] ?? p.aucStatusCd)
                : (PRD_STATUS_LABEL[p.prdStatusCd] ?? p.prdStatusCd);

              const badgeClass = p.tradeSn
                ? (TRADE_BADGE[p.tradeStatusCd] ?? 'badge-outline-gray')
                : p.aucStatusCd
                ? (AUC_STATUS_BADGE[p.aucStatusCd] ?? 'badge-outline-gray')
                : (PRD_STATUS_BADGE[p.prdStatusCd] ?? 'badge-outline-gray');

              const isActive = p.prdStatusCd === 'PRDC0002';
              const isDraft  = p.prdStatusCd === 'PRDC0001';
              const isEnded  = p.prdStatusCd === 'PRDC0003';

              return (
                <MyPageListItem
                  key={p.prdSn}
                  imageSrc={p.prdImgUrl ? toImageUrl(p.prdImgUrl) : ''}
                  imageAlt={p.prdNm}
                  imageFallback="상품 이미지"
                  badge={<MyPageStatusBadge className={badgeClass}>{badgeLabel}</MyPageStatusBadge>}
                  title={p.prdNm}
                  actions={(
                    <>
                    {p.tradeSn && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenTradeDetail) {
                            onOpenTradeDetail(p.tradeSn);
                            return;
                          }

                          navigate(`/trades/${p.tradeSn}/seller`, { state: breadcrumbFrom });
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        거래 관리
                      </button>
                    )}
                    {!p.tradeSn && isActive && p.aucStatusCd === 'AUCC0005' && (
                      <button type="button" onClick={() => navigate(`/product/${p.prdSn}/seller`, { state: breadcrumbFrom })} className="btn btn-sm btn-ghost">
                        취소 상품 보기
                      </button>
                    )}
                    {!p.tradeSn && isActive && p.aucStatusCd !== 'AUCC0005' && (
                      <button type="button" onClick={() => navigate(`/product/${p.prdSn}/seller`, { state: breadcrumbFrom })} className="btn btn-sm btn-primary">
                        판매 관리
                      </button>
                    )}
                    {isDraft && (
                      <button type="button" onClick={() => navigate('/product/register', { state: { prdSn: p.prdSn, ...breadcrumbFrom } })} className="btn btn-sm btn-ghost">
                        등록재개
                      </button>
                    )}
                    {!p.tradeSn && isEnded && (
                      <button type="button" onClick={() => navigate(`/product/${p.prdSn}/seller`, { state: breadcrumbFrom })} className="btn btn-sm btn-ghost">
                        판매 기록
                      </button>
                    )}
                    {(isDraft || isEnded) && !p.tradeSn && p.aucStatusCd !== 'AUCC0003' && (
                      <button type="button" onClick={() => setConfirmTarget({ prdSn: p.prdSn, prdNm: p.prdNm })} className="btn btn-sm btn-danger">
                        삭제
                      </button>
                    )}
                    </>
                  )}
                >
                  <p>
                    시작가 {fmtPrice(p.prdStartAmt)}
                    {p.prdIbyAmt != null && ` · 즉시구매 ${fmtPrice(p.prdIbyAmt)}`}
                    {` · ${TRADE_LABEL[p.prdTrdMethodCd] ?? p.prdTrdMethodCd}`}
                    {p.prdRegDt && ` · ${fmtDate(p.prdRegDt)}`}
                  </p>
                </MyPageListItem>
              );
            })}
          </div>
          <div className="pagination">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <ConfirmModal
        open={!!confirmTarget}
        message={confirmTarget ? `"${confirmTarget.prdNm}" 상품을 삭제하시겠습니까?` : ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmTarget(null)}
      />
    </>
  );
}
