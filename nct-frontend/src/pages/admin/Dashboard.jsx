// src/pages/admin/Dashboard.jsx
//
// F-OPS-010 관리자 운영 대시보드의 첫 화면입니다.
// 아직 다른 담당자의 실제 집계 API가 준비되지 않았으므로 가짜 숫자를 보여 주지 않고,
// 어떤 데이터가 연결됐고 무엇을 기다리는지 관리자와 개발자가 함께 확인하도록 구성합니다.
// 각 계약이 준비되면 아래 카드의 상태와 값만 실제 API 응답으로 교체하면 됩니다.

import { createElement } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenCheck,
  CircleDashed,
  Clock3,
  Megaphone,
  ShieldAlert,
} from 'lucide-react';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import MockupAdminStatusBadge from '@components/admin/mockup/MockupAdminStatusBadge';
import PageMeta from '@components/admin/PageMeta';
import './Dashboard.css';

const SUMMARY_ITEMS = [
  {
    label: '사용자·거래 현황',
    status: '연결 대기',
    tone: 'neutral',
    icon: CircleDashed,
  },
  {
    label: '신고·리스크 이벤트',
    status: '부분 연결',
    tone: 'warning',
    icon: ShieldAlert,
  },
  {
    label: '공지·이용가이드',
    status: '관리 연결',
    tone: 'primary',
    icon: Megaphone,
  },
  {
    label: '핵심 E2E',
    status: '검증 전',
    tone: 'danger',
    icon: Clock3,
  },
];

const CONTRACT_ROWS = [
  { name: '회원·계정 상태', state: '연결 대기' },
  { name: '경매·입찰·낙찰', state: '연결 대기' },
  { name: '거래·채팅·리뷰', state: '연결 대기' },
  { name: '분쟁·정산 상태', state: '연결 대기' },
  { name: '위험 이벤트', state: '미리보기 연결' },
];

const Dashboard = () => (
  <div className="admin-dashboard">
    <PageMeta title="관리자 대시보드" />
    <MockupAdminPageHeader title="관리자 대시보드" />

    <section className="admin-dashboard__summary" aria-label="관리자 주요 기능 연결 현황">
      {SUMMARY_ITEMS.map(({ label, status, tone, icon: Icon }) => (
        <article className={`card admin-summary-card admin-summary-card--${tone}`} key={label}>
          <div className="admin-summary-card__top">
            <span className="admin-summary-card__icon">{createElement(Icon, { 'aria-hidden': true })}</span>
            <MockupAdminStatusBadge tone={tone === 'primary' ? 'info' : tone}>{status}</MockupAdminStatusBadge>
          </div>
          <h2>{label}</h2>
        </article>
      ))}
    </section>

    <section className="admin-dashboard__grid">
      <article className="card admin-dashboard-card">
        <div className="admin-dashboard-card__heading">
          <div>
            <h2>운영 현황</h2>
          </div>
          <span className="admin-dashboard-card__tag">실제값 연동 전</span>
        </div>

        <div className="admin-contract-list">
          {CONTRACT_ROWS.map(({ name, state }) => (
            <div className="admin-contract-row" key={name}>
              <div>
                <strong>{name}</strong>
              </div>
              <MockupAdminStatusBadge tone={state === '미리보기 연결' ? 'warning' : 'neutral'}>{state}</MockupAdminStatusBadge>
            </div>
          ))}
        </div>
      </article>

      <article className="card admin-dashboard-card admin-dashboard-card--risk">
        <div className="admin-dashboard-card__heading">
          <div>
            <h2>신고·위험 이벤트</h2>
          </div>
          <ShieldAlert aria-hidden="true" />
        </div>
        <Link className="admin-dashboard-card__action" to="/admin/operations-preview">
          민감정보 탐지 이벤트 열기
        </Link>
      </article>

      <article className="card admin-dashboard-card admin-dashboard-card--content">
        <div className="admin-dashboard-card__heading">
          <div>
            <h2>공지·이용가이드</h2>
          </div>
          <Megaphone aria-hidden="true" />
        </div>
        <div className="admin-content-readiness">
          <div>
            <Megaphone aria-hidden="true" />
            <span><strong>공지사항</strong></span>
          </div>
          <div>
            <BookOpenCheck aria-hidden="true" />
            <span><strong>이용가이드</strong></span>
          </div>
        </div>
      </article>

      <article className="card admin-dashboard-card">
        <div className="admin-dashboard-card__heading">
          <div>
            <h2>관리자 메뉴</h2>
          </div>
          <MockupAdminStatusBadge tone="info">13개 메뉴</MockupAdminStatusBadge>
        </div>
      </article>
    </section>
  </div>
);

export default Dashboard;
