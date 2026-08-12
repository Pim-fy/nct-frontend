import { History, RefreshCw } from 'lucide-react';

import { useAdminHistory } from '@hooks/useAdminAudit';
import { formatAdminMemberIdentity } from '@utils/adminMemberIdentity';
import './AdminHistoryTimeline.css';

const LEGACY_AUDIT_PATTERN = /^reason=(.*?); before=(.*?); after=(.*?); requestId=(.*)$/s;

const legacyFields = (item) => {
  if (item.before != null || item.after != null || item.requestId != null) {
    return item;
  }
  const match = String(item.reason ?? '').match(LEGACY_AUDIT_PATTERN);
  if (!match) return item;
  return {
    ...item,
    reason: match[1] === '-' ? null : match[1],
    before: match[2] === '-' ? null : match[2],
    after: match[3] === '-' ? null : match[3],
    requestId: match[4] === '-' ? null : match[4],
  };
};

const referenceLabel = (name, code, sn) => {
  if (!name && !code && sn == null) return null;
  return `${name || code || '대상'}${sn == null ? '' : ` #${sn}`}`;
};

/** 담당자 7 · F-OPS-016: 관리자 상세 화면용 공통 처리 이력 타임라인입니다. */
const AdminHistoryTimeline = ({ limit = 100, referenceSn, referenceType, title = '처리 이력' }) => {
  const historyQuery = useAdminHistory(referenceType, referenceSn, limit);
  const items = (historyQuery.data ?? []).map(legacyFields);

  return (
    <section className="admin-history" aria-labelledby={`admin-history-${referenceType}-${referenceSn}`}>
      <div className="admin-history__heading">
        <div>
          <History aria-hidden="true" size={18} />
          <h3 id={`admin-history-${referenceType}-${referenceSn}`}>{title}</h3>
          {!historyQuery.isLoading && !historyQuery.isError && <span>{items.length}건</span>}
        </div>
        <button
          aria-label="처리 이력 새로고침"
          className="admin-history__refresh"
          disabled={historyQuery.isFetching}
          onClick={() => historyQuery.refetch()}
          title="새로고침"
          type="button"
        >
          <RefreshCw aria-hidden="true" size={16} />
        </button>
      </div>

      {historyQuery.isLoading && (
        <div className="admin-history__skeleton" aria-label="처리 이력을 불러오는 중입니다.">
          {[0, 1, 2].map((item) => <span key={item} />)}
        </div>
      )}
      {historyQuery.isError && (
        <div className="admin-history__state is-error">
          처리 이력을 불러오지 못했습니다.
          <button className="btn btn-outline btn-sm" onClick={() => historyQuery.refetch()} type="button">
            다시 시도
          </button>
        </div>
      )}
      {!historyQuery.isLoading && !historyQuery.isError && items.length === 0 && (
        <div className="admin-history__state">기록된 처리 이력이 없습니다.</div>
      )}
      {items.length > 0 && (
        <ol className="admin-history__list">
          {items.map((item) => {
            const mainReference = referenceLabel(item.refType, item.refTypeCd, item.refSn);
            const relatedReference = referenceLabel(
              item.relatedRefType,
              item.relatedRefTypeCd,
              item.relatedRefSn,
            );
            return (
              <li key={item.id}>
                <span className="admin-history__dot" aria-hidden="true" />
                <article>
                  <div className="admin-history__meta">
                    <strong>{item.type || item.typeCd || '관리자 작업'}</strong>
                    <time>{item.date || '-'}</time>
                  </div>
                  <p className="admin-history__actor">
                    {item.userSn == null
                      ? '시스템 자동 처리'
                      : formatAdminMemberIdentity(item.actorMember, item.userSn)}
                  </p>
                  {item.reason && <p className="admin-history__reason">{item.reason}</p>}
                  {(item.before || item.after) && (
                    <dl className="admin-history__change">
                      <dt>변경 전</dt><dd>{item.before || '-'}</dd>
                      <dt>변경 후</dt><dd>{item.after || '-'}</dd>
                    </dl>
                  )}
                  <div className="admin-history__references">
                    {mainReference && <span>{mainReference}</span>}
                    {relatedReference && <span>연관: {relatedReference}</span>}
                    {item.requestId && <code>{item.requestId}</code>}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

export default AdminHistoryTimeline;
