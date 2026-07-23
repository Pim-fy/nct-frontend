// src/pages/user/point/components/PointSummaryCards.jsx

/**
 * 포인트 잔액 요약 카드 4종 (총 보유 / 사용 가능 / 홀딩 / 환전 가능)
 * 목업 17_point_wallet.html 기준
 * 총 보유는 서버가 내려준 total을 그대로 쓴다 — 헤더와 같은 출처(서버 원장 SUM 단일 진실)라
 * "총 보유"의 정의가 바뀌어도 화면끼리 숫자가 어긋날 수 없다 (프론트 재계산 제거, 2026-07-20)
 */
const PointSummaryCards = ({ balance }) => {
  const cards = [
    { label: '총 보유 포인트',   value: balance.total,       bg: 'bg-white',      text: 'text-blue-700' },
    { label: '사용 가능 포인트', value: balance.available,   bg: 'bg-blue-50',    text: 'text-blue-700' },
    { label: '홀딩 포인트',      value: balance.hold,        bg: 'bg-amber-50',   text: 'text-amber-700' },
    { label: '환전 가능 포인트', value: balance.exchangeable, bg: 'bg-indigo-50',  text: 'text-indigo-700' },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} border border-gray-100 rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.06)]`}
        >
          <h3 className="text-base font-bold text-gray-900 m-0">{card.label}</h3>
          <p className={`text-2xl font-bold mt-2 mb-0 ${card.text}`}>
            {card.value.toLocaleString()} P
          </p>
        </div>
      ))}
    </section>
  );
};

export default PointSummaryCards;
