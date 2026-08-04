// src/pages/user/point/components/PointLedgerTable.jsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMyBidHistory } from '@hooks/useBid';
import PointTable from './PointTable';

// 원장유형(PTLG02)별 배지 색 — 목업 badge-success/warning/blue/gray 매핑
const TYPE_BADGE = {
  충전:       'bg-blue-100 text-blue-800',
  홀딩:       'bg-amber-100 text-amber-800',
  반환:       'bg-indigo-100 text-indigo-800',
  보관금전환: 'bg-amber-100 text-amber-800',
  정산:       'bg-blue-100 text-blue-800',
  전환:       'bg-purple-100 text-purple-800',
  환전출금:   'bg-red-100 text-red-700',
  환전복원:   'bg-teal-100 text-teal-800',
  환불:       'bg-cyan-100 text-cyan-800',
  보정:       'bg-gray-100 text-gray-600',
};

const badge = (label) => (
  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium ${TYPE_BADGE[label] ?? 'bg-gray-100 text-gray-600'}`}>
    {label}
  </span>
);

// 참조유형공통코드(REFG01) → 이동할 화면 경로.
// 거래(REFC0005)는 정산 적립(PTLC0008)이면 판매자 화면, 보관금 환불(PTLC0013)이면 구매자 화면으로 보낸다 —
// 정산은 항상 판매자에게, 환불은 항상 구매자/의뢰자에게 적립되기 때문 (PointLedgerType 주석 기준).
// 입찰(REFC0004)은 원장에 경매번호가 없어(bidSn만 있음), 내 입찰 내역(/bids/me, 담당자5 제공 조회
// 계약)에서 bidSn→aucSn을 찾아 진행 중이든 종료됐든 상관없이 해당 경매 상세로 보낸다.
const resolveRefLink = (row, bidByBidSn) => {
  if (!row.refTypeCd || row.refSn == null) return null;
  switch (row.refTypeCd) {
    case 'REFC0005': // 거래
      return row.typeCd === 'PTLC0008' ? `/trades/${row.refSn}/seller` : `/trades/${row.refSn}`;
    case 'REFC0004': { // 입찰
      const aucSn = bidByBidSn.get(row.refSn)?.aucSn;
      return aucSn ? `/auction/${aucSn}` : null;
    }
    default:
      return null;
  }
};

// 참조번호(BID_SN 등)는 화면에서 그 자체로는 의미가 없어서, 알아볼 수 있는 상품명이 있으면
// 상품명만 보여준다 — 참조번호는 화면에 안 찍어도 refTypeCd/refSn과 링크(href)에는 그대로
// 남아있어 데이터 연결·원장-DB 대조에는 영향 없다 (사용자 결정, 2026-07-29).
const withProductName = (row, bidByBidSn) => {
  if (row.refTypeCd === 'REFC0004') {
    const title = bidByBidSn.get(row.refSn)?.auctionTitle;
    if (title) return title;
  }
  return row.ref;
};

// 표 배치는 공용 셸(PointTable)이 담당 — 여기는 컬럼 구성과 셀 내용만 정의한다 (2026-07-20 통합)
const buildColumns = (bidByBidSn) => [
  { key: 'date', header: '일시', widthClass: 'min-w-[150px]', cellClass: 'whitespace-nowrap text-gray-700', render: (r) => r.date },
  {
    key: 'type', header: '유형', widthClass: 'min-w-[110px]', cellClass: 'whitespace-nowrap',
    render: (r) => (
      <>
        {badge(r.type)}
        <span className="ml-1.5 text-xs text-gray-400">({r.category})</span>
      </>
    ),
  },
  {
    key: 'amount', header: '변동금액', align: 'right', widthClass: 'min-w-[110px]',
    cellClass: (r) => `whitespace-nowrap font-medium ${r.amount > 0 ? 'text-blue-700' : 'text-red-700'}`,
    render: (r) => `${r.amount > 0 ? '+' : ''}${r.amount.toLocaleString()}P`,
  },
  {
    key: 'balanceAfter', header: '잔액', align: 'right', widthClass: 'min-w-[110px]', cellClass: 'whitespace-nowrap text-gray-700',
    render: (r) => `${r.balanceAfter.toLocaleString()}P`,
  },
  {
    key: 'ref', header: '관련', cellClass: 'max-w-[140px] truncate text-gray-500',
    render: (r) => {
      if (!r.ref) return '-';
      const label = withProductName(r, bidByBidSn);
      const link = resolveRefLink(r, bidByBidSn);
      return link
        ? <Link to={link} title={label} className="text-blue-600 hover:underline">{label}</Link>
        : <span title={label}>{label}</span>;
    },
  },
  {
    key: 'reason', header: '사유', cellClass: 'max-w-[160px] truncate text-gray-500',
    render: (r) => <span title={r.reason}>{r.reason}</span>,
  },
];

// 모바일 카드 한 장 — 표 컬럼과 같은 데이터를 배지+날짜 / 금액+잔액 / 사유 / 관련 순서로 배치한다
// (사유·관련처럼 폭이 일정치 않은 정보가 있어 표는 sm 이상에서만, 좁은 화면은 카드로 보여준다, 2026-08-03)
const buildRenderCard = (bidByBidSn) => (r) => {
  const label = r.ref ? withProductName(r, bidByBidSn) : null;
  const link = r.ref ? resolveRefLink(r, bidByBidSn) : null;
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span>
          {badge(r.type)}
          <span className="ml-1.5 text-xs text-gray-400">({r.category})</span>
        </span>
        <span className="text-xs text-gray-400 whitespace-nowrap">{r.date}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className={`text-base font-bold ${r.amount > 0 ? 'text-blue-700' : 'text-red-700'}`}>
          {r.amount > 0 ? '+' : ''}{r.amount.toLocaleString()}P
        </span>
        <span className="text-xs text-gray-400 whitespace-nowrap">잔액 {r.balanceAfter.toLocaleString()}P</span>
      </div>
      {r.reason && <div className="mt-1 text-[13px] leading-snug text-gray-500">{r.reason}</div>}
      {label && (
        link
          ? <Link to={link} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">↗ {label}</Link>
          : <div className="mt-1 text-xs text-gray-500">{label}</div>
      )}
    </>
  );
};

// limit을 주면(마이페이지 요약 카드) 최근 N건만 보여주고 "+"로 전체보기 모달을 띄운다.
// limit 없이 부르면(전체보기 모달 안) 전부 보여준다 (2026-07-29).
/** 포인트 원장 내역 테이블 (F-PAY-039) */
const PointLedgerTable = ({ rows, limit, onExpand, loading }) => {
  const { data: myBids } = useMyBidHistory();
  const bidByBidSn = useMemo(
    () => new Map((myBids ?? []).map((b) => [b.bidSn, b])),
    [myBids],
  );
  const columns = useMemo(() => buildColumns(bidByBidSn), [bidByBidSn]);
  const renderCard = useMemo(() => buildRenderCard(bidByBidSn), [bidByBidSn]);
  const visibleRows = limit ? rows.slice(0, limit) : rows;

  return (
    <PointTable
      title="포인트 내역"
      columns={columns}
      rows={visibleRows}
      emptyText="포인트 내역이 없습니다."
      onExpand={limit ? onExpand : undefined}
      pageSize={limit ? undefined : 10}
      loading={loading}
      renderCard={renderCard}
    />
  );
};

export default PointLedgerTable;
