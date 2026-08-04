import { useMemo, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import AdminModal from '@components/admin/AdminModal';
import AdminPagination from '@components/admin/AdminPagination';
import AdminSectionCard from '@components/admin/AdminSectionCard';
import AdminTable from '@components/admin/AdminTable';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import useClientPagination from '@hooks/useClientPagination';
import '../notice/adminContentPages.css';
import './adminServiceRequestPage.css';

/** 담당자 7: 서비스 거래 API가 제공되기 전, 관리자 흐름을 확인하는 임시 읽기 전용 목록입니다. */
const SAMPLE_REQUESTS = [
  {
    id: 'SVC-2607-001',
    title: '입주 청소 견적 요청',
    category: '청소',
    area: '서울',
    requester: '김집준비',
    provider: '-',
    quotes: 2,
    amount: '-',
    status: '견적대기',
    date: '2026-07-17',
    tone: 'warning',
    note: '희망일 2026-07-23 · 24평 아파트',
  },
  {
    id: 'SVC-2607-002',
    title: '원룸 이사 요청',
    category: '이사',
    area: '경기',
    requester: '이사준비',
    provider: '빠른이사',
    quotes: 3,
    amount: '180,000원',
    status: '진행중',
    date: '2026-07-16',
    tone: 'info',
    note: '희망일 2026-07-20 · 소형 이사',
  },
  {
    id: 'SVC-2607-003',
    title: '에어컨 설치·수리',
    category: '설치·수리',
    area: '인천',
    requester: '여름준비',
    provider: '설치마스터',
    quotes: 1,
    amount: '95,000원',
    status: '진행중',
    date: '2026-07-15',
    tone: 'info',
    note: '벽걸이 에어컨 1대 · 방문 일정 협의',
  },
];

const EMPTY_FILTER = { category: '전체', status: '전체', area: '전체', keyword: '' };
const PAGE_SIZE = 20;
const OPTIONS = {
  category: ['전체', '이사', '청소', '레슨', '설치·수리', '인테리어'],
  status: ['전체', '견적대기', '진행중', '완료', '분쟁'],
  area: ['전체', '서울', '경기', '인천', '부산'],
};

const AdminServiceRequestPage = () => {
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [selected, setSelected] = useState(null);
  const requests = useMemo(
    () => SAMPLE_REQUESTS.filter((item) => {
      const keyword = filter.keyword.trim().toLowerCase();
      const matchesFilters = ['category', 'status', 'area']
        .every((key) => filter[key] === '전체' || item[key] === filter[key]);
      const searchableText = `${item.id} ${item.title} ${item.requester} ${item.provider}`.toLowerCase();

      return matchesFilters && (!keyword || searchableText.includes(keyword));
    }),
    [filter],
  );
  const {
    page,
    pagedItems: pagedRequests,
    resetPage,
    setPage,
    totalItems,
    totalPages,
  } = useClientPagination(requests, PAGE_SIZE);

  const change = ({ target }) => {
    setFilter((current) => ({ ...current, [target.name]: target.value }));
    resetPage();
  };
  const resetFilters = () => {
    setFilter(EMPTY_FILTER);
    resetPage();
  };

  const columns = useMemo(() => [
    { key: 'id', label: '요청번호' },
    { key: 'title', label: '요청명', className: 'admin-notice-list__title', render: (value) => <strong>{value}</strong> },
    { key: 'category', label: '카테고리' },
    { key: 'area', label: '지역' },
    { key: 'requester', label: '요청자' },
    { key: 'provider', label: '제공자' },
    { key: 'quotes', label: '견적', render: (value) => `${value}건` },
    { key: 'amount', label: '금액' },
    {
      key: 'status', label: '상태',
      render: (value, row) => <AdminStatusBadge tone={row.tone}>{value}</AdminStatusBadge>,
    },
    {
      key: 'manage', label: '관리',
      render: (_, row) => <button className="btn btn-outline" onClick={() => setSelected(row)} type="button">상세보기</button>,
    },
  ], []);

  return (
    <div className="admin-content-page admin-service-page">
      <PageMeta title="서비스 요청 관리" />
      <AdminPageHeader
        action={<AdminStatusBadge tone="warning">임시 데이터 · 읽기 전용</AdminStatusBadge>}
        description="서비스 요청 흐름을 목록에서 먼저 확인합니다. 실제 요청·견적·거래 API가 연결되면 데이터만 교체합니다."
        eyebrow="담당자 7 · 관리자 운영 화면"
        title="서비스 요청 관리"
      />

      <section className="card admin-service-filter" aria-label="서비스 요청 검색">
        {Object.entries(OPTIONS).map(([name, values]) => (
          <label key={name}>
            {({ category: '카테고리', status: '상태', area: '지역' })[name]}
            <select name={name} onChange={change} value={filter[name]}>
              {values.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        ))}
        <label className="admin-service-filter__search">
          검색
          <div>
            <Search aria-hidden="true" />
            <input
              name="keyword"
              onChange={change}
              placeholder="요청명 · 요청자 · 제공자 · 요청번호"
              value={filter.keyword}
            />
          </div>
        </label>
        <button className="btn btn-outline" onClick={resetFilters} type="button">
          <RotateCcw />
          초기화
        </button>
      </section>

      <AdminSectionCard
        action={<span>총 {totalItems}건</span>}
        className="admin-notice-list admin-service-list"
        description="서비스 요청·견적·거래 API가 연결되면 목록 데이터만 교체합니다."
        title="서비스 요청 목록"
      >
        <div className="admin-table-scroll">
          <AdminTable
            columns={columns}
            data={pagedRequests}
            emptyMessage="조건에 맞는 임시 자료가 없습니다."
            rowKey={(item) => item.id}
          />
        </div>
        <AdminPagination
          ariaLabel="서비스 요청 목록 페이지 이동"
          onPageChange={setPage}
          page={page}
          totalPages={totalPages}
        />
      </AdminSectionCard>

      {selected && (
        <AdminModal onClose={() => setSelected(null)} title="서비스 요청 상세">
          <section className="admin-service-detail">
            <div>
              <span>요청 상세 · 읽기 전용</span>
              <h2>{selected.title}</h2>
              <p>{selected.note}</p>
            </div>
            <dl>
              <dt>요청번호</dt>
              <dd>{selected.id}</dd>

              <dt>요청자 / 제공자</dt>
              <dd>{selected.requester} / {selected.provider}</dd>

              <dt>견적 / 금액</dt>
              <dd>{selected.quotes}건 / {selected.amount}</dd>

              <dt>등록일 / 상태</dt>
              <dd>
                {selected.date} / <AdminStatusBadge tone={selected.tone}>{selected.status}</AdminStatusBadge>
              </dd>
            </dl>
            <p className="admin-service-detail__notice">
              실제 API 연결 후 견적·분쟁·정산 이력과 권한 검증을 추가합니다.
            </p>
          </section>
        </AdminModal>
      )}
    </div>
  );
};

export default AdminServiceRequestPage;
