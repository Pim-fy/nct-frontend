import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  decideAdminAuctionCancellation,
  fetchAdminAuctionCancellationRequest,
  fetchAdminAuctionOverview,
  fetchAdminAuctions,
  forceCancelAdminAuction,
} from '@api/adminAuctionApi';
import AdminDetailDrawer from '@components/admin/AdminDetailDrawer';
import AdminFilterActions from '@components/admin/AdminFilterActions';
import AdminHistoryTimeline from '@components/admin/AdminHistoryTimeline';
import AdminPagination from '@components/admin/AdminPagination';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import AdminTable from '@components/admin/AdminTable';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import PageMeta from '@components/admin/PageMeta';
import CommonTabs from '@components/common/CommonTabs';
import { ADMIN_HIGH_VOLUME_PAGE_SIZE } from '@/constants/adminPagination';
import { formatDateTime, toast } from '@utils/common';
import { formatAdminMemberIdentity } from '@utils/adminMemberIdentity';
import AdminBidUnitManagementPanel from './AdminBidUnitManagementPanel';
import '../audit/adminAuditPage.css';
import './adminAuctionManagementPage.css';

// 담당자 7 · F-OPS-003/004: 관리자 경매 운영 조회와 판매자 취소 승인 화면입니다.
const auctionStatusTone = (statusCode) => {
  if (statusCode === 'AUCC0006') return 'danger';
  if (statusCode === 'AUCC0005') return 'danger';
  if (statusCode === 'AUCC0003') return 'neutral';
  if (statusCode === 'AUCC0002') return 'info';
  return 'neutral';
};
const tradeStatusTone = (statusCode) => {
  if (statusCode === 'TRDC0008') return 'danger';
  if (statusCode === 'TRDC0005' || statusCode === 'TRDC0007') return 'warning';
  if (statusCode === 'TRDC0006') return 'success';
  if (statusCode === 'TRDC0003' || statusCode === 'TRDC0004') return 'info';
  return 'neutral';
};
const TRADE_STATUS_LABELS = {
  TRDC0003: '진행중',
  TRDC0004: '배송/직거래중',
  TRDC0005: '상대확인대기',
  TRDC0006: '완료',
  TRDC0007: '보류',
  TRDC0008: '취소',
};

const INITIAL_FILTERS = {
  keyword: '',
  auctionStatusCode: '',
  tradeStatusCode: '',
  cancellationPending: '',
  registeredFrom: '',
  registeredTo: '',
};
const PAGE_SIZE = ADMIN_HIGH_VOLUME_PAGE_SIZE;
const formatAmount = (value) => (
  value == null ? '-' : `${Number(value).toLocaleString('ko-KR')}P`
);
const createRequestId = () => globalThis.crypto?.randomUUID?.()
  ?? `admin-auction-cancel-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const AdminAuctionManagementPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'bid-units' ? 'bid-units' : 'auctions';
  const [filterForm, setFilterForm] = useState(INITIAL_FILTERS);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [filterError, setFilterError] = useState('');
  const [selected, setSelected] = useState(null);
  const [reviewReason, setReviewReason] = useState('');
  const [forceCancelReason, setForceCancelReason] = useState('');
  const [page, setPage] = useState(1);

  const auctionsQuery = useQuery({
    queryKey: ['admin-auctions', filters, page],
    queryFn: () => fetchAdminAuctions({
      keyword: filters.keyword || undefined,
      auctionStatusCode: filters.auctionStatusCode || undefined,
      tradeStatusCode: filters.tradeStatusCode || undefined,
      cancellationPending: filters.cancellationPending === ''
        ? undefined
        : filters.cancellationPending === 'PENDING',
      registeredFrom: filters.registeredFrom || undefined,
      registeredTo: filters.registeredTo || undefined,
      page,
      size: PAGE_SIZE,
    }),
    enabled: activeTab === 'auctions',
  });
  const overviewQuery = useQuery({
    queryKey: ['admin-auction-overview', selected?.auctionId],
    queryFn: () => fetchAdminAuctionOverview(selected.auctionId),
    enabled: activeTab === 'auctions' && selected?.auctionId != null,
  });
  const cancellationQuery = useQuery({
    queryKey: ['admin-auction-cancellation-request', selected?.auctionId],
    queryFn: () => fetchAdminAuctionCancellationRequest(selected.auctionId),
    enabled: activeTab === 'auctions'
      && selected?.auctionId != null
      && selected?.cancelRequestId != null
      && selected?.cancelApprovedYn == null,
  });
  const decisionMutation = useMutation({
    mutationFn: decideAdminAuctionCancellation,
    onSuccess: (_, variables) => {
      toast({
        icon: 'success',
        title: `경매 #${variables.auctionId} 취소 요청을 ${variables.decision === 'APPROVED' ? '승인' : '반려'}했습니다.`,
        timer: 2000,
      });
      setSelected(null);
      setReviewReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
      auctionsQuery.refetch();
    },
  });
  const forceCancelMutation = useMutation({
    mutationFn: forceCancelAdminAuction,
    onSuccess: (_, variables) => {
      toast({
        icon: 'success',
        title: `경매 #${variables.auctionId}를 취소했습니다.`,
        timer: 2000,
      });
      setSelected(null);
      setForceCancelReason('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
      auctionsQuery.refetch();
    },
  });

  const closeDetail = () => {
    if (decisionMutation.isPending || forceCancelMutation.isPending) return;
    setSelected(null);
    setReviewReason('');
    setForceCancelReason('');
  };

  const rows = auctionsQuery.data?.items ?? [];
  const columns = useMemo(() => [
    { key: 'auctionId', label: '경매 번호', render: (value) => `#${value}` },
    {
      key: 'productName',
      label: '상품명',
      className: 'admin-table__long-text admin-auction-table__product-name',
      render: (value) => <strong title={value}>{value}</strong>,
    },
    {
      key: 'sellerUserSn',
      label: '판매자',
      className: 'admin-table__compact-text',
      render: (value, row) => formatAdminMemberIdentity(row.sellerMember, value),
    },
    { key: 'auctionStatusName', label: '경매 상태', render: (value, row) => <AdminStatusBadge tone={auctionStatusTone(row.auctionStatusCode)}>{value ?? row.auctionStatusCode}</AdminStatusBadge> },
    { key: 'bidCount', label: '입찰', render: (value) => `${value ?? 0}건` },
    {
      key: 'tradeStatusName',
      label: '거래 상태',
      render: (value, row) => {
        const statusLabel = value ?? TRADE_STATUS_LABELS[row.tradeStatusCode] ?? row.tradeStatusCode;
        return statusLabel
          ? <AdminStatusBadge tone={tradeStatusTone(row.tradeStatusCode)}>{statusLabel}</AdminStatusBadge>
          : '-';
      },
    },
    { key: 'registeredAt', label: '등록일', render: formatDateTime },
    {
      key: 'manage', label: '관리', render: (_, row) => (
        <button className={row.cancelRequestId ? 'btn btn-danger' : 'btn btn-outline'} onClick={() => { setSelected(row); setReviewReason(''); setForceCancelReason(''); }} type="button">
          {row.cancelRequestId
            ? (row.cancelApprovedYn == null ? '취소 심사' : '취소 처리 이력')
            : '상세 보기'}
        </button>
      ),
    },
  ], []);

  const decide = (decision) => {
    const reason = reviewReason.trim();
    if (!selected?.cancelRequestId || !reason || decisionMutation.isPending
      || cancellationQuery.isLoading || cancellationQuery.isError) return;
    decisionMutation.mutate({ auctionId: selected.auctionId, decision, reason });
  };

  const overview = overviewQuery.data;
  const auctionDetail = overview?.auction;
  const productDetail = overview?.product;
  const cancellationDetail = cancellationQuery.data;
  const detailProductId = productDetail?.prdSn ?? selected?.productId;
  const cancellationPending = selected?.cancelRequestId != null
    && selected?.cancelApprovedYn == null;
  const tradeId = overview?.tradeSn ?? selected?.tradeId;
  const detailAuctionStatusCode = auctionDetail?.auctionStatusCode
    ?? selected?.auctionStatusCode;
  const detailAuctionStatusLabel = auctionDetail?.auctionStatusName
    ?? selected?.auctionStatusName
    ?? detailAuctionStatusCode;
  const detailTradeStatusCode = overview?.tradeStatusCode ?? selected?.tradeStatusCode;
  const detailTradeStatusLabel = TRADE_STATUS_LABELS[detailTradeStatusCode]
    ?? selected?.tradeStatusName
    ?? detailTradeStatusCode;
  const detailSeller = selected?.sellerUserSn != null
    ? formatAdminMemberIdentity(
      selected.sellerMember,
      selected.sellerUserSn,
    )
    : auctionDetail?.sellerName?.trim()
      || formatAdminMemberIdentity(null, auctionDetail?.sellerId ?? productDetail?.usrSn);
  const canForceCancel = ['AUCC0001', 'AUCC0002', 'AUCC0003'].includes(
    detailAuctionStatusCode,
  ) && !cancellationPending;

  const forceCancel = () => {
    const reason = forceCancelReason.trim();
    if (!selected?.auctionId || !reason || forceCancelMutation.isPending) return;
    forceCancelMutation.mutate({
      auctionId: selected.auctionId,
      reason,
      requestId: createRequestId(),
    });
  };

  const submitSearch = (event) => {
    event.preventDefault();
    if (filterForm.registeredFrom && filterForm.registeredTo
      && filterForm.registeredFrom > filterForm.registeredTo) {
      setFilterError('등록 시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }
    setFilterError('');
    setPage(1);
    setFilters({ ...filterForm, keyword: filterForm.keyword.trim() });
  };

  const resetFilters = () => {
    setFilterError('');
    setPage(1);
    setFilterForm(INITIAL_FILTERS);
    setFilters(INITIAL_FILTERS);
  };

  const selectTab = (tab) => {
    setSelected(null);
    setReviewReason('');
    setSearchParams(tab === 'bid-units' ? { tab: 'bid-units' } : {});
  };

  return (
    <div className="admin-bjn-page admin-auction-page">
      <PageMeta title="경매 관리" />
      <AdminPageHeader title="경매 관리" />
      <CommonTabs
        activeValue={activeTab}
        ariaLabel="경매 관리 메뉴"
        className="admin-auction-tabs"
        items={[
          { value: 'auctions', label: '상품·경매 조회' },
          { value: 'bid-units', label: '입찰 단위 관리' },
        ]}
        onChange={selectTab}
      />
      {activeTab === 'bid-units' ? (
        <div role="tabpanel">
          <AdminBidUnitManagementPanel />
        </div>
      ) : (
        <div role="tabpanel">
      <form className="admin-bjn-filters admin-auction-filters" onSubmit={submitSearch}>
        <label>경매 상태
          <select onChange={(event) => setFilterForm({ ...filterForm, auctionStatusCode: event.target.value })} value={filterForm.auctionStatusCode}>
            <option value="">전체</option>
            <option value="AUCC0006">취소 요청</option>
            <option value="AUCC0002">진행 중</option>
            <option value="AUCC0001">진행 예정</option>
            <option value="AUCC0003">종료</option>
            <option value="AUCC0004">유찰</option>
            <option value="AUCC0005">취소</option>
          </select>
        </label>
        <label>거래 상태
          <select onChange={(event) => setFilterForm({ ...filterForm, tradeStatusCode: event.target.value })} value={filterForm.tradeStatusCode}>
            <option value="">전체</option>
            <option value="TRDC0003">진행중</option>
            <option value="TRDC0004">배송/직거래중</option>
            <option value="TRDC0005">상대확인대기</option>
            <option value="TRDC0006">완료</option>
            <option value="TRDC0007">보류</option>
            <option value="TRDC0008">취소</option>
          </select>
        </label>
        <label>취소 요청
          <select onChange={(event) => setFilterForm({ ...filterForm, cancellationPending: event.target.value })} value={filterForm.cancellationPending}>
            <option value="">전체</option>
            <option value="PENDING">처리 대기</option>
            <option value="NONE">처리 대기 없음</option>
          </select>
        </label>
        <label>등록 시작일<input onChange={(event) => setFilterForm({ ...filterForm, registeredFrom: event.target.value })} type="date" value={filterForm.registeredFrom} /></label>
        <label>등록 종료일<input onChange={(event) => setFilterForm({ ...filterForm, registeredTo: event.target.value })} type="date" value={filterForm.registeredTo} /></label>
        <label className="admin-auction-filters__search">검색<input onChange={(event) => setFilterForm({ ...filterForm, keyword: event.target.value })} placeholder="상품명·판매자·경매 번호" value={filterForm.keyword} /></label>
        <AdminFilterActions disabled={auctionsQuery.isFetching} onReset={resetFilters} />
      </form>
      {filterError && <p className="admin-auction-page__filter-error" role="alert">{filterError}</p>}
      {auctionsQuery.isError && <div className="admin-bjn-state is-error">경매 목록을 불러오지 못했습니다. <button className="btn btn-outline" onClick={() => auctionsQuery.refetch()} type="button">다시 시도</button></div>}
      {!auctionsQuery.isError && (
        <AdminSectionCard action={!auctionsQuery.isLoading && <span>총 {auctionsQuery.data?.totalItems ?? 0}건</span>} title="경매·거래 목록">
          <div className="admin-bjn-table-scroll">
            <AdminTable
              columns={columns}
              data={rows}
              loading={auctionsQuery.isLoading}
              rowKey={(row) => row.auctionId}
            />
          </div>
          <AdminPagination
            ariaLabel="경매·거래 목록 페이지 이동"
            disabled={auctionsQuery.isFetching}
            onPageChange={setPage}
            page={auctionsQuery.data?.page ?? page}
            totalPages={auctionsQuery.data?.totalPages ?? 0}
          />
        </AdminSectionCard>
      )}
      {selected && (
        <AdminDetailDrawer
          eyebrow="경매 관리"
          footer={(
            <button
              className="btn btn-outline"
              disabled={decisionMutation.isPending || forceCancelMutation.isPending}
              onClick={closeDetail}
              type="button"
            >
              닫기
            </button>
          )}
          onClose={closeDetail}
          title={selected.cancelRequestId ? '판매자 취소 요청/처리 이력' : '상품·경매 상세'}
        >
          <section
            aria-busy={overviewQuery.isLoading || cancellationQuery.isLoading}
            className="admin-auction-cancellation"
          >
            <h3>
              {productDetail?.prdNm
                ?? auctionDetail?.title
                ?? selected.productName
                ?? `경매 #${selected.auctionId}`}
            </h3>
            <dl>
              <dt>경매 번호</dt><dd>#{selected.auctionId}</dd>
              <dt>상품 번호</dt>
              <dd>{detailProductId == null ? '-' : `#${detailProductId}`}</dd>
              <dt>판매자</dt><dd>{detailSeller}</dd>
              <dt>경매 상태</dt>
              <dd>
                {detailAuctionStatusLabel
                  ? <AdminStatusBadge tone={auctionStatusTone(detailAuctionStatusCode)}>{detailAuctionStatusLabel}</AdminStatusBadge>
                  : '-'}
              </dd>
              <dt>입찰 수</dt><dd>{auctionDetail?.bidCount ?? selected.bidCount ?? 0}건</dd>
              <dt>현재가</dt><dd>{formatAmount(auctionDetail?.currentPrice)}</dd>
              <dt>시작가</dt><dd>{formatAmount(auctionDetail?.startPrice ?? productDetail?.prdStartAmt)}</dd>
              <dt>경매 시작</dt><dd>{formatDateTime(auctionDetail?.startDateTime)}</dd>
              <dt>경매 종료</dt><dd>{formatDateTime(auctionDetail?.endDateTime)}</dd>
              <dt>거래 번호</dt><dd>{tradeId == null ? '-' : `#${tradeId}`}</dd>
              <dt>거래 상태</dt>
              <dd>
                {detailTradeStatusLabel
                  ? <AdminStatusBadge tone={tradeStatusTone(detailTradeStatusCode)}>{detailTradeStatusLabel}</AdminStatusBadge>
                  : '-'}
              </dd>
              <dt>등록일</dt><dd>{formatDateTime(productDetail?.prdRegDt ?? selected.registeredAt)}</dd>
              {selected.cancelRequestId && (
                <>
                  <dt>요청 일시</dt>
                  <dd>{formatDateTime(cancellationDetail?.requestedAt ?? selected.cancelRequestedAt)}</dd>
                  <dt>판매자 사유</dt>
                  <dd>{cancellationDetail?.reason ?? selected.cancelReason}</dd>
                  {selected.cancelApprovedYn != null && (
                    <>
                      <dt>처리 결과</dt>
                      <dd>{selected.cancelApprovedYn === 'Y' ? '승인' : '반려'}</dd>
                      <dt>처리자</dt>
                      <dd>{formatAdminMemberIdentity(
                        selected.cancelProcessorMember,
                        selected.cancelProcessorUserSn,
                      )}</dd>
                      <dt>처리 일시</dt>
                      <dd>{formatDateTime(selected.cancelProcessedAt)}</dd>
                      <dt>관리자 처리 사유</dt>
                      <dd>{selected.cancelProcessReason ?? '-'}</dd>
                    </>
                  )}
                </>
              )}
            </dl>
            {overviewQuery.isError && (
              <p className="admin-auction-cancellation__sync-status is-error" role="alert">
                {selected == null
                  ? '경매 상세를 불러오지 못했습니다.'
                  : '최신 경매 상세를 불러오지 못해 목록의 요약 정보를 표시합니다.'}
              </p>
            )}
            {cancellationPending && <>
              {cancellationQuery.isError && (
                <p className="admin-auction-cancellation__sync-status is-error" role="alert">
                  현재 처리 대기 중인 취소 요청을 확인하지 못했습니다. 목록을 새로 조회해 주세요.
                </p>
              )}
              <label>관리자 처리 사유<textarea disabled={decisionMutation.isPending} onChange={(event) => setReviewReason(event.target.value)} placeholder="승인 또는 반려 사유를 입력하세요." value={reviewReason} /></label>
              {!reviewReason.trim() && (
                <p className="admin-auction-cancellation__validation" role="alert">
                  처리 사유를 입력해야 승인 또는 반려할 수 있습니다.
                </p>
              )}
              {decisionMutation.isError && <p className="admin-bjn-state is-error">처리에 실패했습니다. 이미 처리된 요청인지 확인해 주세요.</p>}
              <div className="admin-auction-cancellation__actions">
                <button className="btn btn-outline" disabled={!reviewReason.trim() || decisionMutation.isPending || cancellationQuery.isLoading || cancellationQuery.isError} onClick={() => decide('REJECTED')} type="button">반려</button>
                <button className="btn btn-primary" disabled={!reviewReason.trim() || decisionMutation.isPending || cancellationQuery.isLoading || cancellationQuery.isError} onClick={() => decide('APPROVED')} type="button">{decisionMutation.isPending ? '처리 중…' : '취소 승인'}</button>
              </div>
            </>}
            {canForceCancel && (
              <section className="admin-auction-force-cancel">
                <h4>관리자 강제 취소</h4>
                <p>
                  입찰·보관금·거래가 있으면 경매 취소 전용 서비스에서 함께 정리합니다.
                </p>
                <label>
                  취소 사유
                  <textarea
                    disabled={forceCancelMutation.isPending}
                    maxLength="1000"
                    onChange={(event) => setForceCancelReason(event.target.value)}
                    placeholder="강제 취소 사유를 입력하세요."
                    value={forceCancelReason}
                  />
                </label>
                {!forceCancelReason.trim() && (
                  <p className="admin-auction-cancellation__validation" role="alert">
                    취소 사유를 입력해야 강제 취소할 수 있습니다.
                  </p>
                )}
                {forceCancelMutation.isError && (
                  <p className="admin-bjn-state is-error" role="alert">
                    경매를 취소하지 못했습니다. 현재 경매·거래 상태를 확인해 주세요.
                  </p>
                )}
                <div className="admin-auction-cancellation__actions">
                  <button
                    className="btn btn-danger"
                    disabled={!forceCancelReason.trim() || forceCancelMutation.isPending}
                    onClick={forceCancel}
                    type="button"
                  >
                    {forceCancelMutation.isPending ? '취소 처리 중…' : '경매 강제 취소'}
                  </button>
                </div>
              </section>
            )}
            <AdminHistoryTimeline
              referenceSn={selected.auctionId}
              referenceType="AUCTION"
              title="경매 운영 이력"
            />
          </section>
        </AdminDetailDrawer>
      )}
        </div>
      )}
    </div>
  );
};

export default AdminAuctionManagementPage;
