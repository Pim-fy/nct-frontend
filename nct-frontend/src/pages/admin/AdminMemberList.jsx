import { ArrowLeft, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminPageHeader from '@components/admin/AdminPageHeader';
import PageMeta from '@components/admin/PageMeta';
import './AdminMemberList.css';

/**
 * 담당자 7 임시 연결: 관리자 회원 조회 API와 화면 계약이 아직 제공되지 않아 경로만 보존합니다.
 * 회원 목록·검색·상세 계약이 확정되면 이 준비 화면을 실제 관리 화면으로 교체합니다.
 */
const AdminMemberList = () => (
  <div className="admin-member-pending">
    <PageMeta title="회원 관리" />
    <AdminPageHeader title="회원 관리" />

    <section className="admin-member-pending__card">
      <span className="admin-member-pending__icon">
        <UsersRound aria-hidden="true" />
      </span>
      <span className="admin-member-pending__badge">준비 중</span>
      <h2>회원 관리 기능을 준비 중입니다.</h2>
      <p>
        회원 목록·검색·상세 조회 기능이 제공되면 이 화면에서 바로 확인할 수 있습니다.
      </p>
      <Link to="/admin"><ArrowLeft aria-hidden="true" />대시보드로 돌아가기</Link>
    </section>
  </div>
);

export default AdminMemberList;
