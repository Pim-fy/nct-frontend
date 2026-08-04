import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  confirmServiceCompletion,
  requestServiceCompletion,
  submitServiceTradeDispute,
} from '@api/serviceTradeApi';
import {
  getServiceTradeStatus,
  SERVICE_TRADE_STEPS,
} from './serviceTradeStatus';
import '@assets/css/service-trade-detail.css';

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getNextAvailableTime = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  now.setMinutes(now.getMinutes() + 1);

  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const SERVICE_SCHEDULE_TIME_SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, '0');
  const minute = index % 2 === 0 ? '00' : '30';

  return `${hour}:${minute}`;
});

// 담당자4 서비스 거래 상세의 표현 전용 화면이다.
// 조회·완료 API와 공통 route는 계약 확정 뒤 연결한다.
export default function ServiceTradeDetailPage({
  trade = null,
  disputeTypes = [],
  onSubmitDispute = submitServiceTradeDispute,
  onRequestCompletion = requestServiceCompletion,
  onConfirmCompletion = confirmServiceCompletion,
  scheduleHistory = [],
  onRequestScheduleChange = null,
  onRequestScheduleCancellation = null,
}) {
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [disputeTypeCode, setDisputeTypeCode] = useState('');
  const [disputeContent, setDisputeContent] = useState('');
  const [disputeError, setDisputeError] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  const [completionDialogType, setCompletionDialogType] = useState(null);
  const [completionMemo, setCompletionMemo] = useState('');
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);
  const [completionSubmitted, setCompletionSubmitted] = useState(false);
  const [completionError, setCompletionError] = useState('');
  const [scheduleDialogType, setScheduleDialogType] = useState(null);
  const [requestedScheduleDate, setRequestedScheduleDate] = useState('');
  const [requestedScheduleTime, setRequestedScheduleTime] = useState('');
  const [isScheduleTimePickerOpen, setIsScheduleTimePickerOpen] = useState(false);
  const [scheduleReason, setScheduleReason] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [scheduleSubmitted, setScheduleSubmitted] = useState(false);
  const todayDate = getTodayDate();
  const availableScheduleTimes = useMemo(() => {
    const minimumTime = requestedScheduleDate === todayDate
      ? getNextAvailableTime()
      : '00:00';

    return SERVICE_SCHEDULE_TIME_SLOTS.filter((time) => time >= minimumTime);
  }, [requestedScheduleDate, todayDate]);

  if (!trade) {
    return (
      <main className="service-trade-detail-page">
        <section className="container service-trade-detail-page__empty">
          <h1>서비스 거래 상세</h1>
          <p>서비스 거래 API 계약이 연결되면 거래 정보를 표시합니다.</p>
        </section>
      </main>
    );
  }

  const status = getServiceTradeStatus(trade.tradeStatusCode);
  const isRequester = trade.viewerRole === 'REQUESTER';
  const isProvider = trade.viewerRole === 'PROVIDER';
  const canRequestCompletion = isProvider && trade.availableActions?.includes('REQUEST_COMPLETION');
  const canConfirmCompletion = isRequester && trade.availableActions?.includes('CONFIRM_COMPLETION');
  const canSubmitDispute = trade.availableActions?.includes('SUBMIT_DISPUTE');
  const canRequestScheduleChange = trade.availableActions?.includes('REQUEST_SCHEDULE_CHANGE');
  const canRequestScheduleCancellation = trade.availableActions?.includes('REQUEST_SCHEDULE_CANCELLATION');
  const hasDisputeTypes = disputeTypes.length > 0;
  const isCompletionRequest = completionDialogType === 'REQUEST';
  const completionHandler = isCompletionRequest ? onRequestCompletion : onConfirmCompletion;
  const canSubmitCompletion = typeof completionHandler === 'function';
  const isScheduleChange = scheduleDialogType === 'CHANGE';
  const scheduleHandler = isScheduleChange ? onRequestScheduleChange : onRequestScheduleCancellation;
  const canSubmitSchedule = typeof scheduleHandler === 'function';

  const openDisputeDialog = () => {
    setDisputeError('');
    setDisputeSubmitted(false);
    setIsDisputeDialogOpen(true);
  };

  const closeDisputeDialog = () => {
    if (isSubmittingDispute) return;
    setIsDisputeDialogOpen(false);
  };

  const handleDisputeSubmit = async (event) => {
    event.preventDefault();
    const content = disputeContent.trim();

    if (!hasDisputeTypes) {
      setDisputeError('거래 문제 유형 목록을 확인한 뒤 접수할 수 있습니다.');
      return;
    }
    if (!disputeTypeCode) {
      setDisputeError('거래 문제 유형을 선택해 주세요.');
      return;
    }
    if (!content) {
      setDisputeError('거래 문제 내용을 입력해 주세요.');
      return;
    }

    setIsSubmittingDispute(true);
    setDisputeError('');
    try {
      await onSubmitDispute(trade.tradeId, {
        disputeTypeCode,
        content,
      });
      setDisputeSubmitted(true);
    } catch (error) {
      setDisputeError(error.response?.data?.message ?? '거래 문제를 접수하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const openCompletionDialog = (type) => {
    setCompletionDialogType(type);
    setCompletionMemo('');
    setCompletionError('');
    setCompletionSubmitted(false);
  };

  const closeCompletionDialog = () => {
    if (isSubmittingCompletion) return;
    setCompletionDialogType(null);
  };

  const handleCompletionSubmit = async (event) => {
    event.preventDefault();
    const memo = completionMemo.trim();

    if (isCompletionRequest && !memo) {
      setCompletionError('완료 요청 메모를 입력해 주세요.');
      return;
    }
    if (!canSubmitCompletion) {
      setCompletionError('서비스 거래 완료 처리 계약을 확인한 뒤 요청할 수 있습니다.');
      return;
    }

    setIsSubmittingCompletion(true);
    setCompletionError('');
    try {
      await completionHandler(trade.tradeId, isCompletionRequest ? { completionMemo: memo } : undefined);
      setCompletionSubmitted(true);
    } catch (error) {
      setCompletionError(error.response?.data?.message ?? '완료 처리를 요청하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmittingCompletion(false);
    }
  };

  const openScheduleDialog = (type) => {
    setScheduleDialogType(type);
    setRequestedScheduleDate('');
    setRequestedScheduleTime('');
    setIsScheduleTimePickerOpen(false);
    setScheduleReason('');
    setScheduleError('');
    setScheduleSubmitted(false);
  };

  const closeScheduleDialog = () => {
    if (isSubmittingSchedule) return;
    setScheduleDialogType(null);
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    const reason = scheduleReason.trim();
    if (isScheduleChange && (!requestedScheduleDate || !requestedScheduleTime)) {
      setScheduleError('변경할 서비스 날짜와 시간을 선택해 주세요.');
      return;
    }
    if (isScheduleChange && new Date(`${requestedScheduleDate}T${requestedScheduleTime}`) <= new Date()) {
      setScheduleError('변경 시간은 현재 시간 이후로 선택해 주세요.');
      return;
    }
    if (!reason) {
      setScheduleError('요청 사유를 입력해 주세요.');
      return;
    }
    if (!canSubmitSchedule) {
      setScheduleError('서비스 일정 처리 계약을 확인한 뒤 요청할 수 있습니다.');
      return;
    }

    setIsSubmittingSchedule(true);
    setScheduleError('');
    try {
      await scheduleHandler(trade.tradeId, isScheduleChange
        ? { requestedScheduleAt: `${requestedScheduleDate}T${requestedScheduleTime}`, reason }
        : { reason });
      setScheduleSubmitted(true);
    } catch (error) {
      setScheduleError(error.response?.data?.message ?? '일정 요청을 처리하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  return (
    <main className="service-trade-detail-page">
      <div className="container">
        <header className="service-trade-detail-page__header">
          <div>
            <p className="service-trade-detail-page__eyebrow">서비스 거래</p>
            <h1>{trade.serviceRequestTitle}</h1>
            <p>{status.description}</p>
          </div>
          <span className={`service-trade-status service-trade-status--${status.tone}`}>
            {status.label}
          </span>
        </header>

        <ol className="service-trade-progress" aria-label="서비스 거래 진행 상태">
          {SERVICE_TRADE_STEPS.map((step, index) => (
            <li
              className={index <= status.step ? 'service-trade-progress__item service-trade-progress__item--active' : 'service-trade-progress__item'}
              key={step}
            >
              {step}
            </li>
          ))}
        </ol>

        <section className="service-trade-detail-grid">
          <article className="service-trade-card">
            <h2>서비스 요청 및 선택 견적</h2>
            <dl className="service-trade-detail-list">
              <div><dt>서비스 요청</dt><dd>{trade.serviceRequestTitle}</dd></div>
              <div><dt>선택 견적</dt><dd>{trade.quoteSummary}</dd></div>
              <div><dt>거래 금액</dt><dd>{trade.tradeAmountLabel}</dd></div>
              <div><dt>서비스 일정</dt><dd>{trade.scheduleLabel ?? '일정 협의 중'}</dd></div>
            </dl>
          </article>

          <aside className="service-trade-card service-trade-card--escrow">
            <h2>서비스 보관금</h2>
            <strong>{trade.tradeAmountLabel}</strong>
            <p>{trade.escrowStatusLabel ?? '보관금 상태를 확인하고 있습니다.'}</p>
          </aside>
        </section>

        <section className="service-trade-card service-trade-card--timeline">
          <h2>서비스 일정 이력</h2>
          {scheduleHistory.length > 0 ? (
            <ol className="service-trade-schedule-history">
              {scheduleHistory.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.occurredAt}</span>
                  {item.reason && <p>{item.reason}</p>}
                </li>
              ))}
            </ol>
          ) : <p>서비스 일정 API가 연결되면 변경·취소 이력을 시간순으로 표시합니다.</p>}
        </section>

        {(canRequestCompletion || canConfirmCompletion || canSubmitDispute || canRequestScheduleChange || canRequestScheduleCancellation) && (
          <section className="service-trade-detail-actions" aria-label="서비스 거래 처리">
            {canRequestCompletion && <button className="btn btn-success" type="button" onClick={() => openCompletionDialog('REQUEST')}>완료 요청 작성</button>}
            {canConfirmCompletion && <button className="btn btn-primary" type="button" onClick={() => openCompletionDialog('CONFIRM')}>완료 확인</button>}
            {canRequestScheduleChange && <button className="btn btn-ghost" type="button" onClick={() => openScheduleDialog('CHANGE')}>일정 변경 요청</button>}
            {canRequestScheduleCancellation && <button className="btn btn-ghost" type="button" onClick={() => openScheduleDialog('CANCEL')}>일정 취소 요청</button>}
            {canSubmitDispute && <button className="btn btn-danger" type="button" onClick={openDisputeDialog}>거래 문제 접수</button>}
          </section>
        )}

        <div className="service-trade-detail-page__links">
          <Link className="btn btn-ghost" to={`/service-requests/${trade.serviceRequestId}`}>요청 상세</Link>
        </div>
      </div>

      {isDisputeDialogOpen && (
        <div className="service-trade-dialog-backdrop" role="presentation" onMouseDown={closeDisputeDialog}>
          <section
            className="service-trade-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-trade-dispute-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="service-trade-dialog__header">
              <div>
                <p>서비스 거래</p>
                <h2 id="service-trade-dispute-title">거래 문제 접수</h2>
              </div>
              <button className="service-trade-dialog__close" type="button" onClick={closeDisputeDialog} aria-label="거래 문제 접수 창 닫기">×</button>
            </header>

            {disputeSubmitted ? (
              <div className="service-trade-dialog__result" role="status">
                <strong>거래 문제가 접수되었습니다.</strong>
                <p>거래와 관련 정산은 보류되며, 관리자 처리 결과를 안내해 드립니다.</p>
                <button className="btn btn-primary" type="button" onClick={closeDisputeDialog}>확인</button>
              </div>
            ) : (
              <form className="service-trade-dispute-form" onSubmit={handleDisputeSubmit}>
                <p className="service-trade-dispute-form__notice">거래 문제를 접수하면 완료 처리와 정산이 보류됩니다.</p>
                <label htmlFor="service-trade-dispute-type">거래 문제 유형</label>
                <select
                  id="service-trade-dispute-type"
                  value={disputeTypeCode}
                  onChange={(event) => setDisputeTypeCode(event.target.value)}
                  disabled={!hasDisputeTypes || isSubmittingDispute}
                >
                  <option value="">{hasDisputeTypes ? '유형을 선택해 주세요.' : '유형 목록 확인 대기 중'}</option>
                  {disputeTypes.map((type) => <option key={type.code} value={type.code}>{type.label}</option>)}
                </select>
                {!hasDisputeTypes && <p className="service-trade-dispute-form__help">유형 목록 공통코드 계약이 연결되면 선택할 수 있습니다.</p>}

                <label htmlFor="service-trade-dispute-content">상세 내용</label>
                <textarea
                  id="service-trade-dispute-content"
                  value={disputeContent}
                  onChange={(event) => setDisputeContent(event.target.value)}
                  maxLength={4000}
                  placeholder="문제 상황과 요청 사항을 구체적으로 입력해 주세요."
                  disabled={isSubmittingDispute}
                />
                <p className="service-trade-dispute-form__count">{disputeContent.length}/4,000</p>
                {disputeError && <p className="service-trade-dispute-form__error" role="alert">{disputeError}</p>}

                <div className="service-trade-dispute-form__actions">
                  <button className="btn btn-ghost" type="button" onClick={closeDisputeDialog} disabled={isSubmittingDispute}>취소</button>
                  <button className="btn btn-danger" type="submit" disabled={isSubmittingDispute || !hasDisputeTypes}>
                    {isSubmittingDispute ? '접수 중...' : '거래 문제 접수'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {completionDialogType && (
        <div className="service-trade-dialog-backdrop" role="presentation" onMouseDown={closeCompletionDialog}>
          <section
            className="service-trade-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-trade-completion-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="service-trade-dialog__header">
              <div>
                <p>서비스 거래</p>
                <h2 id="service-trade-completion-title">{isCompletionRequest ? '서비스 완료 요청' : '서비스 완료 확인'}</h2>
              </div>
              <button className="service-trade-dialog__close" type="button" onClick={closeCompletionDialog} aria-label="완료 처리 창 닫기">×</button>
            </header>

            {completionSubmitted ? (
              <div className="service-trade-dialog__result" role="status">
                <strong>{isCompletionRequest ? '완료 요청을 전달했습니다.' : '서비스 완료를 확인했습니다.'}</strong>
                <p>{isCompletionRequest ? '의뢰자의 확인 기한은 5일이며, 이의가 없으면 자동 완료됩니다.' : '거래 완료와 정산 처리 결과를 안내해 드립니다.'}</p>
                <button className="btn btn-primary" type="button" onClick={closeCompletionDialog}>확인</button>
              </div>
            ) : (
              <form className="service-trade-dispute-form" onSubmit={handleCompletionSubmit}>
                <p className="service-trade-dispute-form__notice">
                  {isCompletionRequest
                    ? '완료 요청 후 의뢰자가 확인하거나 5일 동안 이의가 없으면 거래가 자동 완료됩니다.'
                    : '완료를 확인하면 거래 완료와 제공자 정산 처리 절차가 진행됩니다.'}
                </p>
                {isCompletionRequest && (
                  <>
                    <label htmlFor="service-trade-completion-memo">완료 요청 메모</label>
                    <textarea
                      id="service-trade-completion-memo"
                      value={completionMemo}
                      onChange={(event) => setCompletionMemo(event.target.value)}
                      maxLength={1000}
                      placeholder="완료한 작업 내용과 확인 사항을 입력해 주세요."
                      disabled={isSubmittingCompletion}
                    />
                    <p className="service-trade-dispute-form__count">{completionMemo.length}/1,000</p>
                  </>
                )}
                {!canSubmitCompletion && <p className="service-trade-dispute-form__help">완료 처리 API 계약이 연결되면 요청할 수 있습니다.</p>}
                {completionError && <p className="service-trade-dispute-form__error" role="alert">{completionError}</p>}
                <div className="service-trade-dispute-form__actions">
                  <button className="btn btn-ghost" type="button" onClick={closeCompletionDialog} disabled={isSubmittingCompletion}>취소</button>
                  <button className="btn btn-primary" type="submit" disabled={isSubmittingCompletion || !canSubmitCompletion}>
                    {isSubmittingCompletion ? '처리 중...' : isCompletionRequest ? '완료 요청 보내기' : '완료 확인'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {scheduleDialogType && (
        <div className="service-trade-dialog-backdrop" role="presentation" onMouseDown={closeScheduleDialog}>
          <section
            className="service-trade-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-trade-schedule-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="service-trade-dialog__header">
              <div>
                <p>서비스 거래</p>
                <h2 id="service-trade-schedule-title">{isScheduleChange ? '서비스 일정 변경 요청' : '서비스 일정 취소 요청'}</h2>
              </div>
              <button className="service-trade-dialog__close" type="button" onClick={closeScheduleDialog} aria-label="일정 요청 창 닫기">×</button>
            </header>

            {scheduleSubmitted ? (
              <div className="service-trade-dialog__result" role="status">
                <strong>{isScheduleChange ? '일정 변경 요청을 전달했습니다.' : '일정 취소 요청을 전달했습니다.'}</strong>
                <p>상대방 확인과 처리 결과는 서비스 거래 이력에서 안내해 드립니다.</p>
                <button className="btn btn-primary" type="button" onClick={closeScheduleDialog}>확인</button>
              </div>
            ) : (
              <form className="service-trade-dispute-form" onSubmit={handleScheduleSubmit}>
                <p className="service-trade-dispute-form__notice">일정 변경·취소에는 수수료가 부과되지 않으며 요청 사유가 거래 이력에 기록됩니다.</p>
                {isScheduleChange && (
                  <div className="service-trade-schedule-picker-grid">
                    <label htmlFor="service-trade-requested-schedule-date">변경 희망 날짜
                    <input
                      id="service-trade-requested-schedule-date"
                      type="date"
                      value={requestedScheduleDate}
                      min={todayDate}
                      onChange={(event) => {
                        const nextDate = event.target.value;
                        setRequestedScheduleDate(nextDate);
                        setIsScheduleTimePickerOpen(false);
                        if (nextDate === todayDate && requestedScheduleTime < getNextAvailableTime()) {
                          setRequestedScheduleTime('');
                        }
                      }}
                      disabled={isSubmittingSchedule}
                    />
                    </label>
                    <div className="service-trade-time-slots-field" role="group" aria-label="변경 희망 시간">
                      <span className="service-trade-time-slots-field__label">변경 희망 시간</span>
                      <button
                        aria-expanded={isScheduleTimePickerOpen}
                        className="service-trade-time-picker-trigger"
                        type="button"
                        disabled={!requestedScheduleDate || isSubmittingSchedule}
                        onClick={() => setIsScheduleTimePickerOpen((isOpen) => !isOpen)}
                      >
                        <span>{requestedScheduleTime || '시간 선택'}</span>
                        <span aria-hidden="true">⌄</span>
                      </button>
                      {!requestedScheduleDate && <p>먼저 변경 희망 날짜를 선택해 주세요.</p>}
                      {requestedScheduleDate && isScheduleTimePickerOpen && (
                        <div className="service-trade-time-picker" role="dialog" aria-label="변경 희망 시간 선택">
                          {availableScheduleTimes.length > 0 ? (
                            <div className="service-trade-time-slots" role="radiogroup" aria-label="변경 희망 시간">
                              {availableScheduleTimes.map((time) => (
                                <button
                                  aria-checked={requestedScheduleTime === time}
                                  className={requestedScheduleTime === time
                                    ? 'service-trade-time-slot service-trade-time-slot--selected'
                                    : 'service-trade-time-slot'}
                                  key={time}
                                  role="radio"
                                  type="button"
                                  disabled={isSubmittingSchedule}
                                  onClick={() => {
                                    setScheduleError('');
                                    setRequestedScheduleTime(time);
                                    setIsScheduleTimePickerOpen(false);
                                  }}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          ) : <p>오늘 선택 가능한 시간이 없습니다. 다른 날짜를 선택해 주세요.</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <label htmlFor="service-trade-schedule-reason">요청 사유</label>
                <textarea
                  id="service-trade-schedule-reason"
                  value={scheduleReason}
                  onChange={(event) => setScheduleReason(event.target.value)}
                  maxLength={1000}
                  placeholder="일정 변경 또는 취소가 필요한 사유를 입력해 주세요."
                  disabled={isSubmittingSchedule}
                />
                <p className="service-trade-dispute-form__count">{scheduleReason.length}/1,000</p>
                {!canSubmitSchedule && <p className="service-trade-dispute-form__help">서비스 일정 처리 API 계약이 연결되면 요청할 수 있습니다.</p>}
                {scheduleError && <p className="service-trade-dispute-form__error" role="alert">{scheduleError}</p>}
                <div className="service-trade-dispute-form__actions">
                  <button className="btn btn-ghost" type="button" onClick={closeScheduleDialog} disabled={isSubmittingSchedule}>취소</button>
                  <button className="btn btn-primary" type="submit" disabled={isSubmittingSchedule || !canSubmitSchedule}>
                    {isSubmittingSchedule ? '요청 중...' : '요청 보내기'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
