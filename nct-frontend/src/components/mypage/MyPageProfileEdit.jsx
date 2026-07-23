// src/components/mypage/MyPageProfileEdit.jsx
// Figma: mypage_01일반_프로필수정(node 28:12) CONTENTS 구간("프로필수정" 탭).
// - 절대좌표 → 반응형 전환.
//   메인 폼(좌)/소셜+알림(우) → xl 이상 가로 배치, 그 이하 세로 스택.
//   폼 내부 필드: sm 이상 2열 그리드, 그 이하 단일 열.
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@utils/common";
import { assets } from "@components/mypage/assets";
import { updateProfile } from "@api/memberApi";

const FIELD_CLASS =
  "w-full h-[40px] rounded-[5px] border border-[#d9d9d9] bg-white px-3 text-[14px] text-[#404040] focus:outline-none focus:border-[#0064ff]";

export default function MyPageProfileEdit({ user }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    nickname: user?.nickname || "",
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
    address: user?.address || "",
    addressDetail: user?.addressDetail || "",
  });
  const [notify, setNotify] = useState({
    auction: { inapp: true, email: false },
    trade:   { inapp: true, email: true },
    service: { inapp: true, email: true },
    ops:     { inapp: true, email: true },
  });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await updateProfile({ nickname: form.nickname });
      queryClient.setQueryData(["auth", "user"], (prev) =>
        prev ? { ...prev, nickname: res.data.nickname } : prev
      );
      toast({ icon: "success", title: "닉네임이 저장되었습니다." });
    } catch (err) {
      const msg = err?.response?.data?.message || "저장에 실패했습니다.";
      toast({ icon: "error", title: msg });
    }
  };

  const toggleNotify = (group, channel) =>
    setNotify((prev) => ({
      ...prev,
      [group]: { ...prev[group], [channel]: !prev[group][channel] },
    }));

  return (
    <div className="flex flex-col xl:flex-row gap-4 items-start">
      {/* ── 메인 정보수정 카드 ── */}
      <div className="flex-1 min-w-0 border border-[#e5e5e5] rounded-[20px] overflow-hidden">
        <div className="bg-[rgba(230,240,255,0.47)] px-6 h-[52px] flex items-center">
          <p className="font-bold text-[17px] text-[#404040]">정보수정</p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* 프로필 사진 */}
          <div className="flex items-center gap-4">
            <div className="size-[80px] rounded-full overflow-hidden bg-[#e6f0ff] shrink-0">
              <img src={assets.profile} alt="" className="size-full object-cover" />
            </div>
            <button
              type="button"
              onClick={() => toast({ icon: "info", title: "프로필 사진 변경은 준비 중입니다." })}
              className="h-[36px] px-4 rounded-full border border-[#d9d9d9] bg-white text-[#4e4e4e] text-[13px] flex items-center gap-2 cursor-pointer hover:bg-[#f5f5f5] transition-colors"
            >
              <img src={assets.iconPhoto} alt="" className="size-[13px]" />
              프로필 사진 변경
            </button>
          </div>

          {/* 닉네임 */}
          <div>
            <label className="block font-bold text-[14px] text-[#404040] mb-1.5">닉네임</label>
            <input className={FIELD_CLASS} value={form.nickname} onChange={handleChange("nickname")} />
          </div>

          {/* 이메일 / 전화번호 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[14px] text-[#404040] mb-1.5">이메일</label>
              <div className={FIELD_CLASS + " flex items-center text-[#404040]"}>
                {user?.email
                  ? user.email.replace(/(?<=.{2}).(?=.*@)/g, "*")
                  : "ks***@***.com"}
              </div>
            </div>
            <div>
              <label className="block font-bold text-[14px] text-[#404040] mb-1.5">전화번호</label>
              <div className="flex gap-2">
                <div className={FIELD_CLASS + " flex-1 flex items-center text-[#404040]"}>
                  010-****-5678
                </div>
                <button
                  type="button"
                  onClick={() => toast({ icon: "info", title: "전화번호 수정은 준비 중입니다." })}
                  className="h-[40px] px-4 rounded-[5px] border border-[#969696] bg-white text-[#4e4e4e] text-[13px] cursor-pointer hover:bg-[#f5f5f5] transition-colors whitespace-nowrap"
                >
                  수정
                </button>
              </div>
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block font-bold text-[14px] text-[#404040] mb-1.5">현재 비밀번호</label>
            <input
              type="password"
              className={FIELD_CLASS}
              value={form.currentPassword}
              onChange={handleChange("currentPassword")}
              placeholder="********"
            />
          </div>
          <div>
            <label className="block font-bold text-[14px] text-[#404040] mb-1.5">새 비밀번호</label>
            <input
              type="password"
              className={FIELD_CLASS}
              value={form.newPassword}
              onChange={handleChange("newPassword")}
              placeholder="********"
            />
          </div>
          <div>
            <label className="block font-bold text-[14px] text-[#404040] mb-1.5">새 비밀번호 확인</label>
            <input
              type="password"
              className={FIELD_CLASS}
              value={form.newPasswordConfirm}
              onChange={handleChange("newPasswordConfirm")}
              placeholder="********"
            />
          </div>

          {/* 주소 */}
          <div>
            <label className="block font-bold text-[14px] text-[#404040] mb-1.5">주소</label>
            <div className="flex gap-2">
              <input
                className={FIELD_CLASS + " flex-1"}
                value={form.address}
                onChange={handleChange("address")}
              />
              <button
                type="button"
                onClick={() => toast({ icon: "info", title: "주소검색 기능은 준비 중입니다." })}
                className="h-[40px] px-4 rounded-[5px] bg-[#4e4e4e] text-white text-[13px] cursor-pointer hover:bg-[#3a3a3a] transition-colors whitespace-nowrap"
              >
                주소검색
              </button>
            </div>
          </div>
          <div>
            <label className="block font-bold text-[14px] text-[#404040] mb-1.5">상세주소</label>
            <input
              className={FIELD_CLASS}
              value={form.addressDetail}
              onChange={handleChange("addressDetail")}
            />
          </div>

          {/* 환전계좌 */}
          <div>
            <label className="block font-bold text-[14px] text-[#404040] mb-1.5">환전계좌</label>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] text-[#404040]">국민은행 1234****7890</span>
              <button
                type="button"
                onClick={() => toast({ icon: "info", title: "환전계좌 수정은 준비 중입니다." })}
                className="h-[28px] px-3 rounded-[5px] border border-[#969696] bg-white text-[#4e4e4e] text-[13px] cursor-pointer hover:bg-[#f5f5f5] transition-colors"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => toast({ icon: "info", title: "환전계좌 삭제는 준비 중입니다." })}
                className="h-[28px] px-3 rounded-[5px] border border-[#e63946] bg-white text-[#e63946] text-[13px] cursor-pointer hover:bg-[#fdf1f2] transition-colors"
              >
                삭제
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="h-[40px] w-[100px] rounded-[5px] bg-[#0064ff] text-white text-[14px] font-bold cursor-pointer hover:bg-[#0048bf] transition-colors"
            >
              저장
            </button>
          </div>
        </form>
      </div>

      {/* ── 우측: 소셜 로그인 + 알림설정 ── */}
      <div className="w-full xl:w-[300px] shrink-0 flex flex-col gap-4">
        {/* 소셜 로그인 연동 */}
        <div className="border border-[#e5e5e5] rounded-[20px] overflow-hidden">
          <div className="bg-[rgba(230,240,255,0.47)] px-5 h-[52px] flex items-center">
            <p className="font-bold text-[17px] text-black">소셜 로그인 연동</p>
          </div>
          <div className="p-5">
            <img
              src={assets.loginIcon}
              alt="구글/네이버/카카오"
              className="w-full h-[60px] object-contain mb-5"
            />
            <div className="flex justify-around">
              {[
                { label: "구글",   state: "연동됨" },
                { label: "네이버", state: "연동하기" },
                { label: "카카오", state: "연동됨" },
              ].map((social) => (
                <div key={social.label} className="flex flex-col items-center gap-2">
                  <p className="text-[13px] text-black font-medium">{social.label}</p>
                  <button
                    type="button"
                    onClick={() =>
                      toast({ icon: "info", title: "소셜 로그인 연동은 준비 중입니다." })
                    }
                    className={`h-[28px] px-3 rounded-[5px] border text-[12px] cursor-pointer transition-colors ${
                      social.state === "연동됨"
                        ? "border-[#969696] bg-white text-[#4e4e4e] hover:bg-[#f5f5f5]"
                        : "border-[#0064ff] bg-white text-[#0064ff] hover:bg-[#f0f6ff]"
                    }`}
                  >
                    {social.state}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 알림설정 */}
        <div className="border border-[#e5e5e5] rounded-[20px] overflow-hidden">
          <div className="bg-[rgba(230,240,255,0.47)] px-5 h-[52px] flex items-center justify-between">
            <p className="font-bold text-[17px] text-black">알림설정</p>
            <button
              type="button"
              onClick={() =>
                toast({ icon: "info", title: "알림설정 상세보기는 준비 중입니다." })
              }
              className="bg-transparent border-none cursor-pointer text-[13px] text-[#4e4e4e]"
            >
              상세보기 +
            </button>
          </div>
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between h-[40px] text-[12px] font-medium text-[#969696] border-b border-[#f0f0f0]">
              <span>항목</span>
              <div className="flex gap-6">
                <span>인앱</span>
                <span>이메일</span>
              </div>
            </div>
            {[
              { key: "auction", label: "경매 전체" },
              { key: "trade",   label: "거래 전체" },
              { key: "service", label: "서비스 전체" },
              { key: "ops",     label: "운영 전체" },
            ].map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between h-[44px] border-b border-[#f0f0f0] last:border-b-0"
              >
                <span className="text-[13px] text-black">{row.label}</span>
                <div className="flex gap-6 items-center">
                  <button
                    type="button"
                    onClick={() => toggleNotify(row.key, "inapp")}
                    className="size-[16px] rounded-[2px] border border-[#d9d9d9] bg-white flex items-center justify-center cursor-pointer overflow-hidden"
                    aria-label={`${row.label} 인앱 알림`}
                  >
                    {notify[row.key].inapp && (
                      <img src={assets.checkOn} alt="" className="size-full object-cover" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleNotify(row.key, "email")}
                    className="size-[16px] rounded-[2px] border border-[#d9d9d9] bg-white flex items-center justify-center cursor-pointer overflow-hidden"
                    aria-label={`${row.label} 이메일 알림`}
                  >
                    {notify[row.key].email && (
                      <img src={assets.checkOn} alt="" className="size-full object-cover" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
