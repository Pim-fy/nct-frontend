// Claude Code 작성 (BJN, 260805)
// ─────────────────────────────────────────────────────────────────────────────
// 현재 화면에 표시할 브레드크럼 항목 배열을 계산하는 훅.
//
// 우선순위:
//  1. 페이지가 Context로 주입한 오버라이드 (마이페이지 중첩 상세 등)
//  2. 중앙 맵(BREADCRUMB_ROUTES) 매치 + state.from 기반 자동 생성
//  3. 맵에 없으면 null → BreadcrumbBar가 아무것도 렌더하지 않음
//     (목록·랜딩·인증·에러 페이지는 맵에 등록하지 않는 것만으로 자동 제외)
// ─────────────────────────────────────────────────────────────────────────────
import { matchPath, useLocation } from 'react-router-dom';
import { BREADCRUMB_ROUTES, HOME_ITEM } from './breadcrumbRoutes';
import { resolveEntryTrail, sanitizeFrom } from './resolveFrom';
import { useBreadcrumbContext } from './BreadcrumbContext';

export default function useBreadcrumbTrail() {
  const location = useLocation();
  const { entry } = useBreadcrumbContext();

  // 1순위: 현재 location에서 설정된 오버라이드만 인정 (이전 화면의 잔재는 key 불일치로 무시)
  if (entry && entry.locationKey === location.key) {
    return entry.items;
  }

  // 2순위: 중앙 맵 매치 — 배열 순서대로 첫 매치 사용
  const matchedRoute = BREADCRUMB_ROUTES
    .map((route) => ({ route, match: matchPath(route.pattern, location.pathname) }))
    .find(({ match }) => match);
  if (!matchedRoute || matchedRoute.route.hidden) return null;

  const { route, match } = matchedRoute;

  // 접근 경로(state.from)가 허용된 진입점이면 그 경로를, 아니면 정식 위치(defaultTrail)를 사용
  // → 같은 화면이라도 어디서 들어왔는지에 따라 브레드크럼이 달라진다 (요구사항 3)
  const fromTrail = resolveEntryTrail(sanitizeFrom(location.state?.from));
  const defaultTrail = typeof route.defaultTrail === 'function'
    ? route.defaultTrail(match.params)
    : route.defaultTrail;
  const middle = fromTrail ?? defaultTrail;

  return [HOME_ITEM, ...middle, { label: route.pageLabel }];
}
