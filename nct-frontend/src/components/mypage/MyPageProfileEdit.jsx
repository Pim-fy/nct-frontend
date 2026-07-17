// src/components/mypage/MyPageProfileEdit.jsx
// Figma: mypage_01일반_프로필수정(node 28:12) CONTENTS 구간("프로필수정" 탭).
// TODO: 회원(F-USR) 정보수정 API가 아직 없어 폼 상태만 로컬로 관리한다.
//       API가 준비되면 초기값을 user 조회 결과로 채우고, 저장 시 PUT /api/users/me 등으로 연동한다.
import React, { useState } from "react";
import { Camera, Check } from "lucide-react";
import { toast } from "@utils/common";

const FIELD_CLASS =
  "h-[40px] rounded-[5px] border border-[#d9d9d9] bg-white px-3 text-[14px] text-[#404040] font-['Inter:Regular'] focus:outline-none focus:border-[#0064ff]";

export default function MyPageProfileEdit({ user }) {
  const [form, setForm] = useState({
    name: user?.name || "홍길동",
    nickname: user?.nickname || "초록구매자",
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
    address: "",
    addressDetail: "",
  });
  const [notify, setNotify] = useState({
    auction: { inapp: true, email: false },
    trade: { inapp: true, email: true },
    service: { inapp: true, email: true },
    ops: { inapp: true, email: true },
  });

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = (e) => {
    e.preventDefault();
    // TODO: 회원정보 수정 API 연동 전까지는 화면 확인용으로 토스트만 띄운다.
    toast({ icon: "success", title: "정보수정 기능은 준비 중입니다." });
  };

  const toggleNotify = (group, channel) =>
    setNotify((prev) => ({ ...prev, [group]: { ...prev[group], [channel]: !prev[group][channel] } }));

  return (
    <div className="absolute contents left-[440px] top-[141px]" data-name="CONTENTS">
      {/* 정보수정 */}
      <form onSubmit={handleSave}>
        <div className="absolute left-[440px] top-[141px] w-[966px] h-[673px] bg-white border border-[#e5e5e5] rounded-[20px]" />
        <div className="absolute left-[441px] top-[141px] w-[965px] h-[52px] bg-[rgba(230,240,255,0.47)] rounded-t-[20px]" />
        <p className="absolute left-[468px] top-[160px] font-['Noto_Sans_KR:Bold'] font-bold text-[18px] text-[#404040] tracking-[-0.9px]">
          정보수정
        </p>

        {/* 프로필 사진 */}
        <div className="absolute left-[499px] top-[218px] size-[86px] rounded-full bg-[#e6f0ff] overflow-hidden" />
        <button
          type="button"
          onClick={() => toast({ icon: "info", title: "프로필 사진 변경은 준비 중입니다." })}
          className="absolute left-[615px] top-[240px] h-[38px] w-[146px] rounded-[19px] border border-[#d9d9d9] bg-white text-[#4e4e4e] text-[14px] font-['Noto_Sans_KR:Regular'] flex items-center justify-center gap-2 cursor-pointer hover:bg-[#f5f5f5] transition-colors"
        >
          <Camera size={13} />
          프로필 사진 변경
        </button>

        {/* 이름 / 닉네임 */}
        <label className="absolute left-[490px] top-[331px] font-['Noto_Sans_KR:Bold'] font-bold text-[16px] text-[#404040] tracking-[-0.8px]">
          이름
        </label>
        <input
          className={FIELD_CLASS}
          style={{ position: "absolute", left: 615, top: 321, width: 262 }}
          value={form.name}
          onChange={handleChange("name")}
        />
        <label className="absolute left-[977px] top-[331px] font-['Noto_Sans_KR:Bold'] font-bold text-[16px] text-[#404040] tracking-[-0.8px]">
          닉네임
        </label>
        <input
          className={FIELD_CLASS}
          style={{ position: "absolute", left: 1102, top: 321, width: 262 }}
          value={form.nickname}
          onChange={handleChange("nickname")}
        />

        {/* 이메일 / 전화번호 (읽기전용 + 수정) */}
        <p className="absolute left-[490px] top-[384px] font-['Noto_Sans_KR:Bold'] font-bold text-[16px] text-[#404040] tracking-[-0.8px]">
          이메일
        </p>
        <p className="absolute left-[626px] top-[369px] font-['Inter:Regular'] text-[14px] text-[#404040]">
          {user?.email ? user.email.replace(/(?<=.{2}).(?=.*@)/g, "*") : "ks***@***.com"}
        </p>
        <p className="absolute left-[977px] top-[384px] font-['Noto_Sans_KR:Bold'] font-bold text-[16px] text-[#404040] tracking-[-0.8px]">
          전화번호
        </p>
        <p className="absolute left-[1113px] top-[371px] font-['Inter:Regular'] text-[14px] text-[#404040]">
          010-****-5678
        </p>
        <button
          type="button"
          onClick={() => toast({ icon: "info", title: "전화번호 수정은 준비 중입니다." })}
          className="absolute left-[1214px] top-[379px] h-[30px] w-[45px] rounded-[5px] border border-[#969696] bg-white text-[#4e4e4e] text-[14px] font-['Inter:Medium'] cursor-pointer hover:bg-[#f5f5f5] transition-colors"
        >
          수정
        </button>

        {/* 비밀번호 */}
        <label className="absolute left-[490px] top-[431px] font-['Noto_Sans_KR:Bold'] font-bold text-[16px] text-[#404040] tracking-[-0.8px]">
          현재 비밀번호
        </label>
        <input
          type="password"
          className={FIELD_CLASS}
          style={{ position: "absolute", left: 615, top: 421, width: 749 }}
          value={form.currentPassword}
          onChange={handleChange("currentPassword")}
          placeholder="********"
        />
        <label className="absolute left-[490px] top-[481px] font-['Noto_Sans_KR:Bold'] font-bold text-[16px] text-[#404040] tracking-[-0.8px]">
          새 비밀번호
        </label>
        <input
          type="password"
          className={FIELD_CLASS}
          style={{ position: "absolute", left: 615, top: 471, width: 749 }}
          value={form.newPassword}
          onChange={handleChange("newPassword")}
          placeholder="********"
        />
        <label className="absolute left-[490px] top-[531px] font-['Noto_Sans_KR:Bold'] font-bold text-[16px] text-[#404040] tracking-[-0.8px]">
          새 비밀번호 확인
        </label>
        <input
          type="password"
          className={FIELD_CLASS}
          style={{ position: "absolute", left: 615, top: 521, width: 749 }}
          value={form.newPasswordConfirm}
          onChange={handleChange("newPasswordConfirm")}
          placeholder="********"
        />

        {/* 주소 */}
        <label className="absolute left-[490px] top-[589px] font-['Noto_Sans_KR:Bold'] font-bold text-[16px] text-[#404040] tracking-[-0.8px]">
          주소
        </label>
        <input
          className={FIELD_CLASS}
          style={{ position: "absolute", left: 615, top: 576, width: 231 }}
          value={form.address}
          onChange={handleChange("address")}
        />
        <button
          type="button"
          onClick={() => toast({ icon: "info", title: "주소검색 기능은 준비 중입니다." })}
          className="absolute left-[852px] top-[576px] h-[40px] w-[67px] rounded-[5px] bg-[#4e4e4e] text-white text-[14px] font-['Inter:Medium'] cursor-pointer hover:bg-[#3a3a3a] transition-colors"
        >
          주소검색
        </button>
        <label className="absolute left-[490px] top-[636px] font-['Noto_Sans_KR:Bold'] font-bold text-[16px] text-[#404040] tracking-[-0.8px]">
          상세주소
        </label>
        <input
          className={FIELD_CLASS}
          style={{ position: "absolute", left: 615, top: 626, width: 749 }}
          value={form.addressDetail}
          onChange={handleChange("addressDetail")}
        />

        {/* 환전계좌 */}
        <p className="absolute left-[490px] top-[684px] font-['Noto_Sans_KR:Bold'] font-bold text-[16px] text-[#404040] tracking-[-0.8px]">
          환전계좌
        </p>
        <p className="absolute left-[626px] top-[669px] font-['Inter:Regular'] text-[14px] text-[#404040]">
          국민은행 1234****7890
        </p>
        <button
          type="button"
          onClick={() => toast({ icon: "info", title: "환전계좌 수정은 준비 중입니다." })}
          className="absolute left-[773px] top-[679px] h-[30px] w-[45px] rounded-[5px] border border-[#969696] bg-white text-[#4e4e4e] text-[14px] font-['Inter:Medium'] cursor-pointer hover:bg-[#f5f5f5] transition-colors"
        >
          수정
        </button>
        <button
          type="button"
          onClick={() => toast({ icon: "info", title: "환전계좌 삭제는 준비 중입니다." })}
          className="absolute left-[825px] top-[679px] h-[30px] w-[45px] rounded-[5px] border border-[#e63946] bg-white text-[#e63946] text-[14px] font-['Inter:Medium'] cursor-pointer hover:bg-[#fdf1f2] transition-colors"
        >
          삭제
        </button>

        {/* 저장 */}
        <button
          type="submit"
          className="absolute left-[1248px] top-[737px] h-[40px] w-[116px] rounded-[5px] bg-[#0064ff] text-white text-[14px] font-['Inter:Bold'] font-bold cursor-pointer hover:bg-[#0048bf] transition-colors"
        >
          저장
        </button>
      </form>

      {/* 소셜 로그인 연동 */}
      <div className="absolute left-[1443px] top-[141px] w-[324px] h-[243px] bg-white border border-[#e5e5e5] rounded-[20px]" />
      <div className="absolute left-[1443px] top-[141px] w-[324px] h-[52px] bg-[rgba(230,240,255,0.47)] rounded-t-[20px]" />
      <p className="absolute left-[1468px] top-[143px] font-['Inter:Bold'] font-bold text-[18px] text-black tracking-[-0.9px]">
        소셜 로그인 연동
      </p>
      {[
        { label: "구글", state: "연동됨", left: 1482 },
        { label: "네이버", state: "연동하기", left: 1573 },
        { label: "카카오", state: "연동됨", left: 1671 },
      ].map((social) => (
        <React.Fragment key={social.label}>
          <p
            className="absolute font-['Inter:Medium'] text-[14px] text-black"
            style={{ left: social.left + 16, top: 266 }}
          >
            {social.label}
          </p>
          <button
            type="button"
            onClick={() => toast({ icon: "info", title: "소셜 로그인 연동은 준비 중입니다." })}
            className={`absolute h-[30px] rounded-[5px] border text-[14px] font-['Inter:Medium'] cursor-pointer ${
              social.state === "연동됨"
                ? "border-[#969696] bg-white text-[#4e4e4e]"
                : "border-[#0064ff] bg-white text-[#0064ff]"
            }`}
            style={{ left: social.left, top: 310, width: social.state === "연동됨" ? 58 : 68 }}
          >
            {social.state}
          </button>
        </React.Fragment>
      ))}

      {/* 알림설정 */}
      <div className="absolute left-[1443px] top-[419px] w-[324px] h-[270px] bg-white border border-[#e5e5e5] rounded-[20px]" />
      <div className="absolute left-[1443px] top-[419px] w-[324px] h-[52px] bg-[rgba(230,240,255,0.47)] rounded-t-[20px]" />
      <p className="absolute left-[1468px] top-[421px] font-['Inter:Bold'] font-bold text-[18px] text-black tracking-[-0.9px]">
        알림설정
      </p>
      <button
        type="button"
        onClick={() => toast({ icon: "info", title: "알림설정 상세보기는 준비 중입니다." })}
        className="absolute left-[1686px] top-[421px] bg-transparent border-none cursor-pointer font-['Inter:Regular'] text-[14px] text-black"
      >
        상세보기 +
      </button>
      <div className="absolute left-[1468px] top-[479px] font-['Inter:Medium'] text-[14px] text-black">
        <p className="mb-[50px]">경매 전체</p>
        <p className="mb-[50px]">거래 전체</p>
        <p className="mb-[50px]">서비스 전체</p>
        <p>운영 전체</p>
      </div>
      <div className="absolute left-[1580px] top-[479px] font-['Inter:Medium'] text-[14px] text-black">
        인앱&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;이메일
      </div>
      {[
        { key: "auction", top: 496 },
        { key: "trade", top: 546 },
        { key: "service", top: 596 },
        { key: "ops", top: 646 },
      ].map((row) => (
        <React.Fragment key={row.key}>
          <button
            type="button"
            onClick={() => toggleNotify(row.key, "inapp")}
            className="absolute size-[16px] rounded-[2px] border border-[#d9d9d9] bg-white flex items-center justify-center cursor-pointer"
            style={{ left: 1561, top: row.top }}
            aria-label={`${row.key} 인앱 알림`}
          >
            {notify[row.key].inapp && <Check size={12} className="text-[#0064ff]" />}
          </button>
          <button
            type="button"
            onClick={() => toggleNotify(row.key, "email")}
            className="absolute size-[16px] rounded-[2px] border border-[#d9d9d9] bg-white flex items-center justify-center cursor-pointer"
            style={{ left: 1637, top: row.top }}
            aria-label={`${row.key} 이메일 알림`}
          >
            {notify[row.key].email && <Check size={12} className="text-[#0064ff]" />}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
