// src/utils/providerMode.js
// 일반 ↔ 제공자 전환은 실제 회원 역할 전환 API가 아직 없어(F-USR 담당자 영역),
// "이미 제공자 권한을 쓴 적이 있는지"를 브라우저에 로컬로만 기억해 두는 임시 구현이다.
// 실제 API가 붙으면 이 파일은 지우고 useAuth()의 user.role 등으로 대체한다.
const STORAGE_KEY = 'isProviderAccount';

export const isProviderAccount = () => localStorage.getItem(STORAGE_KEY) === 'true';

export const setProviderAccount = (value) => {
  localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
};

// SiteHeader(다른 컴포넌트 트리)에서 이미 /user/mypage 에 있는 MyPage에게
// "모드를 바꿔라"라고 알려줄 방법이 없어 커스텀 이벤트로 다리를 놓는다.
export const MYPAGE_MODE_EVENT = 'mypage:setmode';

export const requestMypageMode = (mode) => {
  window.dispatchEvent(new CustomEvent(MYPAGE_MODE_EVENT, { detail: mode }));
};
