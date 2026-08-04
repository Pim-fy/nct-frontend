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

// 사유는 "고정 문구: 관리자 입력 상세" 형태인 경우가 있어(취소 사유 등) 콜론 앞
// 고정 문구만 기본 표시하고, 전체 텍스트는 title 툴팁으로 남긴다 (2026-08-04, 가독성 개선).
const reasonSummary = (reason) => {
  if (!reason) return reason;
  const colonIndex = reason.indexOf(':');
  return colonIndex === -1 ? reason : reason.slice(0, colonIndex);
};

// 표 배치는 공용 셸(PointTable)이 담당 — 여기는 컬럼 구성과 셀 내용만 정의한다 (2026-07-20 통합)
// widthClass 퍼센트는 앞 3열(일시/배지/금액)만 충전·환전 내역 표와 맞춰뒀다 — 이 표는 잔액
// 컬럼이 하나 더 있어 컬럼 수가 달라서, 뒤쪽(잔액/관련/사유)까지 세 표를 전부 맞추진 못한다
// (2026-08-04, PointTable.jsx 참고).
const buildColumns = (bidByBidSn) => [
  { key: 'date', header: '일시', widthClass: 'w-[18%]', cellClass: 'whitespace-nowrap text-gray-700', render: (r) => r.date },
  {
    key: 'type', header: '유형', widthClass: 'w-[12%]', cellClass: 'whitespace-nowrap',
    render: (r) => badge(r.type),
  },
  {
    key: 'amount', header: '변동금액', align: 'right', widthClass: 'w-[14%]',
    cellClass: (r) => `whitespace-nowrap font-medium ${r.amount > 0 ? 'text-blue-700' : 'text-red-700'}`,
    render: (r) => `${r.amount > 0 ? '+' : ''}${r.amount.toLocaleString()}P`,
  },
  {
    key: 'balanceAfter', header: '잔액', align: 'right', widthClass: 'w-[14%]', cellClass: 'whitespace-nowrap text-gray-700',
    render: (r) => `${r.balanceAfter.toLocaleString()}P`,
  },
  {
    key: 'ref', header: '관련', widthClass: 'w-[16%]', cellClass: 'truncate text-gray-500',
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
    key: 'reason', header: '사유', widthClass: 'w-[26%]', cellClass: 'truncate text-gray-500',
    render: (r) => <span title={r.reason}>{reasonSummary(r.reason)}</span>,
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
        {badge(r.type)}
        <span className="text-xs text-gray-400 whitespace-nowrap">{r.date}</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className={`text-base font-bold ${r.amount > 0 ? 'text-blue-700' : 'text-red-700'}`}>
          {r.amount > 0 ? '+' : ''}{r.amount.toLocaleString()}P
        </span>
        <span className="text-xs text-gray-400 whitespace-nowrap">잔액 {r.balanceAfter.toLocaleString()}P</span>
      </div>
      {r.reason && <div className="mt-1 text-[13px] leading-snug text-gray-500" title={r.reason}>{reasonSummary(r.reason)}</div>}
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
// 홀딩 카테고리 행은 기본 노출에서 뺀다(2026-08-04) — 홀딩은 사용자가 취소·조작할 수 없는
// 시스템 처리 중 상태라 행 자체가 정보 가치가 없고, 홀딩이 걸리거나 반환될 때 짝이 되는
// 사용가능 카테고리 행("-15,000P, 사유: 입찰 포인트 홀딩")이 같은 사건을 이미 설명해준다.
// 원장(POINT_LEDGER)에는 그대로 남고, 화면 노출만 거른다 — 상단 홀딩 요약 카드는 별개로 유지.
const HIDDEN_CATEGORIES = new Set(['홀딩']);

/** 포인트 원장 내역 테이블 (F-PAY-039) */
const PointLedgerTable = ({ rows, limit, onExpand, loading }) => {
  const { data: myBids } = useMyBidHistory();
  const bidByBidSn = useMemo(
    () => new Map((myBids ?? []).map((b) => [b.bidSn, b])),
    [myBids],
  );
  const columns = useMemo(() => buildColumns(bidByBidSn), [bidByBidSn]);
  const renderCard = useMemo(() => buildRenderCard(bidByBidSn), [bidByBidSn]);
  const displayRows = rows.filter((r) => !HIDDEN_CATEGORIES.has(r.category));
  const visibleRows = limit ? displayRows.slice(0, limit) : displayRows;

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
