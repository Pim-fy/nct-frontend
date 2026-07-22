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
  CheckCircle2,
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
    description: 'USERS·TRADE·분쟁·정산 집계 계약을 기다리고 있습니다.',
    owner: '담당자 1·4·5 계약',
    status: '연결 대기',
    tone: 'neutral',
    icon: CircleDashed,
  },
  {
    label: '신고·리스크 이벤트',
    description: '마스킹·탐지 결과와 위험 이벤트 미리보기가 연결돼 있습니다.',
    owner: 'F-OPS-012·013',
    status: '부분 연결',
    tone: 'warning',
    icon: ShieldAlert,
  },
  {
    label: '공지·이용가이드',
    description: '공지 관리 화면과 경매·서비스 순서형 이용가이드가 연결돼 있습니다.',
    owner: 'F-COM-013·014 / F-OPS-023',
    status: '관리 연결',
    tone: 'primary',
    icon: Megaphone,
  },
  {
    label: '핵심 E2E',
    description: '낙찰·즉시구매·서비스 매칭·분쟁 보류·자동 완료를 검증합니다.',
    owner: 'F-OPS-018',
    status: '검증 전',
    tone: 'danger',
    icon: Clock3,
  },
];

const CONTRACT_ROWS = [
  { name: '회원·계정 상태', owner: '담당자 1', state: '연결 대기' },
  { name: '경매·입찰·낙찰', owner: '담당자 5', state: '연결 대기' },
  { name: '거래·채팅·리뷰', owner: '담당자 4', state: '연결 대기' },
  { name: '분쟁·정산 상태', owner: '담당자 5·6', state: '연결 대기' },
  { name: '위험 이벤트', owner: '담당자 7', state: '미리보기 연결' },
];

const Dashboard = () => (
  <div className="admin-dashboard">
    <PageMeta title="관리자 대시보드" />
    <MockupAdminPageHeader
      action={(
        <MockupAdminStatusBadge tone="success">
        <CheckCircle2 aria-hidden="true" />
        ROLE_ADMIN 보호 적용
        </MockupAdminStatusBadge>
      )}
      description="관리자 목업 v2의 메뉴와 운영 영역을 기준으로, 실제 기능 연결 상태를 먼저 보여줍니다."
      eyebrow="F-OPS-010 · 관리자 통합 화면"
      title="관리자 대시보드"
    />

    <section className="admin-dashboard__summary" aria-label="관리자 주요 기능 연결 현황">
      {SUMMARY_ITEMS.map(({ label, description, owner, status, tone, icon: Icon }) => (
        <article className={`card admin-summary-card admin-summary-card--${tone}`} key={label}>
          <div className="admin-summary-card__top">
            <span className="admin-summary-card__icon">{createElement(Icon, { 'aria-hidden': true })}</span>
            <MockupAdminStatusBadge tone={tone === 'primary' ? 'info' : tone}>{status}</MockupAdminStatusBadge>
          </div>
          <h2>{label}</h2>
          <p>{description}</p>
          <small>{owner}</small>
        </article>
      ))}
    </section>

    <section className="admin-dashboard__grid">
      <article className="card admin-dashboard-card">
        <div className="admin-dashboard-card__heading">
          <div>
            <h2>운영 데이터 계약</h2>
            <p>대시보드 숫자를 만들기 위해 필요한 담당자별 제공 계약입니다.</p>
          </div>
          <span className="admin-dashboard-card__tag">실제값 연동 전</span>
        </div>

        <div className="admin-contract-list">
          {CONTRACT_ROWS.map(({ name, owner, state }) => (
            <div className="admin-contract-row" key={name}>
              <div>
                <strong>{name}</strong>
                <small>{owner}</small>
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
            <p>현재 만든 마스킹·탐지·중복 방지 결과를 읽기 전용으로 확인합니다.</p>
          </div>
          <ShieldAlert aria-hidden="true" />
        </div>
        <ul className="admin-dashboard-checks">
          <li><CheckCircle2 aria-hidden="true" /> 민감정보 마스킹 예시</li>
          <li><CheckCircle2 aria-hidden="true" /> 위험 이벤트 중복 방지 계약</li>
          <li><CircleDashed aria-hidden="true" /> 실제 신고·제재 담당 계약 연결 대기</li>
        </ul>
        <Link className="admin-dashboard-card__action" to="/admin/operations-preview">
          민감정보 탐지 이벤트 열기
        </Link>
      </article>

      <article className="card admin-dashboard-card admin-dashboard-card--content">
        <div className="admin-dashboard-card__heading">
          <div>
            <h2>공지·이용가이드</h2>
            <p>사용자에게 공개되는 콘텐츠와 관리자 작업 경계를 구분합니다.</p>
          </div>
          <Megaphone aria-hidden="true" />
        </div>
        <div className="admin-content-readiness">
          <div>
            <Megaphone aria-hidden="true" />
            <span><strong>공지사항</strong><small>목록·상세 공개 조회 → 관리자 등록·수정·숨김·삭제</small></span>
            <b>관리 연결</b>
          </div>
          <div>
            <BookOpenCheck aria-hidden="true" />
            <span><strong>이용가이드</strong><small>경매·서비스 이용 순서와 담당 화면 연결 상태</small></span>
            <b>미리보기 연결</b>
          </div>
        </div>
        <p className="admin-dashboard-card__note">가이드 작성·저장 CMS는 POL-COM-004에 따라 현재 범위에서 제외합니다.</p>
      </article>

      <article className="card admin-dashboard-card">
        <div className="admin-dashboard-card__heading">
          <div>
            <h2>관리자 메뉴 준비 상태</h2>
            <p>전체 메뉴는 공통 쉘에 표시하고, 상세 화면은 각 단일 소유자가 연결합니다.</p>
          </div>
          <MockupAdminStatusBadge tone="info">13개 메뉴</MockupAdminStatusBadge>
        </div>
        <div className="admin-owner-grid">
          <span><strong>직접 소유</strong>대시보드·서비스·카테고리·공지·가이드</span>
          <span><strong>계약 소비</strong>회원·심사·경매·환전·신고·감사·설정</span>
        </div>
        <p className="admin-dashboard-card__note">연결 대기 메뉴는 route가 등록될 때까지 404가 발생하지 않도록 비활성화했습니다.</p>
      </article>
    </section>
  </div>
);

export default Dashboard;
