import { useMemo, useState } from 'react';
import { FileText, Search, X } from 'lucide-react';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import MockupAdminStatusBadge from '@components/admin/mockup/MockupAdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import '../notice/adminContentPages.css';
import './adminProviderApprovalPage.css';
import { decideProviderApplicationPreview, getProviderApplicationPreviews } from '../../provider/providerApplicationPreview';

// 담당자 7 · F-PROV-002/003/007/012~014: UI 흐름 검수용 임시 심사 화면입니다.
// 실제 PROVIDER_APPLY API가 준비되면 이 임시 저장소만 Query/API 계층으로 교체합니다.
const FILTERS = { status: ['전체', '심사 대기', '승인됨', '반려됨'], category: ['전체', '이사', '청소', '레슨', '설치·수리', '인테리어'], type: ['전체', '신규', '추가', '갱신'] };
const EMPTY_FILTER = { status: '전체', category: '전체', type: '전체', keyword: '' };

const AdminProviderApprovalPage = () => {
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [applies, setApplies] = useState(getProviderApplicationPreviews);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const filtered = useMemo(() => {
    const keyword = filter.keyword.trim().toLowerCase();
    return applies.filter((item) => (filter.status === '전체' || item.status === filter.status)
      && (filter.category === '전체' || item.category === filter.category)
      && (filter.type === '전체' || item.type === filter.type)
      && (!keyword || `${item.id} ${item.name}`.toLowerCase().includes(keyword)));
  }, [applies, filter]);
  const change = ({ target }) => setFilter((current) => ({ ...current, [target.name]: target.value }));
  const decide = (decision) => {
    if (decision === 'reject' && !rejectReason.trim()) return;
    setSelected(decideProviderApplicationPreview({ id: selected.id, decision, reason: rejectReason }));
    setApplies(getProviderApplicationPreviews());
    setRejectReason('');
  };

  return <div className="admin-content-page admin-provider-approval-page">
    <PageMeta title="제공자 심사" />
    <MockupAdminPageHeader action={<MockupAdminStatusBadge tone="warning">브라우저 데모 데이터</MockupAdminStatusBadge>} description="신청 화면에서 만든 임시 신청을 승인·반려해 신청 상태 화면까지 연결해 볼 수 있습니다." eyebrow="담당자 7 · F-PROV-002/003/007" title="제공자 심사" />
    <section className="card admin-provider-filter" aria-label="제공자 심사 검색 및 필터">
      {['status', 'category', 'type'].map((name) => <label key={name}>{name === 'status' ? '심사 상태' : name === 'category' ? '카테고리' : '신청 유형'}<select name={name} onChange={change} value={filter[name]}>{FILTERS[name].map((item) => <option key={item}>{item}</option>)}</select></label>)}
      <label className="admin-provider-filter__search">검색<div><Search aria-hidden="true" /><input name="keyword" onChange={change} placeholder="신청번호 또는 닉네임" value={filter.keyword} /></div></label>
    </section>
    <section className="card admin-notice-list admin-provider-list"><div className="admin-notice-list__summary"><p>조건에 맞는 신청 <strong>{filtered.length}</strong>건</p><small>서류 원문은 계약 연결 전까지 표시하지 않습니다.</small></div><div className="admin-table-scroll"><table><thead><tr><th>신청번호</th><th>닉네임</th><th>카테고리</th><th>신청유형</th><th>신청일</th><th>심사 상태</th><th>서류</th><th>관리</th></tr></thead><tbody>
      {filtered.map((item) => <tr key={item.id}><td>{item.id}</td><td><strong>{item.name}</strong></td><td>{item.category}</td><td>{item.type}</td><td>{item.date}</td><td><MockupAdminStatusBadge tone={item.tone}>{item.status}</MockupAdminStatusBadge></td><td>{item.files}건</td><td><button className="btn btn-outline" onClick={() => { setSelected(item); setRejectReason(''); }} type="button">{item.status === '심사 대기' ? '심사하기' : '상세보기'}</button></td></tr>)}
      {!filtered.length && <tr><td className="admin-notice-list__empty" colSpan="8">조건에 맞는 임시 신청 자료가 없습니다.</td></tr>}
    </tbody></table></div></section>
    {selected && <section className="card admin-provider-detail" aria-live="polite"><div><span>심사 상세 · 데모</span><h2>{selected.name}</h2><p>{selected.reason ? `반려 사유: ${selected.reason}` : selected.status === '승인됨' ? '승인 결과가 신청 상태 화면에 반영되었습니다.' : '제출 내용을 검토한 뒤 승인 또는 반려할 수 있습니다.'}</p></div><button aria-label="상세 닫기" className="btn btn-outline" onClick={() => setSelected(null)} type="button"><X /></button><dl><dt>신청번호 / 유형</dt><dd>{selected.id} / {selected.type}</dd><dt>신청 카테고리 / 지역</dt><dd>{selected.category} / {selected.area}</dd><dt>제출 서류</dt><dd><FileText aria-hidden="true" /> {selected.files}건 · 파일 조회 계약 연결 대기</dd><dt>심사 상태</dt><dd><MockupAdminStatusBadge tone={selected.tone}>{selected.status}</MockupAdminStatusBadge></dd></dl>{selected.status === '심사 대기' && <><label className="admin-provider-detail__reason">반려 사유<textarea onChange={(event) => setRejectReason(event.target.value)} placeholder="반려 또는 보완 요청 사유를 입력합니다." value={rejectReason} /></label><div className="admin-provider-detail__actions"><button className="btn btn-primary" onClick={() => decide('approve')} type="button">승인</button><button className="btn btn-outline" disabled={!rejectReason.trim()} onClick={() => decide('reject')} type="button">반려</button></div></>}<p className="admin-provider-detail__notice">데모 동작입니다. 실제 API 연결 시 관리자 권한, 대상 상태, 반려 사유, 감사 기록을 서버에서 검증합니다.</p></section>}
  </div>;
};
export default AdminProviderApprovalPage;
