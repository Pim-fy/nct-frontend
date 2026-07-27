import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '@api/categoryApi';
import { uploadImage } from '@api/fileApi';
import PageMeta from '@components/admin/PageMeta';
import { ContentPageHeader, ContentPageShell } from '@components/content/ContentUi';
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
  const [settlementAccount, setSettlementAccount] = useState({
    bankName: '',
    accountNo: '',
    accountHolder: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploadingKey, setUploadingKey] = useState('');
  const applicationsQuery = useMyProviderApplications();
  const submitMutation = useSubmitProviderApplication();
  const categoriesQuery = useQuery({
    queryKey: ['provider-service-categories', SERVICE_DOMAIN_CD],
    queryFn: () => getCategories(SERVICE_DOMAIN_CD)
      .then((response) => response.data.filter((category) => category.catParentSn !== null)),
  });

  const applications = useMemo(() => applicationsQuery.data ?? [], [applicationsQuery.data]);
  const states = useMemo(
    () => Object.fromEntries(applications.map((item) => [
      item.categorySn,
      statusLabel(item.statusCode, item.statusName),
    ])),
    [applications],
  );
  const unavailable = (category) => ['심사 대기', '승인됨'].includes(states[category.catSn]);

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

  const changeSettlementAccount = (field) => (event) => {
    setSettlementAccount((current) => ({ ...current, [field]: event.target.value }));
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
      setUploadedFiles((current) => ({
        ...current,
        [key]: {
          categorySn: category.catSn,
          fileTypeCode: document.code,
          flSn: uploaded.flSn,
          fileName: file.name,
        },
      }));
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
      <ContentPageHeader
        description="여러 서비스 카테고리를 함께 선택할 수 있으며, 제출 뒤에는 카테고리별로 따로 심사됩니다."
        eyebrow="담당자 7 · F-PROV-002/003/006/007"
        title="제공자 권한 신청"
      />

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
          <p className="provider-apply-demo-note">서비스 카테고리를 불러오는 중입니다.</p>
        )}

        {step === 0 && categoriesQuery.isError && (
          <p className="provider-apply-error">서비스 카테고리를 불러오지 못했습니다.</p>
        )}

        {step === 0 && categoriesQuery.data && (
          <div className="provider-apply-category-grid">
            {categoriesQuery.data.map((category) => {
              const isSelected = selectedCategories.some((item) => item.catSn === category.catSn);

              return (
                <button
                  className={isSelected ? 'active' : ''}
                  disabled={unavailable(category)}
                  key={category.catSn}
                  onClick={() => toggleCategory(category)}
                  type="button"
                >
                  {category.catNm}
                  <small>{states[category.catSn] ?? '신청 가능'}</small>
                </button>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div className="provider-apply-account">
            <div>
              <strong>정산 계좌 정보</strong>
              <p>서비스 완료 후 정산·환전 안내에 사용할 계좌 정보입니다.</p>
            </div>

            {/* 담당자 7 · F-PROV-002/003 임시 UI: 계좌 저장 API가 아직 없어서 화면 입력만 받습니다.
                최종 교체 대상: USERS.USR_BANK_NM / USR_ACNT_NO 저장 API가 확정되면 이 값을 저장 요청에 연결합니다. */}
            <label>
              은행명
              <input
                onChange={changeSettlementAccount('bankName')}
                placeholder="예: 국민은행"
                value={settlementAccount.bankName}
              />
            </label>
            <label>
              계좌번호
              <input
                inputMode="numeric"
                onChange={changeSettlementAccount('accountNo')}
                placeholder="숫자만 입력"
                value={settlementAccount.accountNo}
              />
            </label>
            <label>
              예금주
              <input
                onChange={changeSettlementAccount('accountHolder')}
                placeholder="본인 명의 예금주"
                value={settlementAccount.accountHolder}
              />
            </label>
            <p className="provider-apply-demo-note">
              현재는 계좌 저장 API 대기 상태라 신청 제출값에는 포함하지 않습니다.
              API가 확정되면 이 단계에서 저장/검증을 연결합니다.
            </p>
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
                  const uploadLabel = uploaded
                    ? uploaded.fileName
                    : uploadingKey === key
                      ? '업로드 중...'
                      : '이미지 파일 선택';

                  return (
                    <label className="provider-apply-upload" key={document.code}>
                      {document.label}
                      <span>{uploadLabel}</span>
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
            disabled={submitMutation.isPending || (step === 0 && categoriesQuery.isLoading)}
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
