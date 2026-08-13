import { ActionButton } from '@components/common/ui';
import { useMyProviderApplications } from '@hooks/useProviderApplications';
import './providerApplicationMulti.css';

const label = (item) => ({
  PRVC0002: '심사 대기',
  PRVC0003: '승인됨',
  PRVC0004: '반려됨',
})[item.statusCode] ?? item.statusName ?? '확인 필요';

/** 담당자 7 · F-PROV-012/014: 마이페이지에서 보여주는 카테고리별 제공자 신청 상태 카드입니다. */
const ProviderApplicationStatusCard = () => {
  const { data = [], isError, isLoading } = useMyProviderApplications();

  return (
    <section className="provider-status-preview">
      <span>제공자 권한</span>
      <h2>{isLoading ? '확인 중' : data.length ? `${data.length}개 신청` : '미신청'}</h2>
      <p>
        {data.length
          ? '카테고리별 심사 결과를 확인하거나 권한을 추가 신청할 수 있습니다.'
          : '첫 카테고리를 선택해 제공자 권한을 신청할 수 있습니다.'}
      </p>

      {isError && (
        <p className="provider-apply-error">신청 상태를 불러오지 못했습니다.</p>
      )}

      {data.length > 0 && (
        <dl>
          {data.map((item) => (
            <div key={item.applicationSn}>
              <dt>{item.categoryName}</dt>
              <dd>{label(item)}</dd>
            </div>
          ))}
        </dl>
      )}

      <ActionButton tone="outline" to="/provider/apply">제공자 권한 신청</ActionButton>
    </section>
  );
};

export default ProviderApplicationStatusCard;
