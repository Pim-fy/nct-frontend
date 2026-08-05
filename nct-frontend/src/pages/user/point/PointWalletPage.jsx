// src/pages/user/point/PointWalletPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';

import PointSummaryCards from './components/PointSummaryCards';
import PointLedgerTable from './components/PointLedgerTable';
import PointChargeOrderTable from './components/PointChargeOrderTable';
import PointConvertHistoryTable from './components/PointConvertHistoryTable';
import PointExchangeOrderTable from './components/PointExchangeOrderTable';
import PointAmountModal from './components/PointAmountModal';
import PointChargeWidgetModal from './components/PointChargeWidgetModal';
import PointHistoryDetailModal from './components/PointHistoryDetailModal';
import MyPageContentHeader from '@components/mypage/MyPageContentHeader';
import { usePointBalance, usePointLedger, usePointChargeOrders, usePointExchangeOrders } from '../../../hooks/usePoint';
import { confirmPointCharge, requestPointExchange, convertPoint } from '../../../api/pointApi';
import { useAuth } from '@hooks/useAuth';
import { useSettlementList } from '../../../hooks/useSettlement';
import SettlementSummaryCards from '@pages/user/settlement/components/SettlementSummaryCards';
import SettlementTable from '@pages/user/settlement/components/SettlementTable';

// 데이터 도착 전(로딩 중) 카드가 깨지지 않도록 쓰는 0값 기본 잔액
const EMPTY_BALANCE = { available: 0, hold: 0, settleable: 0, total: 0, exchangeable: 0 };

// 요약 카드에서 각 내역별로 보여주는 최근 건수 — 나머지는 "+" 눌러 전체 내역 모달에서 확인 (2026-07-29)
const RECENT_LIMIT = 5;

/** axios 오류에서 백엔드 ApiResponse의 message를 꺼낸다 (없으면 일반 안내) */
const errorMessage = (err) =>
  err?.response?.data?.message ?? '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

/**
 * 환전/전환 제출 설정 — 두 기능은 "검증 → 모달 닫기 → API 호출 → 포인트 캐시 갱신 → 결과 안내"
 * 구조가 완전히 같고 API와 문구만 달라서, 흐름은 submitAmount 하나로 쓰고 차이만 여기 모았다
 * (환전 F-PAY-012: 신청 즉시 차감·관리자 수동 지급 / 전환 F-PAY-010: 분쟁 없을 때만 서버가 허용)
 */
const SUBMIT_ACTIONS = {
  exchange: {
    api: requestPointExchange,
    invalidText: '환전 금액은 1P 이상의 정수만 가능합니다.',
    successTitle: '환전 신청 완료',
    successText: '신청 금액이 차감되었고, 등록하신 계좌로 며칠 내 지급될 예정입니다.',
    failTitle: '환전 신청 실패',
  },
  convert: {
    api: convertPoint,
    invalidText: '전환 금액은 1P 이상의 정수만 가능합니다.',
    successTitle: '전환 완료',
    successText: '정산 가능 포인트가 사용 가능 포인트로 전환되었습니다.',
    failTitle: '전환 실패',
  },
};

/**
 * 포인트 지갑 (목업 17_point_wallet.html, F-PAY-006/007/011)
 * - GET /api/point/balance, /api/point/ledger, /api/point/charge/orders 연동 (usePoint 훅)
 * - 충전(F-PAY-011): 토스페이먼츠 결제위젯 방식 단일 (사용자 결정, 2026-07-16 — 결제창 방식 제거)
 *   서버 주문 생성 → 모달 안에 결제수단 UI 렌더링 → 리다이렉트 → 서버 승인(confirm) 순서로,
 *   금액은 항상 서버 기록만 신뢰한다 (프론트는 금액을 승인 요청에 싣지 않는다)
 * - 결제 리다이렉트는 별도 라우트 없이 이 페이지의 쿼리 파라미터(?charge=...)로 받는다
 *   (공용 AppRoutes.jsx는 담당자1 소유라 라우트 추가 없이 처리)
 * - 환전(F-PAY-012): 방식 확정(D-026, 2026-07-17)에 따라 실연동 — 신청 즉시 서버가 차감하고
 *   실제 입금은 관리자 수동 처리라 "며칠 내 지급 예정" 안내만 나간다. 계좌는 서버가
 *   회원의 등록 계좌를 직접 읽는다 (프론트는 금액만 보냄)
 * - embedded=true면 마이페이지 사이드바 안에 끼워 넣어지는 것이라, 자체 최대너비·여백 없이
 *   내용만 렌더한다(마이페이지 쪽 컨테이너 여백을 그대로 쓴다). 단독 라우트(/user/point)로
 *   접근할 때만 자체 컨테이너를 갖는다 (2026-07-24, 팀전달_마이페이지_포인트지갑사이드바_수정요청)
 * - 제공자 모드는 "포인트 내역"/"정산 내역" 두 탭으로 나뉜다 (2026-08-04, 정산 관리 화면 흡수).
 *   제공자모드 마이페이지의 독립 "정산 관리" 화면(SettlementListPage, 옥동민/담당자5 소유·D-023
 *   이관)이 포인트지갑과 내용이 겹치면서도 조회 전용이라 존재의의가 약하다는 판단으로, 정산
 *   내역 탭 안에 그 화면의 컴포넌트(SettlementSummaryCards·SettlementTable)를 그대로 재사용해
 *   전환·환전 내역과 함께 옮겼다(사용자·옥동민 협의 완료) — 옥동민의 두 컴포넌트 파일 자체는
 *   수정하지 않고 가져다 쓰기만 한다. 일반회원은 정산 화면이 원래 없었으므로 탭 없이 기존
 *   레이아웃 그대로 유지한다. 사이드바 메뉴·라우트 정리(황성경/황희준 소유 파일)는 별도로 처리.
 */
const PointWalletPage = ({ embedded = false } = {}) => {
  const { isProvider } = useAuth();
  const [openModal, setOpenModal] = useState(null); // null | 'charge' | 'exchange' | 'convert'
  // 각 내역은 최근 5건만 보이고, "+"를 누르면 전체 내역 모달이 뜬다 (2026-07-29)
  const [detailModal, setDetailModal] = useState(null); // null | 'ledger' | 'charge' | 'settlement' | 'convert' | 'exchange'
  // 제공자모드 탭 — 일반회원은 탭 없이 기존 레이아웃 그대로라 이 상태를 쓰지 않는다
  const [activeTab, setActiveTab] = useState('point'); // 'point' | 'settlement'
  const [settlementFilter, setSettlementFilter] = useState('전체');

  const [searchParams, setSearchParams] = useSearchParams();
  // 결제 리다이렉트로 돌아온 직후(?charge=...가 붙어 있는 동안)는 최초 렌더부터 계속 true —
  // 승인 처리 중 쇼핑 등 다른 조작과 겹치지 않도록 화면을 완전히 덮어서, 충전을 시작했던
  // 페이지로 돌아가기 전까지 포인트지갑 화면 자체가 잠깐이라도 눈에 띄지 않게 한다
  // (원래 페이지 유지 요청, 2026-07-29 — 지갑 화면이 스치듯 보이는 것도 없애 달라는 후속 요청).
  const isChargeRedirect = !!searchParams.get('charge');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // React StrictMode의 이펙트 2회 실행으로 승인(confirm)이 중복 호출되는 것을 막는 가드
  const confirmHandled = useRef(false);
  // 사용자가 오버레이의 나가기 버튼으로 직접 빠져나갔는지 — true면 승인 응답이 나중에 와도
  // 결과 팝업을 다시 띄우거나 페이지를 재차 이동시키지 않는다 (이미 나갔으므로 중복 동작 방지)
  const leftManually = useRef(false);

  // 결제 리다이렉트 처리가 끝난 뒤, 충전을 시작했던 원래 페이지로 돌려보낸다 — 결제위젯이
  // successUrl/failUrl을 항상 포인트지갑으로 고정해 둬야 해서(AppRoutes.jsx는 담당자1 소유라
  // 별도 콜백 라우트를 새로 만들지 않는 기존 설계), 쇼핑 중이던 페이지에서 충전하면 결제 후
  // 포인트지갑으로 튕겨 나가버리는 문제가 있었다. PointChargeWidgetModal이 결제 시작 직전
  // sessionStorage에 남겨둔 원래 경로로 돌아간다 — 값이 없으면(지갑 화면에서 직접 충전한 경우
  // 등) 그대로 지갑 화면에 머문다.
  const returnToOriginalPage = () => {
    const returnTo = sessionStorage.getItem('pointChargeReturnTo');
    sessionStorage.removeItem('pointChargeReturnTo');
    if (returnTo && returnTo !== window.location.pathname + window.location.search) {
      navigate(returnTo, { replace: true });
    }
  };

  // 오버레이의 나가기 버튼 — 승인 응답이 비정상적으로 안 오는 등 예외 상황에서도 사용자가
  // 화면에 갇히지 않도록 하는 탈출구다. 승인 요청 자체는 취소하지 않고(서버는 계속 처리),
  // 화면만 정리하고 원래 페이지로 나간다 — 포인트 반영 여부는 다음에 지갑을 열어보면 확인 가능.
  const leaveChargeOverlay = () => {
    leftManually.current = true;
    setSearchParams({}, { replace: true });
    returnToOriginalPage();
  };

  // 서버 조회 — 로그인(쿠키) 필요. 미로그인 401이면 axios 인터셉터가 /login으로 보낸다
  const { data: balance = EMPTY_BALANCE, isLoading: balanceLoading } = usePointBalance();
  const { data: ledger = [], isLoading: ledgerLoading } = usePointLedger();
  const { data: chargeOrders = [], isLoading: ordersLoading } = usePointChargeOrders();
  const { data: exchangeOrders = [], isLoading: exchangeLoading } = usePointExchangeOrders();
  // 정산 내역은 제공자모드 탭에서만 화면에 쓰지만, useSettlementList가 enabled 옵션을 받지
  // 않는 훅이라(옥동민 소유, 수정하지 않음) 항상 호출한다 — 일반회원도 요청은 나가되 탭 자체가
  // 없어 화면엔 안 쓰인다.
  const { data: settlementRows = [], isLoading: settlementLoading } = useSettlementList();

  // 결제 리다이렉트 처리 — 성공이면 서버 승인 호출, 실패면 사유 안내
  useEffect(() => {
    const chargeResult = searchParams.get('charge');
    if (!chargeResult || confirmHandled.current) return;
    confirmHandled.current = true;

    const clearParams = () => setSearchParams({}, { replace: true });

    if (chargeResult === 'success') {
      // 토스가 successUrl에 붙여 준 paymentKey/orderId로 서버 승인을 요청한다.
      // amount 파라미터는 위변조 가능성이 있어 서버에 보내지 않는다 — 서버가 사전 기록과 대조.
      confirmPointCharge({
        orderId: searchParams.get('orderId'),
        paymentKey: searchParams.get('paymentKey'),
      })
        .then(() => {
          // 잔액·원장·충전내역 모두 바뀌었으니 포인트 캐시 전체 갱신
          queryClient.invalidateQueries({ queryKey: ['point'] });
          // 이미 나가기 버튼으로 빠져나갔으면 이제 와서 팝업을 띄우지 않는다 — 다음에 지갑을
          // 열었을 때 반영된 내역으로 충분히 알 수 있다
          if (leftManually.current) return null;
          return Swal.fire({
            icon: 'success',
            title: '충전 완료',
            text: '포인트 충전이 완료되었습니다.',
            confirmButtonColor: '#0064ff',
          });
        })
        .catch((err) => {
          queryClient.invalidateQueries({ queryKey: ['point'] });
          if (leftManually.current) return null;
          return Swal.fire({
            icon: 'error',
            title: '충전 승인 실패',
            text: errorMessage(err),
            confirmButtonColor: '#0064ff',
          });
        })
        .finally(() => {
          if (leftManually.current) return;
          // clearParams()가 navigate() 뒤에 실행되면 이 페이지(/user/mypage) 기준
          // setSearchParams가 원래 페이지로의 이동을 되돌려버린다 — 반드시 clearParams를
          // 먼저 끝내고 나서 원래 페이지로 나가야 한다.
          clearParams();
          returnToOriginalPage();
        });
    } else {
      // 실패 리다이렉트 — 토스가 붙여 준 실패 메시지를 그대로 안내 (주문은 대기 상태로 남는다)
      Swal.fire({
        icon: 'error',
        title: '결제 실패',
        text: searchParams.get('message') ?? '결제가 완료되지 않았습니다.',
        confirmButtonColor: '#0064ff',
      }).then(() => {
        if (leftManually.current) return;
        clearParams();
        returnToOriginalPage();
      });
    }
  }, [searchParams, setSearchParams, queryClient]);

  /**
   * 환전/전환 공통 제출 처리 — 어느 쪽인지(kind)에 따라 SUBMIT_ACTIONS의 API·문구만 갈아끼운다.
   * 서버가 검증(계좌·잔액·분쟁)을 전부 하므로 프론트는 정수 확인만 하고 사유는 서버 응답을 그대로 안내
   */
  const submitAmount = (kind) => (amount) => {
    const action = SUBMIT_ACTIONS[kind];
    if (!Number.isInteger(amount) || amount <= 0) {
      Swal.fire({
        icon: 'warning',
        title: '금액을 확인해 주세요',
        text: action.invalidText,
        confirmButtonColor: '#0064ff',
      });
      return;
    }
    setOpenModal(null);
    action.api(amount)
      .then(() => {
        // 잔액·원장·내역이 전부 바뀌므로 포인트 캐시 전체 갱신
        queryClient.invalidateQueries({ queryKey: ['point'] });
        Swal.fire({
          icon: 'success',
          title: action.successTitle,
          text: action.successText,
          confirmButtonColor: '#0064ff',
        });
      })
      .catch((err) => {
        // 계좌 미등록·잔액 부족·분쟁 진행 중 등 서버가 알려준 사유를 그대로 안내
        Swal.fire({
          icon: 'error',
          title: action.failTitle,
          text: errorMessage(err),
          confirmButtonColor: '#0064ff',
        });
      });
  };

  return (
    <div
      className={embedded ? undefined : 'container'}
      style={embedded ? undefined : { paddingTop: '25px', paddingBottom: '25px' }}
    >
      <MyPageContentHeader
        title="포인트 지갑"
        actions={(
          <>
            <button
              type="button"
              className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg px-3 py-2 sm:px-5 sm:py-2.5 transition-colors"
              onClick={() => setOpenModal('charge')}
            >
              충전
            </button>
            <button
              type="button"
              className="whitespace-nowrap border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm font-medium rounded-lg px-3 py-2 sm:px-5 sm:py-2.5 transition-colors"
              onClick={() => setOpenModal('convert')}
            >
              전환
            </button>
            <button
              type="button"
              className="whitespace-nowrap border border-blue-600 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm font-medium rounded-lg px-3 py-2 sm:px-5 sm:py-2.5 transition-colors"
              onClick={() => setOpenModal('exchange')}
            >
              환전
            </button>
          </>
        )}
      />

      <PointSummaryCards balance={balance} />

      {isProvider ? (
        <>
          {/* 제공자모드: 정산 관리 화면 흡수로 포인트/정산 두 탭으로 분리 (2026-08-04) */}
          <div className="flex gap-6 border-b border-gray-200 mt-6 mb-1">
            {[
              { key: 'point', label: '포인트 내역' },
              { key: 'settlement', label: '정산 내역' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`pb-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'point' && (
            <>
              <PointLedgerTable
                loading={ledgerLoading || balanceLoading}
                rows={ledger}
                limit={RECENT_LIMIT}
                onExpand={() => setDetailModal('ledger')}
              />
              <PointChargeOrderTable
                loading={ordersLoading}
                rows={chargeOrders}
                limit={RECENT_LIMIT}
                onExpand={() => setDetailModal('charge')}
              />
            </>
          )}

          {activeTab === 'settlement' && (
            <>
              <div className="mt-6">
                <SettlementSummaryCards rows={settlementRows} />
              </div>
              <section className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 m-0">판매·서비스 정산 내역</h3>
                  <button
                    type="button"
                    aria-label="판매·서비스 정산 내역 전체 보기"
                    onClick={() => setDetailModal('settlement')}
                    className="flex size-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors text-base leading-none"
                  >
                    +
                  </button>
                </div>
                <SettlementTable
                  rows={settlementRows.slice(0, RECENT_LIMIT)}
                  filter={settlementFilter}
                  onFilterChange={setSettlementFilter}
                  loading={settlementLoading}
                />
              </section>
              <PointConvertHistoryTable
                loading={ledgerLoading}
                rows={ledger}
                limit={RECENT_LIMIT}
                onExpand={() => setDetailModal('convert')}
              />
              <PointExchangeOrderTable
                loading={exchangeLoading}
                rows={exchangeOrders}
                limit={RECENT_LIMIT}
                onExpand={() => setDetailModal('exchange')}
              />
            </>
          )}
        </>
      ) : (
        <>
          <PointLedgerTable
            loading={ledgerLoading || balanceLoading}
            rows={ledger}
            limit={RECENT_LIMIT}
            onExpand={() => setDetailModal('ledger')}
          />
          <PointChargeOrderTable
            loading={ordersLoading}
            rows={chargeOrders}
            limit={RECENT_LIMIT}
            onExpand={() => setDetailModal('charge')}
          />
          <PointConvertHistoryTable
            loading={ledgerLoading}
            rows={ledger}
            limit={RECENT_LIMIT}
            onExpand={() => setDetailModal('convert')}
          />
          <PointExchangeOrderTable
            loading={exchangeLoading}
            rows={exchangeOrders}
            limit={RECENT_LIMIT}
            onExpand={() => setDetailModal('exchange')}
          />
        </>
      )}

      {detailModal === 'ledger' && (
        <PointHistoryDetailModal title="포인트 내역" onClose={() => setDetailModal(null)}>
          <PointLedgerTable rows={ledger} />
        </PointHistoryDetailModal>
      )}
      {detailModal === 'charge' && (
        <PointHistoryDetailModal title="충전 내역" onClose={() => setDetailModal(null)}>
          <PointChargeOrderTable rows={chargeOrders} />
        </PointHistoryDetailModal>
      )}
      {detailModal === 'settlement' && (
        <PointHistoryDetailModal title="판매·서비스 정산 내역" onClose={() => setDetailModal(null)}>
          <h3 className="text-lg font-bold text-gray-900 mb-3">판매·서비스 정산 내역</h3>
          <SettlementTable
            rows={settlementRows}
            filter={settlementFilter}
            onFilterChange={setSettlementFilter}
            loading={settlementLoading}
          />
        </PointHistoryDetailModal>
      )}
      {detailModal === 'convert' && (
        <PointHistoryDetailModal title="정산포인트 내역" onClose={() => setDetailModal(null)}>
          <PointConvertHistoryTable rows={ledger} />
        </PointHistoryDetailModal>
      )}
      {detailModal === 'exchange' && (
        <PointHistoryDetailModal title="환전 내역" onClose={() => setDetailModal(null)}>
          <PointExchangeOrderTable rows={exchangeOrders} />
        </PointHistoryDetailModal>
      )}

      {openModal === 'charge' && (
        <PointChargeWidgetModal
          infoRow={{ label: '사용가능 포인트', value: `${(balance.available ?? 0).toLocaleString()} P` }}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === 'exchange' && (
        <PointAmountModal
          title="환전 신청"
          submitLabel="환전"
          infoRow={{ label: '환전 가능 포인트', value: `${balance.exchangeable.toLocaleString()} P` }}
          maxAmount={balance.exchangeable}
          onSubmit={submitAmount('exchange')}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === 'convert' && (
        <PointAmountModal
          title="포인트 전환"
          submitLabel="전환"
          infoRow={{ label: '정산가능 포인트', value: `${balance.settleable.toLocaleString()} P` }}
          maxAmount={balance.settleable}
          onSubmit={submitAmount('convert')}
          onClose={() => setOpenModal(null)}
        />
      )}

      {/* 결제 리다이렉트로 돌아온 직후 ~ 원래 페이지로 돌아가기 전까지 화면 전체를 완전히 덮는다.
          fixed + 불투명 배경이라 이 포인트지갑 페이지(사이드바 포함)가 뒤에서 잠깐이라도 비치지
          않고, 처리가 끝나면 원래 페이지로 이동하므로 사용자 입장에서는 지갑 화면을 아예 거치지
          않은 것처럼 보인다. 승인 응답이 비정상적으로 안 오는 등 예외 상황에서 화면에 갇히지
          않도록 우측 상단에 나가기(X) 버튼을 둔다 — 눌러도 서버 승인 처리 자체는 계속된다. */}
      {isChargeRedirect && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white p-6">
          <button
            type="button"
            aria-label="닫기"
            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-xl"
            onClick={leaveChargeOverlay}
          >
            ×
          </button>
          <div className="flex flex-col items-center gap-4">
            <div className="size-10 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
            <p className="text-sm font-medium text-gray-700">충전 처리 중입니다. 잠시만 기다려 주세요.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointWalletPage;
