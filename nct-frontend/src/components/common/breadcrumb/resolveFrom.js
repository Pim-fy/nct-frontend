// Claude Code 작성 (BJN, 260805)
// ─────────────────────────────────────────────────────────────────────────────
// state.from(이전 페이지 경로) 검증·해석 유틸 — React에 의존하지 않는 순수 함수만 둔다.
//
// 배경: 프로젝트에는 이미 두 가지 from 전달 방식이 섞여 있다.
//  1) 경매 카드 → 상세 이동: from에 "경로 문자열"을 담음 (AuctionCard.jsx)
//  2) 로그인 리다이렉트:     from에 "location 객체"를 통째로 담음 (LoginPage 계열)
// 여기서 둘 다 흡수해 안전한 경로 문자열 하나로 정규화한다.
// (AuctionDetailPage.jsx 116~123행의 검증 로직을 일반화한 것)
// ─────────────────────────────────────────────────────────────────────────────
import { matchPath } from 'react-router-dom';
import { BREADCRUMB_ENTRIES } from './breadcrumbRoutes';

// from 값을 검증해 "/경로?쿼리#해시" 문자열로 정규화한다. 유효하지 않으면 null.
export function sanitizeFrom(rawFrom) {
  // location 객체 형태(로그인 리다이렉트 방식)면 문자열로 합쳐준다
  const raw = typeof rawFrom === 'string'
    ? rawFrom
    : (rawFrom && typeof rawFrom.pathname === 'string')
      ? `${rawFrom.pathname}${rawFrom.search ?? ''}${rawFrom.hash ?? ''}`
      : null;

  // 내부 경로만 인정: '/'로 시작해야 하고, '//'는 외부 도메인 이동이 될 수 있어 차단
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

// "/auction?category=1#top" 같은 전체 경로 문자열을 pathname/search/hash로 분해한다.
// (URL 생성자를 쓰지 않는 이유: 상대 경로라 base 지정이 필요하고, 여기선 단순 분해면 충분)
export function parsePath(fullPath) {
  const hashIndex = fullPath.indexOf('#');
  const hash = hashIndex >= 0 ? fullPath.slice(hashIndex) : '';
  const withoutHash = hashIndex >= 0 ? fullPath.slice(0, hashIndex) : fullPath;
  const searchIndex = withoutHash.indexOf('?');
  const search = searchIndex >= 0 ? withoutHash.slice(searchIndex) : '';
  const pathname = searchIndex >= 0 ? withoutHash.slice(0, searchIndex) : withoutHash;
  return { pathname, search, hash };
}

// 정규화된 from 경로가 "허용된 진입점(목록성 화면)"이면 해당 트레일을 반환, 아니면 null.
// 진입점 목록에는 목록 페이지만 등록돼 있으므로, 상세→상세 이동처럼
// 진입점이 아닌 from은 여기서 자동으로 걸러져 defaultTrail 폴백으로 이어진다.
export function resolveEntryTrail(fromPath) {
  if (!fromPath) return null;
  const loc = parsePath(fromPath);
  const entry = BREADCRUMB_ENTRIES.find((e) => matchPath(e.pattern, loc.pathname));
  return entry ? entry.trail(loc) : null;
}
