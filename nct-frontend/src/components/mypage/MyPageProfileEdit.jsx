// src/components/mypage/MyPageProfileEdit.jsx
// Figma: mypage_01일반_프로필수정(node 28:12) CONTENTS 구간("프로필수정" 탭).
// - 절대좌표 → 반응형 전환.
//   메인 폼(좌)/소셜+알림(우) → xl 이상 가로 배치, 그 이하 세로 스택.
//   폼 내부 필드: sm 이상 2열 그리드, 그 이하 단일 열.
import React, { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import DaumPostcode from "react-daum-postcode";
import { toast, confirm } from "@utils/common";
import { assets } from "@components/mypage/assets";
import { updateProfile, changePassword, getProfile, getOauthLinks, unlinkOauth } from "@api/memberApi";
import { uploadImage, toImageUrl } from "@api/fileApi";
import { useAuth } from "@hooks/useAuth";

const FIELD_CLASS =
  "w-full h-[40px] rounded-[5px] border border-[#d9d9d9] bg-white px-3 text-[14px] text-[#404040] focus:outline-none focus:border-[#0064ff]";

// 백엔드 friendly key(OAuthProviderParser)와 1:1 대응. 연동 시작 URL은 로그인용과 동일한
// registrationId에 "-link" 접미사만 붙는다(SecurityConfig.oauthLinkFilterChain).
const SOCIAL_PROVIDERS = [
  { key: "google", label: "구글" },
  { key: "naver", label: "네이버" },
  { key: "kakao", label: "카카오" },
];

const MYPAGE_LINK_RETURN_KEY = "mypageLinkReturn";

export default function MyPageProfileEdit({ user }) {
  const queryClient = useQueryClient();
  const { localLogout } = useAuth();
  const [form, setForm] = useState({
    nickname: user?.nickname || "",
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
    phone: "",
    zip: "",
    address: "",
    addressDetail: "",
    profileFileSn: null,
    bankName: "",
    accountNo: "",
  });
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const photoInputRef = useRef(null);
  const [notify, setNotify] = useState({
    auction: { inapp: true, email: false },
    trade:   { inapp: true, email: true },
    service: { inapp: true, email: true },
    ops:     { inapp: true, email: true },
  });

  // ISS-022: 전화번호·주소는 로그인 응답(user)에 없어 마이페이지 전용 조회 API로 초기값을 채운다.
  const profileQuery = useQuery({
    queryKey: ["member", "profile"],
    queryFn: () => getProfile().then((res) => res.data),
  });
  useEffect(() => {
    if (!profileQuery.data) return;
    // 편집 가능한 폼을 비동기 조회 결과로 1회 초기화하는 표준 패턴이다(값 자체를 렌더링에 쓰는
    // 게 아니라 이후 사용자 입력의 시작값으로만 씀).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((prev) => ({
      ...prev,
      phone: profileQuery.data.phone || "",
      zip: profileQuery.data.zip || "",
      address: profileQuery.data.address || "",
      addressDetail: profileQuery.data.addressDetail || "",
      profileFileSn: profileQuery.data.profileFileSn ?? null,
      bankName: profileQuery.data.bankName || "",
      accountNo: profileQuery.data.accountNo || "",
    }));
  }, [profileQuery.data]);

  // ISS-022: 소셜 로그인 전용 계정(백엔드 getProfile의 passwordChangeable)은 실제 아는 비밀번호가
  // 없어 변경이 불가능하다. 데이터 도착 전 깜빡임을 피하려고 로딩 중엔 기본 true로 둔다.
  const passwordChangeable = profileQuery.data?.passwordChangeable ?? true;

  const handlePasswordFieldBlocked = () => {
    if (passwordChangeable) return;
    toast({ icon: "info", title: "소셜 로그인으로 가입한 계정은 비밀번호를 생성·저장할 수 없습니다." });
  };

  const oauthLinksQuery = useQuery({
    queryKey: ["member", "oauthLinks"],
    queryFn: () => getOauthLinks().then((res) => res.data),
  });
  const linkedProviders = new Set((oauthLinksQuery.data ?? []).map((link) => link.provider));

  const unlinkMutation = useMutation({
    mutationFn: (provider) => unlinkOauth(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member", "oauthLinks"] });
      toast({ icon: "success", title: "연동이 해제되었습니다." });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || "연동 해제에 실패했습니다.";
      toast({ icon: "error", title: msg });
    },
  });

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // 회원가입 화면(SignupPage)과 동일한 카카오 우편번호 API 연동 - 도로명/지번 주소와 우편번호를 함께 받는다.
  const handleAddressComplete = (data) => {
    const address = data.roadAddress || data.jibunAddress || "";
    const zip = data.zonecode || "";
    if (!address || !zip) return;
    setForm((prev) => ({ ...prev, address, zip }));
    setAddressSearchOpen(false);
  };

  // ISS-022: 파일 업로드(FileController, service='profile')만 먼저 하고 flSn을 폼에 담아둔다.
  // 실제 USERS.USR_PRFL_FL_SN 반영은 다른 필드와 함께 "저장" 버튼을 눌러야 확정된다.
  const handlePhotoButtonClick = () => photoInputRef.current?.click();

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 선택해도 change가 발생하도록 초기화
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const res = await uploadImage(file, "profile");
      setForm((prev) => ({ ...prev, profileFileSn: res.data.flSn }));
      setPreviewImageUrl(toImageUrl(res.data.url));
      toast({ icon: "success", title: "사진이 업로드되었습니다. 저장을 눌러야 반영됩니다." });
    } catch (err) {
      const msg = err?.response?.data?.message || "사진 업로드에 실패했습니다.";
      toast({ icon: "error", title: msg });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: "환전계좌를 삭제할까요?",
      text: "저장된 은행명·계좌번호가 삭제됩니다.",
      icon: "warning",
      confirmButtonText: "삭제",
    });
    if (!ok) return;
    try {
      const res = await updateProfile({
        nickname: form.nickname,
        email: user?.email,
        bankName: "",
        accountNo: "",
      });
      setForm((prev) => ({ ...prev, bankName: "", accountNo: "" }));
      queryClient.setQueryData(["member", "profile"], res.data);
      toast({ icon: "success", title: "환전계좌가 삭제되었습니다." });
    } catch (err) {
      const msg = err?.response?.data?.message || "삭제에 실패했습니다.";
      toast({ icon: "error", title: msg });
    }
  };

  // ISS-022: 비밀번호는 나머지 필드(저장 버튼)와 별개의 독립 동작이다 - 검증 규칙이 다르고
  // 성공 시 서버가 리프레시 토큰을 무효화해 다른 필드 저장과 같은 흐름에 묶으면 혼란스럽다.
  const handleChangePassword = async () => {
    if (!passwordChangeable) {
      handlePasswordFieldBlocked();
      return;
    }
    if (!form.currentPassword || !form.newPassword || !form.newPasswordConfirm) {
      toast({ icon: "error", title: "비밀번호 항목을 모두 입력해주세요." });
      return;
    }
    if (form.newPassword !== form.newPasswordConfirm) {
      toast({ icon: "error", title: "새 비밀번호가 일치하지 않습니다." });
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        newPasswordConfirm: form.newPasswordConfirm,
      });
      toast({ icon: "success", title: "비밀번호가 변경되었습니다. 다시 로그인해주세요." });
      // 서버가 리프레시 토큰을 무효화했으므로 로그아웃 API 호출 없이 로컬 상태만 정리하고 나간다.
      setTimeout(localLogout, 1200);
    } catch (err) {
      const msg = err?.response?.data?.message || "비밀번호 변경에 실패했습니다.";
      toast({ icon: "error", title: msg });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 연동은 OAuth 핸드셰이크(리다이렉트)가 필요해 REST 호출이 아니라 페이지 이동으로 시작한다.
  // 완료 후 어디로 돌아올지는 OAuthRedirectHandler가 이 값을 읽어 사용한다.
  const handleLink = (provider) => {
    sessionStorage.setItem(MYPAGE_LINK_RETURN_KEY, "/user/mypage?section=profile");
    // 전체 페이지 이동(OAuth 리다이렉트)이라 useAuth.js의 로그아웃 리다이렉트와 동일한 패턴이다.
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = `${import.meta.env.VITE_API_URL}/api/oauth2/authorization/${provider}-link`;
  };

  const handleUnlink = async (provider, label) => {
    const ok = await confirm({
      title: `${label} 연동을 해제할까요?`,
      text: "해제 후 다시 사용하려면 마이페이지에서 재연동해야 합니다.",
      icon: "warning",
      confirmButtonText: "해제",
    });
    if (!ok) return;
    unlinkMutation.mutate(provider);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // email은 이 화면에서 수정하지 않지만 백엔드가 필수값으로 요구해 현재 값을 그대로 함께 보낸다.
      const res = await updateProfile({
        nickname: form.nickname,
        email: user?.email,
        phone: form.phone.trim(),
        zip: form.zip.trim(),
        address: form.address.trim(),
        addressDetail: form.addressDetail.trim(),
        profileFileSn: form.profileFileSn,
        bankName: form.bankName.trim(),
        accountNo: form.accountNo.trim(),
      });
      queryClient.setQueryData(["auth", "user"], (prev) =>
        prev ? { ...prev, nickname: res.data.nickname } : prev
      );
      queryClient.setQueryData(["member", "profile"], res.data);
      setPreviewImageUrl(null); // 저장 완료 후엔 서버가 내려준 profileImageUrl을 그대로 신뢰한다
      toast({ icon: "success", title: "저장되었습니다." });
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
    <>
    <h1 className="mb-5 text-2xl font-bold text-black">프로필</h1>
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
              <img
                src={previewImageUrl || toImageUrl(profileQuery.data?.profileImageUrl) || assets.profile}
                alt=""
                className="size-full object-cover"
              />
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={handlePhotoButtonClick}
              disabled={isUploadingPhoto}
              className="btn btn-ghost btn-sm"
            >
              <img src={assets.iconPhoto} alt="" className="size-[13px]" />
              {isUploadingPhoto ? "업로드 중..." : "프로필 사진 변경"}
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
              <input
                className={FIELD_CLASS}
                type="tel"
                placeholder="01012345678"
                value={form.phone}
                onChange={handleChange("phone")}
              />
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
              readOnly={!passwordChangeable}
              onFocus={handlePasswordFieldBlocked}
              onClick={handlePasswordFieldBlocked}
              placeholder={passwordChangeable ? "********" : "소셜 로그인 계정은 비밀번호가 없습니다"}
            />
          </div>
          <div>
            <label className="block font-bold text-[14px] text-[#404040] mb-1.5">새 비밀번호</label>
            <input
              type="password"
              className={FIELD_CLASS}
              value={form.newPassword}
              onChange={handleChange("newPassword")}
              readOnly={!passwordChangeable}
              onFocus={handlePasswordFieldBlocked}
              onClick={handlePasswordFieldBlocked}
              placeholder={passwordChangeable ? "********" : "소셜 로그인 계정은 비밀번호가 없습니다"}
            />
          </div>
          <div>
            <label className="block font-bold text-[14px] text-[#404040] mb-1.5">새 비밀번호 확인</label>
            <input
              type="password"
              className={FIELD_CLASS}
              value={form.newPasswordConfirm}
              onChange={handleChange("newPasswordConfirm")}
              readOnly={!passwordChangeable}
              onFocus={handlePasswordFieldBlocked}
              onClick={handlePasswordFieldBlocked}
              placeholder={passwordChangeable ? "********" : "소셜 로그인 계정은 비밀번호가 없습니다"}
            />
          </div>
          {!passwordChangeable && (
            <p className="text-[12px] text-[#969696]">
              소셜 로그인(카카오·네이버·구글)으로 가입한 계정은 비밀번호를 생성·저장할 수 없습니다.
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={isChangingPassword || !passwordChangeable}
              className="btn btn-outline btn-sm"
            >
              {isChangingPassword ? "변경 중..." : "비밀번호 변경"}
            </button>
          </div>

          {/* 주소 */}
          <div>
            <label className="block font-bold text-[14px] text-[#404040] mb-1.5">주소</label>
            <div className="flex gap-2">
              <input
                className={FIELD_CLASS + " flex-1"}
                placeholder="주소 검색을 눌러주세요."
                readOnly
                value={form.address}
              />
              <button
                type="button"
                onClick={() => setAddressSearchOpen(true)}
                className="btn btn-dark btn-sm"
              >
                주소검색
              </button>
            </div>
            {form.zip && <p className="mt-1 text-[12px] text-[#969696]">우편번호 {form.zip}</p>}
          </div>
          <div>
            <label className="block font-bold text-[14px] text-[#404040] mb-1.5">상세주소</label>
            <input
              className={FIELD_CLASS}
              disabled={!form.address}
              placeholder={form.address ? "동·호수 등 상세주소" : "주소 검색 후 입력할 수 있습니다."}
              value={form.addressDetail}
              onChange={handleChange("addressDetail")}
            />
          </div>

          {/* 환전계좌 */}
          <div>
            <label className="block font-bold text-[14px] text-[#404040] mb-1.5">환전계좌</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className={FIELD_CLASS}
                placeholder="은행명"
                value={form.bankName}
                onChange={handleChange("bankName")}
              />
              <div className="flex gap-2">
                <input
                  className={FIELD_CLASS + " flex-1"}
                  placeholder="계좌번호"
                  value={form.accountNo}
                  onChange={handleChange("accountNo")}
                />
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={!form.bankName && !form.accountNo}
                  className="btn btn-danger btn-sm"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="btn btn-primary"
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
              {SOCIAL_PROVIDERS.map((social) => {
                const linked = linkedProviders.has(social.key);
                return (
                  <div key={social.key} className="flex flex-col items-center gap-2">
                    <p className="text-[13px] text-black font-medium">{social.label}</p>
                    <button
                      type="button"
                      onClick={() =>
                        linked ? handleUnlink(social.key, social.label) : handleLink(social.key)
                      }
                      disabled={oauthLinksQuery.isLoading || unlinkMutation.isPending}
                      className={linked ? "btn btn-ghost btn-sm" : "btn btn-outline btn-sm"}
                    >
                      {linked ? "연동됨" : "연동하기"}
                    </button>
                  </div>
                );
              })}
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

      {addressSearchOpen ? (
        <div aria-modal="true" className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 p-4" role="dialog">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#f0f0f0] px-5 py-3">
              <p className="font-bold text-[15px] text-[#404040]">주소 검색</p>
              <button
                type="button"
                onClick={() => setAddressSearchOpen(false)}
                className="btn btn-ghost btn-sm"
              >
                닫기
              </button>
            </div>
            <DaumPostcode autoClose={false} onComplete={handleAddressComplete} />
          </div>
        </div>
      ) : null}
    </div>
    </>
  );
}
