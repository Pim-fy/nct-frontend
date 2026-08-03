import { useMemo, useState } from 'react';
import { PencilLine, Plus, Save, X } from 'lucide-react';
import AdminPagination from '@components/admin/AdminPagination';
import AdminTable from '@components/admin/AdminTable';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import MockupAdminStatusBadge from '@components/admin/mockup/MockupAdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import { useAdminCategories, useSaveAdminCategory } from '@hooks/useAdminCategories';
import useClientPagination from '@hooks/useClientPagination';
import '../notice/adminContentPages.css';
import './adminCategoryPage.css';

const DOMAINS = [
  { code: 'CATC0001', label: '상품 카테고리' },
  { code: 'CATC0002', label: '서비스 카테고리' },
];
const EMPTY_FORM = { name: '', sortNo: 10, professional: false, active: true };
const PAGE_SIZE = 20;

/** 담당자 7 · F-COM-003: 상품·서비스 카테고리를 분리해 등록·수정·사용 중지하는 화면이다. */
const AdminCategoryPage = () => {
  const [domainCode, setDomainCode] = useState(DOMAINS[0].code);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [feedback, setFeedback] = useState('');
  const categoriesQuery = useAdminCategories(domainCode);
  const saveMutation = useSaveAdminCategory();
  const {
    page,
    pagedItems: pagedCategories,
    resetPage,
    setPage,
    startIndex,
    totalItems,
    totalPages,
  } = useClientPagination(categoriesQuery.data ?? [], PAGE_SIZE);

  const reset = () => { setEditingId(null); setForm(EMPTY_FORM); setFeedback(''); };
  const changeDomain = (code) => { setDomainCode(code); resetPage(); reset(); };
  const edit = (category) => {
    setEditingId(category.categorySn);
    setForm({
      name: category.name,
      sortNo: category.sortNo,
      professional: category.professional,
      active: category.active,
    });
    setFeedback('');
  };
  const change = ({ target }) => setForm((current) => ({
    ...current,
    [target.name]: target.type === 'checkbox' ? target.checked : target.value,
  }));
  const submit = async (event) => {
    event.preventDefault();
    setFeedback('');
    try {
      await saveMutation.mutateAsync({
        domainCode,
        categorySn: editingId,
        payload: {
          ...form,
          name: form.name.trim(),
          sortNo: Number(form.sortNo),
          professional: domainCode === 'CATC0002' && form.professional,
        },
      });
      reset();
      setFeedback('카테고리를 저장했습니다. 연결된 화면에도 같은 값이 사용됩니다.');
    } catch (error) {
      setFeedback(error.response?.data?.message || '저장하지 못했습니다. 입력값과 중복 이름을 확인해 주세요.');
    }
  };

  const columns = useMemo(() => [
    { key: 'index', label: '번호', render: (_, __, idx) => startIndex + idx + 1 },
    { key: 'name', label: '이름', render: (value) => <strong>{value}</strong> },
    { key: 'professional', label: '전문 서비스', render: (value) => (value ? '예' : '아니오') },
    {
      key: 'active', label: '상태',
      render: (value) => <MockupAdminStatusBadge tone={value ? 'success' : 'neutral'}>{value ? '사용 중' : '사용 중지'}</MockupAdminStatusBadge>,
    },
    {
      key: 'manage', label: '관리',
      render: (_, row) => <button className="btn btn-outline" onClick={() => edit(row)} type="button"><PencilLine /> 수정</button>,
    },
  ], [startIndex]);

  return (
    <div className="admin-content-page admin-category-page">
      <PageMeta title="카테고리 관리" />
      <MockupAdminPageHeader
        action={<button className="btn btn-primary" onClick={reset} type="button"><Plus /> 새 카테고리</button>}
        description="상품과 서비스 카테고리를 분리해 관리합니다. 사용 중지는 기존 상품·요청의 연결을 보존합니다."
        eyebrow="F-COM-003 · REQ-COM-003"
        title="카테고리 관리"
      />

      <div className="admin-category-tabs" role="tablist" aria-label="카테고리 종류">
        {DOMAINS.map(({ code, label }) => (
          <button className={domainCode === code ? 'is-active' : ''} key={code}
            onClick={() => changeDomain(code)} role="tab" type="button">{label}</button>
        ))}
      </div>

      <form className="card admin-category-form" onSubmit={submit}>
        <div className="admin-category-form__heading">
          <strong>{editingId ? '카테고리 수정' : '새 카테고리 등록'}</strong>
          {editingId && <button className="btn btn-outline" onClick={reset} type="button"><X /> 취소</button>}
        </div>
        <label><span>이름</span><input maxLength="100" name="name" onChange={change} required value={form.name} /></label>
        <label><span>표시 순서</span><input max="9999" min="1" name="sortNo" onChange={change} required type="number" value={form.sortNo} /></label>
        {domainCode === 'CATC0002' && <label className="admin-category-check"><input checked={form.professional} name="professional" onChange={change} type="checkbox" /> 전문 서비스</label>}
        <label className="admin-category-check"><input checked={form.active} name="active" onChange={change} type="checkbox" /> 사용 중</label>
        <button className="btn btn-primary" disabled={saveMutation.isPending} type="submit"><Save /> {saveMutation.isPending ? '저장 중' : '저장'}</button>
      </form>

      {feedback && <p className={`admin-category-feedback${feedback.includes('저장했습니다') ? ' is-success' : ''}`}>{feedback}</p>}
      {categoriesQuery.isError && <div className="card admin-content-state is-error">카테고리를 불러오지 못했습니다.</div>}
      {!categoriesQuery.isError && (
        <section className="card admin-category-list">
          {!categoriesQuery.isLoading && (
            <div className="admin-notice-list__summary"><p>총 <strong>{totalItems}</strong>개</p><small>표시 순서가 작은 항목부터 노출됩니다.</small></div>
          )}
          <div className="admin-table-scroll">
            <AdminTable
              columns={columns}
              data={pagedCategories}
              emptyMessage="등록된 카테고리가 없습니다."
              loading={categoriesQuery.isLoading}
              rowKey={(category) => category.categorySn}
            />
          </div>
          <AdminPagination
            ariaLabel="카테고리 목록 페이지 이동"
            disabled={categoriesQuery.isFetching}
            onPageChange={setPage}
            page={page}
            totalPages={totalPages}
          />
        </section>
      )}
    </div>
  );
};

export default AdminCategoryPage;
