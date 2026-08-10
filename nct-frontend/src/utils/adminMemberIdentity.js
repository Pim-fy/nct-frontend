/** 담당자 7: 관리자 화면에서 비민감 회원 식별정보와 내부 회원번호를 함께 표시합니다. */
export const formatAdminMemberIdentity = (member, userSn, emptyLabel = '-') => {
  const resolvedUserSn = member?.userSn ?? userSn;
  if (resolvedUserSn == null) return emptyLabel;
  if (String(resolvedUserSn).toUpperCase() === 'SYSTEM') return '시스템';

  // 담당자 7 · POL-AUTH-010: 백엔드 누락에도 소셜 인증용 시스템 ID를 화면에 표시하지 않습니다.
  const rawLoginId = member?.loginId?.trim();
  const loginId = rawLoginId?.startsWith('OAUTH_') ? null : rawLoginId;
  const nickname = member?.nickname?.trim();
  if (!loginId && !nickname) return `회원 #${resolvedUserSn}`;

  const primary = loginId || nickname;
  const nicknameLabel = loginId && nickname && nickname !== loginId ? ` (${nickname})` : '';
  return `${primary}${nicknameLabel} · #${resolvedUserSn}`;
};
