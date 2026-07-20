import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "./assets";
import ArrowIcon from "./ArrowIcon";

const SEARCH_TAGS = [
  { label: "#마감임박경매", left: 723, width: 112 },
  { label: "#청소견적", left: 843, width: 88 },
  { label: "#전자기기", left: 939, width: 86 },
  { label: "#이사도움", left: 1033, width: 86 },
  { label: "#직거래", left: 1127, width: 86 },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");

  const runSearch = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    navigate(`/search/${encodeURIComponent(trimmed)}`);
  };

  // 태그를 클릭하면 검색창에 그 키워드가 채워지고 바로 검색까지 실행된다.
  const handleTagClick = (label) => {
    const word = label.replace(/^#/, "");
    setKeyword(word);
    runSearch(word);
  };

  return (
    // ⚠️ Figma 원본의 공지 배너(notice)는 이 프로젝트에 이미 있는
    // <NoticeStrip /> (닫기 버튼 + 세션 저장 기능 포함)으로 대체되었습니다.
    // LandingPage.jsx에서 <NoticeStrip /> 다음에 <HeroSection />을 렌더링해주세요.
    <section className="absolute contents left-[-1024px] top-[82px]" data-name="SECTION_1">
      {/* 배경 이미지 */}
      <div className="absolute contents left-[-1024px] top-[456px]" data-name="BgImg">
        <div className="absolute h-[559px] left-[-1024px] top-[456px] w-[4096px]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img alt="" className="absolute h-[244.38%] left-[22.3%] max-w-none top-[-43.65%] w-[49.97%]" src={assets.bgImg} />
          </div>
        </div>
        <div className="absolute bg-black h-[559px] left-0 opacity-30 top-[456px] w-[1920px]" />
      </div>

      {/* 타이틀 카피 */}
      <div className="absolute contents left-[714px]">
        <div className="-translate-x-1/2 absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[0] left-[968px] text-[0px] text-black text-center top-[150px] tracking-[-2.5px] whitespace-nowrap">
          <p className="leading-[normal] mb-0 text-[50px]">
            <span className="text-[#474baa]">실시간 경매</span>
            <span>와</span><br />         
            <span className="text-[#00ccd0]">생활 서비스</span>
            <span>를 한 화면에서</span>
          </p>
        </div>
      </div>

      {/* 통합 검색 + 인기 태그 */}

      <div className="absolute contents left-[571px] top-[368px]" data-name="search">
        <div className="absolute h-[73px] left-[571px] top-[418px] w-[800px]">
          <div className="absolute inset-[-21.92%_-2.5%_-32.88%_-2.5%]">
            <img alt="" className="block max-w-none size-full" src={assets.searchBg} />
          </div>
        </div>
        <p className="absolute font-['Noto_Sans_KR:Medium'] font-medium leading-[normal] left-[608px] text-[18px] text-black top-[444px] whitespace-nowrap">통합검색</p>
        <p className="absolute font-['Noto_Sans_KR:Medium'] font-medium leading-[normal] left-[693px] text-[9px] text-black top-[449px] whitespace-nowrap">▼</p>
        
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") runSearch(keyword); }}
          placeholder="검색어를 입력하세요."
          className="absolute left-[729px] top-[440px] w-[560px] bg-transparent font-['Noto_Sans_KR:Regular'] font-normal text-[18px] text-black placeholder:text-[#b1b1b1] outline-none"
        />
        
        <button type="button" onClick={() => runSearch(keyword)} className="absolute left-[1317px] size-[27px] top-[442px]">
          <img alt="검색" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={assets.searchIcon} />
        </button>

        <div className="absolute contents left-[723px] top-[368px]">
          {SEARCH_TAGS.map((tag) => {
            const word = tag.label.replace(/^#/, "");
            const active = keyword === word;
            return (
              <div key={tag.label} className="absolute contents top-[368px]" style={{ left: tag.left }}>
                <button
                  type="button"
                  onClick={() => handleTagClick(tag.label)}
                  className={`absolute h-[31px] rounded-[30px] cursor-pointer transition-colors ${active ? "bg-[#e9fbff]" : "bg-[#f5f5f4] hover:bg-[#ececec]"}`}
                  style={{ left: tag.left, width: tag.width, top: 368 }}
                />
                <p
                  className={`-translate-x-1/2 absolute font-['Noto_Sans_KR:Medium'] font-medium leading-[normal] text-[14px] text-center top-[375px] tracking-[-0.7px] whitespace-nowrap pointer-events-none ${
                    active ? "text-[#0064ff]" : "text-[#4e4e4e]"
                  }`}
                  style={{ left: tag.left + tag.width / 2 }}
                >
                  {tag.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 이벤트 슬라이드 배너 */}
      <div className="absolute contents left-[436px] top-[611px]" data-name="slide">
        <div className="absolute bg-white h-[303px] left-[531px] rounded-[41px] shadow-[0px_4px_10px_0px_rgba(0,0,0,0.2)] top-[611px] w-[872px]" />
        <div className="absolute h-[303px] left-[532px] rounded-[40px] top-[611px] w-[871px]">
          <img alt="" className="absolute inset-0 max-w-none object-cover opacity-30 pointer-events-none rounded-[40px] size-full" src={assets.slide} />
        </div>
        <div className="absolute h-[296px] left-[980px] top-[619px] w-[395px]">
          <img alt="기프트 쿠폰" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={assets.giftVoucher} />
        </div>
        <div className="-translate-x-1/2 absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[0] left-[767px] text-[45px] text-black text-center top-[659px] tracking-[-2.25px] whitespace-nowrap">
          <p className="leading-[normal] mb-0">서비스 요청만 해도</p>
          <p className="leading-[normal]">쿠폰 100% 당첨</p>
        </div>
        <div className="absolute bg-[#ffd900] h-[9px] left-[766px] top-[788px] w-[120px]" />
        <p className="absolute font-['Noto_Sans_KR:Regular'] font-normal leading-[normal] left-[649px] text-[16px] text-black top-[778px] tracking-[-0.8px] whitespace-nowrap">
          회원가입시에 최대 쿠폰 10,000원 증정
        </p>
        <button type="button" className="absolute bg-[#0064ff] h-[43px] left-[717px] rounded-[10px] top-[823px] w-[106px]">
          <span className="absolute -translate-x-1/2 left-1/2 font-['Noto_Sans_KR:Bold'] font-bold leading-[normal] text-[18px] text-center text-white top-[11px] tracking-[-0.9px] whitespace-nowrap">
            응모하기
          </span>
        </button>

        <div className="absolute contents left-[436px] top-[743px]">
          <ArrowIcon direction="left" className="left-[436px] top-[743px]" />
          <ArrowIcon direction="right" className="left-[1485px] top-[743px]" />
        </div>
      </div>
    </section>
  );
}
