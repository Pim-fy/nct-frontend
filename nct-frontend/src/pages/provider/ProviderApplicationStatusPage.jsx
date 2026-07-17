import { Link } from 'react-router-dom';
import PageMeta from '@components/admin/PageMeta';
import { ContentPageHeader, ContentPageShell, ContentState } from '@components/content/ContentUi';
import { getMyProviderApplicationPreview } from './providerApplicationPreview';
import './providerApplyPage.css';

/** 담당자 7 · F-PROV-012/014: 마이페이지에서 연결할 신청 상태 확인 화면입니다. */
const ProviderApplicationStatusPage = () => {
  const application = getMyProviderApplicationPreview();
  if (!application) return <ContentPageShell><PageMeta title="제공자 신청 상태" /><ContentState title="진행 중인 제공자 신청이 없습니다." description="신청서를 작성하면 심사 진행 상태와 결과를 이곳에서 확인할 수 있습니다." actionLabel="제공자 권한 신청" actionTo="/provider/apply" /></ContentPageShell>;
  const message = application.status === '승인됨' ? '승인된 카테고리에서 제공자 활동을 시작할 수 있습니다.' : application.status === '반려됨' ? `반려 사유: ${application.reason || '관리자 보완 요청을 확인해 주세요.'}` : '관리자가 제출 정보와 신청 카테고리를 검토하고 있습니다.';
  return <ContentPageShell className="provider-apply-page"><PageMeta title="제공자 신청 상태" /><ContentPageHeader eyebrow="담당자 7 · F-PROV-012/014" title="제공자 신청 상태" description="마이페이지 메뉴에서 이 화면으로 연결할 수 있도록 준비한 상태 화면입니다." /><section className={`provider-status-preview ${application.tone}`}><span>현재 상태</span><h2>{application.status}</h2><p>{message}</p><dl><dt>신청번호</dt><dd>{application.id}</dd><dt>신청 카테고리</dt><dd>{application.category}</dd><dt>활동 지역</dt><dd>{application.area}</dd><dt>신청일</dt><dd>{application.date}</dd></dl>{application.status === '반려됨' && <Link className="btn btn-primary" to="/provider/apply">보완 후 다시 신청</Link>}</section></ContentPageShell>;
};
export default ProviderApplicationStatusPage;
