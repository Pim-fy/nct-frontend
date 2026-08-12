import CommonTabs from '@components/common/CommonTabs';

export default function MyPageFilterTabs({
  items,
  activeValue,
  onChange,
  ariaLabel,
  endContent,
  isLoading = false,
}) {
  return (
    <CommonTabs
      activeValue={activeValue}
      ariaLabel={ariaLabel}
      endContent={endContent}
      isLoading={isLoading}
      items={items}
      onChange={onChange}
    />
  );
}
