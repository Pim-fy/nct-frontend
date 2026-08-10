import { useEffect, useState } from 'react';
import {
  acceptOfflineScheduleProposal,
  proposeTradeOfflineSchedule,
  rejectOfflineScheduleProposal,
  requestOfflineScheduleCancellation,
  withdrawOfflineScheduleProposal,
} from '@api/tradeApi';

const getInitialValue = (value) => (value && value !== '-' ? value : '');
const formatMeetingPlace = (place, address) => [place, address]
  .map(getInitialValue)
  .map((value) => value.trim())
  .filter(Boolean)
  .join(' ');

/** 직거래 일정 표시·제안·응답·변경·취소를 양쪽 상세 화면에서 공통으로 처리한다. */
const OfflineScheduleProposalPanel = ({
  tradeId,
  trade,
  onUpdated,
  onNotice,
  onError,
  pendingOnly = false,
}) => {
  const [meetingDate, setMeetingDate] = useState(getInitialValue(trade?.meetingDate));
  const [meetingTime, setMeetingTime] = useState(getInitialValue(trade?.meetingTime));
  const [meetingPlace, setMeetingPlace] = useState(
    formatMeetingPlace(trade?.meetingPlace, trade?.meetingAddress),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pending = trade?.pendingScheduleProposalId
    ? {
      id: trade.pendingScheduleProposalId,
      type: trade.pendingScheduleProposalType,
      date: trade.pendingMeetingDate,
      time: trade.pendingMeetingTime,
      place: trade.pendingMeetingPlace,
      address: trade.pendingMeetingAddress,
    }
    : null;
  const hasConfirmedSchedule = Boolean(
    trade?.meetingDate && trade.meetingDate !== '-'
      && trade?.meetingTime && trade.meetingTime !== '-'
      && trade?.meetingPlace && trade.meetingPlace !== '-',
  );

  useEffect(() => {
    setMeetingDate(getInitialValue(trade?.meetingDate));
    setMeetingTime(getInitialValue(trade?.meetingTime));
    setMeetingPlace(formatMeetingPlace(trade?.meetingPlace, trade?.meetingAddress));
  }, [trade?.meetingAddress, trade?.meetingDate, trade?.meetingPlace, trade?.meetingTime]);

  const applyAction = async (action, successMessage) => {
    setIsSubmitting(true);
    try {
      const response = await action();
      onUpdated(response);
      onNotice(successMessage);
    } catch (error) {
      onError(error.response?.data?.message ?? '직거래 일정 처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitProposal = async (event) => {
    event.preventDefault();
    if (!meetingDate || !meetingTime || !meetingPlace.trim()) {
      onError('거래 일시와 장소를 모두 입력해 주세요.');
      return;
    }

    await applyAction(
      () => proposeTradeOfflineSchedule(tradeId, {
        meetingDate,
        meetingTime,
        meetingPlace: meetingPlace.trim(),
        meetingAddress: '',
      }),
      hasConfirmedSchedule ? '일정 변경을 제안했습니다.' : '직거래 일정을 제안했습니다.',
    );
  };

  if (
    pendingOnly
    || ['COMPLETED', 'CANCELED', 'ON_HOLD', 'CONFIRM_PENDING', 'WAITING_CONFIRMATION']
      .includes(trade?.status)
  ) {
    return null;
  }

  return (
    <div className="trade-detail-card__block trade-schedule-proposal-panel">
      <h3>직거래 일정·장소 관리</h3>

      {hasConfirmedSchedule && (
        <div className="trade-detail-card__block">
          <h4>현재 확정 일정</h4>
          <dl className="trade-meeting-summary">
            <div><dt>거래 일시</dt><dd>{trade.meetingDate} {trade.meetingTime}</dd></div>
            <div><dt>거래 장소</dt><dd>{formatMeetingPlace(trade.meetingPlace, trade.meetingAddress)}</dd></div>
          </dl>
        </div>
      )}

      {pending ? (
        <div className="trade-detail-card__block">
          <h4>{pending.type === 'TRDC0032' ? '일정 취소 요청' : '대기 중인 일정 제안'}</h4>
          {pending.type !== 'TRDC0032' && (
            <dl className="trade-meeting-summary">
              <div><dt>거래 일시</dt><dd>{pending.date ?? '-'} {pending.time ?? ''}</dd></div>
              <div><dt>거래 장소</dt><dd>{formatMeetingPlace(pending.place, pending.address) || '-'}</dd></div>
            </dl>
          )}
          <p className="trade-detail-card__muted">
            {trade.canRespondToScheduleProposal
              ? '상대방이 제안한 내용입니다. 수락하면 확정 일정으로 저장됩니다.'
              : '상대방의 응답을 기다리고 있습니다.'}
          </p>
          <div className="trade-detail-actions trade-detail-actions--end">
            {trade.canRespondToScheduleProposal && (
              <>
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => applyAction(
                    () => acceptOfflineScheduleProposal(tradeId, pending.id),
                    pending.type === 'TRDC0032' ? '직거래 일정 취소를 확정했습니다.' : '직거래 일정을 확정했습니다.',
                  )}
                >
                  수락
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => applyAction(
                    () => rejectOfflineScheduleProposal(tradeId, pending.id),
                    '직거래 일정 제안을 거절했습니다.',
                  )}
                >
                  거절
                </button>
              </>
            )}
            {trade.canWithdrawScheduleProposal && (
              <button
                className="btn btn-outline"
                type="button"
                disabled={isSubmitting}
                onClick={() => applyAction(
                  () => withdrawOfflineScheduleProposal(tradeId, pending.id),
                  '직거래 일정 제안을 철회했습니다.',
                )}
              >
                제안 철회
              </button>
            )}
          </div>
        </div>
      ) : (
        <form className="trade-detail-card__block" onSubmit={submitProposal}>
          <p className="trade-notice">
            {hasConfirmedSchedule
              ? '현재 확정 일정은 상대방이 수락하기 전까지 유지됩니다.'
              : '채팅으로 협의한 일시와 장소를 등록해 주세요.'}
          </p>
          <div className="trade-address-grid">
            <label className="trade-form-field">
              거래 날짜
              <input className="input" type="date" value={meetingDate} onChange={(event) => setMeetingDate(event.target.value)} disabled={isSubmitting} />
            </label>
            <label className="trade-form-field">
              거래 시간
              <input className="input" type="time" value={meetingTime} onChange={(event) => setMeetingTime(event.target.value)} disabled={isSubmitting} />
            </label>
          </div>
          <label className="trade-form-field">
            거래 장소
            <textarea
              className="input trade-form-field__textarea"
              value={meetingPlace}
              onChange={(event) => setMeetingPlace(event.target.value)}
              placeholder="예: 합정역 8번 출구 앞 스타벅스 입구, 건물 오른쪽 벤치"
              maxLength={200}
              rows={3}
              disabled={isSubmitting}
            />
          </label>
          <div className="trade-detail-actions trade-detail-actions--end">
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '처리 중...' : hasConfirmedSchedule ? '변경 제안하기' : '일정 제안하기'}
            </button>
            {hasConfirmedSchedule && (
              <button
                className="btn btn-outline"
                type="button"
                disabled={isSubmitting}
                onClick={() => applyAction(
                  () => requestOfflineScheduleCancellation(tradeId),
                  '직거래 일정 취소를 제안했습니다.',
                )}
              >
                일정 취소 제안
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

export default OfflineScheduleProposalPanel;
