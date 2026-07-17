import { Link } from 'react-router-dom';
import { getMyProviderApplicationPreviews } from './providerApplicationPreview';
import './providerApplicationMulti.css';

/** 담당자 7 · F-PROV-012/014: 담당자3 MyPage에 삽입할 카테고리별 제공자 신청 상태 카드입니다. */
const ProviderApplicationStatusCard = () => {
  const items = getMyProviderApplicationPreviews();
  return <section className="provider-status-preview"><span>제공자 권한</span><h2>{items.length ? `${items.length}개 신청` : '미신청'}</h2><p>{items.length ? '카테고리별 심사 결과를 확인하거나 권한을 추가 신청할 수 있습니다.' : '첫 카테고리를 선택해 제공자 권한을 신청할 수 있습니다.'}</p>{items.length > 0 && <dl>{items.map((item) => <div key={item.id}><dt>{item.category}</dt><dd>{item.status}</dd></div>)}</dl>}<Link className="btn btn-outline" to="/provider/apply">제공자 권한 신청</Link></section>;
};
export default ProviderApplicationStatusCard;
