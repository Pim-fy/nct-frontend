import { useMemo, useState } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import { Skeleton } from '@components/skeleton/BaseSkeleton';
import {
  useAdminRiskEvents,
  useAdminRiskEventSummary,
} from '@hooks/useAdminRiskEvents';
import { formatDateTime } from '@utils/common';
import './operationsIntegrationPreview.css';

/** 담당자 7 · F-OPS-011/013: 운영 위험 이벤트를 읽기 전용으로 확인하는 화면입니다. */
const OperationsIntegrationPreview = () => {
  const [typeCode, setTypeCode] = useState('');
  const [processed, setProcessed] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      typeCode: typeCode || undefined,
      processed: processed || undefined,
      page,
      size: 20,
    }),
    [page, processed, typeCode],
  );

  const eventsQuery = useAdminRiskEvents(filters);
  const summaryQuery = useAdminRiskEventSummary();

  const events = useMemo(
    () =>
      (eventsQuery.data?.items ?? []).filter((item) => {
        const query = keyword.trim().toLowerCase();
        const searchableText = [
          item.riskEventId,
          item.typeName,
          item.referenceTypeCode,
          item.content,
        ]
          .join(' ')
          .toLowerCase();

        return !query || searchableText.includes(query);
      }),
    [eventsQuery.data, keyword],
  );


  return (
    <div className="operations-preview">
      <PageMeta title="위험 이벤트 조회" />

      <header className="operations-preview__header">
        <div>
          <h1>위험 이벤트</h1>
        </div>
        <AdminStatusBadge tone="info">읽기 전용</AdminStatusBadge>
      </header>

      <section className="operations-summary" aria-label="위험 이벤트 유형별 건수">
        {summaryQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <article className="operations-summary__card" key={index}>
              <Skeleton circle height={42} style={{ flexShrink: 0, width: 42 }} />
              <div>
                <Skeleton height={13} style={{ maxWidth: 90 }} />
                <Skeleton height={25} style={{ maxWidth: 60 }} />
              </div>
            </article>
          ))
        ) : (
          (summaryQuery.data ?? []).map((item) => (
            <article className="operations-summary__card" key={item.typeCode}>
              <div className="operations-summary__icon operations-summary__icon--danger">
                <AlertTriangle size={20} />
              </div>
              <div>
                <span>{item.typeName}</span>
                <strong>{item.count}건</strong>
                <small>전체 위험 이벤트</small>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="operations-card">
        <div className="operations-card__heading">
          <div>
            <h2>위험 이벤트 목록</h2>
            <p>내용에는 원문 개인정보 대신 서버에서 마스킹된 정보만 표시됩니다.</p>
          </div>
          <span>총 {eventsQuery.data?.totalItems ?? 0}건</span>
        </div>

        <div className="operations-filters">
          <label>
            <span>유형</span>
            <select
              onChange={(event) => {
                setTypeCode(event.target.value);
                setPage(1);
              }}
              value={typeCode}
            >
              <option value="">전체</option>
              {(summaryQuery.data ?? []).map((item) => (
                <option key={item.typeCode} value={item.typeCode}>
                  {item.typeName}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>처리 상태</span>
            <select
              onChange={(event) => {
                setProcessed(event.target.value);
                setPage(1);
              }}
              value={processed}
            >
              <option value="">전체</option>
              <option value="N">미처리</option>
              <option value="Y">처리 완료</option>
            </select>
          </label>

          <label className="operations-search">
            <span className="sr-only">검색</span>
            <Search size={17} aria-hidden="true" />
            <input
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
              }}
              placeholder="번호, 유형, 내용 검색"
              value={keyword}
            />
          </label>
        </div>

        <div className="operations-table-wrap">
          <table className="operations-table">
            <thead>
              <tr>
                <th>이벤트 번호</th>
                <th>유형</th>
                <th>관련 대상</th>
                <th>내용</th>
                <th>등록일</th>
                <th>처리 상태</th>
              </tr>
            </thead>
            <tbody>
              {eventsQuery.isLoading && Array.from({ length: 6 }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: 6 }).map((__, colIndex) => (
                    <td key={colIndex}><Skeleton height={14} /></td>
                  ))}
                </tr>
              ))}

              {eventsQuery.isError && (
                <tr>
                  <td className="operations-table__empty" colSpan="6">
                    위험 이벤트를 불러오지 못했습니다. 관리자 로그인과 백엔드 실행 상태를 확인해
                    주세요.
                  </td>
                </tr>
              )}

              {!eventsQuery.isLoading &&
                !eventsQuery.isError &&
                events.map((item) => (
                  <tr key={item.riskEventId}>
                    <td className="operations-table__id">{item.riskEventId}</td>
                    <td>{item.typeName}</td>
                    <td>
                      {item.referenceTypeCode} #{item.referenceSn}
                    </td>
                    <td>{item.content}</td>
                    <td>{formatDateTime(item.registeredAt)}</td>
                    <td>
                      <AdminStatusBadge tone={item.processedYn === 'Y' ? 'success' : 'warning'}>
                        {item.processedYn === 'Y' ? '처리 완료' : '미처리'}
                      </AdminStatusBadge>
                    </td>
                  </tr>
                ))}

              {!eventsQuery.isLoading && !eventsQuery.isError && events.length === 0 && (
                <tr>
                  <td className="operations-table__empty" colSpan="6">
                    조건에 맞는 위험 이벤트가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {(eventsQuery.data?.totalPages ?? 0) > 1 && (
          <nav className="operations-pagination" aria-label="위험 이벤트 페이지 이동">
            <button
              disabled={page <= 1 || eventsQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              이전
            </button>
            <span>
              {eventsQuery.data?.page ?? page} / {eventsQuery.data?.totalPages}
            </span>
            <button
              disabled={page >= eventsQuery.data.totalPages || eventsQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              다음
            </button>
          </nav>
        )}
      </section>
    </div>
  );
};

export default OperationsIntegrationPreview;
