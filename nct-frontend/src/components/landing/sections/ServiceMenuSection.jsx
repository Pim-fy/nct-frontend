import React from "react";
import { assets } from "./assets";
import MoreButton from "./MoreButton";

export const SERVICE_MENU_ITEMS = [
  { label: "청소", left: 322, image: assets.image10, imgLeft: 373, imgTop: 1128, imgW: 53, imgH: 47 },
  { label: "이사", left: 482, image: assets.image11, imgLeft: 535, imgTop: 1130, imgW: 52, imgH: 42 },
  { label: "설치/수리", left: 642, image: assets.image8, imgLeft: 696, imgTop: 1129, imgW: 48, imgH: 45 },
  { label: "인테리어", left: 802, image: assets.image9, imgLeft: 853, imgTop: 1126, imgW: 45, imgH: 50 },
  { label: "레슨", left: 962, image: assets.image7, imgLeft: 1007, imgTop: 1127, imgW: 57, imgH: 49 },
];

export const HOT_ITEMS = [
  { rank: 1, name: "메타 퀘스트 3S VR", price: "420,000원" },
  { rank: 2, name: "인바디 체성분 분석기", price: "980,000원" },
  { rank: 3, name: "GIANT 카본 로드바이크", price: "1,250,000원" },
  { rank: 4, name: "LG 워시타워 미니워셔", price: "650,000원" },
  { rank: 5, name: "LG DIOS 전자레인지", price: "189,000원" },
];

export default function ServiceMenuSection() {
  return (
    <section className="absolute contents left-[167px] top-[942px]" data-name="SECTION_2(서비스메뉴/HOTITEM)">
      {/* 서비스 아이콘 메뉴 */}
      <div className="absolute contents left-[167px] top-[1090px]" data-name="서비스_icon">
        <div className="absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[0] left-[167px] text-[22px] text-black top-[1135px] whitespace-nowrap">
          <p className="leading-[normal] mb-0">SERVICE</p>
          <p className="leading-[normal]">MENU</p>
        </div>

        {SERVICE_MENU_ITEMS.map((item) => (
          <div key={item.label} className="absolute contents" style={{ left: item.left, top: 1090 }}>
            <button
              type="button"
              className="absolute bg-white border border-[rgba(0,0,0,0.1)] border-solid rounded-[20px] size-[150px] hover:shadow-md transition-shadow"
              style={{ left: item.left, top: 1090 }}
            />
            <div className="absolute" style={{ left: item.imgLeft, top: item.imgTop, width: item.imgW, height: item.imgH }}>
              <img alt={item.label} className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={item.image} />
            </div>
            <p
              className="-translate-x-1/2 absolute font-['Noto_Sans_KR:Medium'] font-medium leading-[normal] text-[16px] text-black text-center top-[1191px] tracking-[-1.28px] whitespace-nowrap"
              style={{ left: item.left + 75 }}
            >
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {/* HOT ITEM 랭킹 카드 */}
      <div className="absolute contents left-[1340px] top-[942px]" data-name="HOT ITEM">
        <div className="absolute bg-white h-[367px] left-[1340px] rounded-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.15)] top-[942px] w-[426px]" />
        <div className="absolute bg-[#0064ff] h-[73px] left-[1340px] rounded-tl-[20px] rounded-tr-[20px] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.15)] top-[942px] w-[426px]" />
        <p className="absolute font-['Noto_Sans_KR:Black'] font-black leading-[normal] left-[1363px] text-[25px] text-white top-[964px] tracking-[5px] whitespace-nowrap">
          HOT ITEM
        </p>
        {/* 이전엔 left=1694라 박스(1340~1766) 밖으로 61px 튀어나가 있었다. 박스 안 오른쪽에 맞춰 수정. */}
        <MoreButton left={1614} top={972} variant="dark" />

        <div className="absolute contents left-[1360px] top-[1032px]" data-name="num">
          {HOT_ITEMS.map((item, i) => (
            <div
              key={item.rank}
              className={`absolute left-[1360px] size-[29px] rounded-full ${i === 0 ? 'bg-[#0064ff]' : 'bg-[#c9d3e0]'}`}
              style={{ top: 1042 + i * 50 }}
            />
          ))}
          <div className="absolute font-['Noto_Sans_KR:Bold'] font-bold leading-[0] left-[1371px] text-[13px] text-white top-[1032px] tracking-[-0.65px] whitespace-nowrap">
            {HOT_ITEMS.map((item, i) => (
              <p key={item.rank} className={`leading-[50px] ${i < HOT_ITEMS.length - 1 ? "mb-0" : ""} ${i === 0 ? "" : "text-[#0064ff]"}`}>
                {item.rank}
              </p>
            ))}
          </div>
        </div>

        <div className="absolute font-['Noto_Sans_KR:Regular'] font-normal leading-[0] left-[1403px] text-[16px] text-black top-[1032px] tracking-[-0.8px] whitespace-nowrap">
          {HOT_ITEMS.map((item, i) => (
            <p key={item.rank} className={`leading-[50px] ${i < HOT_ITEMS.length - 1 ? "mb-0" : ""} whitespace-pre`}>{` ${item.name} `}</p>
          ))}
        </div>
        <div className="absolute -translate-x-full font-['Noto_Sans_KR:Bold'] font-bold leading-[0] left-[1741px] text-[16px] text-black text-right top-[1032px] tracking-[-0.8px] whitespace-nowrap">
          {HOT_ITEMS.map((item, i) => (
            <p key={item.rank} className={`leading-[50px] ${i < HOT_ITEMS.length - 1 ? "mb-0" : ""} whitespace-pre`}>{`${item.price} `}</p>
          ))}
        </div>

        <div className="absolute left-[1361px] top-[1081px] w-[380px] flex flex-col">
          {[0,1,2,3].map(i => (
            <div key={i} className="h-[50px] border-b border-[#ebebeb]" />
          ))}
        </div>
      </div>
    </section>
  );
}
