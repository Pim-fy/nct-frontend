// 서비스 탐색 페이지가 임시 목업 구현을 직접 알지 않게 하는 교체 지점입니다.
// 확정 공통 컴포넌트가 오면 페이지가 아닌 이 export 연결만 교체합니다.
export {
  MockupDiscoveryTabs as DiscoveryTabs,
  MockupIntegrationNotice as IntegrationNotice,
  MockupPortfolioModal as PortfolioModal,
  MockupProviderGrid as ProviderGrid,
  MockupProviderProfile as ProviderProfile,
  MockupProviderReportModal as ProviderReportModal,
  MockupServiceEmptyState as ServiceEmptyState,
  MockupServiceFilterPanel as ServiceFilterPanel,
  MockupServiceRequestGrid as ServiceRequestGrid,
  MockupServiceSearchBar as ServiceSearchBar,
} from './mockup/MockupServiceComponents';
