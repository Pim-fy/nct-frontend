// src/components/skeleton/MainSkeleton.jsx
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
const MainSkeleton = () => (
  <div className="container" style={{ paddingTop: '40px' }}>
    <Skeleton height={40} style={{ marginBottom: '16px' }} />
    <Skeleton count={5} height={20} style={{ marginBottom: '8px' }} />
  </div>
);
export default MainSkeleton;
