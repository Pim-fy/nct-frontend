import { useMemo, useState } from 'react';
import { RotateCcw, Search, X } from 'lucide-react';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import MockupAdminStatusBadge from '@components/admin/mockup/MockupAdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import '../notice/adminContentPages.css';
import './adminServiceRequestPage.css';

/**
 * 담당자 7 · 관리자 서비스 요청 관리 목업 어댑터입니다.
 * `42_services.html`의 목록·필터·상세 구조를 공통 관리자 레이아웃에 맞춰 옮겼습니다.
 * 실제 SERVICE_REQUEST/견적 API 계약이 확정되면 아래 SAMPLE_REQUESTS만 Query 훅으로 교체합니다.
 */
const SAMPLE_REQUESTS = [
  { id: 'SVC-2607-001', title: '입주 청소 견적 요청', category: '청소', area: '서울', requester: '깨끗한집', provider: '-', quotes: 2, amount: '-', status: '견적대기', date: '2026-07-17', tone: 'warning', note: '희망일 2026-07-23 · 24평 아파트' },
  { id: 'SVC-2607-002', title: '원룸 이사 도움', category: '이사', area: '경기', requester: '이사준비', provider: '빠른이사', quotes: 3, amount: '180,000원', status: '진행중', date: '2026-07-16', tone: 'info', note: '희망일 2026-07-20 · 소형 이사' },
  { id: 'SVC-2607-003', title: '에어컨 설치·수리', category: '설치·수리', area: '인천', requester: '여름준비', provider: '설치마스터', quotes: 1, amount: '95,000원', status: '진행중', date: '2026-07-15', tone: 'info', note: '벽걸이 에어컨 1대 · 방문 일정 협의' },
  { id: 'SVC-2607-004', title: '피아노 레슨 4회', category: '레슨', area: '서울', requester: '초보피아노', provider: '뮤직쌤', quotes: 4, amount: '160,000원', status: '완료', date: '2026-07-12', tone: 'success', note: '완료일 2026-07-16 · 리뷰 작성 대기' },
  { id: 'SVC-2607-005', title: '거실 부분 인테리어', category: '인테리어', area: '부산', requester: '새집꾸미기', provider: '-', quotes: 0, amount: '-', status: '분쟁', date: '2026-07-11', tone: 'danger', note: '거래 문제 처리 계약 연결 전 · 운영 확인 필요' },
];

const EMPTY_FILTER = { category: '전체', status: '전체', area: '전체', keyword: '' };
const CATEGORY_OPTIONS = ['전체', '이사', '청소', '레슨', '설치·수리', '인테리어'];
const STATUS_OPTIONS = ['전체', '견적대기', '진행중', '완료', '분쟁'];
const AREA_OPTIONS = ['전체', '서울', '경기', '인천', '부산'];

const AdminServiceRequestPage = () => {
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [selected, setSelected] = useState(null);
  const requests = useMemo(() => {
    const keyword = filter.keyword.trim().toLowerCase();
    return SAMPLE_REQUESTS.filter((item) => (
      (filter.category === '전체' || item.category === filter.category)
      && (filter.status === '전체' || item.status === filter.status)
      && (filter.area === '전체' || item.area === filter.area)
      && (!keyword || `${item.id} ${item.title} ${item.requester} ${item.provider}`.toLowerCase().includes(keyword))
    ));
  }, [filter]);
  const change = ({ target }) => setFilter((current) => ({ ...current, [target.name]: target.value }));
  const summary = (status) => SAMPLE_REQUESTS.filter((item) => status.includes(item.status)).length;

  return (
    <div className="admin-content-page admin-service-page">
      <PageMeta title="서비스 요청 관리" />
      <MockupAdminPageHeader
        action={<MockupAdminStatusBadge tone="warning">임시 데이터 · 읽기 전용</MockupAdminStatusBadge>}
        description="목업의 운영 목록을 먼저 확인하는 화면입니다. 상태 변경·분쟁 처리·견적 관리는 실제 서비스 거래 API가 연결된 뒤 활성화합니다."
        eyebrow="담당자 7 · 관리자 운영 화면"
        title="서비스 요청 관리"
      />

      <section className="admin-service-summary" aria-label="서비스 요청 요약">
        {[
          ['공개 요청', summary(['견적대기']), '견적 대기 포함', 'primary'],
          ['진행중 서비스', summary(['진행중']), '상세 관리 대상', 'info'],
          ['완료 서비스', summary(['완료']), '목록 요약 확인', 'success'],
          ['분쟁·보류', summary(['분쟁']), '신고·정산 계약 필요', 'danger'],
        ].map(([label, value, hint, tone]) => <article className={`card admin-service-stat admin-service-stat--${tone}`} key={label}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>)}
      </section>

      <section className="card admin-service-filter" aria-label="서비스 요청 검색">
        <label>카테고리<select name="category" onChange={change} value={filter.category}>{CATEGORY_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>상태<select name="status" onChange={change} value={filter.status}>{STATUS_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>지역<select name="area" onChange={change} value={filter.area}>{AREA_OPTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="admin-service-filter__search">검색<div><Search aria-hidden="true" /><input name="keyword" onChange={change} placeholder="요청명, 요청자, 제공자, 요청번호" value={filter.keyword} /></div></label>
        <button className="btn btn-outline" onClick={() => setFilter(EMPTY_FILTER)} type="button"><RotateCcw /> 초기화</button>
      </section>

      <section className="card admin-notice-list admin-service-list">
        <div className="admin-notice-list__summary"><p>조건에 맞는 서비스 요청 <strong>{requests.length}</strong>건</p><small>표시 값은 연동 전 확인용 예시입니다.</small></div>
        <div className="admin-table-scroll"><table><thead><tr><th>요청번호</th><th>요청명</th><th>카테고리</th><th>지역</th><th>요청자</th><th>제공자</th><th>견적</th><th>금액</th><th>상태</th><th>관리</th></tr></thead><tbody>
          {requests.map((item) => <tr key={item.id}><td>{item.id}</td><td className="admin-notice-list__title"><strong>{item.title}</strong></td><td>{item.category}</td><td>{item.area}</td><td>{item.requester}</td><td>{item.provider}</td><td>{item.quotes}건</td><td>{item.amount}</td><td><MockupAdminStatusBadge tone={item.tone}>{item.status}</MockupAdminStatusBadge></td><td><button className="btn btn-outline" onClick={() => setSelected(item)} type="button">상세</button></td></tr>)}
          {!requests.length && <tr><td className="admin-notice-list__empty" colSpan="10">조건에 맞는 임시 자료가 없습니다.</td></tr>}
        </tbody></table></div>
      </section>

      {selected && <section className="card admin-service-detail" aria-live="polite"><div><span>요청 상세 · 읽기 전용</span><h2>{selected.title}</h2><p>{selected.note}</p></div><button aria-label="상세 닫기" className="btn btn-outline" onClick={() => setSelected(null)} type="button"><X /></button><dl><dt>요청번호</dt><dd>{selected.id}</dd><dt>요청자 / 제공자</dt><dd>{selected.requester} / {selected.provider}</dd><dt>견적 / 금액</dt><dd>{selected.quotes}건 / {selected.amount}</dd><dt>등록일 / 상태</dt><dd>{selected.date} / <MockupAdminStatusBadge tone={selected.tone}>{selected.status}</MockupAdminStatusBadge></dd></dl><p className="admin-service-detail__notice">실제 API 연결 후 이 영역에 견적·분쟁·정산 이력과 권한 검증을 추가합니다.</p></section>}
    </div>
  );
};

export default AdminServiceRequestPage;
