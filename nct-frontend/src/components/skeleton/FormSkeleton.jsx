// src/components/skeleton/FormSkeleton.jsx
// 라벨+입력창이 세로로 나열된 폼 화면(설정, 작성/수정 화면 등)을 위한 스켈레톤.
import { Skeleton } from './BaseSkeleton';

const FormSkeleton = ({ fields = 6 }) => (
  <div className="container" style={{ paddingTop: '40px' }}>
    <Skeleton height={28} style={{ marginBottom: 24, maxWidth: 240 }} />
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} style={{ marginBottom: 20 }}>
        <Skeleton height={14} style={{ marginBottom: 8, maxWidth: 120 }} />
        <Skeleton height={36} />
      </div>
    ))}
  </div>
);

export default FormSkeleton;
