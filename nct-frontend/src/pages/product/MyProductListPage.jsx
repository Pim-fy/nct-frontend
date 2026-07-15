// src/pages/product/MyProductListPage.jsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteProduct, getMyProducts } from '@api/productApi';
import Pagination from '@components/common/Pagination';
import { usePagination } from '@hooks/usePagination';

const STATUS_LABEL = {
  PRDC0001: '임시저장',
  PRDC0002: '공개',
  PRDC0003: '종료',
};

const TRADE_LABEL = {
  TRDC0009: '배송',
  TRDC0010: '직거래',
};

export default function MyProductListPage() {
  const navigate = useNavigate();
  const { page, size, totalPages, setTotalPages, goToPage } = usePagination(1, 10);

  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError('');
    getMyProducts(page, size)
      .then(res => {
        const { list, totalPages: tp } = res.data;
        setProducts(list);
        setTotalPages(tp);
      })
      .catch(() => setError('목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [page, size, setTotalPages]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (prdSn, prdNm) => {
    if (!window.confirm(`"${prdNm}" 상품을 삭제하시겠습니까?`)) return;
    try {
      await deleteProduct(prdSn);
      fetchProducts();
    } catch (err) {
      const msg = err.response?.data?.message;
      alert(msg || '삭제에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">내 판매 목록</h1>
        <button
          onClick={() => navigate('/product/register')}
          className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
        >
          + 상품 등록
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-center text-gray-500 py-10">불러오는 중...</p>
      ) : products.length === 0 ? (
        <div className="text-center text-gray-500 py-16">
          <p className="mb-4">등록한 상품이 없습니다.</p>
          <button
            onClick={() => navigate('/product/register')}
            className="text-blue-600 underline"
          >
            첫 상품을 등록해보세요
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium">상품명</th>
                  <th className="text-left px-4 py-3 font-medium">카테고리</th>
                  <th className="text-left px-4 py-3 font-medium">시작가</th>
                  <th className="text-left px-4 py-3 font-medium">즉시구매가</th>
                  <th className="text-left px-4 py-3 font-medium">거래방식</th>
                  <th className="text-left px-4 py-3 font-medium">상태</th>
                  <th className="text-left px-4 py-3 font-medium">등록일</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.prdSn} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/product/${p.prdSn}`)}
                        className="text-blue-600 hover:underline text-left"
                      >
                        {p.prdNm}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.catNm}</td>
                    <td className="px-4 py-3 font-mono">
                      {p.prdStartAmt?.toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-500">
                      {p.prdIbyAmt != null ? `${p.prdIbyAmt.toLocaleString()}원` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {TRADE_LABEL[p.prdTrdMethodCd] ?? p.prdTrdMethodCd}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium
                        ${p.prdStatusCd === 'PRDC0002' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[p.prdStatusCd] ?? p.prdStatusCd}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.prdRegDt ? new Date(p.prdRegDt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(p.prdSn, p.prdNm)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-center">
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          </div>
        </>
      )}
    </div>
  );
}
