import { useState } from 'react';

export default function MyPageListSearch({
  onSearch,
  placeholder = '상품명 검색',
  ariaLabel = '상품명 검색',
}) {
  const [value, setValue] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form className="flex gap-2" onSubmit={handleSubmit}>
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-9 min-w-0 flex-1 rounded-lg border border-[#dce2ed] bg-white px-3 text-sm outline-none focus:border-[#1466f5] sm:w-[180px]"
      />
      <button
        type="submit"
        className="h-9 shrink-0 cursor-pointer rounded-lg border-0 bg-[#1466f5] px-4 text-sm font-bold text-white"
      >
        검색
      </button>
    </form>
  );
}
