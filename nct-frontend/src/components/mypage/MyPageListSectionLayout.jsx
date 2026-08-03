import MyPageContentHeader from '@components/mypage/MyPageContentHeader';
import MyPageFilterTabs from '@components/mypage/MyPageFilterTabs';
import MyPageListSearch from '@components/mypage/MyPageListSearch';
import MyPageSummary from '@components/mypage/MyPageSummary';

export default function MyPageListSectionLayout({
  title,
  summaryItems,
  filterItems,
  activeFilter,
  onFilterChange,
  filterAriaLabel,
  onSearch,
  searchAriaLabel,
  searchPlaceholder,
  extraControls,
  isLoading = false,
}) {
  return (
    <>
      <MyPageContentHeader title={title} />
      <MyPageSummary items={summaryItems} isLoading={isLoading} />
      <div className="mb-5">
        <MyPageFilterTabs
          items={filterItems}
          activeValue={activeFilter}
          onChange={onFilterChange}
          ariaLabel={filterAriaLabel}
          isLoading={isLoading}
          endContent={(
            <div className="flex flex-col gap-2 sm:flex-row">
              {extraControls}
              <MyPageListSearch onSearch={onSearch} ariaLabel={searchAriaLabel} placeholder={searchPlaceholder} />
            </div>
          )}
        />
      </div>
    </>
  );
}
