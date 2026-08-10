import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Power, RotateCcw } from 'lucide-react';
import {
  changeAdminBidUnitStatus,
  fetchAdminBidUnits,
  reorderAdminBidUnits,
  saveAdminBidUnit,
} from '@api/adminAuctionApi';
import AdminModal from '@components/admin/AdminModal';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import AdminTable from '@components/admin/AdminTable';
import { toast } from '@utils/common';
import './adminBidUnitManagementPanel.css';

const EMPTY_FORM = {
  amount: '',
  changeReason: '',
};

const formatAmount = (value) => `${Number(value).toLocaleString('ko-KR')}P`;

/** 담당자 7 · F-AUC-013/F-OPS-003: AUCG02 입찰 단위를 경매 관리에서 편집합니다. */
const AdminBidUnitManagementPanel = () => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [statusChanging, setStatusChanging] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusReason, setStatusReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [orderFeedback, setOrderFeedback] = useState('');
  const [draggedBidUnitSn, setDraggedBidUnitSn] = useState(null);
  const [dragTarget, setDragTarget] = useState(null);

  const bidUnitsQuery = useQuery({
    queryKey: ['admin-auction-bid-units'],
    queryFn: fetchAdminBidUnits,
  });
  const saveMutation = useMutation({
    mutationFn: saveAdminBidUnit,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-auction-bid-units'] });
      await queryClient.invalidateQueries({ queryKey: ['reference-codes', 'AUCG02'] });
    },
  });
  const reorderMutation = useMutation({
    mutationFn: reorderAdminBidUnits,
    onSuccess: (ordered) => {
      queryClient.setQueryData(['admin-auction-bid-units'], ordered);
    },
  });
  const statusMutation = useMutation({
    mutationFn: changeAdminBidUnitStatus,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-auction-bid-units'] });
      await queryClient.invalidateQueries({ queryKey: ['reference-codes', 'AUCG02'] });
    },
  });

  const bidUnits = bidUnitsQuery.data ?? [];
  const activeCount = bidUnits.filter((item) => item.active).length;

  const resetDialogs = () => {
    setEditing(null);
    setStatusChanging(null);
    setForm(EMPTY_FORM);
    setStatusReason('');
    setFeedback('');
  };

  const closeDialogs = () => {
    if (saveMutation.isPending || statusMutation.isPending) return;
    resetDialogs();
  };

  const openCreate = () => {
    setEditing({ isNew: true });
    setForm(EMPTY_FORM);
    setFeedback('');
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      amount: String(item.amount),
      changeReason: '',
    });
    setFeedback('');
  };

  const change = ({ target }) => setForm((current) => ({
    ...current,
    [target.name]: target.value,
  }));

  const validate = () => {
    const amount = Number(form.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return '입찰 단위는 1P 이상의 정수로 입력해 주세요.';
    }
    if (!form.changeReason.trim()) {
      return '변경 사유를 입력해 주세요.';
    }
    const duplicate = bidUnits.some((item) => (
      item.bidUnitSn !== editing?.bidUnitSn && Number(item.amount) === amount
    ));
    return duplicate ? '동일한 입찰 단위가 이미 존재합니다.' : '';
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationMessage = validate();
    if (validationMessage) {
      setFeedback(validationMessage);
      return;
    }
    setFeedback('');
    try {
      await saveMutation.mutateAsync({
        bidUnitSn: editing?.bidUnitSn,
        payload: {
          amount: Number(form.amount),
          changeReason: form.changeReason.trim(),
        },
      });
      const message = editing?.isNew ? '입찰 단위를 추가했습니다.' : '입찰 단위를 수정했습니다.';
      resetDialogs();
      toast({ icon: 'success', title: message, timer: 1800 });
    } catch (error) {
      setFeedback(error.response?.data?.message || '입찰 단위를 저장하지 못했습니다.');
    }
  };

  const submitStatus = async (event) => {
    event.preventDefault();
    if (!statusReason.trim()) {
      setFeedback('변경 사유를 입력해 주세요.');
      return;
    }
    setFeedback('');
    try {
      await statusMutation.mutateAsync({
        bidUnitSn: statusChanging.item.bidUnitSn,
        payload: {
          active: statusChanging.active,
          changeReason: statusReason.trim(),
        },
      });
      const message = statusChanging.active
        ? '입찰 단위를 다시 사용합니다.'
        : '입찰 단위를 사용 중지했습니다.';
      resetDialogs();
      toast({ icon: 'success', title: message, timer: 1800 });
    } catch (error) {
      setFeedback(error.response?.data?.message || '입찰 단위 상태를 변경하지 못했습니다.');
    }
  };

  const saveOrder = async (orderedIds) => {
    setOrderFeedback('');
    try {
      await reorderMutation.mutateAsync(orderedIds);
      toast({ icon: 'success', title: '입찰 단위 순서를 변경했습니다.', timer: 1500 });
    } catch (error) {
      setOrderFeedback(error.response?.data?.message || '입찰 단위 순서를 변경하지 못했습니다.');
    }
  };

  const move = (item, direction) => {
    if (reorderMutation.isPending) return;
    const currentIds = bidUnits.map((bidUnit) => bidUnit.bidUnitSn);
    const index = currentIds.indexOf(item.bidUnitSn);
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= currentIds.length) return;
    [currentIds[index], currentIds[targetIndex]] = [currentIds[targetIndex], currentIds[index]];
    void saveOrder(currentIds);
  };

  const startDrag = (event, item) => {
    if (reorderMutation.isPending) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(item.bidUnitSn));
    setDraggedBidUnitSn(item.bidUnitSn);
    setDragTarget(null);
  };

  const dragOver = (event, item) => {
    if (!draggedBidUnitSn || reorderMutation.isPending) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    setDragTarget({
      bidUnitSn: item.bidUnitSn,
      position: event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after',
    });
  };

  const finishDrag = () => {
    setDraggedBidUnitSn(null);
    setDragTarget(null);
  };

  const drop = (event, targetItem) => {
    event.preventDefault();
    const sourceId = draggedBidUnitSn ?? Number(event.dataTransfer.getData('text/plain'));
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after';
    finishDrag();
    if (!sourceId || sourceId === targetItem.bidUnitSn || reorderMutation.isPending) return;

    const currentIds = bidUnits.map((item) => item.bidUnitSn);
    const orderedIds = [...currentIds];
    const sourceIndex = orderedIds.indexOf(sourceId);
    if (sourceIndex < 0) return;
    const [movedId] = orderedIds.splice(sourceIndex, 1);
    const targetIndex = orderedIds.indexOf(targetItem.bidUnitSn);
    if (targetIndex < 0) return;
    orderedIds.splice(position === 'after' ? targetIndex + 1 : targetIndex, 0, movedId);
    if (orderedIds.every((id, index) => id === currentIds[index])) return;
    void saveOrder(orderedIds);
  };

  const columns = [
    {
      key: 'order',
      label: '순번',
      render: (_, item) => {
        const orderIndex = bidUnits.findIndex((bidUnit) => bidUnit.bidUnitSn === item.bidUnitSn);
        const dropPosition = dragTarget?.bidUnitSn === item.bidUnitSn
          && draggedBidUnitSn !== item.bidUnitSn
          ? dragTarget.position
          : null;
        return (
          <div
            className={`admin-bid-unit-order${draggedBidUnitSn === item.bidUnitSn ? ' is-dragging' : ''}${dropPosition ? ` is-drop-${dropPosition}` : ''}`}
            onDragOver={(event) => dragOver(event, item)}
            onDrop={(event) => drop(event, item)}
          >
            <button
              aria-label={`${formatAmount(item.amount)} 순서 끌어서 이동`}
              disabled={reorderMutation.isPending}
              draggable={!reorderMutation.isPending}
              onDragEnd={finishDrag}
              onDragStart={(event) => startDrag(event, item)}
              title="잡고 끌어서 순서 변경"
              type="button"
            >
              <GripVertical aria-hidden="true" />
            </button>
            <strong>{orderIndex + 1}</strong>
            <div>
              <button
                aria-label={`${formatAmount(item.amount)} 위로 이동`}
                disabled={orderIndex <= 0 || reorderMutation.isPending}
                onClick={() => move(item, 'UP')}
                title="위로 이동"
                type="button"
              >
                <ArrowUp aria-hidden="true" />
              </button>
              <button
                aria-label={`${formatAmount(item.amount)} 아래로 이동`}
                disabled={orderIndex < 0 || orderIndex >= bidUnits.length - 1 || reorderMutation.isPending}
                onClick={() => move(item, 'DOWN')}
                title="아래로 이동"
                type="button"
              >
                <ArrowDown aria-hidden="true" />
              </button>
            </div>
          </div>
        );
      },
    },
    { key: 'amount', label: '입찰 단위', render: formatAmount },
    {
      key: 'active',
      label: '상태',
      render: (active) => (
        <AdminStatusBadge tone={active ? 'success' : 'neutral'}>
          {active ? '사용 중' : '사용 중지'}
        </AdminStatusBadge>
      ),
    },
    {
      key: 'manage',
      label: '관리',
      render: (_, item) => (
        <div className="admin-bid-unit-actions">
          <button className="btn btn-outline" onClick={() => openEdit(item)} type="button">
            <Pencil aria-hidden="true" />
            수정
          </button>
          <button
            className={`btn btn-outline${item.active ? ' admin-bid-unit-actions__deactivate' : ''}`}
            disabled={item.active && activeCount <= 1}
            onClick={() => {
              setStatusChanging({ item, active: !item.active });
              setStatusReason('');
              setFeedback('');
            }}
            title={item.active && activeCount <= 1
              ? '활성 입찰 단위는 최소 한 개 이상이어야 합니다.'
              : undefined}
            type="button"
          >
            {item.active ? <Power aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
            {item.active ? '사용 중지' : '사용 재개'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <section aria-labelledby="admin-bid-unit-title" className="admin-bid-unit-panel">
      {bidUnitsQuery.isError && (
        <div className="admin-bjn-state is-error">
          입찰 단위를 불러오지 못했습니다.
          <button className="btn btn-outline" onClick={() => bidUnitsQuery.refetch()} type="button">
            다시 시도
          </button>
        </div>
      )}
      {!bidUnitsQuery.isError && (
        <>
          {orderFeedback && <p className="admin-bid-unit-panel__feedback" role="alert">{orderFeedback}</p>}
          <AdminSectionCard
            action={(
              <div className="admin-bid-unit-panel__summary">
                {!bidUnitsQuery.isLoading && <span>활성 {activeCount}개 · 전체 {bidUnits.length}개</span>}
                <button className="btn btn-primary" onClick={openCreate} type="button">
                  <Plus aria-hidden="true" />
                  입찰 단위 추가
                </button>
              </div>
            )}
            title="입찰 단위 목록"
          >
            <div className="admin-bjn-table-scroll">
              <AdminTable
                columns={columns}
                data={bidUnits}
                emptyMessage="등록된 입찰 단위가 없습니다."
                loading={bidUnitsQuery.isLoading}
                rowKey={(item) => item.bidUnitSn}
              />
            </div>
          </AdminSectionCard>
        </>
      )}

      {editing && (
        <AdminModal onClose={closeDialogs} title={editing.isNew ? '입찰 단위 추가' : '입찰 단위 수정'}>
          <form className="admin-bid-unit-form" onSubmit={submit}>
            <label>
              <span>입찰 단위 (P)</span>
              <input
                autoFocus
                inputMode="numeric"
                min="1"
                name="amount"
                onChange={change}
                step="1"
                type="number"
                value={form.amount}
              />
            </label>
            <label>
              <span>변경 사유</span>
              <textarea maxLength="500" name="changeReason" onChange={change} value={form.changeReason} />
            </label>
            {feedback && <p className="admin-bid-unit-form__feedback" role="alert">{feedback}</p>}
            <div className="admin-bid-unit-form__actions">
              <button className="btn btn-outline" disabled={saveMutation.isPending} onClick={closeDialogs} type="button">취소</button>
              <button className="btn btn-primary" disabled={saveMutation.isPending} type="submit">
                {saveMutation.isPending ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {statusChanging && (
        <AdminModal
          onClose={closeDialogs}
          title={statusChanging.active ? '입찰 단위 사용 재개' : '입찰 단위 사용 중지'}
        >
          <form className="admin-bid-unit-form" onSubmit={submitStatus}>
            <div className="admin-bid-unit-form__code">
              <span>대상</span>
              <strong>{formatAmount(statusChanging.item.amount)}</strong>
            </div>
            <label>
              <span>변경 사유</span>
              <textarea
                autoFocus
                maxLength="500"
                onChange={(event) => setStatusReason(event.target.value)}
                value={statusReason}
              />
            </label>
            {feedback && <p className="admin-bid-unit-form__feedback" role="alert">{feedback}</p>}
            <div className="admin-bid-unit-form__actions">
              <button className="btn btn-outline" disabled={statusMutation.isPending} onClick={closeDialogs} type="button">취소</button>
              <button
                className={statusChanging.active ? 'btn btn-primary' : 'btn btn-danger'}
                disabled={statusMutation.isPending}
                type="submit"
              >
                {statusMutation.isPending
                  ? '처리 중...'
                  : statusChanging.active ? '사용 재개' : '사용 중지'}
              </button>
            </div>
          </form>
        </AdminModal>
      )}
    </section>
  );
};

export default AdminBidUnitManagementPanel;
