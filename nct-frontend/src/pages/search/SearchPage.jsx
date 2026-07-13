// src/pages/search/SearchPage.jsx
import { useParams } from 'react-router-dom';

const SearchPage = () => {
  const { keyword } = useParams();
  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <h1>검색 결과: "{decodeURIComponent(keyword)}"</h1>
      <p style={{ color: '#888' }}>구현 예정입니다.</p>
    </div>
  );
};
export default SearchPage;
