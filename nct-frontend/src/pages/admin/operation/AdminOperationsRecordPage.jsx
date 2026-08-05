import { Link, useSearchParams } from 'react-router-dom';
import OperationsIntegrationPreview from '@pages/admin/OperationsIntegrationPreview';
import AdminAuditLogPage from '@pages/admin/audit/AdminAuditLogPage';
import './adminOperationsRecordPage.css';

const TABS = [
  { key: 'risk', label: '위험 이벤트' },
  { key: 'audit', label: '감사 로그' },
];

/** 담당자 7 · F-OPS-011: 담당자 6의 F-OPS-016 화면을 변경하지 않고 운영 기록 탐색에 연결합니다. */
const AdminOperationsRecordPage = () => {
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = requestedTab === 'audit' ? 'audit' : 'risk';

  return (
    <div className="admin-operations-records">
      <nav className="admin-operations-records__tabs" aria-label="운영 기록 종류">
        {TABS.map((tab) => (
          <Link
            aria-current={activeTab === tab.key ? 'page' : undefined}
            className={activeTab === tab.key ? 'is-active' : ''}
            key={tab.key}
            to={`?tab=${tab.key}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <section>
        {activeTab === 'risk'
          ? <OperationsIntegrationPreview />
          : <AdminAuditLogPage />}
      </section>
    </div>
  );
};

export default AdminOperationsRecordPage;
