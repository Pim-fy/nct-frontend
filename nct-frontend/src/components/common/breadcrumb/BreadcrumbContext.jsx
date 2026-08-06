// Claude Code 작성 (BJN, 260805)
// ─────────────────────────────────────────────────────────────────────────────
// 브레드크럼 오버라이드 통로 — 마이페이지처럼 URL만으로는 현재 위치를 표현할 수 없는
// 화면(?section= + 로컬 state 중첩 상세)이 트레일 전체를 직접 지정할 때 쓴다.
// 일반 상세 페이지는 이 Context를 쓸 필요 없이 중앙 맵(breadcrumbRoutes.js) 등록만으로 동작한다.
//
// location.key 스코핑: 오버라이드에 "설정 당시의 location.key"를 함께 저장해 두고,
// 트레일 계산 시 현재 key와 일치할 때만 사용한다. 이렇게 하면 라우트가 바뀌는 순간
// 이전 페이지의 오버라이드가 자동으로 무효화된다.
// (Provider 쪽 effect로 초기화하면 부모 effect가 자식보다 늦게 실행되어
//  새 페이지가 방금 설정한 값을 지워버리는 순서 버그가 생기므로 이 방식을 쓴다)
// ─────────────────────────────────────────────────────────────────────────────
import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

const BreadcrumbContext = createContext({ entry: null, setEntry: () => {} });

export const BreadcrumbProvider = ({ children }) => {
  // entry: { locationKey, items } | null
  const [entry, setEntry] = useState(null);
  const value = useMemo(() => ({ entry, setEntry }), [entry]);
  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumbContext = () => useContext(BreadcrumbContext);

// 페이지에서 호출: items 배열을 넘기면 그 화면에 있는 동안 브레드크럼 전체를 교체한다.
// items가 null/빈 배열이면 아무것도 하지 않는다(조건부 오버라이드를 위해 호출 자체는 항상 가능).
export const useBreadcrumbOverride = (items) => {
  const { setEntry } = useBreadcrumbContext();
  const { key: locationKey } = useLocation();

  // 배열 리터럴은 렌더마다 새 참조라 그대로 deps에 넣으면 무한 재실행되므로
  // JSON 문자열로 직렬화해 "내용이 같으면 같은 값"으로 안정화한다.
  const itemsJson = items && items.length > 0 ? JSON.stringify(items) : null;

  // useLayoutEffect: 화면이 그려지기 전에 오버라이드를 반영해 깜빡임을 막는다
  useLayoutEffect(() => {
    if (!itemsJson) return undefined;
    setEntry({ locationKey, items: JSON.parse(itemsJson) });
    // 화면을 떠나거나 items가 사라질 때, 내가 설정한 오버라이드만 정리한다
    // (다른 화면이 이미 새 값을 설정했다면 건드리지 않음)
    return () => {
      setEntry((prev) => (prev?.locationKey === locationKey ? null : prev));
    };
  }, [itemsJson, locationKey, setEntry]);
};
