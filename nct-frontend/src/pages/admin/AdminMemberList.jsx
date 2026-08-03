import { ArrowLeft, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import MockupAdminPageHeader from '@components/admin/mockup/MockupAdminPageHeader';
import PageMeta from '@components/admin/PageMeta';
import './AdminMemberList.css';

/**
 * 담당자 7 임시 연결: 관리자 회원 조회 API와 화면 계약이 아직 제공되지 않아 경로만 보존합니다.
 * 회원 목록·검색·상세 계약이 확정되면 이 준비 화면을 실제 관리 화면으로 교체합니다.
 */
const AdminMemberList = () => (
  <div className="admin-member-pending">
    <PageMeta title="회원 관리" />
    <MockupAdminPageHeader
      description="회원관리 계약이 준비되면 이 경로에서 목록과 상세 기능을 제공합니다."
      title="회원 관리"
    />

    <section className="admin-member-pending__card">
      <span className="admin-member-pending__icon">
        <UsersRound aria-hidden="true" />
      </span>
      <span className="admin-member-pending__badge">준비 중</span>
      <h2>회원관리 API 연결 전입니다.</h2>
      <p>
        현재 회원 목록·검색·상세 조회 계약이 제공되지 않았습니다.
        계약이 확정되면 임시 데이터 없이 이 화면에 실제 관리 기능을 연결합니다.
      </p>
      <Link to="/admin"><ArrowLeft aria-hidden="true" />대시보드로 돌아가기</Link>
    </section>
  </div>
);

export default AdminMemberList;
