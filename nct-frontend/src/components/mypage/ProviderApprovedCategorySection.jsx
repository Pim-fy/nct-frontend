import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  Clock3,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCategories } from '@api/categoryApi';
import { useMyProviderApplications } from '@hooks/useProviderApplications';
import { useMyProviderProfile } from '@hooks/useProviderProfile';

const SERVICE_DOMAIN_CD = 'CATC0002';

const STATUS_VIEW = {
  approved: {
    label: '견적 제출 가능',
    description: '승인이 완료되어 이 분야의 요청에 견적을 제출할 수 있습니다.',
    icon: CheckCircle2,
    iconClass: 'bg-[#eaf8ef] text-[#18864b]',
    badgeClass: 'bg-[#eaf8ef] text-[#18864b]',
  },
  pending: {
    label: '심사 중',
    description: '제출한 정보와 증빙 서류를 관리자가 검토하고 있습니다.',
    icon: Clock3,
    iconClass: 'bg-[#fff7e6] text-[#b26a00]',
    badgeClass: 'bg-[#fff7e6] text-[#9a5b00]',
  },
  rejected: {
    label: '재신청 가능',
    description: '반려 사유를 확인한 뒤 내용을 보완해 다시 신청할 수 있습니다.',
    icon: AlertCircle,
    iconClass: 'bg-[#fff0f0] text-[#c33b3b]',
    badgeClass: 'bg-[#fff0f0] text-[#b42318]',
  },
  unrequested: {
    label: '미신청',
    description: '이 분야에서 견적을 제출하려면 카테고리 심사를 신청해 주세요.',
    icon: CircleDashed,
    iconClass: 'bg-[#f2f4f7] text-[#667085]',
    badgeClass: 'bg-[#f2f4f7] text-[#667085]',
  },
  verification: {
    label: '권한 확인 필요',
    description: '승인 이력과 현재 활성 권한이 일치하지 않습니다. 신청 현황을 확인해 주세요.',
    icon: AlertCircle,
    iconClass: 'bg-[#fff0f0] text-[#c33b3b]',
    badgeClass: 'bg-[#fff0f0] text-[#b42318]',
  },
};

const categoryStatus = ({ approved, application }) => {
  if (approved) return 'approved';
  if (!application) return 'unrequested';
  if (application.statusCode === 'PRVC0002') return 'pending';
  if (application.statusCode === 'PRVC0004') return 'rejected';
  if (application.statusCode === 'PRVC0003') return 'verification';
  return 'unrequested';
};

/**
 * 담당자 7 · F-PROV-007/013: 서비스 요청 카테고리별 실제 견적 제출 권한과
 * 최신 심사 상태를 제공자 대시보드에서 확인하고 추가 심사 신청 화면으로 연결합니다.
 */
export default function ProviderApprovedCategorySection() {
  const profileQuery = useMyProviderProfile();
  const applicationsQuery = useMyProviderApplications();
  const categoriesQuery = useQuery({
    queryKey: ['provider-service-categories', SERVICE_DOMAIN_CD],
    queryFn: () => getCategories(SERVICE_DOMAIN_CD)
      .then((response) => response.data.filter((category) => category.catParentSn !== null)),
  });

  const approvedCategoryNames = useMemo(
    () => new Set((profileQuery.data?.categories ?? []).map((name) => name.trim())),
    [profileQuery.data?.categories],
  );
  const latestApplicationByCategory = useMemo(() => {
    const latest = new Map();
    (applicationsQuery.data ?? []).forEach((application) => {
      const categorySn = Number(application.categorySn);
      if (!latest.has(categorySn)) latest.set(categorySn, application);
    });
    return latest;
  }, [applicationsQuery.data]);
  const categories = (categoriesQuery.data ?? []).map((category) => {
    const application = latestApplicationByCategory.get(Number(category.catSn));
    const status = categoryStatus({
      approved: approvedCategoryNames.has(category.catNm.trim()),
      application,
    });
    return { ...category, application, status };
  });
  const approvedCount = categories.filter((category) => category.status === 'approved').length;
  const hasApplicableCategory = categories.some((category) => (
    category.status === 'unrequested' || category.status === 'rejected'
  ));
  const isLoading = profileQuery.isLoading
    || applicationsQuery.isLoading
    || categoriesQuery.isLoading;
  const isError = profileQuery.isError
    || applicationsQuery.isError
    || categoriesQuery.isError;

  return (
    <article
      className="rounded-[15px] border border-[#e3e8f0] bg-white p-6 shadow-sm lg:col-span-2"
      aria-labelledby="provider-category-permission-title"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="provider-category-permission-title" className="text-lg font-bold text-[#1f2937]">
            서비스 분야 권한
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#6b7788]">
            견적을 제출할 수 있는 분야와 카테고리별 심사 상태를 확인합니다.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {!isLoading && !isError && (
            <span className="text-sm font-semibold text-[#50627a]">
              승인 {approvedCount} / 전체 {categories.length}
            </span>
          )}
          <Link
            className="btn btn-primary shrink-0"
            to={hasApplicableCategory ? '/provider/apply' : '/provider/applications/status'}
          >
            {hasApplicableCategory ? '새 분야 심사 신청' : '신청 이력 확인'}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="서비스 분야 권한을 불러오는 중">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-xl bg-[#f3f6fa]" />
          ))}
        </div>
      )}

      {isError && (
        <div className="mt-5 flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl bg-[#fff5f5] px-6 text-center">
          <p className="text-[15px] text-[#b42318]">서비스 분야 권한을 불러오지 못했습니다.</p>
          <button
            type="button"
            className="text-sm font-semibold text-[#0064ff] hover:underline"
            onClick={() => {
              profileQuery.refetch();
              applicationsQuery.refetch();
              categoriesQuery.refetch();
            }}
          >
            다시 불러오기
          </button>
        </div>
      )}

      {!isLoading && !isError && categories.length === 0 && (
        <div className="mt-5 flex min-h-64 items-center justify-center rounded-xl bg-[#fafbfc] px-6 text-center">
          <p className="text-[15px] text-[#6b7788]">현재 신청 가능한 서비스 카테고리가 없습니다.</p>
        </div>
      )}

      {!isLoading && !isError && categories.length > 0 && (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {categories.map((category) => {
            const status = STATUS_VIEW[category.status];
            const StatusIcon = status.icon;
            const detail = category.status === 'rejected' && category.application?.rejectReason
              ? `반려 사유: ${category.application.rejectReason}`
              : status.description;

            return (
              <li
                key={category.catSn}
                className="flex min-h-24 items-start gap-3 rounded-xl border border-[#dce7f8] bg-[#fbfdff] px-4 py-4"
              >
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${status.iconClass}`}>
                  <StatusIcon aria-hidden="true" className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-[16px] text-[#27364b]">{category.catNm}</strong>
                    <span className={`badge ${status.badgeClass}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-2 break-words text-sm leading-6 text-[#6b7788]">{detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
