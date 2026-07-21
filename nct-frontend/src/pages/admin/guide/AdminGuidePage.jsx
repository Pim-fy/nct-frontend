import { ExternalLink, Route, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import MockupAdminStatusBadge from '@components/admin/mockup/MockupAdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import { GUIDE_FLOWS, GUIDE_JOURNEYS } from '@pages/content/guideData';
import '../notice/adminContentPages.css';

const flowsById = new Map(GUIDE_FLOWS.map((flow) => [flow.id, flow]));

/**
 * F-COM-014 관리자 확인 화면입니다.
 * 이번 단계에서는 정적 가이드와 실제 담당 화면의 연결 상태만 확인하며 저장 기능은 제공하지 않습니다.
 */
const AdminGuidePage = () => (
  <div className="admin-content-page">
    <PageMeta title="이용가이드 관리" />
    <MockupAdminPageHeader
      action={<Link className="btn btn-outline" rel="noreferrer" target="_blank" to="/guide"><ExternalLink aria-hidden="true" /> 사용자 화면 보기</Link>}
      description="경매와 서비스 요청의 이용 순서, 사용자 가이드 미리보기, 담당 화면 연결 상태를 확인합니다."
      eyebrow="F-COM-014 · POL-COM-004"
      title="이용가이드 관리"
    />

    <section className="card admin-guide-policy">
      <Workflow aria-hidden="true" />
      <div>
        <strong>현재는 정적 가이드입니다.</strong>
        <p>관리자 편집·저장은 아직 제공하지 않습니다. 실제 담당 route가 확정되면 데이터의 연결 경로만 교체하고, 추후 CMS 저장소를 붙여도 이 순서 화면은 그대로 사용합니다.</p>
      </div>
      <MockupAdminStatusBadge tone="warning">편집 기능 후속</MockupAdminStatusBadge>
    </section>

    <div className="admin-guide-journeys">
      {GUIDE_JOURNEYS.map((journey) => (
        <section className="card admin-guide-journey" key={journey.id}>
          <div className="admin-guide-journey__heading">
            <div><span>{journey.id === 'auction' ? 'AUCTION' : 'SERVICE'}</span><h2>{journey.title}</h2><p>{journey.description}</p></div>
            <MockupAdminStatusBadge tone="info">{journey.flowIds.length}단계</MockupAdminStatusBadge>
          </div>

          <ol className="admin-guide-steps">
            {journey.flowIds.map((flowId, index) => {
              const flow = flowsById.get(flowId);
              return (
                <li key={`${journey.id}-${flowId}`}>
                  <span className="admin-guide-steps__number">{index + 1}</span>
                  <div className="admin-guide-steps__content">
                    <h3>{flow.title}</h3>
                    <p>{flow.summary}</p>
                    <small>{flow.targetOwner}</small>
                  </div>
                  <div className="admin-guide-steps__actions">
                    <Link className="btn btn-outline" rel="noreferrer" target="_blank" to={`/guide?flow=${flow.id}`}>가이드 미리보기</Link>
                    {flow.targetRoute ? (
                      <Link className="btn btn-outline" rel="noreferrer" target="_blank" to={flow.targetRoute}><Route aria-hidden="true" /> {flow.targetLabel}</Link>
                    ) : (
                      <span className="admin-guide-steps__pending"><Route aria-hidden="true" /> {flow.targetLabel} 연결 대기</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  </div>
);

export default AdminGuidePage;
