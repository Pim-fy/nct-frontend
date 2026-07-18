// Claude Code 작성 (BJN, 2026-07-18)
// 관리자 감사로그 화면 (담당자6 BJN, F-OPS-014/016 — 목업 29_audit_log 기준)
// - 상단: 행위자·유형·기간 필터 + 감사로그 표 (F-OPS-016)
// - 하단: 민감정보(채팅) 원문 제한 조회 패널 (F-OPS-014)
//   사유·분쟁 건 번호 없이는 서버가 거절하고, 조회 성공 시 그 자체가 감사로그로 남아 표 맨 위에 나타난다
import { useState } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import { useAuditLogs, useSensitiveView } from '@hooks/useAdminAudit';
import './adminAuditPage.css';

// 감사 행위 유형 필터 옵션 — 공통코드 AUDG01(기초데이터 v3)과 일치해야 한다
const TYPE_OPTIONS = [
  { value: '', label: '전체 유형' },
  { value: 'AUDC0001', label: '생성' },
  { value: 'AUDC0002', label: '수정' },
  { value: 'AUDC0003', label: '삭제' },
  { value: 'AUDC0004', label: '원문조회' },
  { value: 'AUDC0005', label: '관리자승인' },
  { value: 'AUDC0006', label: '관리자반려' },
  { value: 'AUDC0007', label: '상태변경' },
];

const AdminAuditLogPage = () => {
  // 입력 중 값과 "조회 버튼을 누른 시점의 값"을 분리 — 타이핑할 때마다 서버를 찌르지 않기 위해
  const [form, setForm] = useState({ usrSn: '', typeCd: '', from: '', to: '' });
  const [filters, setFilters] = useState({});
  const logsQuery = useAuditLogs(filters);

  // 민감정보 제한 조회 패널 상태
  const [viewForm, setViewForm] = useState({ chMsgSn: '', trdDspSn: '', reason: '' });
  const sensitiveView = useSensitiveView();

  const submitSearch = (event) => {
    event.preventDefault();
    const next = {};
    if (form.usrSn.trim()) next.usrSn = form.usrSn.trim();
    if (form.typeCd) next.typeCd = form.typeCd;
    if (form.from) next.from = form.from;
    if (form.to) next.to = form.to;
    setFilters(next);
  };

  const submitSensitiveView = (event) => {
    event.preventDefault();
    sensitiveView.mutate({
      chMsgSn: Number(viewForm.chMsgSn),
      trdDspSn: Number(viewForm.trdDspSn),
      reason: viewForm.reason.trim(),
    });
  };

  const logs = logsQuery.data ?? [];
  const viewResult = sensitiveView.data?.data;

  return (
    <div className="admin-bjn-page">
      <MockupAdminPageHeader
        eyebrow="보안/감사"
        title="감사 로그"
        description="포인트·정산·관리자 조치·민감정보 접근 기록을 조건별로 조회합니다. 감사로그는 3년 보존 대상입니다."
      />

      {/* 조건 필터 (F-OPS-016) */}
      <form className="admin-bjn-filters" onSubmit={submitSearch}>
        <label>
          행위자 회원번호
          <input
            name="usrSn"
            type="number"
            placeholder="예: 183"
            value={form.usrSn}
            onChange={(e) => setForm({ ...form, usrSn: e.target.value })}
          />
        </label>
        <label>
          행위 유형
          <select
            name="typeCd"
            value={form.typeCd}
            onChange={(e) => setForm({ ...form, typeCd: e.target.value })}
          >
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label>
          시작일
          <input name="from" type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
        </label>
        <label>
          종료일
          <input name="to" type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
        </label>
        <button type="submit"><Search aria-hidden="true" /> 조회</button>
      </form>

      {/* 감사로그 표 */}
      {logsQuery.isLoading && <div className="admin-bjn-state">감사로그를 불러오는 중입니다…</div>}
      {logsQuery.isError && <div className="admin-bjn-state is-error">감사로그 조회에 실패했습니다. 잠시 후 다시 시도해 주세요.</div>}
      {!logsQuery.isLoading && !logsQuery.isError && (
        logs.length === 0 ? (
          <div className="admin-bjn-state">조건에 맞는 감사로그가 없습니다.</div>
        ) : (
          <div className="admin-bjn-table-scroll">
            <table className="admin-bjn-table">
              <thead>
                <tr>
                  <th>일시</th>
                  <th>행위자</th>
                  <th>행위 유형</th>
                  <th>대상</th>
                  <th>IP</th>
                  <th>사유·내용</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td>{log.userName ? `${log.userName} (#${log.userSn})` : '시스템'}</td>
                    <td>{log.type}</td>
                    <td>{log.refType ? `${log.refType} #${log.refSn}` : '-'}</td>
                    <td>{log.ipAddr ?? '-'}</td>
                    <td className="is-wrap">{log.reason ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* 민감정보 원문 제한 조회 (F-OPS-014) */}
      <section className="admin-bjn-panel">
        <h2><ShieldAlert aria-hidden="true" style={{ verticalAlign: '-3px' }} /> 민감정보 원문 제한 조회</h2>
        <p className="admin-bjn-panel__desc">
          거래 분쟁·법적 대응 건에 한해 채팅 메시지 원문을 조회합니다.
          사유와 분쟁 건 번호가 없으면 거절되며, 조회 즉시 위 감사로그에 기록이 남습니다.
        </p>
        <form onSubmit={submitSensitiveView}>
          <label>
            채팅 메시지 번호
            <input
              name="chMsgSn" type="number" required placeholder="예: 12"
              value={viewForm.chMsgSn}
              onChange={(e) => setViewForm({ ...viewForm, chMsgSn: e.target.value })}
            />
          </label>
          <label>
            거래 분쟁 건 번호
            <input
              name="trdDspSn" type="number" required placeholder="예: 3"
              value={viewForm.trdDspSn}
              onChange={(e) => setViewForm({ ...viewForm, trdDspSn: e.target.value })}
            />
          </label>
          <label>
            조회 사유 (필수)
            <input
              name="reason" type="text" required placeholder="예: 분쟁 3번 증거 확인"
              value={viewForm.reason}
              onChange={(e) => setViewForm({ ...viewForm, reason: e.target.value })}
            />
          </label>
          <button type="submit" disabled={sensitiveView.isPending}>
            {sensitiveView.isPending ? '조회 중…' : '원문 조회'}
          </button>
        </form>

        {sensitiveView.isError && (
          <p className="admin-bjn-panel__error">
            {sensitiveView.error?.response?.data?.message ?? '원문 조회에 실패했습니다.'}
          </p>
        )}
        {viewResult && (
          <div className="admin-bjn-panel__result">
            <strong>메시지 #{viewResult.chMsgSn}</strong> (채팅방 #{viewResult.chRmSn})
            — 발신자 {viewResult.senderName} (#{viewResult.senderSn}), {viewResult.sentAt}
            <br />
            {viewResult.content}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminAuditLogPage;
