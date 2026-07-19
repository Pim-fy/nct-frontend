import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import AdminModal from '@components/admin/AdminModal';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import AdminTable from '@components/admin/AdminTable';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import PageMeta from '@components/admin/PageMeta';
import '../audit/adminAuditPage.css';
import './adminAuctionManagementPage.css';

/**
 * 담당자 7 · F-OPS-003, F-OPS-004: 관리자 상품·경매 조회와 판매자 취소 요청 심사 화면입니다.
 * 임시 이유: 상품·경매·거래를 묶는 관리자 조회 API와 담당자 4의 취소 처리 API가 아직 제공되지 않아
 * SAMPLE_ROWS로 화면 흐름만 확인합니다. API가 준비되면 TanStack Query 결과와 mutation으로 교체합니다.
 */
const SAMPLE_ROWS = [
  { id: 'AUC-104', product: '캠핑 의자 세트', seller: '김민수', productStatus: '판매중', auctionStatus: '진행중', bidStatus: '입찰 4건', tradeStatus: '-', date: '2026-07-19' },
  { id: 'AUC-103', product: '태블릿 11인치', seller: '이서연', productStatus: '낙찰', auctionStatus: '종료', bidStatus: '입찰 7건', tradeStatus: '거래대기', date: '2026-07-18' },
  { id: 'AUC-102', tradeSn: 102, product: '원목 책상', seller: '박준호', productStatus: '거래중', auctionStatus: '종료', bidStatus: '입찰 2건', tradeStatus: '취소 요청', date: '2026-07-17', cancellation: { requestedAt: '2026-07-18 10:30', reason: '낙찰자와 배송 일정 조율이 어려워 거래 취소를 요청합니다.' } },
];

const tone = (value) => ({ 진행중: 'info', 낙찰: 'warning', 거래중: 'info', 판매완료: 'success', 완료: 'success', 거래대기: 'warning', 배송중: 'info', 종료: 'neutral', '취소 요청': 'danger', '취소 승인': 'success', '거래 유지': 'neutral' }[value] ?? 'neutral');

const AdminAuctionManagementPage = () => {
  const [auctions, setAuctions] = useState(SAMPLE_ROWS);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState(null);
  const [reviewReason, setReviewReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const rows = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return query ? auctions.filter((row) => `${row.id} ${row.product} ${row.seller}`.toLowerCase().includes(query)) : auctions;
  }, [auctions, keyword]);
  const openDetail = (row) => {
    setSelected(row);
    setReviewReason('');
  };
  const decideCancellation = (decision) => {
    const reason = reviewReason.trim();
    if (!reason || !selected?.cancellation) return;

    /**
     * 담당자 7 · F-OPS-004 임시 어댑터: 담당자 4의 실제 API가 준비되기 전 화면 상태만 갱신합니다.
     * 교체 대상: tradeSn, decision, reason을 서버에 전달하는 mutation. 서버는 관리자 권한·현재 상태·중복 요청·감사 기록을 검증해야 합니다.
     */
    const approved = decision === 'approve';
    setAuctions((current) => current.map((row) => row.id === selected.id ? {
      ...row,
      tradeStatus: approved ? '취소 승인' : '거래 유지',
      cancellation: { ...row.cancellation, decision: approved ? '승인' : '반려', reviewReason: reason },
    } : row));
    setFeedback(`${selected.id} 취소 요청을 ${approved ? '승인' : '반려'}했습니다. 현재는 화면 확인용 임시 처리입니다.`);
    setSelected(null);
  };
  const columns = [
    ...['id', 'product', 'seller', 'productStatus', 'auctionStatus', 'bidStatus', 'tradeStatus', 'date'].map((key) => ({
      key,
      label: ({ id: '경매 번호', product: '상품명', seller: '판매자', productStatus: '상품', auctionStatus: '경매', bidStatus: '입찰', tradeStatus: '거래', date: '등록일' })[key],
      render: key.endsWith('Status') ? (value) => <AdminStatusBadge tone={tone(value)}>{value}</AdminStatusBadge> : undefined,
    })),
    { key: 'manage', label: '관리', render: (_, row) => <button className="btn btn-outline" onClick={(event) => { event.stopPropagation(); openDetail(row); }} type="button">{row.cancellation?.decision ? '처리 결과' : row.cancellation ? '취소 심사' : '상세보기'}</button> },
  ];

  return <div className="admin-bjn-page admin-auction-page">
    <PageMeta title="상품·경매 조회" />
    <MockupAdminPageHeader eyebrow="담당자 7 · F-OPS-003 / F-OPS-004" title="상품·경매 조회" description="상품, 경매, 입찰, 거래 상태와 판매자 취소 요청을 한 화면에서 확인합니다. 현재는 API 연결 전 임시 데이터입니다." />
    <form className="admin-bjn-filters" onSubmit={(event) => event.preventDefault()}><label>검색<input onChange={(event) => setKeyword(event.target.value)} placeholder="상품명 · 판매자 · 경매번호" value={keyword} /></label><button type="submit"><Search aria-hidden="true" /> 조회</button></form>
    {feedback && <p className="admin-auction-page__feedback" role="status">{feedback}</p>}
    <AdminSectionCard action={<span>총 {rows.length}건</span>} description="상품·경매·거래 상태를 선택하면 상세와 취소 심사를 확인할 수 있습니다." title="경매·거래 목록"><div className="admin-bjn-table-scroll"><AdminTable columns={columns} data={rows} onRowClick={openDetail} /></div></AdminSectionCard>
    {selected && <AdminModal onClose={() => setSelected(null)} title={selected.cancellation ? '판매자 취소 요청 심사' : '상품·경매 상세'}>{selected.cancellation ? <section className="admin-auction-cancellation"><h3>{selected.product}</h3><dl><dt>경매 번호</dt><dd>{selected.id}</dd><dt>거래 번호</dt><dd>{selected.tradeSn ?? '-'}</dd><dt>판매자</dt><dd>{selected.seller}</dd><dt>요청 일시</dt><dd>{selected.cancellation.requestedAt}</dd><dt>판매자 사유</dt><dd>{selected.cancellation.reason}</dd></dl>{selected.cancellation.decision ? <p className="admin-auction-cancellation__result">처리 결과: <strong>{selected.cancellation.decision}</strong><br />관리자 사유: {selected.cancellation.reviewReason}</p> : <><label>관리자 처리 사유<textarea onChange={(event) => setReviewReason(event.target.value)} placeholder="승인 또는 반려 사유를 입력하세요." value={reviewReason} /></label><p className="admin-auction-cancellation__notice">승인·반려 모두 사유가 필요합니다. 실제 서버 연동 후에는 처리 결과를 되돌릴 수 없으므로 확인 후 처리합니다.</p><div className="admin-auction-cancellation__actions"><button className="btn btn-outline" disabled={!reviewReason.trim()} onClick={() => decideCancellation('reject')} type="button">반려</button><button className="btn btn-primary" disabled={!reviewReason.trim()} onClick={() => decideCancellation('approve')} type="button">취소 승인</button></div></>}</section> : <section className="admin-bjn-panel"><h2>{selected.product}</h2><p>경매 번호 {selected.id} · 판매자 {selected.seller} · 등록일 {selected.date}</p><p>상품 {selected.productStatus} / 경매 {selected.auctionStatus} / {selected.bidStatus} / 거래 {selected.tradeStatus}</p></section>}</AdminModal>}
  </div>;
};

export default AdminAuctionManagementPage;
