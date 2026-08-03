import MyPageContentHeader from '@components/mypage/MyPageContentHeader';

// 담당자 7 · F-PROV-009: 제공자 마이페이지 안에서 목록 계약을 기다리는 영역의 공통 빈 상태다.
// 실제 서비스 거래·채팅 컴포넌트가 준비되면 같은 section 위치에서 교체한다.
export default function ProviderEmbeddedSection({ title, description, emptyText }) {
  return (
    <section className="w-full" aria-labelledby={`provider-section-${title}`}>
      <MyPageContentHeader title={title} />

      <div className="min-h-[360px] rounded-[15px] border border-[rgba(0,0,0,0.11)] bg-white">
        <div className="flex min-h-[76px] items-center border-b border-[#e5e5e5] bg-[rgba(0,100,255,0.05)] px-5 py-4">
          <div>
            <h2 id={`provider-section-${title}`} className="text-[18px] font-bold text-[#3a3a3a]">{title} 목록</h2>
            <p className="mt-1 text-sm text-[#6b7788]">{description}</p>
          </div>
        </div>
        <div className="flex min-h-[283px] items-center justify-center px-6 text-center">
          <p className="text-[15px] text-[#6b7788]">{emptyText}</p>
        </div>
      </div>
    </section>
  );
}
