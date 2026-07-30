import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { decideAdminAuctionCancellation, fetchAdminAuctions } from '@api/adminAuctionApi';
import AdminModal from '@components/admin/AdminModal';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import AdminTable from '@components/admin/AdminTable';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import PageMeta from '@components/admin/PageMeta';
import { formatDateTime } from '@utils/common';
import '../audit/adminAuditPage.css';
import './adminAuctionManagementPage.css';

// 담당자 7 · F-OPS-003/004: 관리자 경매 운영 조회와 판매자 취소 승인 화면입니다.
const tone = (statusCode) => {
  if (statusCode === 'AUCC0006') return 'danger';
  if (statusCode === 'AUCC0005') return 'danger';
  if (statusCode === 'AUCC0003') return 'neutral';
  if (statusCode === 'AUCC0002') return 'info';
  return 'neutral';
};

const INITIAL_FILTERS = {
  keyword: '',
  auctionStatusCode: '',
  tradeStatusCode: '',
  cancellationPending: '',
  registeredFrom: '',
  registeredTo: '',
};

const AdminAuctionManagementPage = () => {
  const [filterForm, setFilterForm] = useState(INITIAL_FILTERS);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [filterError, setFilterError] = useState('');
  const [selected, setSelected] = useState(null);
  const [reviewReason, setReviewReason] = useState('');
  const [feedback, setFeedback] = useState('');

  const auctionsQuery = useQuery({
    queryKey: ['admin-auctions', filters],
    queryFn: () => fetchAdminAuctions({
      keyword: filters.keyword || undefined,
      auctionStatusCode: filters.auctionStatusCode || undefined,
      tradeStatusCode: filters.tradeStatusCode || undefined,
      cancellationPending: filters.cancellationPending === ''
        ? undefined
        : filters.cancellationPending === 'PENDING',
      registeredFrom: filters.registeredFrom || undefined,
      registeredTo: filters.registeredTo || undefined,
      page: 1,
      size: 50,
    }),
  });
  const decisionMutation = useMutation({
    mutationFn: decideAdminAuctionCancellation,
    onSuccess: (_, variables) => {
      setFeedback(`경매 #${variables.auctionId} 취소 요청을 ${variables.decision === 'APPROVED' ? '승인' : '반려'}했습니다.`);
      setSelected(null);
      setReviewReason('');
      auctionsQuery.refetch();
    },
  });

  const rows = auctionsQuery.data?.items ?? [];
  const columns = useMemo(() => [
    { key: 'auctionId', label: '경매 번호', render: (value) => `#${value}` },
    { key: 'productName', label: '상품명' },
    { key: 'sellerName', label: '판매자' },
    { key: 'auctionStatusName', label: '경매', render: (value, row) => <AdminStatusBadge tone={tone(row.auctionStatusCode)}>{value ?? row.auctionStatusCode}</AdminStatusBadge> },
    { key: 'bidCount', label: '입찰', render: (value) => `${value ?? 0}건` },
    { key: 'tradeStatusName', label: '거래', render: (value, row) => value ?? row.tradeStatusCode ?? '-' },
    { key: 'registeredAt', label: '등록일', render: formatDateTime },
    {
      key: 'manage', label: '관리', render: (_, row) => (
        <button className={row.cancelRequestId ? 'btn btn-danger' : 'btn btn-outline'} onClick={(event) => { event.stopPropagation(); setSelected(row); setReviewReason(''); }} type="button">
          {row.cancelRequestId ? '취소 심사' : '상세 보기'}
        </button>
      ),
    },
  ], []);

  const decide = (decision) => {
    const reason = reviewReason.trim();
    if (!selected?.cancelRequestId || !reason || decisionMutation.isPending) return;
    decisionMutation.mutate({ auctionId: selected.auctionId, decision, reason });
  };

  const submitSearch = (event) => {
    event.preventDefault();
    if (filterForm.registeredFrom && filterForm.registeredTo
      && filterForm.registeredFrom > filterForm.registeredTo) {
      setFilterError('등록 시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }
    setFilterError('');
    setFilters({ ...filterForm, keyword: filterForm.keyword.trim() });
  };

  const resetFilters = () => {
    setFilterError('');
    setFilterForm(INITIAL_FILTERS);
    setFilters(INITIAL_FILTERS);
  };

  return (
    <div className="admin-bjn-page admin-auction-page">
      <PageMeta title="상품·경매 조회" />
      <MockupAdminPageHeader title="상품·경매 조회" />
      <form className="admin-bjn-filters admin-auction-filters" onSubmit={submitSearch}>
        <label>경매 상태
          <select onChange={(event) => setFilterForm({ ...filterForm, auctionStatusCode: event.target.value })} value={filterForm.auctionStatusCode}>
            <option value="">전체</option>
            <option value="AUCC0001">진행 예정</option>
            <option value="AUCC0002">진행 중</option>
            <option value="AUCC0003">종료</option>
            <option value="AUCC0004">유찰</option>
            <option value="AUCC0005">취소</option>
            <option value="AUCC0006">취소 요청</option>
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
        <button type="submit"><Search aria-hidden="true" />조회</button>
        {Object.values(filters).some(Boolean) && <button className="admin-auction-filters__reset" onClick={resetFilters} type="button">초기화</button>}
      </form>
      {filterError && <p className="admin-auction-page__filter-error" role="alert">{filterError}</p>}
      {feedback && <p className="admin-auction-page__feedback" role="status">{feedback}</p>}
      {auctionsQuery.isError && <div className="admin-bjn-state is-error">경매 목록을 불러오지 못했습니다. <button className="btn btn-outline" onClick={() => auctionsQuery.refetch()} type="button">다시 시도</button></div>}
      {!auctionsQuery.isError && (
        <AdminSectionCard action={!auctionsQuery.isLoading && <span>총 {auctionsQuery.data?.totalItems ?? 0}건</span>} title="경매·거래 목록">
          <div className="admin-bjn-table-scroll">
            <AdminTable
              columns={columns}
              data={rows}
              loading={auctionsQuery.isLoading}
              onRowClick={(row) => { setSelected(row); setReviewReason(''); }}
            />
          </div>
        </AdminSectionCard>
      )}
      {selected && (
        <AdminModal onClose={() => !decisionMutation.isPending && setSelected(null)} title={selected.cancelRequestId ? '판매자 취소 요청 심사' : '상품·경매 상세'}>
          <section className="admin-auction-cancellation">
            <h3>{selected.productName}</h3>
            <dl>
              <dt>경매 번호</dt><dd>#{selected.auctionId}</dd>
              <dt>판매자</dt><dd>{selected.sellerName}</dd>
              <dt>경매 상태</dt><dd>{selected.auctionStatusName ?? selected.auctionStatusCode}</dd>
              <dt>입찰 수</dt><dd>{selected.bidCount ?? 0}건</dd>
              <dt>거래 상태</dt><dd>{selected.tradeStatusName ?? selected.tradeStatusCode ?? '-'}</dd>
              <dt>등록일</dt><dd>{formatDateTime(selected.registeredAt)}</dd>
              {selected.cancelRequestId && <><dt>요청 일시</dt><dd>{formatDateTime(selected.cancelRequestedAt)}</dd><dt>판매자 사유</dt><dd>{selected.cancelReason}</dd></>}
            </dl>
            {selected.cancelRequestId && <>
              <label>관리자 처리 사유<textarea disabled={decisionMutation.isPending} onChange={(event) => setReviewReason(event.target.value)} placeholder="승인 또는 반려 사유를 입력하세요." value={reviewReason} /></label>
              {!reviewReason.trim() && (
                <p className="admin-auction-cancellation__validation" role="alert">
                  처리 사유를 입력해야 승인 또는 반려할 수 있습니다.
                </p>
              )}
              {decisionMutation.isError && <p className="admin-bjn-state is-error">처리에 실패했습니다. 이미 처리된 요청인지 확인해 주세요.</p>}
              <div className="admin-auction-cancellation__actions">
                <button className="btn btn-outline" disabled={!reviewReason.trim() || decisionMutation.isPending} onClick={() => decide('REJECTED')} type="button">반려</button>
                <button className="btn btn-primary" disabled={!reviewReason.trim() || decisionMutation.isPending} onClick={() => decide('APPROVED')} type="button">{decisionMutation.isPending ? '처리 중…' : '취소 승인'}</button>
              </div>
            </>}
          </section>
        </AdminModal>
      )}
    </div>
  );
};

export default AdminAuctionManagementPage;
