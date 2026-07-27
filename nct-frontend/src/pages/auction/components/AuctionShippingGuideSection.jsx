const AuctionShippingGuideSection = ({ sectionId }) => (
  <section
    className="scroll-mt-[136px] py-10 md:scroll-mt-[82px] md:py-14"
    id={sectionId}
    aria-labelledby={`${sectionId}-title`}
  >
    <header className="mb-7">
      <h2
        className="m-0 text-[24px] leading-tight font-bold text-[#1d1d1f] md:text-[28px]"
        id={`${sectionId}-title`}
      >
        배송 안내
      </h2>
    </header>

    <div className="grid min-h-32 place-items-center border-y border-[#e2e5ea] px-4 py-8 text-center">
      <p className="m-0 text-[15px] text-[#777]">등록된 배송 안내가 없습니다.</p>
    </div>
  </section>
);

export default AuctionShippingGuideSection;
