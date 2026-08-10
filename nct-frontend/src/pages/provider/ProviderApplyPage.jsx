import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getCategories } from '@api/categoryApi';
import { uploadImage } from '@api/fileApi';
import { getProfile } from '@api/memberApi';
import PageMeta from '@components/admin/PageMeta';
import { ContentPageHeader, ContentPageShell } from '@components/content/ContentUi';
import { Skeleton } from '@components/skeleton/BaseSkeleton';
import { useMyProviderApplications, useSubmitProviderApplication } from '@hooks/useProviderApplications';
import './providerApplyPage.css';
import './providerApplicationMulti.css';

const SERVICE_DOMAIN_CD = 'CATC0002';

const DOCUMENTS = [
  { code: 'PRVC0012', label: '자격증' },
  { code: 'PRVC0013', label: '경력증빙' },
  { code: 'PRVC0014', label: '본인확인' },
];

const STEPS = ['카테고리 선택', '정산 정보', '카테고리별 증빙 서류'];

const statusLabel = (code, fallback) => ({
  PRVC0002: '심사 대기',
  PRVC0003: '승인됨',
  PRVC0004: '반려됨',
})[code] ?? fallback ?? '확인 필요';

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

/** 담당자 7 · F-PROV-002/003/006/007/012~014
 * 제공자 권한 신청 화면입니다. 선택한 서비스 카테고리의 catSn을 실제 신청 API로 보내며,
 * 공통 파일 API에서 받은 flSn을 카테고리별 서류로 묶어 PROVIDER_APPLY_FILE 저장 흐름까지 연결합니다.
 */
const ProviderApplyPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [error, setError] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadingKey, setUploadingKey] = useState('');
  const uploadedFilesRef = useRef({});
  const applicationsQuery = useMyProviderApplications();
  const submitMutation = useSubmitProviderApplication();
  const categoriesQuery = useQuery({
    queryKey: ['provider-service-categories', SERVICE_DOMAIN_CD],
    queryFn: () => getCategories(SERVICE_DOMAIN_CD)
      .then((response) => response.data.filter((category) => category.catParentSn !== null)),
  });
  // 정산 계좌는 신청서마다 따로 받지 않고 회원 프로필(마이페이지 환전계좌)을 그대로 쓴다 —
  // 제공자는 본인 실명으로 가입하므로 프로필 계좌가 곧 본인 명의 정산 계좌다 (사용자 결정, 2026-07-28).
  const profileQuery = useQuery({
    queryKey: ['member', 'profile'],
    queryFn: () => getProfile().then((res) => res.data),
  });
  const hasSettlementAccount = Boolean(profileQuery.data?.bankName && profileQuery.data?.accountNo);

  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const latestApplicationByCategory = useMemo(() => {
    const latest = new Map();
    applications.forEach((application) => {
      const categorySn = Number(application.categorySn);
      if (!latest.has(categorySn)) latest.set(categorySn, application);
    });
    return latest;
  }, [applications]);
  const unavailable = (category) => ['PRVC0002', 'PRVC0003']
    .includes(latestApplicationByCategory.get(Number(category.catSn))?.statusCode);

  useEffect(() => {
    uploadedFilesRef.current = uploadedFiles;
  }, [uploadedFiles]);

  useEffect(() => () => {
    Object.values(uploadedFilesRef.current).forEach(({ previewUrl }) => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    });
  }, []);

  const toggleCategory = (category) => {
    if (unavailable(category)) return;
    setError('');
    setSelectedCategories((current) => {
      const alreadySelected = current.some((item) => item.catSn === category.catSn);
      return alreadySelected
        ? current.filter((item) => item.catSn !== category.catSn)
        : [...current, category];
    });
  };

  const fileKey = (categorySn, fileTypeCode) => `${categorySn}:${fileTypeCode}`;
  const uploadDocument = async (category, document, file) => {
    if (!file) return;
    const key = fileKey(category.catSn, document.code);
    setUploadingKey(key);
    setError('');
    try {
      const response = await uploadImage(file, 'provider');
      const uploaded = response.data;
      setUploadedFiles((current) => {
        const previousPreviewUrl = current[key]?.previewUrl;
        if (previousPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(previousPreviewUrl);
        return {
          ...current,
          [key]: {
            categorySn: category.catSn,
            fileTypeCode: document.code,
            flSn: uploaded.flSn,
            fileName: file.name,
            // 제공자 서류는 공개 URL로 열리지 않으므로, 선택한 브라우저에서만 볼 수 있는 로컬 미리보기다.
            previewUrl: URL.createObjectURL(file),
          },
        };
      });
    } catch (uploadError) {
      setError(errorMessage(uploadError, '서류 파일 업로드 중 오류가 발생했습니다.'));
    } finally {
      setUploadingKey('');
    }
  };

  const next = async () => {
    if (step === 0 && !selectedCategories.length) {
      setError('신청할 카테고리를 한 개 이상 선택해 주세요.');
      return;
    }

    if (step < 2) return setStep(step + 1);

    const hasMissingFile = selectedCategories.some((category) => (
      !Object.values(uploadedFiles).some((file) => file.categorySn === category.catSn)
    ));
    if (hasMissingFile) {
      return setError('선택한 카테고리마다 증빙 서류를 한 개 이상 업로드해 주세요.');
    }

    try {
      const files = Object.values(uploadedFiles)
        .filter((file) => selectedCategories.some((category) => category.catSn === file.categorySn))
        .map(({ categorySn, fileTypeCode, flSn }) => ({ categorySn, fileTypeCode, flSn }));

      await submitMutation.mutateAsync({
        categorySns: selectedCategories.map((category) => category.catSn),
        reason: '제공자 권한 신청',
        files,
      });
      navigate('/provider/applications/status');
    } catch (submitError) {
      setError(errorMessage(submitError, '제공자 신청 처리 중 오류가 발생했습니다.'));
    }
  };

  return (
    <ContentPageShell className="provider-apply-page">
      <PageMeta title="제공자 권한 신청" />
      <section className="provider-apply-hero">
        <ContentPageHeader title="제공자 권한 신청" />
        <p>활동할 서비스 분야를 선택하고, 카테고리별 증빙 서류를 한 번에 제출하세요.</p>
      </section>

      <section className="provider-status-preview">
        <span>내 카테고리별 신청 현황</span>
        <h2>{applications.length ? `${applications.length}건` : '미신청'}</h2>
        <p>
          {applications.length
            ? '심사 결과와 반려 사유는 카테고리별로 확인할 수 있습니다.'
            : '첫 제공 카테고리를 선택해 신청해 주세요.'}
        </p>
        {applications.length > 0 && (
          <dl>
            {applications.map((item) => (
              <div key={item.applicationSn}>
                <dt>{item.categoryName}</dt>
                <dd>
                  {statusLabel(item.statusCode, item.statusName)}
                  {item.rejectReason && ` · ${item.rejectReason}`}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="provider-apply-card">
        <div className="provider-apply-notice">
          <strong>복수 카테고리 신청</strong>
          <span>선택한 카테고리는 각각 별도 신청번호와 서류 묶음으로 관리자에게 전달됩니다.</span>
        </div>

        <div className="provider-apply-steps">
          {STEPS.map((item, index) => (
            <span
              className={index === step ? 'active' : index < step ? 'done' : ''}
              key={item}
            >
              {item}
            </span>
          ))}
        </div>

        {step === 0 && categoriesQuery.isLoading && (
          <div className="provider-apply-category-grid">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton borderRadius={8} height={64} key={index} />
            ))}
          </div>
        )}

        {step === 0 && categoriesQuery.isError && (
          <p className="provider-apply-error">서비스 카테고리를 불러오지 못했습니다.</p>
        )}

        {step === 0 && categoriesQuery.data && (
          <div className="provider-apply-category-grid">
            {categoriesQuery.data.map((category) => {
              const isSelected = selectedCategories.some((item) => item.catSn === category.catSn);
              const application = latestApplicationByCategory.get(Number(category.catSn));

              return (
                <button
                  className={isSelected ? 'active' : ''}
                  disabled={unavailable(category)}
                  key={category.catSn}
                  onClick={() => toggleCategory(category)}
                  type="button"
                >
                  {category.catNm}
                  <small>{application
                    ? statusLabel(application.statusCode, application.statusName)
                    : '신청 가능'}</small>
                </button>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div className="provider-apply-account">
            <div>
              <strong>정산 계좌 정보</strong>
              <p>서비스 완료 후 정산·환전 안내에 사용할 계좌 정보입니다. 마이페이지에 등록된 계좌를 그대로 사용합니다.</p>
            </div>

            {profileQuery.isLoading && (
              <p className="provider-apply-demo-note">등록된 계좌 정보를 불러오는 중입니다.</p>
            )}

            {!profileQuery.isLoading && hasSettlementAccount && (
              <p className="provider-apply-demo-note">
                {profileQuery.data.bankName} {profileQuery.data.accountNo} 계좌로 정산됩니다.
                계좌를 바꾸시려면 <Link className="provider-apply-inline-link" to="/user/mypage/profile">마이페이지</Link>에서 먼저 수정해 주세요.
              </p>
            )}

            {!profileQuery.isLoading && !hasSettlementAccount && (
              <p className="provider-apply-error">
                정산 계좌가 아직 등록되지 않았습니다.
                {' '}
                <Link className="provider-apply-inline-link" to="/user/mypage/profile">마이페이지</Link>에서 계좌를 먼저 등록해 주세요.
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="provider-apply-files">
            {selectedCategories.map((category) => (
              <div className="provider-apply-file-group" key={category.catSn}>
                <strong>{category.catNm} 신청 서류</strong>
                {DOCUMENTS.map((document) => {
                  const key = fileKey(category.catSn, document.code);
                  const uploaded = uploadedFiles[key];
                  const uploadLabel = uploadingKey === key
                    ? '업로드 중...'
                    : uploaded?.fileName ?? '이미지 파일 선택';

                  return (
                    <label className={`provider-apply-upload${uploaded ? ' is-uploaded' : ''}`} key={document.code}>
                      <strong>{document.label}</strong>
                      {uploaded?.previewUrl ? (
                        <img alt={`${document.label} 미리보기`} src={uploaded.previewUrl} />
                      ) : (
                        <span className="provider-apply-upload__placeholder">{uploadingKey === key ? '업로드 중...' : '이미지 선택'}</span>
                      )}
                      <span className="provider-apply-upload__name">{uploadLabel}</span>
                      <input
                        accept="image/*"
                        disabled={uploadingKey === key || submitMutation.isPending}
                        onChange={(event) => (
                          uploadDocument(category, document, event.target.files?.[0])
                        )}
                        type="file"
                      />
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {error && <p className="provider-apply-error">{error}</p>}

        <div className="provider-apply-actions">
          <button
            className="btn btn-outline"
            disabled={step === 0 || submitMutation.isPending}
            onClick={() => setStep(step - 1)}
            type="button"
          >
            이전
          </button>
          <button
            className="btn btn-primary"
            disabled={submitMutation.isPending
              || (step === 0 && categoriesQuery.isLoading)
              || (step === 1 && (profileQuery.isLoading || !hasSettlementAccount))}
            onClick={next}
            type="button"
          >
            {step === 2 ? `${selectedCategories.length}개 카테고리 신청하기` : '다음'}
          </button>
        </div>
      </section>
    </ContentPageShell>
  );
};

export default ProviderApplyPage;
