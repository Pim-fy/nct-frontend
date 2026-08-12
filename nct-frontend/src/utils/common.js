// src/utils/common.js
import Swal from 'sweetalert2';

// ──────────────────────────────────────────
// SweetAlert2 Toast / Confirm 헬퍼
// ──────────────────────────────────────────

const ToastBase = Swal.mixin({
  toast: true,
  showConfirmButton: false,
  timerProgressBar: true,
  didOpen: (t) => {
    t.onmouseenter = Swal.stopTimer;
    t.onmouseleave = Swal.resumeTimer;
  },
});

/**
 * 토스트 알림
 * @example toast({ icon: 'success', title: '저장되었습니다!' })
 * @example toast({ icon: 'error', html: '실패<br/>관리자 문의', position: 'top-center', timer: 3000 })
 */
export const toast = ({ icon, title, html, position = 'bottom-end', timer = 1500 }) =>
  ToastBase.fire({ icon, title, html, position, timer });

/**
 * 확인 다이얼로그
 * @returns {Promise<boolean>} 확인 → true, 취소 → false
 * @example const ok = await confirm({ title: '삭제하시겠습니까?', text: '복구 불가' })
 */
export const confirm = async ({
  title,
  text,
  icon = 'warning',
  confirmButtonText = '확인',
  cancelButtonText  = '취소',
  showCancelButton = true,
  scrollbarPadding = true,
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton,
    scrollbarPadding,
    confirmButtonColor   : '#d33',
    cancelButtonColor    : '#0F9B73',
    confirmButtonText,
    cancelButtonText,
    reverseButtons       : true,
  });
  return result.isConfirmed;
};

// ──────────────────────────────────────────
// 서버 필드명 ↔ 프론트 필드명 매핑 정의
//
// [매핑 규칙]
// key   : 서버 응답(response.data)의 실제 필드명
// value : 프론트 상태에서 사용할 필드명
//
// [예시 - 구 필드명 참고용]
// 구 서버 필드 mbrId → 프론트 id 로 쓰던 방식:
// mbrId: 'id'
// ──────────────────────────────────────────

const fieldMap = {

  // /api/auth/me 응답 기준
  // { id, email, name, nickname, role, provider }
  user: {
    id       : 'id',
    email    : 'email',
    name     : 'name',
    nickname : 'nickname',
    role     : 'role',
    provider : 'provider',
  },

  // /api/member/me 응답 기준
  // { id, email, name, nickname, role, provider, phone, zipcode, address, detailAddress, profileIcon, profileBg }
  profile: {
    id            : 'id',
    email         : 'email',
    name          : 'name',
    nickname      : 'nickname',
    role          : 'role',
    provider      : 'provider',
    phone         : 'phone',
    zipcode       : 'zipcode',
    address       : 'address',
    detailAddress : 'detailAddress',
    profileIcon   : 'profileIcon',
    profileBg     : 'profileBg',
  },

};

/**
 * 서버 응답 데이터를 프론트 상태 필드명으로 변환
 * @param {string} type          - fieldMap 키 ('user' | 'profile')
 * @param {Object} updatedData   - 서버 응답 데이터
 * @param {Object} profileState  - 기존 상태 (기본값 merge용)
 */
export const mapDataToState = (type, updatedData, profileState = {}) => {
  if (!updatedData) return profileState;

  const mapping = fieldMap[type];
  if (!mapping) {
    console.warn(`fieldMap에 '${type}' 정의가 없습니다.`);
    return { ...profileState, ...updatedData };
  }

  const result = { ...profileState };

  Object.keys(updatedData).forEach((serverKey) => {
    const frontKey = mapping[serverKey];
    let value = updatedData[serverKey];

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      value = { ...value };
    }

    if (frontKey) {
      result[frontKey] = value;
    } else if (Object.prototype.hasOwnProperty.call(result, serverKey)) {
      result[serverKey] = value;
    }
  });

  // 날짜 처리 - 서버가 joinDate 필드를 내려줄 경우
  if (updatedData.joinDate) {
    result.joinDate = updatedData.joinDate.split('T')[0];
  }

  // 이미지 캐시 방지 (절대경로 변환 + 타임스탬프)
  const addCacheBust = (fileObj) => {
    if (!fileObj?.filePath) return fileObj;
    let filePath = fileObj.filePath;
    if (filePath.startsWith('/attachment')) {
      filePath = `${import.meta.env.VITE_API_URL}${filePath}`;
    }
    const sep = filePath.includes('?') ? '&' : '?';
    return { ...fileObj, filePath: `${filePath}${sep}t=${Date.now()}` };
  };

  if (result.profileIcon) result.profileIcon = addCacheBust(result.profileIcon);
  if (result.profileBg)   result.profileBg   = addCacheBust(result.profileBg);

  return result;
};

// ──────────────────────────────────────────
// 일반 유틸리티
// ──────────────────────────────────────────

/**
 * 숫자를 플랫폼 포인트 형식으로 포맷
 * @param {number} amount
 * @returns {string} e.g. "1,234,567P". 값이 없으면 "-"
 */
export const formatPrice = (amount) => {
  if (amount == null) return '-';
  return `${Number(amount).toLocaleString('ko-KR')}P`;
};

/**
 * 숫자를 포인트 형식으로 포맷
 * @param {number} amount
 * @returns {string} e.g. "1,234,567P". 값이 없으면 "-"
 */
export const formatPoint = (amount) => {
  if (amount == null) return '-';
  return `${Number(amount).toLocaleString('ko-KR')}P`;
};

/**
 * 담당자 7 · 내부 금액 표기 통일: 저장된 카테고리 문항 값은 유지하고 화면의 원 단위만 P로 바꿉니다.
 * 숫자가 앞에 있는 금액 표현만 변환하므로 원룸·지원 같은 일반 단어는 건드리지 않습니다.
 */
export const formatPointUnitText = (value) => {
  if (typeof value !== 'string') return value;

  const toPointText = (amountText, multiplier) => {
    const amount = Number(amountText.replaceAll(',', '')) * multiplier;
    return Number.isSafeInteger(amount)
      ? `${amount.toLocaleString('ko-KR')}P`
      : `${amountText}P`;
  };

  return value
    .replace(/(\d[\d,]*)\s*억\s*원/g, (_, amount) => toPointText(amount, 100_000_000))
    .replace(/(\d[\d,]*)\s*만\s*원/g, (_, amount) => toPointText(amount, 10_000))
    .replace(/(\d[\d,]*)\s*천\s*원/g, (_, amount) => toPointText(amount, 1_000))
    .replace(/(\d[\d,]*)\s*원/g, (_, amount) => toPointText(amount, 1));
};

/**
 * 숫자에 천단위 콤마만 표시(단위 없음). 입력창 실시간 포맷팅 등에 사용 — 값이 없으면 0으로 처리
 * @param {number} value
 * @returns {string} e.g. "1,234,567"
 */
export const formatNumber = (value) => {
  const number = Number(value || 0);
  return number.toLocaleString('ko-KR');
};

/**
 * 예산·견적 금액을 포인트(P) 단위로 포맷 — 서비스 요청/견적 화면 공용
 * @param {number|null} amt
 * @returns {string} 값이 없으면 "예산 미정" (숫자 포맷 자체는 formatPoint와 동일)
 */
export const formatBudget = (amt) => {
  if (amt == null) return '예산 미정';
  return formatPoint(amt);
};

/**
 * 날짜를 YYYY.MM.DD 형식으로 포맷
 * @param {string|Date} date
 * @returns {string} 값이 없거나 날짜로 해석할 수 없으면 "-"
 */
export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .replace(/\s/g, '').replace(/\.$/, '');
};

/**
 * 가입일을 "가입 N일차/N개월차/N년차" 형태로 변환한다 - 거래 상대방 신뢰 보조 지표용.
 * @param {string} joinedAt - ISO 날짜/일시 문자열
 * @returns {string} 값이 없으면 "-"
 */
export const formatMembershipDuration = (joinedAt) => {
  if (!joinedAt) return '-';
  const joined = new Date(joinedAt);
  if (Number.isNaN(joined.getTime())) return '-';

  const diffDays = Math.max(0, Math.floor((Date.now() - joined.getTime()) / (1000 * 60 * 60 * 24)));
  if (diffDays < 30) return `가입 ${diffDays + 1}일차`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `가입 ${diffMonths}개월차`;

  return `가입 ${Math.floor(diffMonths / 12)}년차`;
};

/**
 * 마침표+공백 뒤에서 문장을 나눠 배열로 반환한다 - 여러 문장이 한 문단에 이어붙어
 * 좁은 카드 폭에서 줄바꿈 없이 한 줄로 표시되는 걸 막고, 문장 단위로 별도 줄에 보여줄 때 쓴다.
 * @param {string} text
 * @returns {string[]}
 */
export const splitSentences = (text) => {
  if (!text) return [];
  const parts = String(text).split('. ');
  return parts.map((part, index) => (
    index < parts.length - 1 ? `${part}.` : part
  ));
};

/**
 * 날짜+시간을 YYYY.MM.DD HH:mm(24시간제) 형식으로 포맷
 * @param {string} dateTime - ISO LocalDateTime 문자열(예: "2026-07-28T14:30:00")
 * @returns {string} 값이 없으면 "-"
 */
export const formatDateTime = (dateTime) => {
  if (!dateTime) return '-';
  return String(dateTime).replace('T', ' ').replaceAll('-', '.').slice(0, 16);
};

/**
 * 날짜+시간을 YYYY.MM.DD 오전/오후 h:mm 형식으로 포맷 (12시간제)
 * @param {string} dateTime - ISO LocalDateTime 문자열(예: "2026-07-28T14:30:00")
 * @returns {string} 값이 없으면 "-"
 */
export const formatDateTimeAmPm = (dateTime) => {
  if (!dateTime) return '-';
  const [datePart, timePart] = String(dateTime).split('T');
  if (!datePart || !timePart) return '-';
  const [h, m] = timePart.split(':').map(Number);
  const period = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${datePart.replaceAll('-', '.')} ${period} ${h12}:${String(m).padStart(2, '0')}`;
};

/**
 * 문자열 말줄임 처리
 * @param {string} str
 * @param {number} limit
 * @returns {string}
 */
export const truncate = (str, limit = 50) => {
  if (!str) return '';
  return str.length > limit ? `${str.slice(0, limit)}...` : str;
};

/**
 * 빈 값 체크
 * @param {*} value
 * @returns {boolean}
 */
export const isEmpty = (value) => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * 클래스명 조합 (falsy 값 제거)
 * @param {...string} classes
 * @returns {string}
 */
export const cn = (...classes) => classes.filter(Boolean).join(' ');

/**
 * 디바운스
 * @param {Function} fn
 * @param {number} delay
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
