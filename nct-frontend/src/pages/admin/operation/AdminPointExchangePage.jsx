import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  completeAdminPointExchange,
  getAdminPointExchangeOrders,
  rejectAdminPointExchange,
} from '@api/adminPointExchangeApi';
import AdminModal from '@components/admin/AdminModal';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import AdminTable from '@components/admin/AdminTable';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import PageMeta from '@components/admin/PageMeta';
import '../audit/adminAuditPage.css';
import './adminOperationPages.css';

const formatAmount = (value) => `${Number(value ?? 0).toLocaleString('ko-KR')}P`;

const maskAccount = (value) => {
  const normalized = String(value ?? '').replace(/\s/g, '');
  if (!normalized) return '-';
  const visible = normalized.slice(-4);
  return `${'*'.repeat(Math.max(normalized.length - visible.length, 4))}${visible}`;
};

/** F-PAY-012: 수동 계좌 이체 후 환전 지급 결과를 기록하는 관리자 화면입니다. */
const AdminPointExchangePage = () => {
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [accountRevealed, setAccountRevealed] = useState(false);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [feedback, setFeedback] = useState('');

  const ordersQuery = useQuery({
    queryKey: ['admin', 'point-exchange', 'requested'],
    queryFn: getAdminPointExchangeOrders,
  });
  const processMutation = useMutation({
    mutationFn: ({ action, orderSn, rejectReason }) => (
      action === 'complete'
        ? completeAdminPointExchange(orderSn)
        : rejectAdminPointExchange({ orderSn, reason: rejectReason })
    ),
    onSuccess: (_, variables) => {
      setFeedback(
        `환전 신청 #${variables.orderSn}을 ${
          variables.action === 'complete' ? '지급 완료' : '반려'
        } 처리했습니다.`,
      );
      setSelected(null);
      setReason('');
      setAccountRevealed(false);
      setTransferConfirmed(false);
      ordersQuery.refetch();
    },
  });

  const columns = useMemo(() => [
    { key: 'id', label: '신청 번호', render: (value) => `#${value}` },
    {
      key: 'userName',
      label: '신청자',
      render: (value, row) => `${value || '-'} (#${row.userSn})`,
    },
    { key: 'amount', label: '신청 금액', render: formatAmount },
    {
      key: 'accountNo',
      label: '지급 계좌',
      render: (value, row) => `${row.bankName || '-'} ${maskAccount(value)}`,
    },
    { key: 'date', label: '신청일' },
    {
      key: 'status',
      label: '상태',
      render: (value) => <AdminStatusBadge tone="warning">{value || '신청'}</AdminStatusBadge>,
    },
    {
      key: 'manage',
      label: '관리',
      render: (_, row) => (
        <button
          className="btn btn-primary admin-operation-table__action"
          onClick={(event) => {
            event.stopPropagation();
            setSelected(row);
            setReason('');
            setAccountRevealed(false);
            setTransferConfirmed(false);
          }}
          type="button"
        >
          처리
        </button>
      ),
    },
  ], []);

  const complete = () => {
    if (!selected || !transferConfirmed || processMutation.isPending) return;
    processMutation.mutate({ action: 'complete', orderSn: selected.id });
  };

  const reject = () => {
    const normalizedReason = reason.trim();
    if (!selected || !normalizedReason || processMutation.isPending) return;
    processMutation.mutate({
      action: 'reject',
      orderSn: selected.id,
      rejectReason: normalizedReason,
    });
  };

  return (
    <div className="admin-bjn-page admin-operation-page">
      <PageMeta title="환전 관리" />
      <MockupAdminPageHeader title="환전 관리" />

      {feedback && <p className="admin-operation-feedback" role="status">{feedback}</p>}
      {ordersQuery.isLoading && <div className="admin-bjn-state">환전 신청을 불러오는 중입니다.</div>}
      {ordersQuery.isError && (
        <div className="admin-bjn-state is-error">
          환전 신청을 불러오지 못했습니다.
          <button className="btn btn-outline" onClick={() => ordersQuery.refetch()} type="button">
            다시 시도
          </button>
        </div>
      )}
      {!ordersQuery.isLoading && !ordersQuery.isError && (
        <AdminSectionCard
          action={<span>지급 대기 {(ordersQuery.data ?? []).length}건</span>}
          title="환전 지급 대기"
        >
          <div className="admin-bjn-table-scroll">
            <AdminTable
              columns={columns}
              data={ordersQuery.data ?? []}
              onRowClick={(row) => {
                setSelected(row);
                setReason('');
                setAccountRevealed(false);
                setTransferConfirmed(false);
              }}
            />
          </div>
        </AdminSectionCard>
      )}

      {selected && (
        <AdminModal
          onClose={() => !processMutation.isPending && setSelected(null)}
          title="환전 신청 처리"
        >
          <section className="admin-operation-detail">
            <dl>
              <dt>신청 번호</dt><dd>#{selected.id}</dd>
              <dt>신청자</dt><dd>{selected.userName || '-'} (회원 #{selected.userSn})</dd>
              <dt>신청 금액</dt><dd><strong>{formatAmount(selected.amount)}</strong></dd>
              <dt>은행</dt><dd>{selected.bankName || '-'}</dd>
              <dt>지급 계좌</dt>
              <dd className="admin-operation-account">
                <span>{accountRevealed ? selected.accountNo || '-' : maskAccount(selected.accountNo)}</span>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setAccountRevealed((current) => !current);
                    setTransferConfirmed(false);
                  }}
                  type="button"
                >
                  {accountRevealed ? '숨기기' : '계좌번호 보기'}
                </button>
              </dd>
              <dt>신청일</dt><dd>{selected.date || '-'}</dd>
            </dl>

            <label className="admin-operation-confirm">
              <input
                checked={transferConfirmed}
                disabled={!accountRevealed || processMutation.isPending}
                onChange={(event) => setTransferConfirmed(event.target.checked)}
                type="checkbox"
              />
              계좌번호를 확인하고 실제 이체를 완료했습니다.
            </label>

            <label className="admin-operation-detail__reason">
              반려 사유
              <textarea
                disabled={processMutation.isPending}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder="반려할 경우 사유를 입력하세요."
                value={reason}
              />
            </label>

            {processMutation.isError && (
              <p className="admin-operation-error" role="alert">
                {processMutation.error?.response?.data?.message
                  ?? '환전 처리에 실패했습니다. 이미 처리된 신청인지 확인해 주세요.'}
              </p>
            )}
            <div className="admin-operation-actions">
              <button
                className="btn btn-outline"
                disabled={!reason.trim() || processMutation.isPending}
                onClick={reject}
                type="button"
              >
                반려
              </button>
              <button
                className="btn btn-primary"
                disabled={!transferConfirmed || processMutation.isPending}
                onClick={complete}
                type="button"
              >
                {processMutation.isPending ? '처리 중…' : '지급 완료'}
              </button>
            </div>
          </section>
        </AdminModal>
      )}
    </div>
  );
};

export default AdminPointExchangePage;
