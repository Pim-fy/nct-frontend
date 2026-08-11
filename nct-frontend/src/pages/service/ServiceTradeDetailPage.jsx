import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  FileText,
  MessageSquareText,
  Paperclip,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react';
import { deleteImage, uploadTradeDisputeEvidence } from '@api/fileApi';
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

const MAX_DISPUTE_EVIDENCE_FILES = 5;
const MAX_DISPUTE_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;
const DISPUTE_EVIDENCE_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp']);

const formatPointAmount = (amount) => {
  const numericAmount = Number(amount);
  return Number.isFinite(numericAmount) ? `${numericAmount.toLocaleString('ko-KR')}P` : '-';
};

const formatDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

// 실조회 컨테이너와 개발용 입력 양쪽에서 재사용하는 서비스 거래 표현 컴포넌트다.
export default function ServiceTradeDetailPage({
  trade = null,
  disputeTypes = [],
  disputeTypesLoading = false,
  disputeTypesError = false,
  onRetryDisputeTypes = null,
  onSubmitDispute = submitServiceTradeDispute,
  onRequestCompletion = requestServiceCompletion,
  onConfirmCompletion = confirmServiceCompletion,
  scheduleHistory = null,
  onRequestScheduleChange = null,
  onRequestScheduleCancellation = null,
  onDecideScheduleCancellation = null,
  chatPath = null,
  onActionCompleted = null,
  backPath = '/user/mypage/services/trades',
  backLabel = '목록으로',
  viewerRoleLabelOverride = null,
}) {
  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [disputeTypeCode, setDisputeTypeCode] = useState('');
  const [disputeContent, setDisputeContent] = useState('');
  const [disputeFiles, setDisputeFiles] = useState([]);
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
  const [isDecidingScheduleCancellation, setIsDecidingScheduleCancellation] = useState(false);
  const [scheduleCancellationDecisionError, setScheduleCancellationDecisionError] = useState('');
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
  const canOpenChat = trade.chatAvailable === true;
  const canRequestScheduleChange = typeof onRequestScheduleChange === 'function'
    && trade.availableActions?.includes('REQUEST_SCHEDULE_CHANGE');
  const canRequestScheduleCancellation = typeof onRequestScheduleCancellation === 'function'
    && trade.availableActions?.includes('REQUEST_SCHEDULE_CANCELLATION');
  const canDecideScheduleCancellation = typeof onDecideScheduleCancellation === 'function'
    && trade.availableActions?.includes('DECIDE_SCHEDULE_CANCELLATION');
  const hasDisputeTypes = disputeTypes.length > 0;
  const disputeTypePlaceholder = disputeTypesLoading
    ? '거래 문제 유형을 불러오는 중입니다.'
    : disputeTypesError
      ? '거래 문제 유형을 불러오지 못했습니다.'
      : hasDisputeTypes
        ? '유형을 선택해 주세요.'
        : '등록된 거래 문제 유형이 없습니다.';
  const isCompletionRequest = completionDialogType === 'REQUEST';
  const completionHandler = isCompletionRequest ? onRequestCompletion : onConfirmCompletion;
  const canSubmitCompletion = typeof completionHandler === 'function';
  const isScheduleChange = scheduleDialogType === 'CHANGE';
  const scheduleHandler = isScheduleChange ? onRequestScheduleChange : onRequestScheduleCancellation;
  const canSubmitSchedule = typeof scheduleHandler === 'function';
  const tradeAmountLabel = trade.tradeAmountLabel ?? formatPointAmount(trade.tradeAmount);
  const autoCompleteAtLabel = formatDateTime(trade.autoCompleteAt);
  const viewerRoleLabel = viewerRoleLabelOverride
    ?? (isRequester ? '의뢰자' : isProvider ? '제공자' : '거래 당사자');
  const hasAvailableActions = canOpenChat
    || canRequestCompletion
    || canConfirmCompletion
    || canSubmitDispute
    || canRequestScheduleChange
    || canRequestScheduleCancellation
    || canDecideScheduleCancellation;
  const resolvedScheduleHistory = scheduleHistory ?? trade.scheduleHistory;

  const openDisputeDialog = () => {
    setDisputeTypeCode('');
    setDisputeContent('');
    setDisputeFiles([]);
    setDisputeError('');
    setDisputeSubmitted(false);
    setIsDisputeDialogOpen(true);
  };

  const closeDisputeDialog = () => {
    if (isSubmittingDispute) return;
    setIsDisputeDialogOpen(false);
  };

  /** 담당자 7 · F-SVC-012: 접수 전 파일 개수·크기·확장자를 검증하고 실제 업로드는 제출 시 수행합니다. */
  const handleDisputeFilesChange = (event) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (selectedFiles.length === 0) return;

    if (disputeFiles.length + selectedFiles.length > MAX_DISPUTE_EVIDENCE_FILES) {
      setDisputeError(`증빙 자료는 최대 ${MAX_DISPUTE_EVIDENCE_FILES}개까지 첨부할 수 있습니다.`);
      return;
    }

    const invalidFile = selectedFiles.find((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
      return !DISPUTE_EVIDENCE_EXTENSIONS.has(extension)
        || file.size <= 0
        || file.size > MAX_DISPUTE_EVIDENCE_FILE_SIZE;
    });
    if (invalidFile) {
      setDisputeError('PDF, JPG, PNG, WEBP 형식의 10MB 이하 파일만 첨부할 수 있습니다.');
      return;
    }

    const currentKeys = new Set(disputeFiles.map(
      (file) => `${file.name}:${file.size}:${file.lastModified}`,
    ));
    const hasDuplicate = selectedFiles.some(
      (file) => currentKeys.has(`${file.name}:${file.size}:${file.lastModified}`),
    );
    if (hasDuplicate) {
      setDisputeError('이미 선택한 증빙 파일이 포함되어 있습니다.');
      return;
    }

    setDisputeError('');
    setDisputeFiles((current) => [...current, ...selectedFiles]);
  };

  const removeDisputeFile = (fileToRemove) => {
    if (isSubmittingDispute) return;
    setDisputeFiles((current) => current.filter((file) => file !== fileToRemove));
    setDisputeError('');
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
    const uploadedFileSns = [];
    let disputeRegistered = false;
    try {
      for (const file of disputeFiles) {
        const uploadResponse = await uploadTradeDisputeEvidence(file);
        const uploadedFile = uploadResponse.data ?? uploadResponse;
        if (!uploadedFile.flSn) {
          throw new Error('업로드한 증빙 파일 번호를 확인하지 못했습니다.');
        }
        uploadedFileSns.push(uploadedFile.flSn);
      }

      await onSubmitDispute(trade.tradeId, {
        disputeTypeCode,
        content,
        fileSns: uploadedFileSns,
      });
      disputeRegistered = true;
      setDisputeSubmitted(true);
      setDisputeFiles([]);
      try {
        await onActionCompleted?.();
      } catch {
        // 접수는 이미 성공했으므로 후속 화면 새로고침 실패를 접수 실패로 되돌리지 않습니다.
      }
    } catch (error) {
      if (!disputeRegistered && uploadedFileSns.length > 0) {
        await Promise.allSettled(uploadedFileSns.map((fileSn) => deleteImage(fileSn)));
      }
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
      await onActionCompleted?.();
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
      await onActionCompleted?.();
      setScheduleSubmitted(true);
    } catch (error) {
      setScheduleError(error.response?.data?.message ?? '일정 요청을 처리하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleScheduleCancellationDecision = async (approved) => {
    setIsDecidingScheduleCancellation(true);
    setScheduleCancellationDecisionError('');
    try {
      await onDecideScheduleCancellation(trade.tradeId, approved);
      await onActionCompleted?.();
    } catch (error) {
      setScheduleCancellationDecisionError(
        error.response?.data?.message ?? '일정 취소 요청을 처리하지 못했습니다. 다시 시도해 주세요.',
      );
    } finally {
      setIsDecidingScheduleCancellation(false);
    }
  };

  return (
    <main className="service-trade-detail-page">
      <div className="container">
        <header className="service-trade-detail-page__header">
          <div className="service-trade-detail-page__heading">
            <div className="service-trade-detail-page__meta">
              <span className={`service-trade-status service-trade-status--${status.tone}`}>
                <span aria-hidden="true" />
                {status.label}
              </span>
              <span className="service-trade-viewer-role">{viewerRoleLabel}</span>
            </div>
            <h1>{trade.serviceRequestTitle}</h1>
            <p>{status.description}</p>
          </div>
          <Link className="btn btn-ghost service-trade-detail-page__list-link" to={backPath}>{backLabel}</Link>
        </header>

        <ol className="service-trade-progress" aria-label="서비스 거래 진행 상태">
          {SERVICE_TRADE_STEPS.map((step, index) => (
            <li
              className={[
                'service-trade-progress__item',
                index <= status.step ? 'service-trade-progress__item--active' : '',
                index === status.step ? 'service-trade-progress__item--current' : '',
              ].filter(Boolean).join(' ')}
              key={step}
            >
              <span className="service-trade-progress__marker">
                {index < status.step ? <CheckCircle2 aria-hidden="true" size={18} /> : index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className="service-trade-overview-grid">
          <section className="service-trade-card service-trade-card--summary" aria-labelledby="service-trade-summary-title">
            <header className="service-trade-card__header">
                <FileText aria-hidden="true" size={20} />
                <h2 id="service-trade-summary-title">거래 정보</h2>
            </header>
            <dl className="service-trade-detail-list">
              <div><dt>선택 견적</dt><dd>{trade.quoteSummary}</dd></div>
              {trade.serviceAddressLabel && <div><dt>서비스 주소</dt><dd>{trade.serviceAddressLabel}</dd></div>}
              <div><dt>서비스 일정</dt><dd>{trade.scheduleLabel || '등록된 일정 정보 없음'}</dd></div>
              {autoCompleteAtLabel && <div><dt>완료 확인 기한</dt><dd>{autoCompleteAtLabel}</dd></div>}
              <div><dt>거래 금액</dt><dd className="service-trade-detail-list__amount">{tradeAmountLabel}</dd></div>
            </dl>
            {hasAvailableActions && (
              <div className="service-trade-inline-actions" aria-label="거래 처리">
                {(canRequestCompletion || canConfirmCompletion) && (
                  <div className="service-trade-inline-actions__group service-trade-inline-actions__group--primary">
                    {canRequestCompletion && (
                      <button className="btn btn-primary" type="button" onClick={() => openCompletionDialog('REQUEST')}>
                        <CheckCircle2 aria-hidden="true" size={18} /> 완료 요청 작성
                      </button>
                    )}
                    {canConfirmCompletion && (
                      <button className="btn btn-primary" type="button" onClick={() => openCompletionDialog('CONFIRM')}>
                        <CheckCircle2 aria-hidden="true" size={18} /> 거래 완료 확인
                      </button>
                    )}
                  </div>
                )}
                {canDecideScheduleCancellation && (
                  <div className="service-trade-cancellation-decision" role="status">
                    <div>
                      <strong>상대방이 일정 취소를 요청했습니다.</strong>
                      <p>동의하면 거래가 취소되고 보관금은 의뢰자에게 전액 환불됩니다.</p>
                    </div>
                    <div className="service-trade-cancellation-decision__actions">
                      <button className="btn btn-ghost" type="button" disabled={isDecidingScheduleCancellation} onClick={() => handleScheduleCancellationDecision(false)}>거절</button>
                      <button className="btn btn-primary" type="button" disabled={isDecidingScheduleCancellation} onClick={() => handleScheduleCancellationDecision(true)}>{isDecidingScheduleCancellation ? '처리 중...' : '동의하고 취소'}</button>
                    </div>
                    {scheduleCancellationDecisionError && <p className="service-trade-dispute-form__error" role="alert">{scheduleCancellationDecisionError}</p>}
                  </div>
                )}
                {(canOpenChat || canRequestScheduleChange || canRequestScheduleCancellation) && (
                  <div className="service-trade-inline-actions__group">
                    {canOpenChat && <Link className="btn service-trade-inline-actions__chat" to={chatPath ?? `/service-trades/${trade.tradeId}/chat`}><MessageSquareText aria-hidden="true" size={18} /> 서비스 채팅</Link>}
                    {canRequestScheduleChange && <button className="btn btn-ghost" type="button" onClick={() => openScheduleDialog('CHANGE')}><CalendarDays aria-hidden="true" size={18} /> 일정 변경 요청</button>}
                    {canRequestScheduleCancellation && <button className="btn btn-ghost" type="button" onClick={() => openScheduleDialog('CANCEL')}>일정 취소 요청</button>}
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="service-trade-card service-trade-card--status" aria-labelledby="service-trade-status-title">
            <div className="service-trade-card__header">
                <ShieldCheck aria-hidden="true" size={20} />
                <h2 id="service-trade-status-title">현재 거래 상태</h2>
            </div>
            <strong className="service-trade-card__status-label">{status.label}</strong>
            {canSubmitDispute && (
              <div className="service-trade-card__dispute-action">
                <button className="btn service-trade-detail-actions__problem" type="button" onClick={openDisputeDialog}>
                  <CircleAlert aria-hidden="true" size={17} />
                  거래 문제 접수
                </button>
                <p><CircleAlert aria-hidden="true" size={14} /> 문제 접수 시 거래 완료와 정산이 보류됩니다.</p>
              </div>
            )}
            <div className="service-trade-card__escrow" aria-label="서비스 보관금">
              <span><WalletCards aria-hidden="true" size={17} /> 보관금</span>
              <strong>{tradeAmountLabel}</strong>
              <p>{trade.escrowStatusLabel ?? '보관금 상태를 확인하고 있습니다.'}</p>
            </div>
          </aside>
        </div>

        {Array.isArray(resolvedScheduleHistory) && (
          <section className="service-trade-card service-trade-card--schedule" aria-labelledby="service-trade-schedule-title">
            <header className="service-trade-card__header">
              <CalendarDays aria-hidden="true" size={20} />
              <h2 id="service-trade-schedule-title">일정 이력</h2>
            </header>
            {resolvedScheduleHistory.length > 0 ? (
              <ol className="service-trade-schedule-history">
                {resolvedScheduleHistory.map((item) => (
                  <li key={item.id}>
                    <strong>{item.eventType === 'CHANGE' ? '일정 변경 요청' : item.eventType === 'CANCEL_REQUEST' ? '일정 취소 요청' : item.eventType === 'CANCEL_APPROVED' ? '일정 취소 동의' : item.eventType === 'CANCEL_REJECTED' ? '일정 취소 거절' : '일정 취소 요청'}</strong>
                    <span>{item.occurredAt ? formatDateTime(item.occurredAt) : '-'}</span>
                    {item.requestedScheduleAt && <p>변경 희망: {formatDateTime(item.requestedScheduleAt)}</p>}
                    {item.reason && <p>{item.reason}</p>}
                  </li>
                ))}
              </ol>
            ) : <p className="service-trade-card__empty">등록된 일정 변경·취소 이력이 없습니다.</p>}
          </section>
        )}

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
                  disabled={disputeTypesLoading || disputeTypesError || !hasDisputeTypes || isSubmittingDispute}
                >
                  <option value="">{disputeTypePlaceholder}</option>
                  {disputeTypes.map((type) => <option key={type.code} value={type.code}>{type.label}</option>)}
                </select>
                {disputeTypesError && (
                  <div className="service-trade-dispute-form__reference-error">
                    <p className="service-trade-dispute-form__help">거래 문제 유형을 불러오지 못했습니다.</p>
                    {typeof onRetryDisputeTypes === 'function' && (
                      <button type="button" onClick={onRetryDisputeTypes}>다시 불러오기</button>
                    )}
                  </div>
                )}
                {!disputeTypesLoading && !disputeTypesError && !hasDisputeTypes && (
                  <p className="service-trade-dispute-form__help">현재 선택할 수 있는 거래 문제 유형이 없습니다.</p>
                )}

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

                <label htmlFor="service-trade-dispute-files">증빙 자료 (선택)</label>
                <label
                  className="service-trade-dispute-file-picker"
                  htmlFor="service-trade-dispute-files"
                >
                  <Paperclip aria-hidden="true" size={18} />
                  <span>파일 선택</span>
                  <small>PDF, JPG, PNG, WEBP · 파일당 10MB · 최대 5개</small>
                </label>
                <input
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="service-trade-dispute-file-input"
                  disabled={isSubmittingDispute || disputeFiles.length >= MAX_DISPUTE_EVIDENCE_FILES}
                  id="service-trade-dispute-files"
                  multiple
                  onChange={handleDisputeFilesChange}
                  type="file"
                />
                {disputeFiles.length > 0 && (
                  <ul className="service-trade-dispute-file-list" aria-label="선택한 증빙 자료">
                    {disputeFiles.map((file) => (
                      <li key={`${file.name}:${file.size}:${file.lastModified}`}>
                        <span title={file.name}>{file.name}</span>
                        <small>{Math.max(1, Math.ceil(file.size / 1024)).toLocaleString('ko-KR')}KB</small>
                        <button
                          aria-label={`${file.name} 첨부 취소`}
                          disabled={isSubmittingDispute}
                          onClick={() => removeDisputeFile(file)}
                          type="button"
                        >
                          <X aria-hidden="true" size={15} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {disputeError && <p className="service-trade-dispute-form__error" role="alert">{disputeError}</p>}

                <div className="service-trade-dispute-form__actions">
                  <button className="btn btn-ghost" type="button" onClick={closeDisputeDialog} disabled={isSubmittingDispute}>취소</button>
                  <button
                    className="btn btn-danger"
                    type="submit"
                    disabled={isSubmittingDispute || disputeTypesLoading || disputeTypesError || !hasDisputeTypes}
                  >
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
