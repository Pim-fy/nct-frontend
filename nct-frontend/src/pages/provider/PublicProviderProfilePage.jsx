import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ContentPageHeader,
  ContentPageShell,
  ContentState,
} from '@components/content/ContentUi';
import {
  PortfolioModal,
  ProviderProfile,
  ProviderReportModal,
} from '@components/service/ServiceUi';
import ViewSkeleton from '@components/skeleton/ViewSkeleton';
import { useAuth } from '@hooks/useAuth';
import { useProviderReport, usePublicProviderProfile } from '@hooks/useServiceDiscovery';
import { PROVIDER_REPORT_TYPES } from '@pages/service/servicePreviewData';

const EMPTY_REPORT = { typeCode: '', reason: '' };

const getUserId = (user) => user?.id ?? user?.userId ?? user?.userSn ?? user?.usrSn ?? null;

/** F-COM-015: 공개 제공자 프로필에서 로그인 사용자가 신고 흐름을 시작하는 화면입니다. */
const PublicProviderProfilePage = () => {
  const { providerId: rawProviderId } = useParams();
  const providerId = Number(rawProviderId);
  const validProviderId = Number.isSafeInteger(providerId) && providerId > 0;
  const providerQuery = usePublicProviderProfile(providerId);
  const reportMutation = useProviderReport();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reviews');
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [reportForm, setReportForm] = useState(EMPTY_REPORT);
  const [reportError, setReportError] = useState('');
  const [integrationMessage, setIntegrationMessage] = useState('');
  const modalCloseRef = useRef(null);
  const previousFocusRef = useRef(null);
  const modalOpen = reportOpen || Boolean(selectedPortfolio);

  useEffect(() => {
    if (!modalOpen) return undefined;
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => modalCloseRef.current?.focus(), 0);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setReportOpen(false);
        setSelectedPortfolio(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [modalOpen]);

  if (!validProviderId) {
    return (
      <ContentPageShell>
        <Helmet><title>잘못된 제공자 주소 | 에누리컷</title></Helmet>
        <ContentState
          backLabel="서비스 목록으로 돌아가기"
          backTo="/service?view=providers"
          title="잘못된 제공자 주소입니다."
          tone="error"
        />
      </ContentPageShell>
    );
  }

  if (providerQuery.isLoading) return <ViewSkeleton />;

  if (providerQuery.isError) {
    const errorStatus = providerQuery.error?.response?.status ?? providerQuery.error?.status;
    return (
      <ContentPageShell>
        <Helmet><title>제공자 조회 오류 | 에누리컷</title></Helmet>
        <ContentState
          actionLabel={errorStatus === 404 ? undefined : '다시 불러오기'}
          backLabel="서비스 목록으로 돌아가기"
          backTo="/service?view=providers"
          description={errorStatus === 404
            ? '존재하지 않거나 공개되지 않은 제공자일 수 있습니다.'
            : '잠시 후 다시 시도해 주세요.'}
          onAction={errorStatus === 404 ? undefined : () => providerQuery.refetch()}
          title={errorStatus === 404 ? '제공자를 찾을 수 없습니다.' : '제공자 프로필을 불러오지 못했습니다.'}
          tone="error"
        />
      </ContentPageShell>
    );
  }

  const provider = providerQuery.data;

  const openReport = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setReportError('');
    setIntegrationMessage('');
    setReportForm(EMPTY_REPORT);
    setReportOpen(true);
  };

  const closeReport = () => {
    if (reportMutation.isPending) return;
    setReportOpen(false);
  };

  const changeReportForm = (name, value) => {
    setReportForm((current) => ({ ...current, [name]: value }));
    setReportError('');
    setIntegrationMessage('');
  };

  const submitReport = async (event) => {
    event.preventDefault();
    const reason = reportForm.reason.trim();
    if (!reportForm.typeCode) {
      setReportError('신고 유형을 선택해 주세요.');
      return;
    }
    if (!reason) {
      setReportError('신고 사유를 입력해 주세요.');
      return;
    }
    if (String(getUserId(user)) === String(provider.ownerUserId)) {
      setReportError('자신의 제공자 프로필은 신고할 수 없습니다.');
      return;
    }

    const result = await reportMutation.mutateAsync({
      providerId: provider.id,
      reportedUserId: provider.ownerUserId,
      typeCode: reportForm.typeCode,
      reason,
    });
    setIntegrationMessage(result.message);
  };

  return (
    <ContentPageShell className="provider-public-page">
      <Helmet><title>{provider.name} 제공자 프로필 | 에누리컷</title></Helmet>
      <ContentPageHeader title="제공자 프로필" />

      <ProviderProfile
        activeTab={activeTab}
        onOpenPortfolio={setSelectedPortfolio}
        onOpenReport={openReport}
        onTabChange={setActiveTab}
        provider={provider}
      />

      {reportOpen && (
        <ProviderReportModal
          closeButtonRef={modalCloseRef}
          error={reportError}
          form={reportForm}
          integrationMessage={integrationMessage}
          isSubmitting={reportMutation.isPending}
          onChange={changeReportForm}
          onClose={closeReport}
          onSubmit={submitReport}
          providerName={provider.name}
          reportTypes={PROVIDER_REPORT_TYPES}
        />
      )}

      {selectedPortfolio && (
        <PortfolioModal
          closeButtonRef={modalCloseRef}
          onClose={() => setSelectedPortfolio(null)}
          portfolio={selectedPortfolio}
        />
      )}
    </ContentPageShell>
  );
};

export default PublicProviderProfilePage;
