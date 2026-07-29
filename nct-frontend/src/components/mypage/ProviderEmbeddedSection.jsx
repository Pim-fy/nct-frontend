// 담당자 7 · F-PROV-009: 제공자 마이페이지 안에서 목록 계약을 기다리는 영역의 공통 빈 상태다.
// 실제 견적·서비스 거래·채팅·승인 카테고리 컴포넌트가 준비되면 같은 section 위치에서 교체한다.
export default function ProviderEmbeddedSection({ title, description, emptyText }) {
  return (
    <section className="w-full" aria-labelledby={`provider-section-${title}`}>
      <div className="mb-6">
        <h1 id={`provider-section-${title}`} className="m-0 text-3xl font-bold text-gray-900">
          {title}
        </h1>
        <p className="mb-0 mt-1.5 text-gray-500">{description}</p>
      </div>

      <div className="min-h-[360px] rounded-[15px] border border-[rgba(0,0,0,0.11)] bg-white">
        <div className="flex h-[60px] items-center border-b border-[#e5e5e5] bg-[rgba(0,100,255,0.05)] px-5">
          <h2 className="text-[18px] font-bold text-[#3a3a3a]">{title} 목록</h2>
        </div>
        <div className="flex min-h-[299px] items-center justify-center px-6 text-center">
          <p className="text-[15px] text-[#6b7788]">{emptyText}</p>
        </div>
      </div>
    </section>
  );
}
