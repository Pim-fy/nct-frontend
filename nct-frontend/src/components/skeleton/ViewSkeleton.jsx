// src/components/skeleton/ViewSkeleton.jsx
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
const ViewSkeleton = () => (
  <div className="container" style={{ paddingTop: '40px' }}>
    <Skeleton height={40} style={{ marginBottom: '16px' }} />
    <Skeleton count={5} height={20} style={{ marginBottom: '8px' }} />
  </div>
);
export default ViewSkeleton;
