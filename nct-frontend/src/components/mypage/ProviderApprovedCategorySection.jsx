import MyPageContentHeader from '@components/mypage/MyPageContentHeader';
import { useMyProviderProfile } from '@hooks/useProviderProfile';

/**
 * 담당자 7 · F-PROV-009: 제공자 본인 프로필 계약에서 승인된 서비스 카테고리를 표시합니다.
 * PROVIDER_CATEGORY_PERMISSION을 프론트에서 직접 조회하지 않고 profile.categories만 소비합니다.
 */
export default function ProviderApprovedCategorySection() {
  const profileQuery = useMyProviderProfile();
  const categories = profileQuery.data?.categories ?? [];

  return (
    <section className="w-full" aria-labelledby="provider-approved-category-title">
      <MyPageContentHeader title="승인 카테고리" />

      <div className="min-h-[360px] rounded-[15px] border border-[rgba(0,0,0,0.11)] bg-white">
        <div className="flex min-h-[60px] items-center justify-between gap-4 border-b border-[#e5e5e5] bg-[rgba(0,100,255,0.05)] px-5">
          <div>
            <h2 id="provider-approved-category-title" className="text-[18px] font-bold text-[#3a3a3a]">
              견적 제출 가능 분야
            </h2>
            <p className="mt-1 text-sm text-[#6b7788]">
              관리자 승인이 완료된 분야에만 견적을 제출할 수 있습니다.
            </p>
          </div>
          {!profileQuery.isLoading && !profileQuery.isError && (
            <span className="shrink-0 text-sm font-semibold text-[#0064ff]">
              {categories.length}개
            </span>
          )}
        </div>

        {profileQuery.isLoading && (
          <div className="grid gap-3 p-6 sm:grid-cols-2" aria-label="승인 카테고리를 불러오는 중">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-xl bg-[#f3f6fa]" />
            ))}
          </div>
        )}

        {profileQuery.isError && (
          <div className="flex min-h-[299px] flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-[15px] text-[#b42318]">승인 카테고리를 불러오지 못했습니다.</p>
            <button
              type="button"
              className="text-sm font-semibold text-[#0064ff] hover:underline"
              onClick={() => profileQuery.refetch()}
            >
              다시 불러오기
            </button>
          </div>
        )}

        {!profileQuery.isLoading && !profileQuery.isError && categories.length === 0 && (
          <div className="flex min-h-[299px] items-center justify-center px-6 text-center">
            <p className="text-[15px] text-[#6b7788]">현재 승인된 서비스 카테고리가 없습니다.</p>
          </div>
        )}

        {!profileQuery.isLoading && !profileQuery.isError && categories.length > 0 && (
          <ul className="grid gap-3 p-6 sm:grid-cols-2">
            {categories.map((category) => (
              <li
                key={category}
                className="flex min-h-16 items-center gap-3 rounded-xl border border-[#dce7f8] bg-[#f7faff] px-4 py-3"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0064ff] text-sm font-bold text-white"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="text-[16px] font-semibold text-[#27364b]">{category}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
