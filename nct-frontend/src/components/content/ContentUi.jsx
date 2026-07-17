// 페이지가 목업 구현을 직접 알지 않게 하는 임시 UI 교체 지점입니다.
// 피그마 확정 컴포넌트가 오면 페이지가 아닌 이 export 연결만 새 구현으로 바꿉니다.
export {
  MockupContentPageShell as ContentPageShell,
  MockupContentPageHeader as ContentPageHeader,
  MockupContentState as ContentState,
  MockupNoticeFilterBar as NoticeFilterBar,
  MockupNoticeList as NoticeList,
  MockupNoticeListSummary as NoticeListSummary,
  MockupContentPagination as ContentPagination,
  MockupNoticeDetail as NoticeDetail,
  MockupGuideFlowGrid as GuideFlowGrid,
  MockupGuideFlowStrip as GuideFlowStrip,
  MockupGuideModal as GuideModal,
} from './mockup/MockupContentComponents';
