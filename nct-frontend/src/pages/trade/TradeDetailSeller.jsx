import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import Toast from '@components/common/Toast';
import {
  getTradeDetail,
  proposeTradeOfflineSchedule,
  registerTradeShipping,
} from '@api/tradeApi';
import { toTradeDetail } from '@api/tradeAdapter';
import '@assets/css/trade-detail.css';

// date 입력의 최소값에 사용할 오늘 날짜를 사용자의 현지 시간 기준으로 만든다.
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const TradeDetailSeller = () => {
  const { tradeId } = useParams();
  const [trade, setTrade] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingMemo, setShippingMemo] = useState('');
  const [shippingRegistered, setShippingRegistered] = useState(false);
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
      setCarrier(detail.carrier === '-' ? '' : detail.carrier);
      setTrackingNumber(detail.trackingNumber === '-' ? '' : detail.trackingNumber);
      setShippingRegistered(Boolean(detail.trackingNumber !== '-'));
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

  // 택배사와 운송장 번호를 검증한 뒤 서버에 배송 정보를 등록한다.
  const registerShipping = async (event) => {
    event.preventDefault();

    if (!carrier || !trackingNumber.trim()) {
      setError('택배사와 운송장 번호를 입력해 주세요.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await registerTradeShipping(tradeId, {
        carrier,
        trackingNumber: trackingNumber.trim(),
        shippingMemo: shippingMemo.trim(),
      });
      setTrade((currentTrade) => ({
        ...currentTrade,
        carrier,
        trackingNumber: trackingNumber.trim(),
      }));
      setShippingRegistered(true);
      setNotice('운송장이 등록되었습니다.');
    } catch {
      setError('운송장 등록에 실패했습니다. 다시 시도해 주세요.');
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
              <p>닉네임 {trade.counterpart} · 별점 ★{trade.rating}</p>
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
            <p>닉네임 {trade.counterpart} · 별점 ★{trade.rating}</p>
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

        {/* 폼 제출로만 배송 등록을 실행해 Enter 입력과 버튼 동작을 동일하게 처리한다. */}
        <form className="trade-detail-card trade-seller-section" onSubmit={registerShipping}>
          <h2>배송 정보 등록</h2>
          <p className="trade-notice">
            택배사와 운송장 번호, 발송 메모를 입력해 주세요.
          </p>
          <div className="trade-address-grid">
            <label className="trade-form-field">
              택배사 선택
              <select
                className="input"
                value={carrier}
                onChange={(event) => setCarrier(event.target.value)}
                disabled={shippingRegistered}
              >
                <option value="">택배사를 선택하세요</option>
                <option value="CJ대한통운">CJ대한통운</option>
                <option value="롯데택배">롯데택배</option>
                <option value="한진택배">한진택배</option>
                <option value="로젠택배">로젠택배</option>
              </select>
            </label>
            <label className="trade-form-field">
              운송장 번호
              <input
                className="input"
                value={trackingNumber}
                onChange={(event) => setTrackingNumber(event.target.value)}
                placeholder="운송장 번호 입력"
                disabled={shippingRegistered}
              />
            </label>
          </div>
          <label className="trade-form-field">
            발송 메모
            <span className="trade-detail-card__muted">(선택)</span>
            <input
              className="input"
              value={shippingMemo}
              onChange={(event) => setShippingMemo(event.target.value)}
              placeholder="예: 오전에 발송했습니다."
              disabled={shippingRegistered}
            />
          </label>
          {error && (
            <p className="trade-form-error" role="alert">
              {error}
            </p>
          )}
          {shippingRegistered && (
            <p className="trade-success">
              {carrier} · {trackingNumber} 운송장이 등록되었습니다.
            </p>
          )}
          <button
            className="btn btn-primary"
            type="submit"
            disabled={shippingRegistered || isSubmitting}
          >
            {shippingRegistered
              ? '운송장 등록 완료'
              : isSubmitting
                ? '등록 중...'
                : '운송장 등록하기'}
          </button>
        </form>
      </div>
      {notice && <Toast message={notice} onClose={() => setNotice('')} />}
    </div>
  );
};

export default TradeDetailSeller;
