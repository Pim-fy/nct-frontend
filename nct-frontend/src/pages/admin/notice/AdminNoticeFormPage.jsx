import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EyeOff, Save, Trash2 } from 'lucide-react';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import MockupAdminStatusBadge from '@components/admin/mockup/MockupAdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import {
  useAdminNoticeDetail,
  useAdminNoticeOptions,
  useCreateAdminNotice,
  useDeleteAdminNotice,
  useHideAdminNotice,
  useUpdateAdminNotice,
} from '@hooks/useAdminNotices';
import './adminContentPages.css';

const FAQ_TYPE_CODE = 'NTCC0008';

const EMPTY_FORM = {
  typeCode: '',
  statusCode: 'NTCC0005',
  title: '',
  content: '',
  postingStartAt: '',
  postingEndAt: '',
  permanentPosting: true,
  expectedUpdatedAt: null,
  expectedRevision: null,
  pinned: false,
  changeReason: '',
};

const toDateTimeInput = (value) => value ? value.slice(0, 16) : '';
// 담당자 7 | F-OPS-023: 신규 공지의 게시 시작일시는 작성자가 보는 현재 날짜·시각으로 시작합니다.
const nowDateTimeInput = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const getErrorMessage = (error) => error?.response?.status === 409
  ? '다른 관리자가 먼저 변경했습니다. 목록에서 공지를 다시 열어 확인해 주세요.'
  : error?.response?.data?.message || '처리 중 오류가 발생했습니다.';
const formFromNotice = (notice) => ({
  typeCode: notice.typeCode,
  statusCode: notice.statusCode,
  title: notice.title,
  content: notice.content,
  postingStartAt: toDateTimeInput(notice.postingStartAt),
  postingEndAt: toDateTimeInput(notice.postingEndAt),
  permanentPosting: !notice.postingEndAt,
  expectedUpdatedAt: notice.updatedAt,
  expectedRevision: notice.revisionToken,
  pinned: notice.typeCode === FAQ_TYPE_CODE ? false : notice.pinned,
  changeReason: '',
});

/** 공지 신규 작성과 기존 공지 상세·수정을 한 화면 구조로 제공해 입력 규칙을 동일하게 유지합니다. */
const AdminNoticeFormPage = () => {
  const { noticeId: noticeIdParam } = useParams();
  const navigate = useNavigate();
  const isNew = noticeIdParam === undefined;
  const noticeId = Number(noticeIdParam);
  const isValidNoticeId = isNew || (Number.isSafeInteger(noticeId) && noticeId > 0);
  const [draft, setDraft] = useState(null);
  const [isEditing, setIsEditing] = useState(isNew);
  const [feedback, setFeedback] = useState('');
  const optionsQuery = useAdminNoticeOptions();
  const noticeQuery = useAdminNoticeDetail(isNew ? null : noticeId);
  const createMutation = useCreateAdminNotice();
  const updateMutation = useUpdateAdminNotice();
  const hideMutation = useHideAdminNotice();
  const deleteMutation = useDeleteAdminNotice();
  const isPending = createMutation.isPending || updateMutation.isPending
    || hideMutation.isPending || deleteMutation.isPending;

  const initialForm = isNew
    ? { ...EMPTY_FORM, postingStartAt: nowDateTimeInput(), typeCode: optionsQuery.data?.types?.[0]?.code ?? '' }
    : noticeQuery.data ? formFromNotice(noticeQuery.data) : EMPTY_FORM;
  const form = draft ?? initialForm;

  const changeField = (event) => {
    const { name, value, checked, type } = event.target;
    setDraft((current) => {
      const next = {
        ...(current ?? initialForm),
        [name]: type === 'checkbox' ? checked : value,
      };

      // 담당자 7 | F-OPS-023: 영구 게시를 선택하면 종료일을 비워 공개 필터가 계속 통과하도록 한다.
      if (name === 'permanentPosting' && checked) {
        next.postingEndAt = '';
      }
      if (name === 'typeCode' && value === FAQ_TYPE_CODE) {
        next.pinned = false;
      }
      return next;
    });
    setFeedback('');
  };

  const payload = () => {
    const { permanentPosting, ...noticeForm } = form;
    return {
      ...noticeForm,
      postingStartAt: form.postingStartAt || null,
      postingEndAt: permanentPosting ? null : form.postingEndAt || null,
    };
  };

  /** 담당자 7 | F-OPS-023: 저장 성공 시 신규 공지는 관리 목록으로, 실패 시 현재 입력 화면에 남깁니다. */
  const submit = async (event) => {
    event.preventDefault();
    setFeedback('');
    try {
      if (isNew) {
        await createMutation.mutateAsync(payload());
        setDraft(null);
        navigate('/admin/notices', { replace: true });
      } else {
        await updateMutation.mutateAsync({ noticeId, payload: payload() });
        setIsEditing(false);
        setDraft(null);
        setFeedback('공지가 수정되었습니다.');
      }
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  };

  const requireReason = () => {
    if (form.changeReason.trim()) return true;
    setFeedback('관리자 처리 사유를 입력해 주세요.');
    return false;
  };

  const hideNotice = async () => {
    if (!requireReason() || !window.confirm('이 공지를 사용자 화면에서 숨길까요?')) return;
    try {
      await hideMutation.mutateAsync({ noticeId, changeReason: form.changeReason.trim() });
      setDraft(null);
      setFeedback('공지가 숨김 처리되었습니다. 같은 요청을 다시 해도 중복 처리되지 않습니다.');
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  };

  const deleteNotice = async () => {
    if (!requireReason() || !window.confirm('이 공지를 관리 목록에서도 삭제할까요? 변경 사유는 감사로그에 기록됩니다.')) return;
    try {
      await deleteMutation.mutateAsync({ noticeId, changeReason: form.changeReason.trim() });
      navigate('/admin/notices', { replace: true });
    } catch (error) {
      setFeedback(getErrorMessage(error));
    }
  };

  if (!isValidNoticeId) {
    return <div className="card admin-content-state is-error">잘못된 공지 주소입니다.</div>;
  }
  if (!isNew && noticeQuery.isLoading) {
    return <div className="card admin-content-state">공지 상세를 불러오는 중입니다.</div>;
  }
  if (!isNew && noticeQuery.isError) {
    return <div className="card admin-content-state is-error">공지를 찾을 수 없거나 불러오지 못했습니다.</div>;
  }

  const notice = noticeQuery.data;
  const fieldsDisabled = !isEditing || isPending;
  const isFaq = form.typeCode === FAQ_TYPE_CODE;
  const previewTitle = form.title.trim() || '공지 제목을 입력해 주세요';
  return (
    <div className="admin-content-page">
      <PageMeta title={isNew ? '공지 작성' : '공지 상세'} />
      <MockupAdminPageHeader
        action={!isNew && (
          <MockupAdminStatusBadge tone={notice?.visibleNow ? 'success' : 'neutral'}>
            {notice?.visibleNow ? '사용자 화면 노출 중' : '현재 미노출'}
          </MockupAdminStatusBadge>
        )}
        description={isNew
          ? '공지 내용과 공개 조건을 입력합니다.'
          : '저장된 공지와 사용자 노출 상태를 확인합니다.'}
        eyebrow="F-OPS-023 · 관리자 전용"
        title={isNew ? '공지 작성' : '공지 상세'}
      />

      <form className="card admin-notice-form" onSubmit={submit}>
        {!isNew && (
          <div className="admin-notice-form__readonly-meta">
            <span><small>공지 번호</small><strong>{notice.noticeId}</strong></span>
            <span><small>작성자</small><strong>{notice.writerName}</strong></span>
            <span><small>조회수</small><strong>{notice.viewCount.toLocaleString('ko-KR')}</strong></span>
          </div>
        )}

        <div className="admin-notice-form__grid">
          <label>
            <span>공지 유형</span>
            <select
              disabled={fieldsDisabled}
              name="typeCode"
              onChange={changeField}
              required
              value={form.typeCode}
            >
              {(optionsQuery.data?.types ?? []).map((option) => (
                <option key={option.code} value={option.code}>{option.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>게시 상태</span>
            <select
              disabled={fieldsDisabled}
              name="statusCode"
              onChange={changeField}
              required
              value={form.statusCode}
            >
              {(optionsQuery.data?.statuses ?? []).map((option) => (
                <option key={option.code} value={option.code}>{option.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>게시 시작일시</span>
            <input
              disabled={fieldsDisabled}
              name="postingStartAt"
              onChange={changeField}
              type="datetime-local"
              value={form.postingStartAt}
            />
          </label>
          <label>
            <span className="admin-notice-form__end-label">
              게시 종료일시
              <span className="admin-notice-form__permanent-posting">
                <input
                  checked={form.permanentPosting}
                  disabled={fieldsDisabled}
                  name="permanentPosting"
                  onChange={changeField}
                  type="checkbox"
                />
                종료일 없음
              </span>
            </span>
            <input
              disabled={fieldsDisabled || form.permanentPosting}
              name="postingEndAt"
              onChange={changeField}
              required={!form.permanentPosting}
              type="datetime-local"
              value={form.postingEndAt}
            />
          </label>
        </div>

        <label className="admin-notice-form__full">
          <span>제목 <em>{form.title.length}/200</em></span>
          <input
            disabled={fieldsDisabled}
            maxLength={200}
            name="title"
            onChange={changeField}
            required
            value={form.title}
          />
        </label>
        <label className="admin-notice-form__full">
          <span>내용 <em>{form.content.length}/4000</em></span>
          <textarea
            disabled={fieldsDisabled}
            maxLength={4000}
            name="content"
            onChange={changeField}
            required
            rows="12"
            value={form.content}
          />
        </label>
        <label className="admin-notice-form__check">
          <input
            checked={form.pinned}
            disabled={fieldsDisabled || isFaq}
            name="pinned"
            onChange={changeField}
            type="checkbox"
          />
          중요 공지로 등록{isFaq && ' (FAQ는 선택 불가)'}
        </label>

        <section className="admin-notice-form__audit">
          <div><strong>관리자 처리 사유</strong><p>등록·수정·숨김·삭제 사유는 감사로그에 기록됩니다. 개인정보는 입력하지 마세요.</p></div>
          <textarea
            disabled={isPending}
            maxLength={500}
            name="changeReason"
            onChange={changeField}
            placeholder="예: 7월 정기점검 일정 공지"
            required={isEditing}
            rows="3"
            value={form.changeReason}
          />
        </section>

        <section className="admin-notice-preview" aria-label="사용자 공지 미리보기">
          <div><small>사용자 화면 미리보기</small><strong>{previewTitle}</strong><p>{form.content.trim() || '공지 내용이 이곳에 표시됩니다.'}</p></div>
          <div>
            <MockupAdminStatusBadge tone="info">
              {optionsQuery.data?.types?.find((item) => item.code === form.typeCode)?.name ?? '유형 선택'}
            </MockupAdminStatusBadge>
            {form.pinned && (
              <MockupAdminStatusBadge tone="warning">중요 공지</MockupAdminStatusBadge>
            )}
          </div>
        </section>

        {feedback && (
          <p className={`admin-notice-form__feedback${feedback.includes('되었습니다') ? ' is-success' : ''}`}>
            {feedback}
          </p>
        )}

        <div className="admin-notice-form__actions">
          <Link className="btn btn-outline" to="/admin/notices">목록으로</Link>
          {!isNew && !isEditing && (
            <>
              <button
                className="btn btn-outline"
                disabled={isPending}
                onClick={() => setIsEditing(true)}
                type="button"
              >
                수정하기
              </button>
              <button
                className="btn btn-outline"
                disabled={isPending || notice?.statusCode === 'NTCC0007'}
                onClick={hideNotice}
                type="button"
              >
                <EyeOff aria-hidden="true" />
                숨김
              </button>
              <button
                className="btn admin-danger-button"
                disabled={isPending}
                onClick={deleteNotice}
                type="button"
              >
                <Trash2 aria-hidden="true" />
                삭제
              </button>
            </>
          )}
          {!isNew && isEditing && (
            <button
              className="btn btn-outline"
              disabled={isPending}
              onClick={() => {
                setDraft(null);
                setIsEditing(false);
              }}
              type="button"
            >
              수정 취소
            </button>
          )}
          {(isNew || isEditing) && (
            <button className="btn btn-primary" disabled={isPending} type="submit">
              <Save aria-hidden="true" />
              {isNew ? '공지 등록' : '수정 저장'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AdminNoticeFormPage;
