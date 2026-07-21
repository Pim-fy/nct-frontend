import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import Toast from '@components/common/Toast';
import {
  getTradeDetail,
  proposeTradeOfflineSchedule,
  submitTradeDeliveryProof,
} from '@api/tradeApi';
import {
  deleteImage,
  uploadDeliveryProof,
} from '@api/fileApi';
import { toTradeDetail } from '@api/tradeAdapter';
import TradeTrustSummary from '@components/trade/TradeTrustSummary';
import '@assets/css/trade-detail.css';

// date 입력의 최소값에 사용할 오늘 날짜를 사용자의 현지 시간 기준으로 만든다.
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const MAX_SHIPPING_PROOF_FILE_SIZE = 10 * 1024 * 1024;
const MAX_SHIPPING_PROOF_FILES = 5;
const SHIPPING_PROOF_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const TradeDetailSeller = () => {
  const { tradeId } = useParams();
  const [trade, setTrade] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [shippingMemo, setShippingMemo] = useState('');
  const [shippingProofFiles, setShippingProofFiles] = useState([]);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [shippingProofError, setShippingProofError] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingPlace, setMeetingPlace] = useState('');
  const [meetingAddress, setMeetingAddress] = useState('');
  const [meetingProposed, setMeetingProposed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const todayDate = getTodayDate();

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
      const uploadedFiles = await Promise.all(selectedFiles.map(async (file) => ({
        ...(await uploadDeliveryProof(file)),
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      })));

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

  if (isLoading || loadError || !trade) {
    return (
      <div className="trade-detail-page trade-detail-page--seller">
        <main className="container trade-detail-page__state">
          <section className="trade-detail-card" role={loadError ? 'alert' : 'status'}>
            <h1>{loadError ? '거래 정보를 불러오지 못했습니다.' : '거래 정보를 불러오는 중입니다.'}</h1>
            {loadError && (
              <button className="btn btn-outline" type="button" onClick={loadTrade}>
                다시 시도
              </button>
            )}
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
              onClick={() => window.history.back()}
            >
              ← 목록으로
            </button>
          </header>

          <ol className="trade-progress" aria-label="직거래 진행 단계">
            <li className="trade-progress__item trade-progress__item--active">
              일정 제안
            </li>
            <li className="trade-progress__item">직거래 진행</li>
            <li className="trade-progress__item">거래 완료</li>
          </ol>

          <div className="trade-detail-grid">
            <section className="trade-detail-card">
              <h2>상품 정보</h2>
              <div className="trade-product">
                <div className="trade-product__image">상품 이미지</div>
                <div>
                  <strong>{trade.productName}</strong>
                  <p>
                    낙찰가 {trade.price}
                    <span className="badge badge-gray">직거래</span>
                  </p>
                </div>
              </div>
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

          <form
            className="trade-detail-card trade-seller-section"
            onSubmit={proposeMeetingSchedule}
          >
            <h2>직거래 일정 제안</h2>
            <p className="trade-notice">
              구매자가 찾기 쉬운 공개 장소와 거래 가능 시간을 제안해 주세요.
            </p>
            <div className="trade-address-grid">
              <label className="trade-form-field">
                거래 날짜
                <input
                  className="input"
                  type="date"
                  value={meetingDate}
                  min={todayDate}
                  onChange={(event) => setMeetingDate(event.target.value)}
                  disabled={isSubmitting}
                />
              </label>
              <label className="trade-form-field">
                거래 시간
                <input
                  className="input"
                  type="time"
                  value={meetingTime}
                  onChange={(event) => setMeetingTime(event.target.value)}
                  disabled={isSubmitting}
                />
              </label>
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
            {meetingProposed && (
              <p className="trade-success">
                {meetingDate} {meetingTime} · {meetingPlace} 일정이 제안되었습니다.
              </p>
            )}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? '저장 중...'
                : meetingProposed
                  ? '일정 수정하기'
                  : '일정 제안하기'}
            </button>
            <div className="trade-detail-actions">
              <Link className="btn btn-outline" to={`/trades/${trade.id}/chat`}>
                거래 채팅
              </Link>
            </div>
          </form>
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
              onClick={() => window.history.back()}
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
            onClick={() => window.history.back()}
          >
            ← 목록으로
          </button>
        </header>

        <ol className="trade-progress" aria-label="거래 진행 단계">
          <li className="trade-progress__item trade-progress__item--active">
            배송 등록
          </li>
          <li className="trade-progress__item">구매자 확인 대기</li>
          <li className="trade-progress__item">완료</li>
        </ol>

        <div className="trade-detail-grid">
          <section className="trade-detail-card">
            <h2>상품 정보</h2>
            <div className="trade-product">
              <div className="trade-product__image">상품 이미지</div>
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

        <section className="trade-detail-card trade-seller-section">
          <h2>발송 인증 등록</h2>
          <p className="trade-notice">
            발송한 상품과 포장 상태가 보이도록 사진을 최대 5장 등록하고, 배송 메모를 작성해 주세요.
          </p>

          <div className="trade-proof-upload-area">
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

            {isUploadingProof && <p className="trade-proof-upload__filename">사진을 업로드하는 중입니다.</p>}
            {shippingProofFiles.length > 0 && (
              <ul className="trade-proof-list" aria-label="업로드한 발송 인증 사진">
                {shippingProofFiles.map((file, index) => (
                  <li className="trade-proof-list__item" key={file.flSn}>
                    <img src={file.previewUrl} alt={`발송 인증 사진 ${index + 1}`} />
                    <div>
                      <strong>{file.name}</strong>
                      <span>업로드 완료</span>
                    </div>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => removeShippingProof(file)}
                      disabled={isSubmitting}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="trade-form-field">
            배송 메모
            <textarea
              className="input trade-form-field__textarea"
              value={shippingMemo}
              onChange={(event) => setShippingMemo(event.target.value)}
              placeholder="예: 7월 20일 오후에 발송했습니다. 포장 상태는 사진으로 확인해 주세요."
              maxLength={4000}
            />
            <span className="trade-form-field__count">
              {shippingMemo.length.toLocaleString()} / 4,000
            </span>
          </label>

          {shippingProofError && (
            <p className="trade-form-error" role="alert">
              {shippingProofError}
            </p>
          )}

          <button
            className="btn btn-primary"
            type="button"
            onClick={submitDeliveryProof}
            disabled={isUploadingProof || isSubmitting || trade.status !== 'IN_PROGRESS'}
          >
            {isSubmitting ? '발송 인증 등록 중...' : '발송 인증 등록하기'}
          </button>
          {trade.status !== 'IN_PROGRESS' && (
            <p className="trade-warning">이미 발송 처리된 거래는 발송 인증을 다시 등록할 수 없습니다.</p>
          )}
        </section>
      </div>
      {notice && <Toast message={notice} onClose={() => setNotice('')} />}
    </div>
  );
};

export default TradeDetailSeller;
