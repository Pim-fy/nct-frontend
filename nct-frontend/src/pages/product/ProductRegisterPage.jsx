// src/pages/product/ProductRegisterPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories } from '@api/categoryApi';
import { registerProduct } from '@api/productApi';

const TRADE_METHODS = [
  { value: 'TRDC0009', label: '배송' },
  { value: 'TRDC0010', label: '직거래' },
];

// 물건 카테고리 도메인 코드
const PRODUCT_DOMAIN_CD = 'CATC0001';

export default function ProductRegisterPage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const [form, setForm] = useState({
    catSn:         '',
    prdNm:         '',
    prdCn:         '',
    prdStartAmt:   '',
    prdIbyAmt:     '',
    prdTrdMethodCd: '',
  });

  // 카테고리 로드
  useEffect(() => {
    getCategories(PRODUCT_DOMAIN_CD)
      .then(res => {
        // 부모가 있는 항목만 선택지로 노출 (루트 카테고리 제외)
        const children = res.data.filter(c => c.catParentSn !== null);
        setCategories(children);
      })
      .catch(() => setError('카테고리를 불러오지 못했습니다.'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        catSn:          Number(form.catSn),
        prdNm:          form.prdNm,
        prdCn:          form.prdCn || null,
        prdStartAmt:    Number(form.prdStartAmt),
        prdIbyAmt:      form.prdIbyAmt ? Number(form.prdIbyAmt) : null,
        prdTrdMethodCd: form.prdTrdMethodCd,
      };
      await registerProduct(payload);
      navigate('/product/me');
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || '상품 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">상품 등록</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium mb-1">카테고리 *</label>
          <select
            name="catSn"
            value={form.catSn}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">카테고리 선택</option>
            {categories.map(cat => (
              <option key={cat.catSn} value={cat.catSn}>{cat.catNm}</option>
            ))}
          </select>
        </div>

        {/* 상품명 */}
        <div>
          <label className="block text-sm font-medium mb-1">상품명 *</label>
          <input
            type="text"
            name="prdNm"
            value={form.prdNm}
            onChange={handleChange}
            required
            maxLength={200}
            placeholder="상품명을 입력하세요"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 상품 설명 */}
        <div>
          <label className="block text-sm font-medium mb-1">상품 설명</label>
          <textarea
            name="prdCn"
            value={form.prdCn}
            onChange={handleChange}
            maxLength={4000}
            rows={5}
            placeholder="상품에 대한 상세 설명을 입력하세요"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          />
        </div>

        {/* 시작금액 */}
        <div>
          <label className="block text-sm font-medium mb-1">시작금액 *</label>
          <input
            type="number"
            name="prdStartAmt"
            value={form.prdStartAmt}
            onChange={handleChange}
            required
            min={0}
            placeholder="0"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 즉시구매가 */}
        <div>
          <label className="block text-sm font-medium mb-1">즉시구매가 (선택)</label>
          <input
            type="number"
            name="prdIbyAmt"
            value={form.prdIbyAmt}
            onChange={handleChange}
            min={0}
            placeholder="입력 시 즉시구매 가능"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 거래방식 */}
        <div>
          <label className="block text-sm font-medium mb-1">거래방식 *</label>
          <div className="flex gap-4">
            {TRADE_METHODS.map(m => (
              <label key={m.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="prdTrdMethodCd"
                  value={m.value}
                  checked={form.prdTrdMethodCd === m.value}
                  onChange={handleChange}
                  required
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '등록 중...' : '상품 등록'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 border border-gray-300 py-2 rounded font-medium hover:bg-gray-50"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
