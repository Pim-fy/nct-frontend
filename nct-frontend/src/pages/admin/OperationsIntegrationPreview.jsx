import { useMemo, useState } from 'react';
import { AlertTriangle, Search, ShieldCheck, Unplug } from 'lucide-react';
import AdminStatusBadge from '@components/admin/AdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import { operationsIssues, operationsSummary } from './operationsPreviewData';
import './operationsIntegrationPreview.css';

/**
 * F-OPS-012/013과 신고 목업을 먼저 눈으로 확인하는 읽기 전용 화면입니다.
 * 처리 버튼이나 실제 서버 요청은 담당자 5의 신고 API 계약이 확정된 뒤 연결합니다.
 */
const OperationsIntegrationPreview = () => {
  const [statusFilter, setStatusFilter] = useState('전체');
  const [keyword, setKeyword] = useState('');

  const filteredIssues = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return operationsIssues.filter((issue) => {
      const matchesStatus = statusFilter === '전체' || issue.status === statusFilter;
      const searchable = `${issue.id} ${issue.category} ${issue.target} ${issue.content}`.toLowerCase();
      return matchesStatus && (!normalizedKeyword || searchable.includes(normalizedKeyword));
    });
  }, [keyword, statusFilter]);

  return (
    <div className="operations-preview">
      <PageMeta title="신고·위험 이벤트 미리보기" />

      <header className="operations-preview__header">
        <div>
          <p className="operations-preview__eyebrow">1단계 운영·보안</p>
          <h1>신고·위험 이벤트</h1>
          <p>목업의 신고 목록과 민감정보 탐지 흐름을 합친 임시 확인 화면입니다.</p>
        </div>
        <AdminStatusBadge tone="info">임시 데이터 · 읽기 전용</AdminStatusBadge>
      </header>

      <section className="operations-preview__notice" aria-label="현재 연결 상태">
        <Unplug size={20} aria-hidden="true" />
        <div>
          <strong>담당자 4·5 코드 연결 전입니다.</strong>
          <span>현재는 화면과 교체형 연결 규격만 확인할 수 있으며, 신고 처리·저장은 실행되지 않습니다.</span>
        </div>
      </section>

      <section className="operations-summary" aria-label="운영 요약">
        {operationsSummary.map((item) => (
          <article className="operations-summary__card" key={item.label}>
            <div className={`operations-summary__icon operations-summary__icon--${item.tone}`}>
              {item.tone === 'danger' ? <AlertTriangle size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}건</strong>
              <small>{item.helper}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="operations-card">
        <div className="operations-card__heading">
          <div>
            <h2>탐지·신고 목록</h2>
            <p>개인정보 예시는 원문 대신 마스킹된 값만 표시합니다.</p>
          </div>
          <span>총 {filteredIssues.length}건</span>
        </div>

        <div className="operations-filters">
          <label>
            <span>상태</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option>전체</option>
              <option>접수</option>
              <option>검토 필요</option>
              <option>신고 연동 대기</option>
              <option>처리 완료</option>
            </select>
          </label>
          <label className="operations-search">
            <span className="sr-only">검색</span>
            <Search size={17} aria-hidden="true" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="접수번호, 분류, 대상 검색"
            />
          </label>
        </div>

        <div className="operations-table-wrap">
          <table className="operations-table">
            <thead>
              <tr>
                <th>접수번호</th>
                <th>업무유형</th>
                <th>분류</th>
                <th>대상</th>
                <th>내용</th>
                <th>관련회원</th>
                <th>접수일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue) => (
                <tr key={issue.id}>
                  <td className="operations-table__id">{issue.id}</td>
                  <td>{issue.workType}</td>
                  <td>{issue.category}</td>
                  <td>{issue.target}</td>
                  <td>{issue.content}</td>
                  <td>{issue.member}</td>
                  <td>{issue.date}</td>
                  <td><AdminStatusBadge tone={issue.tone}>{issue.status}</AdminStatusBadge></td>
                </tr>
              ))}
              {filteredIssues.length === 0 && (
                <tr>
                  <td className="operations-table__empty" colSpan="8">조건에 맞는 임시 자료가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="operations-flow" aria-label="향후 연결 순서">
        <h2>실제 코드가 들어오면 바뀌는 부분</h2>
        <ol>
          <li><strong>채팅·문의</strong><span>원문 검사 규격을 호출</span></li>
          <li><strong>담당자 7</strong><span>마스킹 후 RISK_EVENT를 한 번만 생성</span></li>
          <li><strong>담당자 5</strong><span>임시 플러그를 실제 신고 저장으로 교체</span></li>
        </ol>
      </section>
    </div>
  );
};

export default OperationsIntegrationPreview;
