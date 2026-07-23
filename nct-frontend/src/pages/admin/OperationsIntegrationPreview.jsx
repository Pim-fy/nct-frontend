import { useMemo, useState } from 'react';
import { AlertTriangle, Search, ShieldCheck } from 'lucide-react';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import {
  useAdminRiskEvents,
  useAdminRiskEventSummary,
} from '@hooks/useAdminRiskEvents';
import './operationsIntegrationPreview.css';

/** 담당자 7 · F-OPS-013: 민감정보 탐지 결과로 생성된 위험 이벤트를 읽기 전용으로 확인하는 화면입니다. */
const OperationsIntegrationPreview = () => {
  const [typeCode, setTypeCode] = useState('');
  const [processed, setProcessed] = useState('');
  const [keyword, setKeyword] = useState('');

  const filters = useMemo(
    () => ({
      typeCode: typeCode || undefined,
      processed: processed || undefined,
      page: 1,
      size: 20,
    }),
    [processed, typeCode],
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

  const formatDate = (value) =>
    value
      ? new Date(value).toLocaleString('ko-KR', {
          dateStyle: 'short',
          timeStyle: 'short',
        })
      : '-';

  return (
    <div className="operations-preview">
      <PageMeta title="위험 이벤트 조회" />

      <header className="operations-preview__header">
        <div>
          <p className="operations-preview__eyebrow">담당자 7 · F-OPS-013</p>
          <h1>민감정보 탐지 이벤트</h1>
          <p>민감정보 탐지로 생성된 신고·리스크 이벤트를 실제 서버 목록으로 조회합니다.</p>
        </div>
        <AdminStatusBadge tone="info">읽기 전용</AdminStatusBadge>
      </header>

      <section className="operations-preview__notice" aria-label="조회 범위">
        <ShieldCheck size={20} aria-hidden="true" />
        <div>
          <strong>관리자 전용 조회 화면입니다.</strong>
          <span>
            이 화면은 위험 이벤트를 수정하지 않습니다. 신고 처리와 제재 처리는 제공 계약이
            준비된 뒤 별도 화면으로 연결합니다.
          </span>
        </div>
      </section>

      <section className="operations-summary" aria-label="위험 이벤트 유형별 건수">
        {summaryQuery.isLoading ? (
          <p>유형별 건수를 불러오는 중입니다.</p>
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
            <select onChange={(event) => setTypeCode(event.target.value)} value={typeCode}>
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
            <select onChange={(event) => setProcessed(event.target.value)} value={processed}>
              <option value="">전체</option>
              <option value="N">미처리</option>
              <option value="Y">처리 완료</option>
            </select>
          </label>

          <label className="operations-search">
            <span className="sr-only">검색</span>
            <Search size={17} aria-hidden="true" />
            <input
              onChange={(event) => setKeyword(event.target.value)}
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
              {eventsQuery.isLoading && (
                <tr>
                  <td className="operations-table__empty" colSpan="6">
                    위험 이벤트를 불러오는 중입니다.
                  </td>
                </tr>
              )}

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
                    <td>{formatDate(item.registeredAt)}</td>
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
      </section>
    </div>
  );
};

export default OperationsIntegrationPreview;
