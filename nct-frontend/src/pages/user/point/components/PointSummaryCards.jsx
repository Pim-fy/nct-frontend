// src/pages/user/point/components/PointSummaryCards.jsx

/**
 * 포인트 잔액 요약 카드 4종 (총 보유 / 사용 가능 / 홀딩 / 환전 가능)
 * 목업 17_point_wallet.html 기준
 */
const PointSummaryCards = ({ balance }) => {
  const total = balance.available + balance.hold + balance.settleable;

  const cards = [
    { label: '총 보유 포인트',   value: total,               bg: 'bg-white',      text: 'text-blue-700' },
    { label: '사용 가능 포인트', value: balance.available,   bg: 'bg-blue-50',    text: 'text-blue-700' },
    { label: '홀딩 포인트',      value: balance.hold,        bg: 'bg-amber-50',   text: 'text-amber-700' },
    { label: '환전 가능 포인트', value: balance.settleable,  bg: 'bg-indigo-50',  text: 'text-indigo-700' },
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
