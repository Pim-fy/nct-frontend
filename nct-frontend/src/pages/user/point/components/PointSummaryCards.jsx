// src/pages/user/point/components/PointSummaryCards.jsx
import iconPoint from '@assets/img/icon_point.png';

/**
 * 포인트 잔액 요약 카드 4종 (총 보유 / 사용 가능 / 전환 가능 / 환전 가능)
 * 목업 17_point_wallet.html 기준에서, 제공자모드 지갑에 전환 가능(정산가능) 포인트가 눈에
 * 안 띈다는 요청에 따라 '홀딩 포인트' 카드를 '전환 가능 포인트' 카드로 교체했다 — 홀딩은
 * 버튼 액션이 없는 단순 참고값이라 사용가능 카드 서브텍스트로 내리고, 전환 버튼과 바로
 * 연결되는 정산가능 포인트를 헤드라인 카드로 올렸다 (2026-07-30)
 * 총 보유는 서버가 내려준 total을 그대로 쓴다 — 헤더와 같은 출처(서버 원장 SUM 단일 진실)라
 * "총 보유"의 정의가 바뀌어도 화면끼리 숫자가 어긋날 수 없다 (프론트 재계산 제거, 2026-07-20)
 * 카드 스타일은 마이페이지 대시보드(MyPageDashboard StatCard)와 톤을 맞췄다 (2026-07-24)
 */
const PointSummaryCards = ({ balance }) => {
  const cards = [
    {
      label: '총 보유 포인트',
      value: balance.total,
      color: '#0064ff',
      meta: `사용가능 ${balance.available.toLocaleString()}   ㅣ   홀딩 ${balance.hold.toLocaleString()}`,
    },
    {
      label: '사용 가능 포인트',
      value: balance.available,
      color: '#005eb5',
      meta: `홀딩 ${balance.hold.toLocaleString()}`,
    },
    {
      label: '전환 가능 포인트',
      value: balance.settleable,
      color: '#d97706',
      meta: '판매·서비스 정산 포인트',
    },
    {
      label: '환전 가능 포인트',
      value: balance.exchangeable,
      color: '#776bf8',
      meta: '사용가능 + 정산가능 합계',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[10px] text-white p-5"
          style={{ backgroundColor: card.color }}
        >
          <div className="flex items-start gap-3 mb-3">
            <img src={iconPoint} alt="" className="size-[40px] object-contain shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-bold text-[16px] opacity-90 leading-tight m-0">{card.label}</p>
              <p className="font-bold text-[30px] leading-tight mt-0.5 mb-0">{card.value.toLocaleString()} P</p>
            </div>
          </div>
          <p className="text-[14px] opacity-80 truncate m-0">{card.meta}</p>
        </div>
      ))}
    </section>
  );
};

export default PointSummaryCards;
