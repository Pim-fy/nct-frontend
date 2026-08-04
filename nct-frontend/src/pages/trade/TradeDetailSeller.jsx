import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import Toast from '@components/common/Toast';
import {
  getTradeDetail,
  proposeTradeOfflineSchedule,
  requestTradeCompletion,
  submitTradeDeliveryProof,
} from '@api/tradeApi';
import {
  deleteImage,
  uploadDeliveryProof,
  toImageUrl,
} from '@api/fileApi';
import { toTradeDetail } from '@api/tradeAdapter';
import TradeTrustSummary from '@components/trade/TradeTrustSummary';
import { Skeleton } from '@components/skeleton/BaseSkeleton';
import '@assets/css/trade-detail.css';

// date 입력의 최소값에 사용할 오늘 날짜를 사용자의 현지 시간 기준으로 만든다.
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// time 입력은 분 단위이므로 현재 분은 이미 지날 수 있어 다음 분부터 제안한다.
const getNextAvailableTime = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  now.setMinutes(now.getMinutes() + 1);

  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const MEETING_TIME_SLOTS = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, '0');
  const minute = index % 2 === 0 ? '00' : '30';

  return `${hour}:${minute}`;
});

const formatDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDateLabel = (dateValue) => {
  if (!dateValue) return '날짜 선택';

  const [year, month, day] = dateValue.split('-');
  return `${year}. ${month}. ${day}.`;
};

const createCalendarMonth = (dateValue = null) => {
  const source = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  return new Date(source.getFullYear(), source.getMonth(), 1);
};

const MAX_SHIPPING_PROOF_FILE_SIZE = 10 * 1024 * 1024;
const MAX_SHIPPING_PROOF_FILES = 5;
const SHIPPING_PROOF_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const TradeDetailSeller = ({
  embedded = false,
  tradeId: selectedTradeId,
  onBack,
  onOpenChat,
}) => {
  const { tradeId: routeTradeId } = useParams();
  const tradeId = selectedTradeId ?? routeTradeId;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [trade, setTrade] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [shippingMemo, setShippingMemo] = useState('');
  const [shippingProofFiles, setShippingProofFiles] = useState([]);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [shippingProofError, setShippingProofError] = useState('');
  const [completionAgreed, setCompletionAgreed] = useState(false);
  const [isCompletionSubmitting, setIsCompletionSubmitting] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingPlace, setMeetingPlace] = useState('');
  const [meetingAddress, setMeetingAddress] = useState('');
  const [meetingProposed, setMeetingProposed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [timeRefreshSignal, setTimeRefreshSignal] = useState(0);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => createCalendarMonth());
  const shippingProofFilesRef = useRef(shippingProofFiles);

  // 렌더 중이 아니라 커밋 이후에 ref를 최신 shippingProofFiles로 동기화한다(react-hooks/refs 규칙 준수).
  useEffect(() => {
    shippingProofFilesRef.current = shippingProofFiles;
  });

  // 업로드는 선택 즉시 끝나지만, 미리보기 blob URL은 제출/삭제 없이 페이지를 벗어나면
  // 해제될 기회가 없다 — 언마운트 시 남아있는 파일들의 미리보기 URL을 정리한다.
  useEffect(() => () => {
    shippingProofFilesRef.current.forEach((file) => URL.revokeObjectURL(file.previewUrl));
  }, []);
  const todayDate = getTodayDate();
  const availableMeetingTimes = useMemo(() => {
    const minimumTime = meetingDate === todayDate
      ? getNextAvailableTime()
      : '00:00';

    return MEETING_TIME_SLOTS.filter((time) => time >= minimumTime);
  }, [meetingDate, timeRefreshSignal, todayDate]);
  const calendarDays = useMemo(() => {
    const firstWeekday = calendarMonth.getDay();
    const lastDate = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      0,
    ).getDate();

    return Array.from({ length: firstWeekday + lastDate }, (_, index) => {
      if (index < firstWeekday) return null;

      return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - firstWeekday + 1);
    });
  }, [calendarMonth]);
  const isPreview = pathname.startsWith('/trades/preview');
  const offlineTradeStatusLabel = (() => {
    if (!meetingProposed) {
      return '일정 제안 대기';
    }

    if (trade?.status === 'COMPLETED') {
      return '거래 완료';
    }

    if (['CONFIRM_PENDING', 'WAITING_CONFIRMATION'].includes(trade?.status)) {
      return '구매자 확인 대기';
    }

    return '직거래 진행 중';
  })();
  // 발송 인증 뒤에는 판매자·구매자가 각각 한 번씩 완료 확인을 진행한다.
  const isDeliveryProofSubmitted = [
    'DELIVERING',
    'CONFIRM_PENDING',
    'WAITING_CONFIRMATION',
    'COMPLETED',
  ].includes(trade?.status);
  // 배송 인증 또는 직거래 일정 저장 뒤, 판매자는 첫 확인을 시작하거나 구매자 요청에 응답할 수 있다.
  const isSellerCompletionReady = (
    (trade?.method === 'DELIVERY' && isDeliveryProofSubmitted)
    || (trade?.method === 'OFFLINE' && meetingProposed)
  );

  const selectMeetingDate = (date) => {
    const nextDate = formatDateValue(date);
    setMeetingDate(nextDate);
    setIsDatePickerOpen(false);
    setIsTimePickerOpen(false);
    if (nextDate === todayDate && meetingTime < getNextAvailableTime()) {
      setMeetingTime('');
    }
  };
  const canRequestSellerCompletion = isSellerCompletionReady
    && (
      ['IN_PROGRESS', 'DELIVERING'].includes(trade?.status)
      || (
        ['CONFIRM_PENDING', 'WAITING_CONFIRMATION'].includes(trade?.status)
        && trade?.completionRequestedBy === 'BUYER'
      )
    );
  const chatPath = isPreview
    ? `/trades/preview/${tradeId}/chat?from=seller`
    : `/trades/${tradeId}/chat?from=seller`;

  // 마이페이지에서 진입한 상세는 브라우저 이력 대신 거래내역 탭으로 명확하게 복귀한다.
  const handleBackToList = () => {
    if (embedded && onBack) {
      onBack();
      return;
    }

    if (searchParams.get('from') === 'mypage') {
      const returnSection = searchParams.get('section');
      const myPageSection = returnSection === 'auction-sales'
        ? 'auction-sales'
        : 'auction-sales';
      const myPagePath = pathname.startsWith('/trades/preview')
        ? `/user/mypage/preview/trades?verify=1&section=${myPageSection}`
        : `/user/mypage?section=${myPageSection}`;

      navigate(myPagePath);
      return;
    }

    navigate(isPreview
      ? '/user/mypage/preview/trades?verify=1&section=auction-sales'
      : '/user/mypage?section=auction-sales');
  };

  // URL의 거래 번호로 서버 상세를 조회해 새로고침해도 같은 거래를 표시한다.
  const loadTrade = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');

    try {
      const response = await getTradeDetail(tradeId);
      const detail = toTradeDetail(response);

      setTrade(detail);
      setMeetingDate(detail.meetingDate === '-' ? '' : detail.meetingDate);
      setMeetingTime(detail.meetingTime === '-' ? '' : detail.meetingTime);
      setMeetingPlace(detail.meetingPlace === '-' ? '' : detail.meetingPlace);
      setMeetingAddress(detail.meetingAddress === '-' ? '' : detail.meetingAddress);
      setMeetingProposed(Boolean(detail.meetingDate !== '-'));
    } catch {
      setLoadError('거래 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  }, [tradeId]);

  // 거래 번호가 바뀌면 렌더링 완료 뒤에 배송 폼을 해당 거래 정보로 다시 초기화한다.
  useEffect(() => {
    const requestTimer = window.setTimeout(loadTrade, 0);

    return () => window.clearTimeout(requestTimer);
  }, [loadTrade]);

  // 파일을 고른 즉시 업로드하고, 제출 전까지는 파일 번호와 로컬 미리보기만 유지한다.
  const handleShippingProofChange = async (event) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (!selectedFiles.length) {
      return;
    }

    if (shippingProofFiles.length + selectedFiles.length > MAX_SHIPPING_PROOF_FILES) {
      setShippingProofError(`인증 사진은 최대 ${MAX_SHIPPING_PROOF_FILES}장까지 등록할 수 있습니다.`);
      event.target.value = '';
      return;
    }

    for (const selectedFile of selectedFiles) {
      if (!SHIPPING_PROOF_IMAGE_TYPES.includes(selectedFile.type)) {
        setShippingProofError('JPG, PNG, WEBP 이미지 파일만 선택할 수 있습니다.');
        event.target.value = '';
        return;
      }

      if (selectedFile.size > MAX_SHIPPING_PROOF_FILE_SIZE) {
        setShippingProofError('인증 사진은 10MB 이하 파일만 등록할 수 있습니다.');
        event.target.value = '';
        return;
      }
    }

    setShippingProofError('');
    setIsUploadingProof(true);

    try {
      const uploadedFiles = await Promise.all(selectedFiles.map(async (file) => {
        const uploadResponse = await uploadDeliveryProof(file);
        // 파일 API는 공통 응답 래퍼의 data 안에 flSn을 담아 반환한다.
        // 실제 파일 번호를 보관해야 삭제와 발송 인증 제출에 같은 파일을 사용할 수 있다.
        const uploadedFile = uploadResponse.data ?? uploadResponse;

        if (!uploadedFile.flSn) {
          throw new Error('업로드한 인증 사진 번호를 확인하지 못했습니다.');
        }

        return {
          ...uploadedFile,
          name: file.name,
          previewUrl: URL.createObjectURL(file),
        };
      }));

      setShippingProofFiles((currentFiles) => [
        ...currentFiles,
        ...uploadedFiles,
      ]);
    } catch (uploadError) {
      setShippingProofError(
        uploadError.response?.data?.message
          ?? '인증 사진 업로드에 실패했습니다. 다시 시도해 주세요.',
      );
    } finally {
      event.target.value = '';
      setIsUploadingProof(false);
    }
  };

  // 제출 전 사진을 지우면 서버의 고아 파일도 함께 정리한다. 연결 완료 파일은 서버가 삭제를 거부한다.
  const removeShippingProof = async (fileToRemove) => {
    setShippingProofError('');

    try {
      await deleteImage(fileToRemove.flSn);
      URL.revokeObjectURL(fileToRemove.previewUrl);
      setShippingProofFiles((currentFiles) => currentFiles.filter(
        (file) => file.flSn !== fileToRemove.flSn,
      ));
    } catch (deleteError) {
      setShippingProofError(
        deleteError.response?.data?.message
          ?? '인증 사진 삭제에 실패했습니다. 다시 시도해 주세요.',
      );
    }
  };

  // 파일과 메모를 한 트랜잭션으로 제출해 메모만 저장되는 반쪽 상태를 막는다.
  const submitDeliveryProof = async () => {
    if (!shippingMemo.trim()) {
      setShippingProofError('배송 메모를 작성해 주세요.');
      return;
    }

    if (!shippingProofFiles.length) {
      setShippingProofError('발송 인증 사진을 한 장 이상 등록해 주세요.');
      return;
    }

    setShippingProofError('');
    setIsSubmitting(true);

    try {
      const response = await submitTradeDeliveryProof(tradeId, {
        deliveryMessage: shippingMemo.trim(),
        fileIds: shippingProofFiles.map((file) => file.flSn),
      });

      shippingProofFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
      setShippingProofFiles([]);
      setTrade(toTradeDetail(response));
      setNotice('발송 인증을 등록했습니다. 구매자가 인증 사진을 확인할 수 있습니다.');
    } catch (submitError) {
      setShippingProofError(
        submitError.response?.data?.message
          ?? '발송 인증 등록에 실패했습니다. 다시 시도해 주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 판매자·구매자의 두 번째 완료 확인이 모두 끝나면 서버가 거래 완료와 정산 대기를 함께 처리한다.
  const requestSellerCompletion = async () => {
    if (!completionAgreed || !canRequestSellerCompletion) {
      return;
    }

    setIsCompletionSubmitting(true);

    try {
      const response = await requestTradeCompletion(tradeId, 'SELLER');
      const updatedTrade = toTradeDetail(response);

      setTrade(updatedTrade);
      setCompletionAgreed(false);
      setNotice(
        updatedTrade.status === 'COMPLETED'
          ? '구매자와 판매자의 완료 확인이 모두 끝나 거래가 완료되었습니다.'
          : '거래 완료 확인을 보냈습니다. 구매자의 확인을 기다려 주세요.',
      );
    } catch (completionError) {
      setNotice(
        completionError.response?.data?.message
          ?? '거래 완료 확인에 실패했습니다. 다시 시도해 주세요.',
      );
    } finally {
      setIsCompletionSubmitting(false);
    }
  };

  // 서버에 저장한 뒤 응답 상세로 폼을 다시 채워, 새로고침해도 같은 일정이 보이게 한다.
  const proposeMeetingSchedule = async (event) => {
    event.preventDefault();

    if (!meetingDate || !meetingTime || !meetingPlace.trim()) {
      setError('거래 일시와 장소를 모두 입력해 주세요.');
      return;
    }

    // 브라우저 입력을 우회해도 오늘보다 이전 날짜는 일정으로 제안할 수 없다.
    if (meetingDate < todayDate) {
      setError('거래 날짜는 오늘 이후로 선택해 주세요.');
      return;
    }

    if (new Date(`${meetingDate}T${meetingTime}`) <= new Date()) {
      setError('거래 시간은 현재 시간 이후로 선택해 주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await proposeTradeOfflineSchedule(tradeId, {
        meetingDate,
        meetingTime,
        meetingPlace: meetingPlace.trim(),
        meetingAddress: meetingAddress.trim(),
      });
      const updatedTrade = toTradeDetail(response);

      setTrade(updatedTrade);
      setMeetingDate(updatedTrade.meetingDate === '-' ? '' : updatedTrade.meetingDate);
      setMeetingTime(updatedTrade.meetingTime === '-' ? '' : updatedTrade.meetingTime);
      setMeetingPlace(updatedTrade.meetingPlace === '-' ? '' : updatedTrade.meetingPlace);
      setMeetingAddress(
        updatedTrade.meetingAddress === '-' ? '' : updatedTrade.meetingAddress,
      );
      setMeetingProposed(true);
      setNotice('직거래 일정과 장소를 저장했습니다.');
    } catch {
      setError('직거래 일정 저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 오늘 화면을 오래 열어 둔 경우에도 과거 시간대가 남지 않게 목록을 분 단위로 갱신한다.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeRefreshSignal((current) => current + 1);
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  if (isLoading && !loadError) {
    return (
      <div className="trade-detail-page trade-detail-page--seller">
        <main className="container">
          <div className="trade-progress" style={{ gap: 8 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton height={38} key={index} style={{ flex: 1 }} />
            ))}
          </div>
          <div className="trade-detail-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton height={140} key={index} style={{ borderRadius: 18 }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (loadError || !trade) {
    return (
      <div className="trade-detail-page trade-detail-page--seller">
        <main className="container trade-detail-page__state">
          <section className="trade-detail-card" role="alert">
            <h1>거래 정보를 불러오지 못했습니다.</h1>
            <button className="btn btn-outline" type="button" onClick={loadTrade}>
              다시 시도
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (trade.method === 'OFFLINE') {
    return (
      <div className="trade-detail-page trade-detail-page--seller">
        <div className="container">
          <header className="trade-detail-page__header">
            <div>
              <h1>거래 상세</h1>
              <p>물건 거래 · 판매자 · 직거래</p>
            </div>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={handleBackToList}
            >
              ← 목록으로
            </button>
          </header>

          <ol className="trade-progress" aria-label="직거래 진행 단계">
            <li className={meetingProposed
              ? 'trade-progress__item'
              : 'trade-progress__item trade-progress__item--active'}
            >
              일정 제안
            </li>
            <li className={meetingProposed
              && trade.status !== 'COMPLETED'
              ? 'trade-progress__item trade-progress__item--active'
              : 'trade-progress__item'}
            >
              구매자 확인 대기
            </li>
            <li className={trade.status === 'COMPLETED'
              ? 'trade-progress__item trade-progress__item--active'
              : 'trade-progress__item'}
            >
              거래 완료
            </li>
          </ol>

          <div className="trade-detail-grid">
            <section className="trade-detail-card">
              <h2>상품 정보</h2>
              <div className="trade-product">
                <div className="trade-product__image">
                  {trade.productImageUrl
                    ? <img src={toImageUrl(trade.productImageUrl)} alt={trade.productName} />
                    : '상품 이미지'}
                </div>
                <div>
                  <strong>{trade.productName}</strong>
                  <p>
                    낙찰가 {trade.price}
                    <span className="badge badge-gray">직거래</span>
                  </p>
                </div>
              </div>
              <p className="trade-detail-card__muted">
                거래 상태: {offlineTradeStatusLabel}
              </p>
            </section>
            <section className="trade-detail-card">
              <h2>구매자 정보</h2>
              <p>닉네임 {trade.counterpart}</p>
              <TradeTrustSummary counterpartUserId={trade.counterpartUserId} />
              <p className="trade-detail-card__muted">
                저장한 일정과 장소는 구매자 거래 상세에도 바로 표시됩니다.
              </p>
            </section>
          </div>

          {meetingProposed ? (
            <section className="trade-detail-card trade-seller-section">
              <h2>직거래 일정</h2>
              <p className="trade-success">
                {meetingDate} {meetingTime} · {meetingPlace} 일정이 제안되었습니다.
              </p>
              <p className="trade-detail-card__muted">
                시간 또는 장소 조율이 필요하면 거래 채팅에서 상대방과 협의해 주세요.
              </p>
              <div className="trade-detail-actions">
                {onOpenChat ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => onOpenChat(tradeId)}
                  >
                    {trade.status === 'COMPLETED' ? '거래 채팅 기록 보기' : '거래 채팅'}
                  </button>
                ) : (
                  <Link className="btn btn-outline" to={chatPath}>
                    {trade.status === 'COMPLETED' ? '거래 채팅 기록 보기' : '거래 채팅'}
                  </Link>
                )}
              </div>
            </section>
          ) : (
            <form
              className="trade-detail-card trade-seller-section"
              onSubmit={proposeMeetingSchedule}
            >
              <h2>직거래 일정 제안</h2>
              <p className="trade-notice">
                구매자가 찾기 쉬운 공개 장소와 거래 가능 시간을 제안해 주세요.
              </p>
              <div className="trade-address-grid">
                <fieldset className="trade-form-field trade-date-picker-field">
                  <legend>거래 날짜</legend>
                  <button
                    aria-expanded={isDatePickerOpen}
                    className="trade-date-picker-trigger"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setCalendarMonth(createCalendarMonth(meetingDate));
                      setIsDatePickerOpen((isOpen) => !isOpen);
                      setIsTimePickerOpen(false);
                    }}
                  >
                    <span>{formatDateLabel(meetingDate)}</span>
                    <span aria-hidden="true" className="trade-picker-icon">
                      <svg viewBox="0 0 24 24" focusable="false">
                        <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
                        <path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" />
                      </svg>
                    </span>
                  </button>
                  {isDatePickerOpen && (
                    <div className="trade-date-picker" role="dialog" aria-label="거래 날짜 선택">
                      <div className="trade-date-picker__header">
                        <button
                          aria-label="이전 달"
                          className="trade-date-picker__month-button"
                          type="button"
                          onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                        >
                          ‹
                        </button>
                        <strong>{calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월</strong>
                        <button
                          aria-label="다음 달"
                          className="trade-date-picker__month-button"
                          type="button"
                          onClick={() => setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                        >
                          ›
                        </button>
                      </div>
                      <div className="trade-date-picker__weekdays" aria-hidden="true">
                        {['일', '월', '화', '수', '목', '금', '토'].map((day) => <span key={day}>{day}</span>)}
                      </div>
                      <div className="trade-date-picker__days" role="grid" aria-label="거래 날짜">
                        {calendarDays.map((date, index) => {
                          if (!date) return <span aria-hidden="true" key={`empty-${index}`} />;

                          const dateValue = formatDateValue(date);
                          const isPastDate = dateValue < todayDate;
                          const isSelected = dateValue === meetingDate;
                          return (
                            <button
                              aria-pressed={isSelected}
                              className={isSelected
                                ? 'trade-date-picker__day trade-date-picker__day--selected'
                                : 'trade-date-picker__day'}
                              disabled={isPastDate || isSubmitting}
                              key={dateValue}
                              role="gridcell"
                              type="button"
                              onClick={() => selectMeetingDate(date)}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </fieldset>
                <fieldset className="trade-form-field trade-time-slots-field">
                  <legend>거래 시간</legend>
                  <button
                    aria-expanded={isTimePickerOpen}
                    className="trade-time-picker-trigger"
                    type="button"
                    disabled={!meetingDate || isSubmitting}
                    onClick={() => setIsTimePickerOpen((isOpen) => !isOpen)}
                  >
                    <span>{meetingTime || '시간 선택'}</span>
                    <span aria-hidden="true" className="trade-picker-icon">
                      <svg viewBox="0 0 24 24" focusable="false">
                        <circle cx="12" cy="12" r="8.5" />
                        <path d="M12 7v5l3.5 2" />
                      </svg>
                    </span>
                  </button>
                  {!meetingDate && (
                    <p className="trade-time-slots__hint">
                      먼저 거래 날짜를 선택해 주세요.
                    </p>
                  )}
                  {meetingDate && isTimePickerOpen && (
                    <div className="trade-time-picker" role="dialog" aria-label="거래 시간 선택">
                      <p>가능한 시간을 선택해 주세요.</p>
                      <div className="trade-time-slots" role="radiogroup" aria-label="거래 시간">
                        {availableMeetingTimes.map((time) => (
                          <button
                            aria-checked={meetingTime === time}
                            className={meetingTime === time
                              ? 'trade-time-slot trade-time-slot--selected'
                              : 'trade-time-slot'}
                            key={time}
                            role="radio"
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => {
                              setError('');
                              setMeetingTime(time);
                              setIsTimePickerOpen(false);
                            }}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </fieldset>
              </div>
              <label className="trade-form-field">
                거래 장소
                <input
                  className="input"
                  value={meetingPlace}
                  onChange={(event) => setMeetingPlace(event.target.value)}
                  placeholder="예: 합정역 8번 출구 앞"
                  disabled={isSubmitting}
                />
              </label>
              <label className="trade-form-field">
                상세 주소
                <span className="trade-detail-card__muted">(선택)</span>
                <input
                  className="input"
                  value={meetingAddress}
                  onChange={(event) => setMeetingAddress(event.target.value)}
                  placeholder="예: 서울 마포구 양화로 45"
                  disabled={isSubmitting}
                />
              </label>
              {error && (
                <p className="trade-form-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="btn btn-primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? '저장 중...' : '일정 제안하기'}
              </button>
            </form>
          )}

          {meetingProposed && (
            <section className="trade-detail-card trade-complete-card">
              <h2>거래 완료 확인</h2>
              <div className="trade-auto-complete">
                <strong>
                  {trade.status === 'COMPLETED'
                    ? '거래 완료'
                    : '구매자 확인 대기'}
                </strong>
                <p>
                  {trade.autoCompleteAt !== '-'
                    ? `${trade.autoCompleteAt}까지 양쪽 확인이 완료되지 않으면 자동 완료됩니다.`
                    : '거래가 완료되었다면 구매자와 서로 완료 확인을 진행해 주세요.'}
                </p>
              </div>
              {canRequestSellerCompletion && (
                <>
                  <label className="trade-complete-card__check">
                    <input
                      type="checkbox"
                      checked={completionAgreed}
                      onChange={(event) => setCompletionAgreed(event.target.checked)}
                      disabled={isCompletionSubmitting}
                    />
                    거래가 완료되었음을 확인합니다
                  </label>
                  <p className="trade-detail-card__muted">
                    확인 요청 이후에는 구매자의 확인 또는 무이의 기간 경과가 필요합니다.
                  </p>
                  <div className="trade-detail-actions">
                    <button
                      className="btn btn-primary"
                      type="button"
                      disabled={!completionAgreed || isCompletionSubmitting}
                      onClick={requestSellerCompletion}
                    >
                      {isCompletionSubmitting ? '확인 중...' : '거래 완료 확인'}
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
        {notice && <Toast message={notice} onClose={() => setNotice('')} />}
      </div>
    );
  }

  // 택배 거래가 아닌 알 수 없는 방식은 계약 확정 전 안내 화면으로 분리한다.
  if (trade.method !== 'DELIVERY') {
    return (
      <div className="trade-detail-page trade-detail-page--seller">
        <main className="container trade-detail-page__state">
          <section className="trade-detail-card">
            <h1>거래 방식 확인</h1>
            <p>거래 방식과 상세 API 계약이 확정된 뒤 화면을 연결합니다.</p>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={handleBackToList}
            >
              ← 목록으로
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="trade-detail-page trade-detail-page--seller">
      <div className="container">
        <header className="trade-detail-page__header">
          <div>
            <h1>거래 상세</h1>
            <p>물건 거래 · 판매자</p>
          </div>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={handleBackToList}
          >
            ← 목록으로
          </button>
        </header>

        <ol className="trade-progress" aria-label="거래 진행 단계">
          <li className={isDeliveryProofSubmitted
            ? 'trade-progress__item'
            : 'trade-progress__item trade-progress__item--active'}
          >
            배송 등록
          </li>
          <li className={isDeliveryProofSubmitted && trade.status !== 'COMPLETED'
            ? 'trade-progress__item trade-progress__item--active'
            : 'trade-progress__item'}
          >
            구매자 확인 대기
          </li>
          <li className={trade.status === 'COMPLETED'
            ? 'trade-progress__item trade-progress__item--active'
            : 'trade-progress__item'}
          >
            완료
          </li>
        </ol>

        <div className="trade-detail-grid">
          <section className="trade-detail-card">
            <h2>상품 정보</h2>
            <div className="trade-product">
              <div className="trade-product__image">
                {trade.productImageUrl
                  ? <img src={toImageUrl(trade.productImageUrl)} alt={trade.productName} />
                  : '상품 이미지'}
              </div>
              <div>
                <strong>{trade.productName}</strong>
                <p>
                  낙찰가 {trade.price}
                  <span className="badge badge-gray">배송</span>
                </p>
              </div>
            </div>
          </section>
          <section className="trade-detail-card">
            <h2>구매자 정보</h2>
            <p>닉네임 {trade.counterpart}</p>
            <TradeTrustSummary counterpartUserId={trade.counterpartUserId} />
            <p className="trade-detail-card__muted">
              택배 거래에서는 거래 채팅방이 생성되지 않습니다.
            </p>
          </section>
        </div>

        {/* 낙찰 시점에 고정된 배송지는 판매자가 조회만 할 수 있다. */}
        <section className="trade-detail-card trade-seller-section">
          <h2>
            구매자 배송지
            <span className="badge badge-success">낙찰 후 고정됨</span>
          </h2>
          <div className="trade-address-grid">
            <label className="trade-form-field">
              수령인
              <input className="input" value={trade.recipientName} readOnly />
            </label>
            <label className="trade-form-field">
              연락처
              <input className="input" value={trade.recipientPhone} readOnly />
            </label>
          </div>
          <label className="trade-form-field">
            주소
            <input className="input" value={trade.deliveryAddress} readOnly />
          </label>
          <label className="trade-form-field">
            상세주소
            <input className="input" value={trade.addressDetail} readOnly />
          </label>
          <label className="trade-form-field">
            배송 요청사항
            <input className="input" value={trade.deliveryRequest} readOnly />
          </label>
          <p className="trade-warning">
            낙찰 확정 후에는 배송지를 수정할 수 없습니다. 주소 오류는 구매자에게 별도 문의해 주세요.
          </p>
        </section>

        {isDeliveryProofSubmitted ? (
          <section className="trade-detail-card trade-complete-card">
            <h2>거래 완료 확인</h2>
            <div className="trade-auto-complete">
              <strong>
                {trade.status === 'COMPLETED'
                  ? '거래 완료'
                  : '구매자 확인 대기'}
              </strong>
              <p>
                {trade.autoCompleteAt !== '-'
                  ? `${trade.autoCompleteAt}까지 양쪽 확인이 완료되지 않으면 자동 완료됩니다.`
                  : '거래가 완료되었다면 구매자와 서로 완료 확인을 진행해 주세요.'}
              </p>
            </div>
            {trade.deliveryMessage !== '-' && (
              <p className="trade-detail-card__muted">
                배송 메모: {trade.deliveryMessage}
              </p>
            )}
            {canRequestSellerCompletion && (
              <>
                <label className="trade-complete-card__check">
                  <input
                    type="checkbox"
                    checked={completionAgreed}
                    onChange={(event) => setCompletionAgreed(event.target.checked)}
                    disabled={isCompletionSubmitting}
                  />
                  거래가 완료되었음을 확인합니다
                </label>
                <p className="trade-detail-card__muted">
                  확인 요청 이후에는 구매자의 확인 또는 무이의 기간 경과가 필요합니다.
                </p>
                <div className="trade-detail-actions">
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={!completionAgreed || isCompletionSubmitting}
                    onClick={requestSellerCompletion}
                  >
                    {isCompletionSubmitting ? '확인 중...' : '거래 완료 확인'}
                  </button>
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="trade-detail-card trade-seller-section">
            <h2>발송 인증 등록</h2>
            <p className="trade-notice">
              발송한 상품과 포장 상태가 보이도록 사진을 최대 5장 등록하고, 배송 메모를 작성해 주세요.
            </p>

            <div className="trade-proof-upload-area">
              <div className="trade-proof-upload-box">
                <label className="trade-proof-upload" htmlFor={`shipping-proof-${trade.id}`}>
                  <input
                    id={`shipping-proof-${trade.id}`}
                    className="trade-proof-upload__input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleShippingProofChange}
                    disabled={isUploadingProof || isSubmitting}
                  />
                  <span className="trade-proof-upload__icon" aria-hidden="true">
                    ↑
                  </span>
                  <strong>발송 인증 사진 선택</strong>
                  <span>JPG, PNG, WEBP · 장당 최대 10MB · 최대 5장</span>
                </label>

                {shippingProofFiles.length > 0 && (
                  <ul className="trade-proof-thumbnail-list" aria-label="업로드한 발송 인증 사진">
                    {shippingProofFiles.map((file, index) => (
                      <li key={file.flSn}>
                        <img src={file.previewUrl} alt={`발송 인증 사진 ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeShippingProof(file)}
                          disabled={isSubmitting}
                          aria-label={`발송 인증 사진 ${index + 1} 삭제`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {isUploadingProof && <p className="trade-proof-upload__filename">사진을 업로드하는 중입니다.</p>}
            </div>

            <label className="trade-form-field">
              배송 메모
              <textarea
                className="input trade-form-field__textarea trade-delivery-memo"
                value={shippingMemo}
                onChange={(event) => setShippingMemo(event.target.value)}
                placeholder="예: 7월 20일 오후에 발송했습니다. 포장 상태는 사진으로 확인해 주세요."
                maxLength={500}
              />
              <span className="trade-form-field__count">
                {shippingMemo.length.toLocaleString()} / 500
              </span>
            </label>

            {shippingProofError && (
              <p className="trade-form-error" role="alert">
                {shippingProofError}
              </p>
            )}

            <div className="trade-proof-submit-actions">
              <button
                className="btn btn-primary"
                type="button"
                onClick={submitDeliveryProof}
                disabled={isUploadingProof || isSubmitting}
              >
                {isSubmitting ? '발송 인증 등록 중...' : '발송 인증 등록하기'}
              </button>
            </div>
          </section>
        )}
      </div>
      {notice && <Toast message={notice} onClose={() => setNotice('')} />}
    </div>
  );
};

export default TradeDetailSeller;
